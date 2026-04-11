import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractsRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(contractsRoot, "..");

const envFiles = [
  path.join(workspaceRoot, ".midnight-local.env"),
  path.join(workspaceRoot, ".env"),
  path.join(contractsRoot, ".env"),
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    loadEnv({ path: envFile, override: false });
  }
}

export type NetworkProfile = {
  name: string;
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
};

const isPreprodMode = (process.env.MIDNIGHT_USE_PREPROD ?? "0") === "1";

const preprodProfiles: NetworkProfile[] = [
  {
    name: "v3 + https relay",
    indexer: "https://indexer.preprod.midnight.network/api/v3/graphql",
    indexerWS: "wss://indexer.preprod.midnight.network/api/v3/graphql/ws",
    node: "https://rpc.preprod.midnight.network",
    proofServer:
      process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://127.0.0.1:6300",
  },
  {
    name: "v4 + https relay",
    indexer: "https://indexer.preprod.midnight.network/api/v4/graphql",
    indexerWS: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
    node: "https://rpc.preprod.midnight.network",
    proofServer:
      process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://127.0.0.1:6300",
  },
  {
    name: "v4 + wss relay",
    indexer: "https://indexer.preprod.midnight.network/api/v4/graphql",
    indexerWS: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
    node: "wss://rpc.preprod.midnight.network",
    proofServer:
      process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://127.0.0.1:6300",
  },
];

const localProfiles: NetworkProfile[] = [
  {
    name: "local + http relay",
    indexer: process.env.MIDNIGHT_INDEXER_URL ?? "http://127.0.0.1:3085/api",
    indexerWS: process.env.MIDNIGHT_INDEXER_WS_URL ?? "ws://127.0.0.1:3085/ws",
    node: process.env.MIDNIGHT_NODE_URL ?? "http://127.0.0.1:3086",
    proofServer:
      process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://127.0.0.1:6300",
  },
  {
    name: "local + ws relay",
    indexer: process.env.MIDNIGHT_INDEXER_URL ?? "http://127.0.0.1:3085/api",
    indexerWS: process.env.MIDNIGHT_INDEXER_WS_URL ?? "ws://127.0.0.1:3085/ws",
    node: process.env.MIDNIGHT_NODE_WS_URL ?? "ws://127.0.0.1:3086",
    proofServer:
      process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://127.0.0.1:6300",
  },
];

export const MIDNIGHT_NETWORK_ID =
  process.env.MIDNIGHT_NETWORK_ID ?? (isPreprodMode ? "preprod" : "undeployed");

export const MIDNIGHT_NETWORK_MODE = isPreprodMode ? "preprod" : "local";

export const MIDNIGHT_NETWORK_PROFILES = isPreprodMode
  ? preprodProfiles
  : localProfiles;

export const MIDNIGHT_FAUCET_URL = isPreprodMode
  ? process.env.MIDNIGHT_FAUCET_URL ??
    "https://faucet.preprod.midnight.network/"
  : process.env.MIDNIGHT_FAUCET_URL ?? "(local network faucet not configured)";
