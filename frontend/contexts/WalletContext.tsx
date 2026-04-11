"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type {
  Configuration,
  InitialAPI,
  WalletConnectedAPI,
} from "@midnight-ntwrk/dapp-connector-api";

interface WalletState {
  isConnected: boolean;
  shieldedAddress: string | null;
  unshieldedAddress: string | null;
  isConnecting: boolean;
  error: string | null;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  connectedApi: WalletConnectedAPI | null;
  walletId: string | null;
  walletConfig: Configuration | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    shieldedAddress: null,
    unshieldedAddress: null,
    isConnecting: false,
    error: null,
  });
  const [connectedApi, setConnectedApi] = useState<WalletConnectedAPI | null>(
    null,
  );
  const [walletId, setWalletId] = useState<string | null>(null);
  const [walletConfig, setWalletConfig] = useState<Configuration | null>(null);

  const getSelectedWallet = (): { id: string; wallet: InitialAPI } | null => {
    const wallets = window.midnight ? Object.entries(window.midnight) : [];
    if (wallets.length === 0) {
      return null;
    }

    const laceWallet = wallets.find(([id]) => id === "mnLace");
    const selected = laceWallet ?? wallets[0];
    return { id: selected[0], wallet: selected[1] };
  };

  const connect = useCallback(async () => {
    const selected = getSelectedWallet();

    if (!selected) {
      setState((prev) => ({
        ...prev,
        error: "Lace wallet not detected. Install from https://lace.io",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const usePreprod =
        (process.env.NEXT_PUBLIC_MIDNIGHT_USE_PREPROD ?? "0") === "1";
      const networkId =
        process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK_ID ||
        (usePreprod ? "preprod" : "undeployed");
      const walletApi = selected.wallet as InitialAPI & {
        enable?: () => Promise<unknown>;
        connect?: (networkId: string) => Promise<unknown>;
      };

      let api: unknown = null;

      if (typeof walletApi.connect === "function") {
        try {
          api = await walletApi.connect(networkId);
        } catch (connectError) {
          const message =
            connectError instanceof Error
              ? connectError.message
              : String(connectError);
          const needsEnableFirst =
            message.includes("Unauthorized request origin") ||
            message.includes("enable()") ||
            message.includes("Call midnight");

          if (!needsEnableFirst) {
            throw connectError;
          }

          if (typeof walletApi.enable !== "function") {
            throw connectError;
          }

          const enableResult = await walletApi.enable();
          if (typeof walletApi.connect === "function") {
            try {
              api = await walletApi.connect(networkId);
            } catch (retryError) {
              const fallbackApi = enableResult as Partial<WalletConnectedAPI>;
              const hasConnectedShape =
                typeof fallbackApi.getShieldedAddresses === "function" &&
                typeof fallbackApi.getUnshieldedAddress === "function";

              if (!hasConnectedShape) {
                throw retryError;
              }

              api = fallbackApi;
            }
          } else {
            api = enableResult;
          }
        }
      } else if (typeof walletApi.enable === "function") {
        api = await walletApi.enable();
      }

      if (!api) {
        throw new Error("User rejected wallet connection");
      }

      const connectedApi = api as WalletConnectedAPI;

      // Get addresses using new v4 API methods
      if (
        typeof connectedApi.getShieldedAddresses !== "function" ||
        typeof connectedApi.getUnshieldedAddress !== "function"
      ) {
        throw new Error(
          "Connected wallet API is incompatible. Please update the Lace extension.",
        );
      }

      const shieldedAddrs = await connectedApi.getShieldedAddresses();
      const unshieldedAddr = await connectedApi.getUnshieldedAddress();

      const shieldedAddress = shieldedAddrs.shieldedAddress;
      const unshieldedAddress = unshieldedAddr.unshieldedAddress;

      if (!shieldedAddress || !unshieldedAddress) {
        throw new Error("Failed to retrieve wallet addresses");
      }

      const connectionStatus = await connectedApi.getConnectionStatus();
      if (!connectionStatus) {
        throw new Error("Wallet connection status unavailable");
      }

      const configuration = await connectedApi.getConfiguration();

      setConnectedApi(connectedApi);
      setWalletId(selected.id);
      setWalletConfig(configuration);
      setState({
        isConnected: true,
        shieldedAddress,
        unshieldedAddress,
        isConnecting: false,
        error: null,
      });

      console.log("✓ Wallet connected");
      console.log(`  Wallet ID: ${selected.id}`);
      console.log(`  Shielded: ${shieldedAddress}`);
      console.log(`  Unshielded: ${unshieldedAddress}`);
      console.log(`  Network: ${configuration.networkId}`);
    } catch (error) {
      let errorMessage = "Failed to connect wallet";

      if (error instanceof Error) {
        if (
          error.message.includes("rejected") ||
          error.message.includes("denied") ||
          error.message.includes("User rejected")
        ) {
          errorMessage =
            "You rejected the wallet connection. Please try again and approve.";
        } else if (
          error.message.includes("Unauthorized request origin") ||
          error.message.includes("Call midnight") ||
          error.message.includes("enable()")
        ) {
          errorMessage =
            "Wallet denied this site. Open Lace, allow this origin, then retry connect.";
        } else {
          errorMessage = error.message;
        }
      }

      console.error("Wallet connection error:", error);

      setState({
        isConnected: false,
        shieldedAddress: null,
        unshieldedAddress: null,
        isConnecting: false,
        error: errorMessage,
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    setConnectedApi(null);
    setWalletId(null);
    setWalletConfig(null);
    setState({
      isConnected: false,
      shieldedAddress: null,
      unshieldedAddress: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        connectedApi,
        walletId,
        walletConfig,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}
