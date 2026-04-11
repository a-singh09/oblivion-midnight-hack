/**
 * Blockchain Data Service
 * Integrates backend API data with Midnight blockchain queries
 */

import deploymentConfig from "../../contracts/deployment.json";
import { DataLocation } from "./api-client";

export interface BlockchainCommitment {
  commitmentHash: string;
  userDID: string;
  serviceProvider: string;
  dataCategories: string[];
  createdAt: number;
  deleted: boolean;
  deletionProofHash?: string;
  blockNumber?: number;
  transactionHash?: string;
}

export interface EnhancedDataLocation extends DataLocation {
  blockchainStatus: "pending" | "confirmed" | "deleted" | "unknown";
  transactionHash?: string;
  blockNumber?: number;
  explorerUrl?: string;
}

export class BlockchainDataService {
  private indexerUrl: string;
  private explorerBaseUrl: string;

  constructor() {
    this.indexerUrl = deploymentConfig.endpoints.indexer;
    this.explorerBaseUrl = "https://explorer.preprod.midnight.network";
  }

  /**
   * Query Midnight indexer for user's commitments using GraphQL
   */
  async getUserCommitments(userDID: string): Promise<BlockchainCommitment[]> {
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
            blockNumber
            transactionHash
          }
        }
      `;

      const response = await fetch(this.indexerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { userDID },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to query blockchain indexer");
      }

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors:", errors);
        return [];
      }

      return data?.commitments || [];
    } catch (error) {
      console.error("Error querying user commitments:", error);
      return [];
    }
  }

  /**
   * Enhance data locations with blockchain information
   */
  async enhanceWithBlockchainData(
    dataLocations: DataLocation[],
  ): Promise<EnhancedDataLocation[]> {
    // Get blockchain commitments for all data locations
    const commitmentHashes = dataLocations.map((loc) => loc.commitmentHash);
    const blockchainData = await this.getCommitmentsByHashes(commitmentHashes);

    // Create a map for quick lookup
    const blockchainMap = new Map(
      blockchainData.map((bc) => [bc.commitmentHash, bc]),
    );

    // Enhance each data location
    return dataLocations.map((location) => {
      const blockchain = blockchainMap.get(location.commitmentHash);

      // Ensure dataCategories is always an array
      const dataCategories =
        location.dataCategories ||
        (location.dataType ? [location.dataType] : []);

      return {
        ...location,
        dataCategories, // Normalize to array
        blockchainStatus: this.determineStatus(location, blockchain),
        transactionHash: blockchain?.transactionHash,
        blockNumber: blockchain?.blockNumber,
        explorerUrl: blockchain?.transactionHash
          ? this.getExplorerUrl(blockchain.transactionHash)
          : undefined,
      };
    });
  }

  /**
   * Get commitments by their hashes
   */
  private async getCommitmentsByHashes(
    hashes: string[],
  ): Promise<BlockchainCommitment[]> {
    if (hashes.length === 0) return [];

    try {
      const query = `
        query GetCommitments($hashes: [String!]!) {
          commitments(where: { commitmentHash: { _in: $hashes } }) {
            commitmentHash
            userDID
            serviceProvider
            dataCategories
            createdAt
            deleted
            deletionProofHash
            blockNumber
            transactionHash
          }
        }
      `;

      const response = await fetch(this.indexerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { hashes },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to query commitments");
      }

      const { data, errors } = await response.json();

      if (errors) {
        console.error("GraphQL errors:", errors);
        return [];
      }

      return data?.commitments || [];
    } catch (error) {
      console.error("Error querying commitments:", error);
      return [];
    }
  }

  /**
   * Determine the blockchain status of a data location
   */
  private determineStatus(
    location: DataLocation,
    blockchain?: BlockchainCommitment,
  ): "pending" | "confirmed" | "deleted" | "unknown" {
    if (!blockchain) {
      return "pending"; // Not yet on blockchain
    }

    if (blockchain.deleted || location.deleted) {
      return "deleted";
    }

    if (blockchain.blockNumber) {
      return "confirmed";
    }

    return "unknown";
  }

  /**
   * Get blockchain explorer URL for a transaction
   */
  getExplorerUrl(transactionHash: string): string {
    return `${this.explorerBaseUrl}/tx/${transactionHash}`;
  }

  /**
   * Listen for real-time blockchain events
   */
  subscribeToBlockchainEvents(
    userDID: string,
    callback: (event: BlockchainCommitment) => void,
  ): () => void {
    // WebSocket subscription to indexer
    const wsUrl = deploymentConfig.endpoints.indexerWS;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Subscribe to commitment events for this user
      const subscription = {
        type: "start",
        payload: {
          query: `
            subscription OnCommitmentChange($userDID: String!) {
              commitments(where: { userDID: { _eq: $userDID } }) {
                commitmentHash
                userDID
                serviceProvider
                dataCategories
                createdAt
                deleted
                deletionProofHash
                blockNumber
                transactionHash
              }
            }
          `,
          variables: { userDID },
        },
      };

      ws.send(JSON.stringify(subscription));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "data" && message.payload?.data?.commitments) {
          message.payload.data.commitments.forEach(callback);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Return cleanup function
    return () => {
      ws.close();
    };
  }

  /**
   * Cache blockchain data with periodic refresh
   */
  createBlockchainCache(refreshInterval: number = 30000) {
    const cache = new Map<
      string,
      { data: BlockchainCommitment; timestamp: number }
    >();

    const get = async (
      commitmentHash: string,
    ): Promise<BlockchainCommitment | null> => {
      const cached = cache.get(commitmentHash);
      const now = Date.now();

      if (cached && now - cached.timestamp < refreshInterval) {
        return cached.data;
      }

      // Fetch fresh data
      const commitments = await this.getCommitmentsByHashes([commitmentHash]);
      const commitment = commitments[0];

      if (commitment) {
        cache.set(commitmentHash, { data: commitment, timestamp: now });
        return commitment;
      }

      return null;
    };

    const clear = () => {
      cache.clear();
    };

    return { get, clear };
  }
}

export const blockchainDataService = new BlockchainDataService();
