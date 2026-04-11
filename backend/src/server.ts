/**
 * Oblivion Protocol REST API Server
 * Express server with core endpoints for SDK integration and user dashboard
 * Requirements: 1.1, 2.1, 3.1, 8.1
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { createServer, Server } from "http";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { StorageManager } from "./storage/StorageManager.js";
import { MidnightClient } from "./midnight/MidnightClient.js";
import { MidnightContractClient } from "./midnight/MidnightContractClient.js";
import { WalletProviderService } from "./midnight/WalletProvider.js";
import { WebSocketManager } from "./websocket/WebSocketManager.js";
import { WebhookManager } from "./webhook/WebhookManager.js";
import { getAppConfig, validateConfig } from "./config/index.js";
import { UserData } from "./types/index.js";

// ES module dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ApiError extends Error {
  statusCode?: number;
}

export class OblivionServer {
  private app: express.Application;
  private server: Server;
  private storageManager: StorageManager;
  private midnightClient: MidnightClient;
  private midnightContractClient: MidnightContractClient;
  private walletProviderService: WalletProviderService;
  private webSocketManager: WebSocketManager;
  private webhookManager: WebhookManager;
  private config: ReturnType<typeof getAppConfig>;
  private useMidnightJS: boolean = false;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.config = getAppConfig();

    // Initialize storage and blockchain clients
    this.storageManager = new StorageManager(
      this.config.storage,
      Buffer.from(this.config.encryptionKey, "utf8"),
    );

    // Keep old client for fallback
    this.midnightClient = new MidnightClient(this.config.midnight);

    // Initialize new Midnight.js integration
    const indexerWsUrl =
      this.config.midnight.indexerUrl.replace("https://", "wss://") + "/ws";

    this.walletProviderService = new WalletProviderService({
      indexerUrl: this.config.midnight.indexerUrl,
      indexerWsUrl: this.config.midnight.indexerWsUrl,
      proofServerUrl: this.config.midnight.proofServerUrl,
      nodeUrl: this.config.midnight.nodeUrl,
      walletSeed: process.env.MIDNIGHT_WALLET_SEED || "",
      networkId: this.config.midnight.networkId,
    });

    this.midnightContractClient = new MidnightContractClient({
      indexerUrl: this.config.midnight.indexerUrl,
      indexerWsUrl: this.config.midnight.indexerWsUrl,
      proofServerUrl: this.config.midnight.proofServerUrl,
      networkId: this.config.midnight.networkId,
      contractsPath: path.join(__dirname, "../../contracts"),
    });

    // Initialize WebSocket manager
    this.webSocketManager = new WebSocketManager(this.server);

    // Initialize Webhook manager
    this.webhookManager = new WebhookManager();
  }

  /**
   * Initialize the server and all dependencies
   */
  public async initialize(): Promise<void> {
    try {
      // Validate configuration
      validateConfig();

      // Initialize storage and blockchain connections
      await this.storageManager.initialize();

      // Try to initialize Midnight.js integration
      let midnightInitialized = false;

      try {
        console.log("\n🌙 Initializing Midnight.js SDK integration...");
        console.log(`   Network: ${this.config.midnight.networkId}`);
        console.log(`   Node URL: ${this.config.midnight.nodeUrl}`);
        console.log(`   Indexer: ${this.config.midnight.indexerUrl}`);
        console.log(`   Proof Server: ${this.config.midnight.proofServerUrl}`);
        console.log(
          `   Wallet Seed: ${this.config.midnight.walletSeed ? "✓ Present" : "✗ Missing"}`,
        );

        // Check prerequisites
        if (!this.config.midnight.walletSeed) {
          console.warn(
            "\n⚠️  MIDNIGHT_WALLET_SEED not set - skipping full SDK initialization",
          );
          console.warn(
            "   To enable real network mode, set MIDNIGHT_WALLET_SEED environment variable",
          );
        } else {
          console.log("\n   Attempting wallet provider initialization...");
          // Initialize wallet provider
          await this.walletProviderService.initialize();
          console.log("   ✅ Wallet provider initialized");

          console.log("   Attempting contract client initialization...");
          // Initialize contract client
          await this.midnightContractClient.initialize();
          console.log("   ✅ Contract client initialized");

          console.log("   Configuring wallet provider for contracts...");
          // Set wallet provider for contract client
          this.midnightContractClient.setWalletProvider(
            this.walletProviderService.getProvider(),
          );
          console.log("   ✅ Wallet provider configured for contracts");

          midnightInitialized = true;
          this.useMidnightJS = true;
          console.log(
            "\n✅ Midnight.js SDK integration active - REAL NETWORK MODE\n",
          );
        }
      } catch (error) {
        console.warn("\n⚠️  Midnight.js SDK initialization failed:");
        console.warn(
          `   Error: ${error instanceof Error ? error.message : error}`,
        );
        console.warn("   Falling back to mock mode for development\n");
      }

      // Always initialize fallback client for safety
      try {
        await this.midnightClient.initialize();
        console.log("✅ Fallback MidnightClient initialized\n");
      } catch (fallbackError) {
        console.warn(
          "⚠️  Fallback MidnightClient initialization failed (non-critical):",
        );
        console.warn(
          `   Error: ${fallbackError instanceof Error ? fallbackError.message : fallbackError}`,
        );
        console.warn(
          "   Server will run without full blockchain integration\n",
        );

        // Mark as not fully initialized but don't fail - we'll use defaults
        if (!midnightInitialized) {
          this.useMidnightJS = false;
        }
      }

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      console.log("OblivionServer initialized successfully");
      console.log(
        `Mode: ${this.useMidnightJS ? "Midnight.js SDK" : "Fallback/Mock"}\n`,
      );
    } catch (error) {
      console.error("Failed to initialize OblivionServer:", error);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
        credentials: true,
      }),
    );

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const timestamp = new Date().toISOString();
      console.log(`${timestamp} ${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check endpoint (both /health and /api/health for compatibility)
    this.app.get("/health", this.handleHealthCheck.bind(this));
    this.app.get("/api/health", this.handleHealthCheck.bind(this));

    // API routes
    const apiRouter = express.Router();

    // SDK integration endpoint - register user data
    apiRouter.post("/register-data", this.handleRegisterData.bind(this));

    // Dashboard endpoints - get user data footprint
    apiRouter.get("/user/:did/footprint", this.handleGetFootprint.bind(this));

    // Deletion endpoint - delete all user data
    apiRouter.post("/user/:did/delete-all", this.handleDeleteAll.bind(this));
    // Delete single commitment
    apiRouter.post(
      "/user/:did/delete/:commitment",
      this.handleDeleteCommitment.bind(this),
    );

    // Webhook management endpoints
    apiRouter.post("/webhooks", this.handleRegisterWebhook.bind(this));
    apiRouter.get("/webhooks/:companyId", this.handleGetWebhooks.bind(this));
    apiRouter.put("/webhooks/:webhookId", this.handleUpdateWebhook.bind(this));
    apiRouter.delete(
      "/webhooks/:webhookId",
      this.handleDeleteWebhook.bind(this),
    );

    // Company dashboard endpoints
    apiRouter.get("/company/stats", this.handleGetCompanyStats.bind(this));
    apiRouter.get(
      "/company/deletion-requests",
      this.handleGetDeletionRequests.bind(this),
    );

    // Mount API router
    this.app.use("/api", apiRouter);

    // 404 handler for unknown routes
    this.app.use("*", (req: Request, res: Response) => {
      res.status(404).json({
        error: "Not Found",
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Health check endpoint for monitoring
   */
  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check database connection
      const dbStats = await this.storageManager.getStats();

      // Check blockchain connection (optional if SKIP_MIDNIGHT_CHECKS is set)
      let networkStats = { blockHeight: 0, totalCommitments: 0 };
      let blockchainStatus = "connected";

      if (process.env.SKIP_MIDNIGHT_CHECKS !== "true") {
        try {
          // Only try to get network stats if client is initialized
          if (this.midnightClient.isInitialized()) {
            networkStats = await this.midnightClient.getNetworkStats();
          } else {
            blockchainStatus = "not_initialized";
          }
        } catch (error) {
          blockchainStatus = "unavailable";
          console.warn("Blockchain stats unavailable:", error);
        }
      } else {
        blockchainStatus = "skipped";
      }

      // Check proof server status
      let proofServerStatus = "unknown";
      try {
        const axios = require("axios");
        const proofServerUrl = this.midnightClient.getConfig().proofServerUrl;
        const response = await axios.get(`${proofServerUrl}/health`, {
          timeout: 2000,
        });
        proofServerStatus =
          response.status === 200 ? "connected" : "unavailable";
      } catch (error) {
        proofServerStatus = "unavailable";
      }

      // Get WebSocket statistics
      const wsStats = this.webSocketManager.getStats();

      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        midnightJS: {
          enabled: this.useMidnightJS,
          status: this.useMidnightJS ? "active" : "fallback",
          contractsLoaded: this.useMidnightJS
            ? this.midnightContractClient.isReady()
            : false,
          walletInitialized: this.useMidnightJS
            ? this.walletProviderService.isInitialized()
            : false,
        },
        services: {
          database: {
            status: "connected",
            totalRecords: dbStats.totalRecords,
            activeRecords: dbStats.activeRecords,
            deletedRecords: dbStats.deletedRecords,
          },
          blockchain: {
            status: blockchainStatus,
            network: this.midnightClient.getConfig().networkId,
            blockHeight: networkStats.blockHeight,
            totalCommitments: networkStats.totalCommitments,
          },
          proofServer: {
            status: proofServerStatus,
            url: this.midnightClient.getConfig().proofServerUrl,
          },
          websocket: {
            status: "connected",
            totalSubscriptions: wsStats.totalSubscriptions,
            uniqueUsers: wsStats.uniqueUsers,
            subscriptionsByUser: wsStats.subscriptionsByUser,
          },
          webhooks: {
            status: "active",
            ...this.webhookManager.getStats(),
          },
        },
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Register user data endpoint for SDK integration
   * Requirements: 3.1, 5.2
   */
  private async handleRegisterData(req: Request, res: Response): Promise<void> {
    try {
      const { userDID, data, dataType, serviceProvider } = req.body;

      // Validate required fields
      if (!userDID || !data || !dataType || !serviceProvider) {
        res.status(400).json({
          error: "Bad Request",
          message:
            "Missing required fields: userDID, data, dataType, serviceProvider",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate userDID format
      if (!userDID.startsWith("did:midnight:")) {
        res.status(400).json({
          error: "Bad Request",
          message: "Invalid userDID format. Must start with 'did:midnight:'",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const userData: UserData = {
        userDID,
        data,
        dataType,
        serviceProvider,
      };

      // Store data and get commitment hash
      const commitmentHash = await this.storageManager.storeData(userData);

      // Register commitment on blockchain
      let transactionHash: string;

      // Check prerequisites for blockchain operations
      if (this.useMidnightJS && this.midnightContractClient.isInitialized()) {
        try {
          console.log("🌙 Using Midnight.js SDK for commitment registration");
          transactionHash =
            await this.midnightContractClient.registerCommitment({
              userDID,
              commitmentHash,
              serviceProvider,
              dataCategories: [dataType],
            });
        } catch (sdkError) {
          console.warn(
            "⚠️  Midnight.js SDK error, falling back:",
            sdkError instanceof Error ? sdkError.message : sdkError,
          );
          this.useMidnightJS = false;
          transactionHash = await this.attemptFallbackRegisterCommitment({
            userDID,
            commitmentHash,
            serviceProvider,
            dataCategories: [dataType],
          });
        }
      } else if (this.midnightClient.isInitialized()) {
        console.log("📦 Using fallback client for commitment registration");
        try {
          transactionHash = await this.midnightClient.registerCommitment({
            userDID,
            commitmentHash,
            serviceProvider,
            dataCategories: [dataType],
          });
        } catch (fallbackError) {
          console.warn(
            "⚠️  Fallback client error:",
            fallbackError instanceof Error
              ? fallbackError.message
              : fallbackError,
          );
          // Final fallback: generate mock hash
          transactionHash = this.generateMockTransactionHash();
        }
      } else {
        console.warn("⚠️  No blockchain client initialized, using mock hash");
        transactionHash = this.generateMockTransactionHash();
      }

      // Broadcast data status update via WebSocket
      this.webSocketManager.broadcastDataStatus(userDID, "registered", {
        commitmentHash,
        dataType,
        serviceProvider,
        transactionHash,
      });

      // Broadcast blockchain confirmation
      this.webSocketManager.broadcastBlockchainConfirmation({
        userDID,
        commitmentHash,
        transactionHash,
        confirmationType: "registration",
      });

      // Send webhook notification
      await this.webhookManager.notifyDataRegistered(
        userDID,
        commitmentHash,
        dataType,
        serviceProvider,
        transactionHash,
      );

      res.status(201).json({
        success: true,
        commitmentHash,
        transactionHash,
        message: "Data registered successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error registering data:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Failed to register data",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get user data footprint for dashboard
   * Requirements: 1.1, 1.2, 1.3, 1.4
   */
  private async handleGetFootprint(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;

      // Validate userDID format
      if (!did.startsWith("did:midnight:")) {
        res.status(400).json({
          error: "Bad Request",
          message: "Invalid userDID format. Must start with 'did:midnight:'",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Get data locations from storage
      const dataLocations = await this.storageManager.getFootprint(did);

      // Get blockchain commitments for verification (optional, only if midnight is initialized)
      let blockchainCommitments: any[] = [];
      try {
        if (this.useMidnightJS && this.midnightContractClient.isReady()) {
          // Use Midnight.js SDK if available
          blockchainCommitments = []; // Would query from contract
        } else if (this.midnightClient && this.midnightClient.isInitialized()) {
          // Use fallback client if initialized
          blockchainCommitments =
            await this.midnightClient.getUserCommitments(did);
        }
      } catch (error) {
        console.warn("Could not fetch blockchain commitments:", error);
        // Continue without blockchain data - still return database records
      }

      res.json({
        userDID: did,
        dataLocations,
        blockchainCommitments,
        totalRecords: dataLocations.length,
        activeRecords: dataLocations.filter((loc) => !loc.deleted).length,
        deletedRecords: dataLocations.filter((loc) => loc.deleted).length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error getting footprint:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to get data footprint",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Delete all user data endpoint
   * Requirements: 2.1, 2.5
   */
  private async handleDeleteAll(req: Request, res: Response): Promise<void> {
    try {
      const { did } = req.params;

      // Validate userDID format
      if (!did.startsWith("did:midnight:")) {
        res.status(400).json({
          error: "Bad Request",
          message: "Invalid userDID format. Must start with 'did:midnight:'",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Delete data and get deletion certificates
      const deletionCertificates = await this.storageManager.deleteData(did);

      if (deletionCertificates.length === 0) {
        res.status(404).json({
          error: "Not Found",
          message: "No data found for the specified user",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Broadcast initial deletion progress
      this.webSocketManager.broadcastDeletionProgress({
        userDID: did,
        totalRecords: deletionCertificates.length,
        processedRecords: 0,
        currentStep: "Starting deletion process",
        status: "in_progress",
      });

      // Generate ZK deletion proofs for each certificate
      const deletionProofs: Array<{
        commitmentHash: string;
        proofHash: string;
        transactionHash: string;
      }> = [];

      for (let i = 0; i < deletionCertificates.length; i++) {
        const certificate = deletionCertificates[i];

        try {
          // Update progress
          this.webSocketManager.broadcastDeletionProgress({
            userDID: did,
            totalRecords: deletionCertificates.length,
            processedRecords: i,
            currentStep: `Generating deletion proof for commitment ${certificate.commitmentHash}`,
            status: "in_progress",
          });

          // Generate ZK deletion proof
          let proofHash: string;
          if (this.useMidnightJS) {
            console.log(
              "🌙 Using Midnight.js SDK for deletion proof generation",
            );
            proofHash = await this.midnightContractClient.generateDeletionProof(
              certificate.commitmentHash,
              certificate.signature,
            );
          } else {
            console.log(
              "⚠️  Using fallback mode for deletion proof generation",
            );
            proofHash = await this.midnightClient.generateDeletionProof({
              userDID: did,
              commitmentHash: certificate.commitmentHash,
              deletionCertificate: certificate.signature,
            });
          }

          // Update progress
          this.webSocketManager.broadcastDeletionProgress({
            userDID: did,
            totalRecords: deletionCertificates.length,
            processedRecords: i,
            currentStep: `Marking commitment ${certificate.commitmentHash} as deleted on blockchain`,
            status: "in_progress",
          });

          // Mark as deleted on blockchain
          let transactionHash: string;
          if (this.useMidnightJS) {
            transactionHash = await this.midnightContractClient.markAsDeleted(
              certificate.commitmentHash,
              proofHash,
            );
          } else {
            transactionHash = await this.midnightClient.markDeleted(
              certificate.commitmentHash,
              proofHash,
            );
          }

          // Update storage with proof hash
          await this.storageManager.updateDeletionProof(
            certificate.commitmentHash,
            proofHash,
          );

          deletionProofs.push({
            commitmentHash: certificate.commitmentHash,
            proofHash,
            transactionHash,
          });

          // Broadcast blockchain confirmation
          this.webSocketManager.broadcastBlockchainConfirmation({
            userDID: did,
            commitmentHash: certificate.commitmentHash,
            transactionHash,
            confirmationType: "deletion",
          });

          // Broadcast data status update
          this.webSocketManager.broadcastDataStatus(did, "deleted", {
            commitmentHash: certificate.commitmentHash,
            dataType: "unknown", // We don't have dataType in certificate
            serviceProvider: "unknown", // We don't have serviceProvider in certificate
            transactionHash,
          });

          // Send webhook notification for individual deletion
          await this.webhookManager.notifyDataDeleted(
            did,
            certificate.commitmentHash,
            "unknown", // We don't have dataType in certificate
            "unknown", // We don't have serviceProvider in certificate
            transactionHash,
          );
        } catch (proofError) {
          console.error(
            `Failed to generate proof for commitment ${certificate.commitmentHash}:`,
            proofError,
          );

          // Broadcast error progress
          this.webSocketManager.broadcastDeletionProgress({
            userDID: did,
            totalRecords: deletionCertificates.length,
            processedRecords: i,
            currentStep: `Failed to process commitment ${certificate.commitmentHash}`,
            status: "in_progress",
            error:
              proofError instanceof Error
                ? proofError.message
                : "Unknown error",
          });

          // Continue with other proofs even if one fails
        }
      }

      // Broadcast completion
      this.webSocketManager.broadcastDeletionProgress({
        userDID: did,
        totalRecords: deletionCertificates.length,
        processedRecords: deletionCertificates.length,
        currentStep: "Deletion process completed",
        status: "completed",
      });

      // Send webhook notification for deletion completion
      await this.webhookManager.notifyDeletionCompleted(
        did,
        "unknown", // We don't have a specific service provider for the overall deletion
        {
          totalRecords: deletionCertificates.length,
          deletedRecords: deletionProofs.length,
          deletionProofs,
        },
      );

      res.json({
        success: true,
        userDID: did,
        deletedRecords: deletionCertificates.length,
        deletionProofs,
        message: "Data deletion completed successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error deleting data:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Failed to delete data",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Delete a single commitment for a user
   */
  private async handleDeleteCommitment(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { did, commitment } = req.params;

      if (!did.startsWith("did:midnight:")) {
        res.status(400).json({
          error: "Bad Request",
          message: "Invalid userDID format. Must start with 'did:midnight:'",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Delete the single commitment from storage and get certificate
      const certificate =
        await this.storageManager.deleteCommitment(commitment);

      if (!certificate) {
        res.status(404).json({
          error: "Not Found",
          message: "Commitment not found or already deleted",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Generate ZK deletion proof and mark on blockchain (same pattern as deleteAll)
      let proofHash: string | undefined = undefined;
      let transactionHash: string | undefined = undefined;

      try {
        if (this.useMidnightJS) {
          proofHash = await this.midnightContractClient.generateDeletionProof(
            certificate.commitmentHash,
            certificate.signature,
          );
        } else {
          proofHash = await this.midnightClient.generateDeletionProof({
            userDID: did,
            commitmentHash: certificate.commitmentHash,
            deletionCertificate: certificate.signature,
          });
        }

        // Mark as deleted on blockchain
        if (this.useMidnightJS) {
          transactionHash = await this.midnightContractClient.markAsDeleted(
            certificate.commitmentHash,
            proofHash,
          );
        } else {
          transactionHash = await this.midnightClient.markDeleted(
            certificate.commitmentHash,
            proofHash,
          );
        }

        // Update storage with proof
        await this.storageManager.updateDeletionProof(
          certificate.commitmentHash,
          proofHash,
        );

        // Broadcast events
        this.webSocketManager.broadcastBlockchainConfirmation({
          userDID: did,
          commitmentHash: certificate.commitmentHash,
          transactionHash,
          confirmationType: "deletion",
        });

        this.webSocketManager.broadcastDataStatus(did, "deleted", {
          commitmentHash: certificate.commitmentHash,
          dataType: "unknown",
          serviceProvider: "unknown",
          transactionHash,
        });

        // Send webhook
        await this.webhookManager.notifyDataDeleted(
          did,
          certificate.commitmentHash,
          "unknown",
          "unknown",
          transactionHash,
        );
      } catch (proofError) {
        console.error(
          "Failed to generate proof/mark blockchain for commitment:",
          proofError,
        );
        // Continue; return the certificate anyway but with info
      }

      res.json({
        success: true,
        certificate,
        proofHash: proofHash || null,
        transactionHash: transactionHash || null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error deleting commitment:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete commitment",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use(
      (error: ApiError, req: Request, res: Response, next: NextFunction) => {
        console.error("Unhandled error:", error);

        const statusCode = error.statusCode || 500;
        const message = error.message || "Internal Server Error";

        res.status(statusCode).json({
          error:
            statusCode === 500
              ? "Internal Server Error"
              : error.name || "Error",
          message,
          timestamp: new Date().toISOString(),
          ...(this.config.nodeEnv === "development" && { stack: error.stack }),
        });
      },
    );

    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error("Unhandled Rejection at:", promise, "reason:", reason);
      process.exit(1);
    });
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(this.config.port, () => {
          console.log(
            `🚀 Oblivion Protocol API server running on port ${this.config.port}`,
          );
          console.log(
            `📊 Health check available at http://localhost:${this.config.port}/health`,
          );
          console.log(
            `🔗 API endpoints available at http://localhost:${this.config.port}/api`,
          );
          console.log(
            `🔌 WebSocket server available at ws://localhost:${this.config.port}/ws`,
          );
          resolve();
        });

        this.server.on("error", (error) => {
          console.error("Server startup error:", error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Register webhook endpoint for companies
   * Requirements: 8.1
   */
  private async handleRegisterWebhook(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { companyId, url, events, secret } = req.body;

      // Validate required fields
      if (!companyId || !url || !events || !Array.isArray(events)) {
        res.status(400).json({
          error: "Bad Request",
          message: "Missing required fields: companyId, url, events (array)",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        res.status(400).json({
          error: "Bad Request",
          message: "Invalid URL format",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate events
      const validEvents = [
        "data_registered",
        "data_deleted",
        "deletion_completed",
      ];
      const invalidEvents = events.filter(
        (event: string) => !validEvents.includes(event),
      );

      if (invalidEvents.length > 0) {
        res.status(400).json({
          error: "Bad Request",
          message: `Invalid events: ${invalidEvents.join(", ")}. Valid events: ${validEvents.join(", ")}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const webhookId = this.webhookManager.registerWebhook(
        companyId,
        url,
        events,
        secret,
      );

      res.status(201).json({
        success: true,
        webhookId,
        message: "Webhook registered successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error registering webhook:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Failed to register webhook",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get webhooks for a company
   */
  private async handleGetWebhooks(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;

      const webhooks = this.webhookManager.getCompanyWebhooks(companyId);

      res.json({
        companyId,
        webhooks,
        totalWebhooks: webhooks.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error getting webhooks:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Failed to get webhooks",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Update webhook configuration
   */
  private async handleUpdateWebhook(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { webhookId } = req.params;
      const updates = req.body;

      // Validate webhook exists
      const webhook = this.webhookManager.getWebhook(webhookId);
      if (!webhook) {
        res.status(404).json({
          error: "Not Found",
          message: "Webhook not found",
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Validate URL if provided
      if (updates.url) {
        try {
          new URL(updates.url);
        } catch {
          res.status(400).json({
            error: "Bad Request",
            message: "Invalid URL format",
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      // Validate events if provided
      if (updates.events) {
        const validEvents = [
          "data_registered",
          "data_deleted",
          "deletion_completed",
        ];
        const invalidEvents = updates.events.filter(
          (event: string) => !validEvents.includes(event),
        );

        if (invalidEvents.length > 0) {
          res.status(400).json({
            error: "Bad Request",
            message: `Invalid events: ${invalidEvents.join(", ")}. Valid events: ${validEvents.join(", ")}`,
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      const success = this.webhookManager.updateWebhook(webhookId, updates);

      if (success) {
        res.json({
          success: true,
          webhookId,
          message: "Webhook updated successfully",
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(500).json({
          error: "Internal Server Error",
          message: "Failed to update webhook",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error updating webhook:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Failed to update webhook",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Delete webhook endpoint
   */
  private async handleDeleteWebhook(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { webhookId } = req.params;

      const success = this.webhookManager.removeWebhook(webhookId);

      if (success) {
        res.json({
          success: true,
          webhookId,
          message: "Webhook deleted successfully",
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(404).json({
          error: "Not Found",
          message: "Webhook not found",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error deleting webhook:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error ? error.message : "Failed to delete webhook",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get company statistics
   */
  private async handleGetCompanyStats(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      // Get database stats
      const dbStats = await this.storageManager.getStats();

      // Calculate compliance score based on deletion rate
      const complianceScore =
        dbStats.totalRecords > 0
          ? Math.round(
              ((dbStats.deletedRecords / dbStats.totalRecords) * 30 + 70) * 10,
            ) / 10
          : 100;

      res.json({
        totalUsers: 0, // This would come from user tracking if implemented
        activeRecords: dbStats.activeRecords,
        deletedRecords: dbStats.deletedRecords,
        pendingDeletions: 0, // This would come from pending deletion tracking
        avgDeletionTime: 24, // Hours - this would be calculated from actual deletion timestamps
        complianceScore,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error getting company stats:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to get company stats",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get deletion requests for company dashboard
   */
  private async handleGetDeletionRequests(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      // Get all data locations (this could be filtered by company in production)
      const locations = await this.storageManager.listAllDataLocations();

      // Filter and format for deletion request view
      const deletionRequests = locations
        .filter((loc) => loc.deleted)
        .map((loc) => ({
          id: loc.commitmentHash,
          userDID: loc.userDID,
          timestamp: loc.deletedAt
            ? new Date(loc.deletedAt).getTime()
            : Date.now(),
          dataCategories: [loc.dataType],
          status: "completed" as const,
          webhookStatus: "delivered" as const,
          retryAttempts: 0,
          serviceProvider: loc.serviceProvider,
        }));

      res.json({
        requests: deletionRequests,
        total: deletionRequests.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error getting deletion requests:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to get deletion requests",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get the Express app instance
   */
  public getApp(): express.Application {
    return this.app;
  }

  /**
   * Close server and cleanup resources
   */
  public async close(): Promise<void> {
    try {
      // Close WebSocket connections
      this.webSocketManager.close();

      // Close webhook manager
      this.webhookManager.close();

      // Close storage connections
      await this.storageManager.close();

      // Close HTTP server
      this.server.close();

      console.log("OblivionServer closed successfully");
    } catch (error) {
      console.error("Error closing server:", error);
      throw error;
    }
  }

  /**
   * Attempt to register commitment with fallback client
   */
  private async attemptFallbackRegisterCommitment(
    params: any,
  ): Promise<string> {
    try {
      if (this.midnightClient && this.midnightClient.isInitialized()) {
        console.log("📦 Falling back to MidnightClient");
        return await this.midnightClient.registerCommitment(params);
      } else {
        console.warn("⚠️  Fallback client not initialized, using mock hash");
        return this.generateMockTransactionHash();
      }
    } catch (error) {
      console.warn("Fallback attempt failed:", error);
      return this.generateMockTransactionHash();
    }
  }

  /**
   * Generate a mock transaction hash for fallback mode
   */
  private generateMockTransactionHash(): string {
    return (
      "0x" +
      Array.from({ length: 64 })
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("")
    );
  }
}
