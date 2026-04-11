/**
 * Oblivion Protocol - Contract Deployment Script (Preprod)
 * Uses the current Midnight SDK (midnight-js v4, wallet-sdk v3, ledger-v8)
 *
 * Usage:
 *   npx tsx scripts/deploy-preprod.ts
 *
 * Requirements:
 *   - Proof server running on port 6300 (npm run start-proof-server)
 *   - Network access to preprod.midnight.network
 */

import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import * as Rx from "rxjs";
import { Buffer } from "buffer";
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { sampleSigningKey } from "@midnight-ntwrk/compact-runtime";

// Midnight SDK imports
import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import {
  setNetworkId,
  getNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import * as ledger from "@midnight-ntwrk/ledger-v8";
import { WalletFacade } from "@midnight-ntwrk/wallet-sdk-facade";
import { DustWallet } from "@midnight-ntwrk/wallet-sdk-dust-wallet";
import {
  HDWallet,
  Roles,
  generateRandomSeed,
} from "@midnight-ntwrk/wallet-sdk-hd";
import { ShieldedWallet } from "@midnight-ntwrk/wallet-sdk-shielded";
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
} from "@midnight-ntwrk/wallet-sdk-unshielded-wallet";
import {
  MIDNIGHT_NETWORK_ID,
  MIDNIGHT_NETWORK_MODE,
  MIDNIGHT_NETWORK_PROFILES,
  MIDNIGHT_FAUCET_URL,
} from "./midnight-network";

import { WebSocket } from "ws";

// Enable WebSocket for GraphQL subscriptions in Node.js
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

setNetworkId(MIDNIGHT_NETWORK_ID as any);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractsRoot = path.resolve(__dirname, "..");

// ─── Key Derivation ─────────────────────────────────────────────────────────
function deriveKeys(seed: string) {
  const hdWallet = HDWallet.fromSeed(Buffer.from(seed, "hex"));
  if (hdWallet.type !== "seedOk") throw new Error("Invalid seed");
  const result = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (result.type !== "keysDerived") throw new Error("Key derivation failed");
  hdWallet.hdWallet.clear();
  return result.keys;
}

// ─── Wallet Creation ─────────────────────────────────────────────────────────
async function createWallet(
  seed: string,
  networkConfig = MIDNIGHT_NETWORK_PROFILES[0],
) {
  const keys = deriveKeys(seed);
  const networkId = getNetworkId();

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(
    keys[Roles.NightExternal],
    networkId,
  );

  const walletConfig = {
    networkId,
    indexerClientConnection: {
      indexerHttpUrl: networkConfig.indexer,
      indexerWsUrl: networkConfig.indexerWS,
    },
    provingServerUrl: new URL(networkConfig.proofServer),
    relayURL: new URL(networkConfig.node),
  };

  const wallet = await WalletFacade.init({
    configuration: walletConfig,
    shielded: (config) =>
      ShieldedWallet(config).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (config) =>
      UnshieldedWallet({
        ...config,
        txHistoryStorage: new InMemoryTransactionHistoryStorage(),
      }).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: (config) =>
      DustWallet({
        ...config,
        costParameters: {
          additionalFeeOverhead: 300_000_000_000_000n,
          feeBlocksMargin: 5,
        },
      }).startWithSecretKey(
        dustSecretKey,
        ledger.LedgerParameters.initialParameters().dust,
      ),
  });

  await wallet.start(shieldedSecretKeys, dustSecretKey);
  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
}

async function waitForSyncWithTimeout(
  wallet: { waitForSyncedState: () => Promise<any> },
  timeoutMs: number,
) {
  return await Promise.race([
    wallet.waitForSyncedState(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout has occurred")), timeoutMs),
    ),
  ]);
}

async function isProofServerReady(baseUrl: string, timeoutMs = 4000) {
  const endpoints = ["/version", "/health", "/healthcheck"];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) {
        return true;
      }
    } catch {
      // try next endpoint
    }
  }

  return false;
}

// ─── Transaction Signing ─────────────────────────────────────────────────────
function signTransactionIntents(
  tx: { intents?: Map<number, any> },
  signFn: (payload: Uint8Array) => ledger.Signature,
  proofMarker: "proof" | "pre-proof",
): void {
  if (!tx.intents || tx.intents.size === 0) return;
  for (const segment of tx.intents.keys()) {
    const intent = tx.intents.get(segment);
    if (!intent) continue;
    const cloned = ledger.Intent.deserialize<
      ledger.SignatureEnabled,
      ledger.Proofish,
      ledger.PreBinding
    >("signature", proofMarker, "pre-binding", intent.serialize());
    const sigData = cloned.signatureData(segment);
    const signature = signFn(sigData);
    if (cloned.fallibleUnshieldedOffer) {
      const sigs = cloned.fallibleUnshieldedOffer.inputs.map(
        (_: any, i: number) =>
          cloned.fallibleUnshieldedOffer!.signatures.at(i) ?? signature,
      );
      cloned.fallibleUnshieldedOffer =
        cloned.fallibleUnshieldedOffer.addSignatures(sigs);
    }
    if (cloned.guaranteedUnshieldedOffer) {
      const sigs = cloned.guaranteedUnshieldedOffer.inputs.map(
        (_: any, i: number) =>
          cloned.guaranteedUnshieldedOffer!.signatures.at(i) ?? signature,
      );
      cloned.guaranteedUnshieldedOffer =
        cloned.guaranteedUnshieldedOffer.addSignatures(sigs);
    }
    tx.intents.set(segment, cloned);
  }
}

// ─── Providers ───────────────────────────────────────────────────────────────
async function createProviders(
  walletCtx: Awaited<ReturnType<typeof createWallet>>,
  zkConfigPath: string,
  stateStoreName: string,
  networkConfig = MIDNIGHT_NETWORK_PROFILES[0],
) {
  const state = await Rx.firstValueFrom(
    walletCtx.wallet.state().pipe(Rx.filter((s) => s.isSynced)),
  );
  const walletProvider = {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () =>
      state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        {
          shieldedSecretKeys: walletCtx.shieldedSecretKeys,
          dustSecretKey: walletCtx.dustSecretKey,
        },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      const signFn = (payload: Uint8Array) =>
        walletCtx.unshieldedKeystore.signData(payload);
      signTransactionIntents(recipe.baseTransaction, signFn, "proof");
      if (recipe.balancingTransaction) {
        signTransactionIntents(
          recipe.balancingTransaction,
          signFn,
          "pre-proof",
        );
      }
      return walletCtx.wallet.finalizeRecipe(recipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };
  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = String(walletCtx.unshieldedKeystore.getBech32Address());
  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: stateStoreName,
      accountId,
      privateStoragePasswordProvider: async () =>
        process.env.MIDNIGHT_PRIVATE_STATE_PASSWORD ?? "oblivion-dev-password",
    }),
    publicDataProvider: indexerPublicDataProvider(
      networkConfig.indexer,
      networkConfig.indexerWS,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(
      networkConfig.proofServer,
      zkConfigProvider,
    ),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

// ─── Deploy a single contract ─────────────────────────────────────────────────
async function deployOneContract(
  name: string,
  walletCtx: Awaited<ReturnType<typeof createWallet>>,
  networkConfig = MIDNIGHT_NETWORK_PROFILES[0],
) {
  const createWitnessProviders = (contractName: string) => {
    if (contractName === "DataCommitment") {
      return {
        getServiceKey: () => {
          const key = Buffer.alloc(32);
          key.write("oblivion-service-key-v1", 0);
          return new Uint8Array(key);
        },
        getDeletionCertificate: (_hash: Uint8Array) => {
          const cert = Buffer.alloc(32);
          cert.write("deletion-cert", 0);
          return new Uint8Array(cert);
        },
      };
    }

    if (contractName === "ZKDeletionVerifier") {
      return {
        getDeletionCertificate: (_hash: Uint8Array) => {
          const cert = Buffer.alloc(32);
          cert.write("deletion-cert", 0);
          return new Uint8Array(cert);
        },
        getVerifierKey: () => {
          const key = Buffer.alloc(32);
          key.write("oblivion-verifier-key-v1", 0);
          return new Uint8Array(key);
        },
        getPrivateData: (_hash: Uint8Array) => {
          const data = Buffer.alloc(32);
          data.write("private-data", 0);
          return new Uint8Array(data);
        },
      };
    }

    return {};
  };

  const zkConfigPath = path.join(contractsRoot, "managed", name);
  const contractDir = path.join(zkConfigPath, "contract");
  const contractPath = fs.existsSync(path.join(contractDir, "index.js"))
    ? path.join(contractDir, "index.js")
    : path.join(contractDir, "index.cjs");

  if (!fs.existsSync(contractPath)) {
    throw new Error(
      `Compiled contract not found at ${contractPath}. Run: npm run compile`,
    );
  }

  console.log(`\n  Loading ${name} from ${contractPath}...`);
  const ContractModule = await import(pathToFileURL(contractPath).href);
  const compiledContract = CompiledContract.make(
    name,
    ContractModule.Contract,
  ).pipe(
    CompiledContract.withWitnesses(createWitnessProviders(name) as any),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );

  const providers = await createProviders(
    walletCtx,
    zkConfigPath,
    `${name}-state`,
    networkConfig,
  );
  const signingKey = sampleSigningKey();

  console.log(`  Deploying ${name} (this may take 30-60 seconds)...`);
  const deployed = await deployContract(providers, {
    compiledContract: compiledContract as any,
    args: [],
    signingKey,
    privateStateId: `${name}State`,
    initialPrivateState: {},
  });

  const contractAddress = deployed.deployTxData.public.contractAddress;
  console.log(`  ✅ ${name} deployed!`);
  console.log(`     Address: ${contractAddress}`);
  return contractAddress;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const syncTimeoutMs = Number(
    process.env.MIDNIGHT_SYNC_TIMEOUT_MS ?? "120000",
  );
  console.log(
    "\n╔══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    `║        Deploy to Midnight ${MIDNIGHT_NETWORK_MODE[0].toUpperCase() + MIDNIGHT_NETWORK_MODE.slice(1)}${" ".repeat(Math.max(0, 26 - MIDNIGHT_NETWORK_MODE.length))}║`,
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝\n",
  );
  const primaryProfile = MIDNIGHT_NETWORK_PROFILES[0];
  console.log(`  Network profile: ${MIDNIGHT_NETWORK_MODE}`);
  console.log(`  Indexer: ${primaryProfile.indexer}`);
  console.log(`  RPC: ${primaryProfile.node}`);
  console.log("");

  // Verify proof server is up
  if (await isProofServerReady(primaryProfile.proofServer)) {
    console.log("  ✅ Proof server is reachable\n");
  } else {
    console.error(
      `  ❌ Proof server is not reachable at ${primaryProfile.proofServer}`,
    );
    console.error("     Start it with: npm run start-local-midnight");
    process.exit(1);
  }

  const walletMode = (process.env.MIDNIGHT_WALLET_MODE ?? "")
    .trim()
    .toLowerCase();
  const forceNewWallet =
    walletMode === "new" || process.env.MIDNIGHT_CREATE_NEW_WALLET === "1";

  const providedSeed = forceNewWallet ? "" : process.env.MIDNIGHT_SEED?.trim();
  const rl = providedSeed
    ? null
    : createInterface({ input: stdin, output: stdout });
  try {
    // ── Step 1: Wallet setup ─────────────────────────────────────────────────
    console.log(
      "─── Step 1: Wallet Setup ──────────────────────────────────────\n",
    );
    let seed: string;
    if (providedSeed) {
      seed = providedSeed;
      console.log("  Using MIDNIGHT_SEED from environment\n");
    } else if (forceNewWallet) {
      const rawSeed = generateRandomSeed();
      seed = Buffer.from(rawSeed).toString("hex");
      console.log("  MIDNIGHT_WALLET_MODE=new detected\n");
      console.log(
        `  ⚠️  SAVE THIS SEED — you'll need it to restore your wallet:\n`,
      );
      console.log(`  ${seed}\n`);
    } else {
      const choice = await rl!.question(
        "  [1] Create new wallet\n  [2] Restore from seed\n  > ",
      );

      if (choice.trim() === "2") {
        seed = await rl!.question("\n  Enter your 64-character hex seed: ");
        seed = seed.trim();
        if (!/^[0-9a-fA-F]{64}$/.test(seed)) {
          throw new Error("Invalid seed — must be 64 hex characters");
        }
      } else {
        const rawSeed = generateRandomSeed();
        seed = Buffer.from(rawSeed).toString("hex");
        console.log(
          `\n  ⚠️  SAVE THIS SEED — you'll need it to restore your wallet:\n`,
        );
        console.log(`  ${seed}\n`);
      }
    }

    if (!/^[0-9a-fA-F]{64}$/.test(seed)) {
      throw new Error("Invalid seed — must be 64 hex characters");
    }

    console.log("  Creating wallet...");
    console.log(
      `  Syncing with ${MIDNIGHT_NETWORK_MODE} network (timeout ${Math.round(syncTimeoutMs / 1000)}s)...`,
    );

    let walletCtx: Awaited<ReturnType<typeof createWallet>> | null = null;
    let state: any;
    let activeConfig: (typeof MIDNIGHT_NETWORK_PROFILES)[number] | null = null;
    let lastError: unknown = null;

    for (const profile of MIDNIGHT_NETWORK_PROFILES) {
      try {
        console.log(`  Attempting profile: ${profile.name}`);
        walletCtx = await createWallet(seed, profile);
        state = await waitForSyncWithTimeout(
          walletCtx.wallet as any,
          syncTimeoutMs,
        );
        activeConfig = profile;
        console.log(`  ✅ Synced using profile: ${profile.name}`);
        break;
      } catch (error) {
        lastError = error;
        if (walletCtx) {
          await walletCtx.wallet.stop().catch(() => undefined);
        }
        walletCtx = null;
      }
    }

    if (!walletCtx || !activeConfig) {
      throw lastError instanceof Error
        ? lastError
        : new Error("Timeout has occurred");
    }

    const address = walletCtx.unshieldedKeystore.getBech32Address();
    const balance =
      state.unshielded.balances[ledger.unshieldedToken().raw] ?? 0n;
    console.log(`\n  Wallet Address : ${address}`);
    console.log(`  tNight Balance : ${balance.toLocaleString()}\n`);

    // ── Step 2: Fund wallet if needed ────────────────────────────────────────
    if (balance === 0n) {
      console.log(
        "─── Step 2: Fund Your Wallet ──────────────────────────────────\n",
      );
      console.log("  Your wallet has no tNight tokens. Please fund it:");
      console.log(`  🔗  ${MIDNIGHT_FAUCET_URL}`);
      console.log(`  📋  Address: ${address}\n`);
      console.log("  Waiting for funds to arrive...");
      await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(
          Rx.throttleTime(10000),
          Rx.filter((s) => s.isSynced),
          Rx.map(
            (s) => s.unshielded.balances[ledger.unshieldedToken().raw] ?? 0n,
          ),
          Rx.filter((b) => b > 0n),
        ),
      );
      console.log("  ✅ Funds received!\n");
    }

    // ── Step 3: DUST registration ─────────────────────────────────────────────
    console.log(
      "─── Step 3: DUST Token Setup ──────────────────────────────────\n",
    );
    const dustState = await walletCtx.wallet.waitForSyncedState();
    const currentDustBalance =
      (dustState as any).dust?.walletBalance?.(new Date()) ?? 0n;
    if (currentDustBalance === 0n) {
      const nightUtxos = dustState.unshielded.availableCoins.filter(
        (c: any) => !c.meta?.registeredForDustGeneration,
      );
      if (nightUtxos.length > 0) {
        console.log("  Registering for DUST generation...");
        const recipe =
          await walletCtx.wallet.registerNightUtxosForDustGeneration(
            nightUtxos,
            walletCtx.unshieldedKeystore.getPublicKey(),
            (payload) => walletCtx.unshieldedKeystore.signData(payload),
          );
        await walletCtx.wallet.submitTransaction(
          await walletCtx.wallet.finalizeRecipe(recipe),
        );
      }
      console.log("  Waiting for DUST tokens...");
      await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(
          Rx.throttleTime(5000),
          Rx.filter((s) => s.isSynced),
          Rx.filter(
            (s) => ((s as any).dust?.walletBalance?.(new Date()) ?? 0n) > 0n,
          ),
        ),
      );
    }
    console.log("  ✅ DUST tokens ready!\n");

    // ── Step 4: Deploy contracts ───────────────────────────────────────────────
    console.log(
      "─── Step 4: Deploy Contracts ──────────────────────────────────\n",
    );

    const dataCommitmentAddress = await deployOneContract(
      "DataCommitment",
      walletCtx,
      activeConfig,
    );
    const zkVerifierAddress = await deployOneContract(
      "ZKDeletionVerifier",
      walletCtx,
      activeConfig,
    );

    // ── Step 5: Save deployment info ──────────────────────────────────────────
    const deploymentInfo = {
      network: MIDNIGHT_NETWORK_MODE,
      deployedAt: new Date().toISOString(),
      walletAddress: address,
      seed,
      contracts: {
        DataCommitment: { address: dataCommitmentAddress },
        ZKDeletionVerifier: { address: zkVerifierAddress },
      },
      endpoints: activeConfig,
    };

    const deploymentPath = path.join(contractsRoot, "deployment.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

    await walletCtx.wallet.stop();

    console.log(
      "\n╔══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║              Deployment Successful! 🎉                       ║",
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════╝",
    );
    console.log(`\n  DataCommitment     : ${dataCommitmentAddress}`);
    console.log(`  ZKDeletionVerifier : ${zkVerifierAddress}`);
    console.log(`\n  Saved to: ${deploymentPath}`);
    console.log("\n  Next steps:");
    console.log("    1. Update backend/.env with the contract addresses above");
    console.log("    2. Run backend: cd ../backend && npm run dev\n");
  } finally {
    rl?.close();
  }
}

main().catch((err) => {
  console.error("\n❌ Deployment failed:", err);
  const message = err instanceof Error ? err.message : String(err);
  process.exit(1);
});
