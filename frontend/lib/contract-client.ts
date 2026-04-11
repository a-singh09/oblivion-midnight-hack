/**
 * Contract Client for Midnight Blockchain Interactions
 * Handles direct communication with deployed smart contracts
 */

import deployment from "../../contracts/deployment.json";

export interface CommitmentParams {
  commitmentHash: string;
  userDID: string;
  serviceProvider: string;
  dataCategories: string[];
}

export interface CommitmentRecord {
  userDID: string;
  serviceProvider: string;
  dataCategories: string[];
  createdAt: number;
  deleted: boolean;
  deletionProofHash: string;
}

export class ContractClient {
  private wallet: any;
  private contractAddress: string;
  private indexerUrl: string;

  constructor(wallet: any) {
    this.wallet = wallet;
    this.contractAddress = deployment.contracts.DataCommitment.address;
    this.indexerUrl = deployment.endpoints.indexer;
  }

  /**
   * Register a new data commitment on the blockchain
   */
  async registerCommitment(params: CommitmentParams): Promise<string> {
    try {
      console.log("Registering commitment on blockchain:", params);

      // Convert data categories to fixed-size vector (max 3)
      const categories = params.dataCategories.slice(0, 3);
      while (categories.length < 3) {
        categories.push(""); // Pad with empty strings
      }

      // Submit transaction to Midnight blockchain
      const tx = await this.wallet.submitTransaction({
        contractAddress: this.contractAddress,
        circuit: "registerCommitment",
        params: {
          commitmentHash: this.hexToBytes32(params.commitmentHash),
          userDID: params.userDID,
          serviceProvider: this.hexToBytes32(params.serviceProvider),
          dataCategories: categories,
        },
      });

      console.log("Commitment registered. TX hash:", tx.hash);
      return tx.hash;
    } catch (error) {
      console.error("Failed to register commitment:", error);
      throw new Error(
        `Failed to register commitment: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Mark a commitment as deleted on the blockchain
   */
  async markAsDeleted(
    commitmentHash: string,
    deletionProofHash: string,
  ): Promise<string> {
    try {
      console.log("Marking commitment as deleted:", commitmentHash);

      const tx = await this.wallet.submitTransaction({
        contractAddress: this.contractAddress,
        circuit: "markAsDeleted",
        params: {
          commitmentHash: this.hexToBytes32(commitmentHash),
          deletionProofHash: this.hexToBytes32(deletionProofHash),
        },
      });

      console.log("Commitment marked as deleted. TX hash:", tx.hash);
      return tx.hash;
    } catch (error) {
      console.error("Failed to mark commitment as deleted:", error);
      throw new Error(
        `Failed to mark as deleted: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get commitment details from the blockchain
   */
  async getCommitment(
    commitmentHash: string,
  ): Promise<CommitmentRecord | null> {
    try {
      const result = await this.wallet.queryContract({
        contractAddress: this.contractAddress,
        circuit: "getCommitment",
        params: {
          commitmentHash: this.hexToBytes32(commitmentHash),
        },
      });

      return result;
    } catch (error) {
      console.error("Failed to get commitment:", error);
      return null;
    }
  }

  /**
   * Check if a commitment exists on the blockchain
   */
  async hasCommitment(commitmentHash: string): Promise<boolean> {
    try {
      const result = await this.wallet.queryContract({
        contractAddress: this.contractAddress,
        circuit: "hasCommitment",
        params: {
          commitmentHash: this.hexToBytes32(commitmentHash),
        },
      });

      return result;
    } catch (error) {
      console.error("Failed to check commitment:", error);
      return false;
    }
  }

  /**
   * Query user commitments from the indexer
   */
  async getUserCommitments(userDID: string): Promise<CommitmentRecord[]> {
    try {
      const query = `
        query GetUserCommitments($userDID: String!) {
          commitments(where: { userDID: { _eq: $userDID } }) {
            commitmentHash
            userDID
            serviceProvider
            dataCategories
            createdAt
            deleted
            deletionProofHash
          }
        }
      `;

      const response = await fetch(this.indexerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          variables: { userDID },
        }),
      });

      if (!response.ok) {
        throw new Error(`Indexer query failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.commitments || [];
    } catch (error) {
      console.error("Failed to query user commitments:", error);
      return [];
    }
  }

  /**
   * Get transaction status from the indexer
   */
  async getTransactionStatus(txHash: string): Promise<{
    status: "pending" | "confirmed" | "failed";
    blockNumber?: number;
  }> {
    try {
      const query = `
        query GetTransaction($txHash: String!) {
          transaction(hash: $txHash) {
            hash
            status
            blockNumber
          }
        }
      `;

      const response = await fetch(this.indexerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          variables: { txHash },
        }),
      });

      if (!response.ok) {
        return { status: "pending" };
      }

      const data = await response.json();
      const tx = data.data?.transaction;

      if (!tx) {
        return { status: "pending" };
      }

      return {
        status:
          tx.status === "confirmed"
            ? "confirmed"
            : tx.status === "failed"
              ? "failed"
              : "pending",
        blockNumber: tx.blockNumber,
      };
    } catch (error) {
      console.error("Failed to get transaction status:", error);
      return { status: "pending" };
    }
  }

  /**
   * Convert hex string to Bytes<32> format
   */
  private hexToBytes32(hex: string): string {
    // Remove 0x prefix if present
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;

    // Pad to 64 characters (32 bytes)
    const paddedHex = cleanHex.padEnd(64, "0");

    return paddedHex;
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }

  /**
   * Get indexer URL
   */
  getIndexerUrl(): string {
    return this.indexerUrl;
  }
}

/**
 * Create a contract client instance
 */
export function createContractClient(wallet: any): ContractClient {
  return new ContractClient(wallet);
}
