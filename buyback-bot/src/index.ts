import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initWebSocket, addActivity, updateStatus, updateBalances, getStats, recordBurn } from './stats.js';
import { claimCreatorFees } from './claim.js';
import { swapSolToToken, getSolBalance } from './swap.js';
import { burnAllTokens, getTokenBalance } from './burn.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Config
const CONFIG = {
  rpcUrl: process.env.RPC_URL || '',
  treasuryKey: process.env.TREASURY_PRIVATE_KEY || '',
  bbbbbMint: process.env.BBBBB_MINT || '',
  jupiterApiKey: process.env.JUPITER_API_KEY || '',
  minSolToSwap: parseFloat(process.env.MIN_SOL_TO_SWAP || '0.1'),
  loopInterval: parseInt(process.env.LOOP_INTERVAL_SECONDS || '60') * 1000,
  dashboardPort: parseInt(process.env.DASHBOARD_PORT || '3001'),
  demoMode: process.env.DEMO_MODE === 'true',
};

let connection: Connection;
let wallet: Keypair;
let tokenMint: PublicKey;
let isProcessing = false;

async function main() {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🗑️  $BBBBB BUYBACK & BURN BOT  🔥                       ║
  ║                                                           ║
  ║   "BaBa BIN burns the supply"                             ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);

  // Demo mode check
  if (CONFIG.demoMode) {
    console.log('⚠️  DEMO MODE - Dashboard only, no real transactions');
    const server = startDashboard();
    initWebSocket(server);
    updateBalances(2.5, 0);
    addActivity('info', '🎬 Demo mode active - simulating buyback & burn...');
    startDemoSimulation();
    return;
  }

  // Validate config
  if (!CONFIG.rpcUrl) {
    console.error('❌ Missing RPC_URL');
    process.exit(1);
  }
  if (!CONFIG.treasuryKey) {
    console.error('❌ Missing TREASURY_PRIVATE_KEY');
    process.exit(1);
  }
  if (!CONFIG.bbbbbMint) {
    console.error('❌ Missing BBBBB_MINT');
    process.exit(1);
  }
  if (!CONFIG.jupiterApiKey) {
    console.error('❌ Missing JUPITER_API_KEY');
    process.exit(1);
  }

  // Initialize
  connection = new Connection(CONFIG.rpcUrl, 'confirmed');
  console.log('✅ Connected to RPC');

  try {
    wallet = Keypair.fromSecretKey(bs58.decode(CONFIG.treasuryKey));
    console.log(`✅ Wallet: ${wallet.publicKey.toString()}`);
  } catch {
    console.error('❌ Invalid private key format');
    process.exit(1);
  }

  tokenMint = new PublicKey(CONFIG.bbbbbMint);
  console.log(`✅ Token mint: ${CONFIG.bbbbbMint}`);

  // Start dashboard
  const server = startDashboard();

  // Init WebSocket
  initWebSocket(server);

  // Initial balance check
  await updateBalanceDisplay();

  // Start the loop
  console.log(`
  🔄 Starting buyback & burn loop
  ⏱️  Interval: ${CONFIG.loopInterval / 1000} seconds
  💰 Min SOL to swap: ${CONFIG.minSolToSwap}
  📊 Dashboard: http://localhost:${CONFIG.dashboardPort}
  `);

  addActivity('info', '🚀 Bot started - watching for creator fees...');
  runLoop();
}

function startDashboard(): http.Server {
  const app = express();

  app.use(express.static(path.join(__dirname, '../public')));

  app.get('/api/stats', (_, res) => {
    res.json(getStats());
  });

  app.get('/api/health', (_, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  const server = http.createServer(app);
  server.listen(CONFIG.dashboardPort, () => {
    console.log(`✅ Dashboard: http://localhost:${CONFIG.dashboardPort}`);
  });

  return server;
}

async function updateBalanceDisplay() {
  const sol = await getSolBalance(connection, wallet.publicKey);
  const { balance: tokens } = await getTokenBalance(connection, wallet.publicKey, tokenMint);
  updateBalances(sol, tokens);
}

async function runLoop() {
  while (true) {
    try {
      if (!isProcessing) {
        await cycle();
      }
    } catch (error) {
      console.error('Loop error:', error);
      addActivity('error', `Loop error: ${error instanceof Error ? error.message : String(error)}`);
    }

    await sleep(CONFIG.loopInterval);
  }
}

async function cycle() {
  isProcessing = true;
  updateStatus('checking');

  try {
    // Step 1: Try to claim fees
    const claimResult = await claimCreatorFees(connection, wallet);
    if (claimResult.success) {
      await sleep(2000); // Wait for balance to update
    }

    // Step 2: Check SOL balance
    await updateBalanceDisplay();
    const solBalance = await getSolBalance(connection, wallet.publicKey);

    // Step 3: If enough SOL, swap → burn
    if (solBalance >= CONFIG.minSolToSwap) {
      addActivity('info', `💰 ${solBalance.toFixed(4)} SOL available - starting buyback...`);

      // Keep 0.01 SOL for gas
      const swapAmount = solBalance - 0.01;

      // Swap SOL → $BBBBB
      const swapResult = await swapSolToToken(
        connection,
        wallet,
        swapAmount,
        CONFIG.bbbbbMint,
        CONFIG.jupiterApiKey
      );

      if (swapResult.success) {
        await sleep(2000); // Wait for balance to update

        // Burn all $BBBBB
        await burnAllTokens(connection, wallet, tokenMint, swapAmount);
      }
    }

    // Update balances
    await updateBalanceDisplay();

  } catch (error) {
    addActivity('error', `Cycle error: ${error instanceof Error ? error.message : String(error)}`);
  }

  isProcessing = false;
  updateStatus('idle');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Demo simulation
async function startDemoSimulation() {
  const delays = (ms: number) => new Promise(r => setTimeout(r, ms));

  while (true) {
    // Simulate a buyback & burn cycle
    const solAmount = 0.5 + Math.random() * 2;
    const tokenAmount = Math.floor(solAmount * 50000 + Math.random() * 20000);

    updateStatus('checking');
    addActivity('info', '🔍 Checking for creator fees...');
    await delays(2000);

    addActivity('claim', `💸 Claimed ${solAmount.toFixed(4)} SOL in fees!`);
    updateBalances(solAmount, 0);
    await delays(2000);

    updateStatus('swapping');
    addActivity('info', `🔄 Swapping ${solAmount.toFixed(4)} SOL → $BBBBB...`);
    await delays(3000);

    addActivity('swap', `✅ Got ${tokenAmount.toLocaleString()} $BBBBB`);
    updateBalances(0.01, tokenAmount);
    await delays(2000);

    updateStatus('burning');
    addActivity('info', `🔥 Burning ${tokenAmount.toLocaleString()} $BBBBB...`);
    await delays(2000);

    const fakeTx = 'demo' + Math.random().toString(36).substring(7);
    addActivity('burn', `🔥 BURNED ${tokenAmount.toLocaleString()} $BBBBB!`, fakeTx);
    recordBurn(solAmount, tokenAmount, fakeTx);
    updateBalances(0.01, 0);

    updateStatus('idle');
    addActivity('info', '😴 Waiting for next cycle...');

    // Wait 30 seconds before next demo cycle
    await delays(30000);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🗑️ BaBa BIN going to sleep...');
  process.exit(0);
});

main().catch(console.error);
