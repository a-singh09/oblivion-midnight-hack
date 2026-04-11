/**
 * Midnight Contract Service
 * Handles interactions with deployed Midnight smart contracts
 */

import type { WalletConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import deploymentConfig from "../../contracts/deployment.json";

export interface CommitmentParams {
  commitmentHash: string;
  userDID: string;
  dataCategories: string[];
}

export interface DeletionParams {
  commitmentHash: string;
}

export interface TransactionResult {
  txHash: string;
  status: "pending" | "confirmed" | "failed";
  blockNumber?: number;
}

export class MidnightContractService {
  private wallet: WalletConnectedAPI;
  private dataCommitmentAddress: string;
  private zkDeletionVerifierAddress: string;
  private proofServerUrl: string;

  constructor(wallet: WalletConnectedAPI) {
    this.wallet = wallet;
    this.dataCommitmentAddress =
      deploymentConfig.contracts.DataCommitment.address;
    this.zkDeletionVerifierAddress =
      deploymentConfig.contracts.ZKDeletionVerifier.address;
    this.proofServerUrl = deploymentConfig.endpoints.proofServer;
  }

  /**
   * Register a commitment on the blockchain
   */
  async registerCommitment(
    params: CommitmentParams,
  ): Promise<TransactionResult> {
    try {
      // Convert commitment hash to bytes
      const commitmentHashBytes = this.hexToBytes(params.commitmentHash);

      // Prepare circuit call parameters
      const circuitParams = {
        commitmentHash: commitmentHashBytes,
        userDID: params.userDID,
        dataCategories: params.dataCategories.slice(0, 3), // Max 3 categories
      };

      // Call the registerCommitment circuit
      // Note: This is a simplified version. Actual implementation would use
      // the compiled contract artifacts and proper circuit invocation
      const tx = await this.invokeCircuit(
        this.dataCommitmentAddress,
        "registerCommitment",
        circuitParams,
      );

      return {
        txHash: tx.hash,
        status: "pending",
      };
    } catch (error) {
      console.error("Failed to register commitment:", error);
      throw new Error(
        `Commitment registration failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Mark a commitment as deleted on the blockchain
   */
  async markAsDeleted(params: DeletionParams): Promise<TransactionResult> {
    try {
      const commitmentHashBytes = this.hexToBytes(params.commitmentHash);

      // Generate deletion proof via proof server
      const proofHash = await this.generateDeletionProof(params.commitmentHash);

      // Call the markAsDeleted circuit
      const tx = await this.invokeCircuit(
        this.dataCommitmentAddress,
        "markAsDeleted",
        {
          commitmentHash: commitmentHashBytes,
          proofHash,
        },
      );

      return {
        txHash: tx.hash,
        status: "pending",
      };
    } catch (error) {
      console.error("Failed to mark as deleted:", error);
      throw new Error(
        `Deletion marking failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate a ZK deletion proof using the proof server
   */
  private async generateDeletionProof(
    commitmentHash: string,
  ): Promise<Uint8Array> {
    try {
      // Call backend API to generate proof via proof server
      const response = await fetch("/api/generate-proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commitmentHash }),
      });

      if (!response.ok) {
        throw new Error("Proof generation failed");
      }

      const { proofHash } = await response.json();
      return this.hexToBytes(proofHash);
    } catch (error) {
      console.error("Proof generation error:", error);
      throw error;
    }
  }

  /**
   * Poll transaction status until confirmed
   */
  async pollTransactionStatus(
    txHash: string,
    maxAttempts = 30,
  ): Promise<TransactionResult> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Check if transaction is confirmed
        // Note: Actual implementation would query the indexer
        const isConfirmed = await this.checkTransactionConfirmation(txHash);

        if (isConfirmed) {
          return {
            txHash,
            status: "confirmed",
            blockNumber: await this.getBlockNumber(txHash),
          };
        }

        // Wait 2 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error("Error polling transaction:", error);
      }
    }

    return {
      txHash,
      status: "pending",
    };
  }

  /**
   * Invoke a circuit on a deployed contract
   */
  private async invokeCircuit(
    contractAddress: string,
    circuitName: string,
    params: any,
  ): Promise<{ hash: string }> {
    try {
      // This is a placeholder for actual circuit invocation
      // Real implementation would:
      // 1. Load contract artifacts
      // 2. Create circuit call transaction
      // 3. Sign with wallet
      // 4. Submit to network

      // For now, return a mock transaction hash
      console.log(`Invoking ${circuitName} on ${contractAddress}`, params);

      // In production, this would use the wallet API to submit transactions
      const mockTxHash = `0x${Math.random().toString(16).slice(2)}`;

      return { hash: mockTxHash };
    } catch (error) {
      console.error("Circuit invocation failed:", error);
      throw error;
    }
  }

  /**
   * Check if a transaction is confirmed on the blockchain
   */
  private async checkTransactionConfirmation(txHash: string): Promise<boolean> {
    try {
      // Query the indexer to check transaction status
      const response = await fetch(deploymentConfig.endpoints.indexer, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetTransaction($txHash: String!) {
              transaction(hash: $txHash) {
                hash
                blockNumber
                status
              }
            }
          `,
          variables: { txHash },
        }),
      });

      const { data } = await response.json();
      return data?.transaction?.status === "confirmed";
    } catch (error) {
      console.error("Error checking transaction confirmation:", error);
      return false;
    }
  }

  /**
   * Get block number for a confirmed transaction
   */
  private async getBlockNumber(txHash: string): Promise<number | undefined> {
    try {
      const response = await fetch(deploymentConfig.endpoints.indexer, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetTransaction($txHash: String!) {
              transaction(hash: $txHash) {
                blockNumber
              }
            }
          `,
          variables: { txHash },
        }),
      });

      const { data } = await response.json();
      return data?.transaction?.blockNumber;
    } catch (error) {
      console.error("Error getting block number:", error);
      return undefined;
    }
  }

  /**
   * Convert hex string to Uint8Array
   */
  private hexToBytes(hex: string): Uint8Array {
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
    }
    return bytes;
  }

  /**
   * Get contract addresses
   */
  getContractAddresses() {
    return {
      dataCommitment: this.dataCommitmentAddress,
      zkDeletionVerifier: this.zkDeletionVerifierAddress,
    };
  }
}
