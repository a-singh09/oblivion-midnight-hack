import { MidnightClient, MidnightConfig } from "./midnight/MidnightClient";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Integration test script for Midnight ZK proof generation and proof server connectivity
 */

async function testMidnightIntegration() {
  console.log("=== Oblivion Protocol - Midnight Integration Test ===\n");

  // Step 1: Initialize MidnightClient with configuration from .env
  console.log("Step 1: Initializing MidnightClient...");
  const config: MidnightConfig = {
    nodeUrl:
      process.env.MIDNIGHT_NODE_URL ||
      "https://rpc.testnet-02.midnight.network",
    indexerUrl:
      process.env.MIDNIGHT_INDEXER_URL ||
      "https://indexer.testnet-02.midnight.network/api/v3/graphql",
    indexerWsUrl:
      process.env.MIDNIGHT_INDEXER_WS_URL ||
      "wss://indexer.testnet-02.midnight.network/api/v3/graphql/ws",
    proofServerUrl:
      process.env.MIDNIGHT_PROOF_SERVER_URL || "http://localhost:6300",
    networkId: (process.env.MIDNIGHT_NETWORK_ID as any) || "preview",
    walletSeed: process.env.MIDNIGHT_WALLET_SEED,
    dataCommitmentContract: process.env.DATA_COMMITMENT_CONTRACT,
    zkDeletionVerifierContract: process.env.ZK_DELETION_VERIFIER_CONTRACT,
  };

  console.log("Configuration:");
  console.log(`  Network ID: ${config.networkId}`);
  console.log(`  Node URL: ${config.nodeUrl}`);
  console.log(`  Indexer URL: ${config.indexerUrl}`);
  console.log(`  Proof Server URL: ${config.proofServerUrl}`);
  console.log(`  Data Commitment Contract: ${config.dataCommitmentContract}`);
  console.log(
    `  ZK Deletion Verifier Contract: ${config.zkDeletionVerifierContract}\n`,
  );

  const client = new MidnightClient(config);

  try {
    // Step 2: Test connectivity to all Midnight services
    console.log("Step 2: Testing connectivity to Midnight services...");
    await client.initialize();
    console.log("✓ All services connected successfully\n");
  } catch (error) {
    console.error("✗ Failed to connect to Midnight services:");
    console.error(error instanceof Error ? error.message : error);
    console.log(
      "\nNote: If proof server connection failed, ensure it's running:",
    );
    console.log(
      "  - Check if proof server is running on",
      config.proofServerUrl,
    );
    console.log(
      "  - Refer to docs/PROOF_SERVER_SETUP.md for setup instructions\n",
    );
    return;
  }

  // Step 3: Test ZK proof generation with sample data
  console.log("Step 3: Testing ZK proof generation with sample data...");

  const sampleUserDID = "did:midnight:test123456789";
  const sampleCommitmentHash =
    "0x" + Buffer.from("sample_commitment_data").toString("hex");
  const sampleServiceProvider = "TestServiceProvider";
  const sampleDataCategories = ["personal_info", "browsing_history"];

  try {
    console.log(
      "\nTest 3a: Registering commitment (includes proof generation)...",
    );
    console.log("Sample data:");
    console.log(`  User DID: ${sampleUserDID}`);
    console.log(`  Commitment Hash: ${sampleCommitmentHash}`);
    console.log(`  Service Provider: ${sampleServiceProvider}`);
    console.log(`  Data Categories: ${sampleDataCategories.join(", ")}`);

    const txHash = await client.registerCommitment({
      userDID: sampleUserDID,
      commitmentHash: sampleCommitmentHash,
      serviceProvider: sampleServiceProvider,
      dataCategories: sampleDataCategories,
    });

    console.log(`✓ Commitment registered successfully`);
    console.log(`  Transaction Hash: ${txHash}\n`);
  } catch (error) {
    console.error("✗ Failed to register commitment:");
    console.error(error instanceof Error ? error.message : error);
    console.log("\nThis may indicate:");
    console.log("  - Proof server is not responding correctly");
    console.log("  - Network connectivity issues");
    console.log("  - Invalid proof generation parameters\n");
  }

  // Step 4: Test deletion proof generation
  try {
    console.log("Test 3b: Generating deletion proof...");
    const sampleDeletionCertificate = JSON.stringify({
      deletedAt: new Date().toISOString(),
      deletedBy: sampleServiceProvider,
      verificationMethod: "api_confirmation",
    });

    console.log("Deletion certificate data:");
    console.log(`  User DID: ${sampleUserDID}`);
    console.log(`  Commitment Hash: ${sampleCommitmentHash}`);
    console.log(`  Certificate: ${sampleDeletionCertificate}`);

    const proofHash = await client.generateDeletionProof({
      userDID: sampleUserDID,
      commitmentHash: sampleCommitmentHash,
      deletionCertificate: sampleDeletionCertificate,
    });

    console.log(`✓ Deletion proof generated successfully`);
    console.log(`  Proof Hash: ${proofHash}\n`);

    // Step 5: Mark commitment as deleted
    console.log("Test 3c: Marking commitment as deleted...");
    const deletionTxHash = await client.markDeleted(
      sampleCommitmentHash,
      proofHash,
    );
    console.log(`✓ Commitment marked as deleted`);
    console.log(`  Transaction Hash: ${deletionTxHash}\n`);
  } catch (error) {
    console.error("✗ Failed to generate deletion proof or mark as deleted:");
    console.error(error instanceof Error ? error.message : error);
    console.log("\nThis may indicate:");
    console.log(
      "  - Proof server timeout (deletion proofs can take 30-60 seconds)",
    );
    console.log("  - Insufficient proof server resources");
    console.log("  - Invalid deletion certificate format\n");
  }

  // Step 6: Query user commitments
  try {
    console.log("Step 4: Querying user commitments from indexer...");
    const commitments = await client.getUserCommitments(sampleUserDID);
    console.log(
      `✓ Retrieved ${commitments.length} commitment(s) for user ${sampleUserDID}`,
    );

    if (commitments.length > 0) {
      console.log("\nCommitment details:");
      commitments.forEach((commitment, index) => {
        console.log(`  [${index + 1}] Hash: ${commitment.commitmentHash}`);
        console.log(`      Service Provider: ${commitment.serviceProvider}`);
        console.log(
          `      Categories: ${commitment.dataCategories.join(", ")}`,
        );
        console.log(`      Deleted: ${commitment.deleted}`);
        if (commitment.deletionProofHash) {
          console.log(`      Deletion Proof: ${commitment.deletionProofHash}`);
        }
      });
    }
    console.log();
  } catch (error) {
    console.error("✗ Failed to query commitments:");
    console.error(error instanceof Error ? error.message : error);
    console.log();
  }

  // Step 7: Get network statistics
  try {
    console.log("Step 5: Fetching network statistics...");
    const stats = await client.getNetworkStats();
    console.log(`✓ Network statistics retrieved`);
    console.log(`  Block Height: ${stats.blockHeight}`);
    console.log(`  Total Commitments: ${stats.totalCommitments}\n`);
  } catch (error) {
    console.error("✗ Failed to get network statistics:");
    console.error(error instanceof Error ? error.message : error);
    console.log();
  }

  console.log("=== Integration Test Complete ===\n");
  console.log("Summary:");
  console.log("  ✓ Tests completed - check results above for any failures");
  console.log(
    "  ✓ If all tests passed, ZK proof generation and proof server are working correctly",
  );
  console.log("  ✓ If any tests failed, review the error messages and ensure:");
  console.log("    - Proof server is running and accessible");
  console.log("    - Midnight testnet services are available");
  console.log("    - Environment variables are correctly configured\n");
}

// Run the test
testMidnightIntegration()
  .then(() => {
    console.log("Test script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test script failed with error:");
    console.error(error);
    process.exit(1);
  });
