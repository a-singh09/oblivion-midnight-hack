import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import * as fs from "node:fs";
import * as path from "node:path";
import { randomBytes } from "node:crypto";
import * as Rx from "rxjs";
import { Buffer } from "buffer";

// Midnight.js imports
import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { signingKeyFromBip340 } from "@midnight-ntwrk/compact-runtime";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import { unshieldedToken } from "@midnight-ntwrk/ledger-v8";
import { generateRandomSeed } from "@midnight-ntwrk/wallet-sdk-hd";

// Shared utilities from the utils.ts file
import {
  createWallet,
  createProviders,
  getCompiledContract,
  zkConfigPath,
  PRIVATE_STATE_ID,
  CONTRACT_NAME,
} from "./utils.js";

// ─── Main Deploy Script ────────────────────────────────────────────────────────

async function main() {
  console.log(
    "\n╔══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    `║        Deploy ${CONTRACT_NAME} to Midnight Preprod${" ".repeat(Math.max(0, 22 - CONTRACT_NAME.length))}║`,
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝\n",
  );

  // Check if contract is compiled
  const contractDir = path.join(zkConfigPath, "contract");
  const hasCompiledContract =
    fs.existsSync(path.join(contractDir, "index.js")) ||
    fs.existsSync(path.join(contractDir, "index.cjs"));

  if (!hasCompiledContract) {
    console.error("Contract not compiled! Run: npm run compile");
    process.exit(1);
  }

  const rl = createInterface({ input: stdin, output: stdout });

  try {
    // 1. Wallet setup
    console.log(
      "─── Step 1: Wallet Setup ───────────────────────────────────────\n",
    );
    const choice = await rl.question(
      "  [1] Create new wallet\n  [2] Restore from seed\n  > ",
    );

    const seed =
      choice.trim() === "2"
        ? await rl.question("\n  Enter your 64-character seed: ")
        : toHex(Buffer.from(generateRandomSeed()));

    if (choice.trim() !== "2") {
      console.log(
        `\n  ⚠️  SAVE THIS SEED (you'll need it later):\n  ${seed}\n`,
      );
    }

    console.log("  Creating wallet...");
    const walletCtx = await createWallet(seed);

    console.log("  Syncing with network...");
    const state = await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5000),
        Rx.filter((s: any) => s.isSynced),
      ),
    );

    const address = walletCtx.unshieldedKeystore.getBech32Address();
    const balance =
      (state as any).unshielded.balances[unshieldedToken().raw] ?? 0n;

    console.log(`\n  Wallet Address: ${address}`);
    console.log(`  Balance: ${balance.toLocaleString()} tNight\n`);

    // 2. Fund wallet if needed
    if (balance === 0n) {
      console.log(
        "─── Step 2: Fund Your Wallet ───────────────────────────────────\n",
      );
      console.log("  Visit: https://faucet.preprod.midnight.network/");
      console.log(`  Address: ${address}\n`);
      console.log("  Waiting for funds...");

      await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(
          Rx.throttleTime(10000),
          Rx.filter((s: any) => s.isSynced),
          Rx.map(
            (s: any) => s.unshielded.balances[unshieldedToken().raw] ?? 0n,
          ),
          Rx.filter((b: bigint) => b > 0n),
        ),
      );
      console.log("  Funds received!\n");
    }

    // 3. Register for DUST
    console.log(
      "─── Step 3: DUST Token Setup ───────────────────────────────────\n",
    );
    const dustState = await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(Rx.filter((s: any) => s.isSynced)),
    );

    if (dustState.dust.balance(new Date()) === 0n) {
      const nightUtxos = (dustState as any).unshielded.availableCoins.filter(
        (c: any) => !c.meta?.registeredForDustGeneration,
      );

      if (nightUtxos.length > 0) {
        console.log("  Registering for DUST generation...");
        const recipe =
          await walletCtx.wallet.registerNightUtxosForDustGeneration(
            nightUtxos,
            walletCtx.unshieldedKeystore.getPublicKey(),
            (payload: Uint8Array) =>
              walletCtx.unshieldedKeystore.signData(payload),
          );
        await walletCtx.wallet.submitTransaction(
          await walletCtx.wallet.finalizeRecipe(recipe),
        );
      }

      console.log("  Waiting for DUST tokens...");
      await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(
          Rx.throttleTime(5000),
          Rx.filter((s) => s.isSynced),
          Rx.filter((s) => s?.dust?.balance(new Date()) > 0n),
        ),
      );
    }
    console.log("  DUST tokens ready!\n");

    // 4. Deploy contract
    console.log(
      "─── Step 4: Deploy Contract ────────────────────────────────────\n",
    );
    console.log("  Setting up providers...");
    const providers = await createProviders(walletCtx);
    const compiledContract = await getCompiledContract();
    const signingKey = signingKeyFromBip340(randomBytes(32));

    console.log("  Deploying contract (this may take 30-60 seconds)...\n");
    const deployed = await (deployContract as any)(providers, {
      compiledContract,
      signingKey,
    });

    const contractAddress = deployed.deployTxData.public.contractAddress;
    console.log("  ✅ Contract deployed successfully!\n");
    console.log(`  Contract Address: ${contractAddress}\n`);

    // 5. Save deployment info
    const deploymentInfo = {
      contractAddress,
      seed,
      network: "preprod",
      deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      "deployment.json",
      JSON.stringify(deploymentInfo, null, 2),
    );
    console.log("  Saved to deployment.json\n");

    await walletCtx.wallet.stop();
    console.log(
      "─── Deployment Complete! ───────────────────────────────────────\n",
    );
  } finally {
    rl.close();
  }
}

main().catch(console.error);
