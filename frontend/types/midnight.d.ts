import type { InitialAPI } from "@midnight-ntwrk/dapp-connector-api";

/**
 * Type declarations for Midnight blockchain integration
 * Extends the Window interface to include the Midnight DApp Connector API
 */

declare global {
  interface Window {
    midnight?: Record<string, InitialAPI> & {
      mnLace?: InitialAPI;
    };
  }
}

export {};
