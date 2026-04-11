import { WebSocket } from "ws";
globalThis.WebSocket = WebSocket as any;

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
import { Buffer } from "buffer";
import {
  MIDNIGHT_NETWORK_ID,
  MIDNIGHT_NETWORK_PROFILES,
} from "./midnight-network";

const seed = Buffer.from(generateRandomSeed());
const hdWallet = HDWallet.fromSeed(seed);
if (hdWallet.type !== "seedOk") throw new Error("Invalid seed");
const keys = hdWallet.hdWallet
  .selectAccount(0)
  .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
  .deriveKeysAt(0);
if (keys.type !== "keysDerived") throw new Error("Key derivation failed");
const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(
  keys.keys[Roles.Zswap],
);
const dustSecretKey = ledger.DustSecretKey.fromSeed(keys.keys[Roles.Dust]);
const profile = MIDNIGHT_NETWORK_PROFILES[0];
const unshieldedKeystore = createKeystore(
  keys.keys[Roles.NightExternal],
  MIDNIGHT_NETWORK_ID as any,
);

const walletConfig = {
  networkId: MIDNIGHT_NETWORK_ID as any,
  indexerClientConnection: {
    indexerHttpUrl: profile.indexer,
    indexerWsUrl: profile.indexerWS,
  },
  provingServerUrl: new URL(profile.proofServer),
  relayURL: new URL(profile.node),
};

console.log("Initializing wallet facade...");
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

console.log("Starting wallet...");
await wallet.start(shieldedSecretKeys, dustSecretKey);

console.log("Waiting for sync...");
const state = await wallet.waitForSyncedState();
console.log("Synced! Unshielded balance:", state.unshielded.balances);
process.exit(0);
