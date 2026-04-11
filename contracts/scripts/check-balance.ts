import { WebSocket } from "ws";
// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

import {
  setNetworkId,
  getNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
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
import * as ledger from "@midnight-ntwrk/ledger-v8";
import * as readline from "readline/promises";
import { stdin, stdout } from "process";
import { Buffer } from "buffer";
import {
  MIDNIGHT_NETWORK_ID,
  MIDNIGHT_NETWORK_MODE,
  MIDNIGHT_NETWORK_PROFILES,
  MIDNIGHT_FAUCET_URL,
} from "./midnight-network";

setNetworkId(MIDNIGHT_NETWORK_ID as any);

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

async function main() {
  const syncTimeoutMs = Number(
    process.env.MIDNIGHT_SYNC_TIMEOUT_MS ?? "120000",
  );
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log(
    `║  Midnight Wallet Balance Checker (${MIDNIGHT_NETWORK_MODE.toUpperCase().padEnd(17)})║`,
  );
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const providedSeed = process.env.MIDNIGHT_SEED?.trim();
  const rl = providedSeed
    ? null
    : readline.createInterface({ input: stdin, output: stdout });

  try {
    const walletSeed =
      providedSeed ??
      (await rl!.question("Enter your 64-character hex seed: "));

    if (!/^[0-9a-fA-F]{64}$/.test(walletSeed)) {
      throw new Error(
        "Invalid seed format. Must be 64 hexadecimal characters.",
      );
    }

    console.log("\nCreating wallet...");

    console.log(
      `Syncing with ${MIDNIGHT_NETWORK_MODE} network (timeout ${Math.round(syncTimeoutMs / 1000)}s)...`,
    );

    let walletCtx: Awaited<ReturnType<typeof createWallet>> | null = null;
    let state: any;
    let activeProfile: (typeof MIDNIGHT_NETWORK_PROFILES)[number] | null = null;
    let lastError: unknown = null;

    for (const profile of MIDNIGHT_NETWORK_PROFILES) {
      try {
        console.log(`Attempting profile: ${profile.name}`);
        walletCtx = await createWallet(walletSeed, profile);
        state = await waitForSyncWithTimeout(
          walletCtx.wallet as any,
          syncTimeoutMs,
        );
        activeProfile = profile;
        console.log(`✓ Synced using profile: ${profile.name}`);
        break;
      } catch (error) {
        lastError = error;
        if (walletCtx) {
          await walletCtx.wallet.stop().catch(() => undefined);
        }
        walletCtx = null;
      }
    }

    if (!walletCtx || !activeProfile) {
      throw lastError instanceof Error
        ? lastError
        : new Error("Timeout has occurred");
    }

    const address = walletCtx.unshieldedKeystore.getBech32Address();
    const balance =
      state.unshielded.balances[ledger.unshieldedToken().raw] ?? 0n;

    console.log("\n✓ Wallet synced!");
    console.log(`\nWallet Address: ${address}`);
    console.log(`tNight Balance: ${balance.toLocaleString()}`);

    if (balance === 0n) {
      console.log("\n⚠️  Balance is 0");
      console.log("\nTo get test tokens:");
      console.log(`  Visit: ${MIDNIGHT_FAUCET_URL}`);
      console.log(`  Use address: ${address}`);
    } else {
      console.log("\n✓ Wallet has sufficient balance for deployment");
    }

    console.log("\nWallet state synced successfully.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("\n❌ Error:", message);

    process.exit(1);
  } finally {
    rl?.close();
  }
}

main().catch(console.error);
