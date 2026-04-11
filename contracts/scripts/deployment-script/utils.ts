import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { WebSocket } from "ws";
import * as Rx from "rxjs";
import { Buffer } from "buffer";

// Midnight SDK imports
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
import { HDWallet, Roles } from "@midnight-ntwrk/wallet-sdk-hd";
import { ShieldedWallet } from "@midnight-ntwrk/wallet-sdk-shielded";
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
} from "@midnight-ntwrk/wallet-sdk-unshielded-wallet";
import { CompiledContract } from "@midnight-ntwrk/compact-js";

// Enable WebSocket for GraphQL subscriptions
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

// Set network to Preprod
setNetworkId("preprod");

// Network configuration for Preprod
export const CONFIG = {
  indexer: "https://indexer.preprod.midnight.network/api/v4/graphql",
  indexerWS: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
  node: "https://rpc.preprod.midnight.network",
  proofServer: process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://127.0.0.1:6300",
};

export const CONTRACT_NAME = "DataCommitment";
export const PRIVATE_STATE_ID = "DataCommitmentState";

function createWitnessProviders(contractName: string) {
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
}

// Path configuration
export const contractsRoot = path.resolve(process.cwd());
export const zkConfigPath = path.join(contractsRoot, "managed", CONTRACT_NAME);

function getContractModulePath() {
  const esmPath = path.join(zkConfigPath, "contract", "index.js");
  if (fs.existsSync(esmPath)) return esmPath;
  return path.join(zkConfigPath, "contract", "index.cjs");
}

export async function getCompiledContract() {
  const contractPath = getContractModulePath();

  if (!fs.existsSync(contractPath)) {
    throw new Error(
      `Compiled contract not found at ${contractPath}. Run: npm run compile`,
    );
  }

  const contractModule = await import(pathToFileURL(contractPath).href);

  return CompiledContract.make(
    CONTRACT_NAME,
    contractModule.Contract as any,
  ).pipe(
    CompiledContract.withWitnesses(
      createWitnessProviders(CONTRACT_NAME) as any,
    ),
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  ) as any;
}

// ─── Wallet Functions ──────────────────────────────────────────────────────────

export function deriveKeys(seed: string) {
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

export async function createWallet(seed: string) {
  const keys = deriveKeys(seed);
  const networkId = getNetworkId();

  // Derive secret keys for different wallet components
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(
    keys[Roles.NightExternal],
    networkId,
  );

  const walletConfig = {
    networkId,
    indexerClientConnection: {
      indexerHttpUrl: CONFIG.indexer,
      indexerWsUrl: CONFIG.indexerWS,
    },
    provingServerUrl: new URL(CONFIG.proofServer),
    relayURL: new URL(CONFIG.node.replace(/^http/, "ws")),
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5,
    },
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

// Sign transaction intents with the wallet's private keys
export function signTransactionIntents(
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

export async function createProviders(
  walletCtx: Awaited<ReturnType<typeof createWallet>>,
) {
  const state: any = await Rx.firstValueFrom(
    walletCtx.wallet.state().pipe(Rx.filter((s: any) => s.isSynced)),
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
      const signedRecipe = await walletCtx.wallet.signRecipe(
        recipe,
        (payload: Uint8Array) => walletCtx.unshieldedKeystore.signData(payload),
      );
      return walletCtx.wallet.finalizeRecipe(signedRecipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const accountId = String(walletCtx.unshieldedKeystore.getBech32Address());

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: `${CONTRACT_NAME}-state`,
      accountId,
      privateStoragePasswordProvider: async () =>
        process.env.MIDNIGHT_PRIVATE_STATE_PASSWORD ?? "oblivion-dev-password",
    }),
    publicDataProvider: indexerPublicDataProvider(
      CONFIG.indexer,
      CONFIG.indexerWS,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(
      CONFIG.proofServer,
      zkConfigProvider,
    ),
    walletProvider,
    midnightProvider: walletProvider,
  };
}
