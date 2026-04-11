/**
 * Hook for interacting with Midnight smart contracts
 */

import { useWallet } from "@/contexts/WalletContext";
import { MidnightContractService } from "@/lib/midnight-contract-service";
import { useMemo } from "react";

export function useMidnightContract() {
  const { connectedApi, isConnected } = useWallet();

  const contractService = useMemo(() => {
    if (!connectedApi || !isConnected) {
      return null;
    }
    return new MidnightContractService(connectedApi);
  }, [connectedApi, isConnected]);

  return {
    contractService,
    isReady: !!contractService,
  };
}
