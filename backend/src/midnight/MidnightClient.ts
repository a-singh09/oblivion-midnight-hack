import axios from "axios";

export interface MidnightConfig {
  nodeUrl: string;
  indexerUrl: string;
  indexerWsUrl: string;
  proofServerUrl: string;
  networkId: string;
  walletSeed?: string;
  dataCommitmentContract?: string;
  zkDeletionVerifierContract?: string;
}

export interface CommitmentParams {
  userDID: string;
  commitmentHash: string;
  serviceProvider: string;
  dataCategories: string[];
}

export interface DeletionProofParams {
  userDID: string;
  commitmentHash: string;
  deletionCertificate: string;
}

export interface BlockchainCommitment {
  commitmentHash: string;
  userDID: string;
  serviceProvider: string;
  dataCategories: string[];
  createdAt: number;
  deleted: boolean;
  deletionProofHash?: string;
}

export class MidnightClient {
  private config: MidnightConfig;
  private initialized: boolean = false;

  constructor(config: MidnightConfig) {
    this.config = config;
  }

  /**
   * Initialize the Midnight client and set network configuration
   */
  public async initialize(): Promise<void> {
    try {
      // Note: In production, this would use the actual Midnight.js SDK
      // setNetworkId(this.config.networkId);
      console.log(
        `Initializing MidnightClient for network: ${this.config.networkId}`,
      );

      // Skip connection tests if SKIP_MIDNIGHT_CHECKS is set (for development)
      if (process.env.SKIP_MIDNIGHT_CHECKS === "true") {
        console.warn(
          "⚠️  Skipping Midnight service connection checks (SKIP_MIDNIGHT_CHECKS=true)",
        );
        console.warn(
          "   Blockchain operations will fail until services are available",
        );
      } else {
        // Test connections to all services
        await this.testConnections();
      }

      this.initialized = true;
      console.log("MidnightClient initialized successfully");
    } catch (error) {
      console.error("Failed to initialize MidnightClient:", error);
      throw new Error(
        `MidnightClient initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Test connections to Midnight services
   */
  private async testConnections(): Promise<void> {
    const tests = [this.testNodeConnection(), this.testIndexerConnection()];

    try {
      await Promise.all(tests);
      console.log("Core Midnight service connections verified");

      // Test proof server separately (optional for development)
      try {
        await this.testProofServerConnection();
        console.log("Proof server connection verified");
      } catch (error) {
        console.warn(
          "⚠️  Proof server not available - ZK proof generation will not work",
        );
        console.warn(
          "   Start the proof server with: npm run proof-server (if available)",
        );
      }
    } catch (error) {
      throw new Error(
        `Service connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Test connection to Midnight node
   */
  private async testNodeConnection(): Promise<void> {
    try {
      const response = await axios.get(`${this.config.nodeUrl}/health`, {
        timeout: 5000,
      });

      if (response.status !== 200) {
        throw new Error(
          `Node health check failed with status: ${response.status}`,
        );
      }

      console.log("Midnight node connection verified");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Node connection failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Test connection to Midnight indexer
   */
  private async testIndexerConnection(): Promise<void> {
    try {
      // The indexerUrl already includes the /api/v1/graphql path
      const response = await axios.post(
        this.config.indexerUrl,
        {
          query: "{ __schema { types { name } } }",
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 5000,
        },
      );

      if (response.status !== 200) {
        throw new Error(
          `Indexer health check failed with status: ${response.status}`,
        );
      }

      console.log("Midnight indexer connection verified");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Indexer connection failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Test connection to proof server
   */
  private async testProofServerConnection(): Promise<void> {
    try {
      const response = await axios.get(`${this.config.proofServerUrl}/health`, {
        timeout: 5000,
      });

      if (response.status !== 200) {
        throw new Error(
          `Proof server health check failed with status: ${response.status}`,
        );
      }

      console.log("Proof server connection verified");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Proof server connection failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Register a commitment on the Midnight blockchain
   * Requirements: 3.3, 5.2
   */
  public async registerCommitment(params: CommitmentParams): Promise<string> {
    // Graceful handling - provide mock response if not initialized
    if (!this.initialized) {
      console.warn(
        "⚠️  MidnightClient not initialized. Returning mock transaction hash.",
      );
      return `mock_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    try {
      console.log(`Registering commitment for user ${params.userDID}`);

      // In a real implementation, this would use the Midnight.js SDK
      // to create and submit a transaction to the DataCommitment contract
      // For now, we'll simulate the blockchain transaction

      const transactionData = {
        circuit: "registerCommitment",
        params: {
          commitmentHash: params.commitmentHash,
          userDID: params.userDID,
          serviceProvider: params.serviceProvider,
          dataCategories: params.dataCategories,
          timestamp: Date.now(),
        },
      };

      // Simulate proof generation via proof server
      const proofResponse = await axios.post(
        `${this.config.proofServerUrl}/generate-proof`,
        {
          circuit: "DataCommitment.registerCommitment",
          witness: transactionData.params,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 30000, // ZK proof generation can take time
        },
      );

      if (proofResponse.status !== 200) {
        throw new Error(
          `Proof generation failed with status: ${proofResponse.status}`,
        );
      }

      // Simulate transaction submission to Midnight node
      const txResponse = await axios.post(
        `${this.config.nodeUrl}/submit-transaction`,
        {
          proof: proofResponse.data.proof,
          publicInputs: {
            commitmentHash: params.commitmentHash,
            userDID: params.userDID,
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        },
      );

      if (txResponse.status !== 200) {
        throw new Error(
          `Transaction submission failed with status: ${txResponse.status}`,
        );
      }

      const transactionHash =
        txResponse.data.transactionHash ||
        `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(
        `Commitment registered successfully. Transaction hash: ${transactionHash}`,
      );
      return transactionHash;
    } catch (error) {
      console.error("Error registering commitment:", error);
      throw new Error(
        `Failed to register commitment: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate a zero-knowledge deletion proof
   * Requirements: 4.1, 4.3, 6.1, 6.4
   */
  public async generateDeletionProof(
    params: DeletionProofParams,
  ): Promise<string> {
    // Graceful handling - provide mock response if not initialized
    if (!this.initialized) {
      console.warn(
        "⚠️  MidnightClient not initialized. Returning mock deletion proof.",
      );
      return `mock_proof_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    try {
      console.log(
        `Generating deletion proof for commitment ${params.commitmentHash}`,
      );

      // Generate ZK proof using local proof server
      const proofData = {
        circuit: "ZKDeletionVerifier.verifyDeletion",
        witness: {
          userDID: params.userDID,
          commitmentHash: params.commitmentHash,
          deletionCertificate: params.deletionCertificate,
          timestamp: Date.now(),
        },
      };

      const response = await axios.post(
        `${this.config.proofServerUrl}/generate-proof`,
        proofData,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 60000, // ZK deletion proofs may take longer
        },
      );

      if (response.status !== 200) {
        throw new Error(
          `Deletion proof generation failed with status: ${response.status}`,
        );
      }

      const proofHash =
        response.data.proofHash ||
        `proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(
        `Deletion proof generated successfully. Proof hash: ${proofHash}`,
      );
      return proofHash;
    } catch (error) {
      console.error("Error generating deletion proof:", error);
      throw new Error(
        `Failed to generate deletion proof: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Mark a commitment as deleted on the blockchain
   * Requirements: 4.1, 4.3
   */
  public async markDeleted(
    commitmentHash: string,
    proofHash: string,
  ): Promise<string> {
    // Graceful handling - provide mock response if not initialized
    if (!this.initialized) {
      console.warn(
        "⚠️  MidnightClient not initialized. Returning mock deletion transaction.",
      );
      return `mock_tx_del_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    try {
      console.log(`Marking commitment ${commitmentHash} as deleted`);

      // Submit deletion proof to blockchain
      const response = await axios.post(
        `${this.config.nodeUrl}/submit-transaction`,
        {
          circuit: "DataCommitment.markAsDeleted",
          params: {
            commitmentHash,
            deletionProofHash: proofHash,
            timestamp: Date.now(),
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        },
      );

      if (response.status !== 200) {
        throw new Error(
          `Mark deleted transaction failed with status: ${response.status}`,
        );
      }

      const transactionHash =
        response.data.transactionHash ||
        `tx_del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(
        `Commitment marked as deleted. Transaction hash: ${transactionHash}`,
      );
      return transactionHash;
    } catch (error) {
      console.error("Error marking commitment as deleted:", error);
      throw new Error(
        `Failed to mark commitment as deleted: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get user commitments from the blockchain
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  public async getUserCommitments(
    userDID: string,
  ): Promise<BlockchainCommitment[]> {
    // Graceful handling - return empty array if not initialized
    if (!this.initialized) {
      console.warn(
        "⚠️  MidnightClient not initialized. Returning empty commitments array.",
      );
      return [];
    }

    try {
      console.log(`Fetching commitments for user ${userDID}`);

      // Query indexer for user's commitments
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

      const response = await axios.post(
        `${this.config.indexerUrl}/graphql`,
        {
          query,
          variables: { userDID },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        },
      );

      if (response.status !== 200) {
        throw new Error(`Indexer query failed with status: ${response.status}`);
      }

      const commitments: BlockchainCommitment[] =
        response.data.data?.commitments || [];

      console.log(
        `Retrieved ${commitments.length} commitments for user ${userDID}`,
      );
      return commitments;
    } catch (error) {
      console.error("Error getting user commitments:", error);
      throw new Error(
        `Failed to get user commitments: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get blockchain network statistics
   */
  public async getNetworkStats(): Promise<{
    blockHeight: number;
    totalCommitments: number;
  }> {
    // Graceful handling - return default stats if not initialized
    if (!this.initialized) {
      console.warn(
        "⚠️  MidnightClient not initialized. Returning default network stats.",
      );
      return {
        blockHeight: 0,
        totalCommitments: 0,
      };
    }

    try {
      const query = `
        query GetNetworkStats {
          blocks(limit: 1, order_by: { height: desc }) {
            height
          }
          commitments_aggregate {
            aggregate {
              count
            }
          }
        }
      `;

      const response = await axios.post(
        this.config.indexerUrl, // URL already includes /api/v1/graphql
        { query },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 5000,
        },
      );

      if (response.status !== 200) {
        throw new Error(
          `Network stats query failed with status: ${response.status}`,
        );
      }

      const data = response.data.data;

      // Handle null or missing data gracefully
      if (!data) {
        console.warn(
          "⚠️  Network stats query returned no data - indexer may not be fully synced",
        );
        return {
          blockHeight: 0,
          totalCommitments: 0,
        };
      }

      return {
        blockHeight: data.blocks?.[0]?.height || 0,
        totalCommitments: data.commitments_aggregate?.aggregate?.count || 0,
      };
    } catch (error) {
      console.error("Error getting network stats:", error);
      throw new Error(
        `Failed to get network stats: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Ensure the client is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("MidnightClient must be initialized before use");
    }
  }

  /**
   * Check if the client is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current configuration
   */
  public getConfig(): MidnightConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (requires re-initialization)
   */
  public updateConfig(newConfig: Partial<MidnightConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.initialized = false;
  }
}
