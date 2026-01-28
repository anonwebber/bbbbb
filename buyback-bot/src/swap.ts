import {
  Connection,
  Keypair,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
  PublicKey
} from '@solana/web3.js';
import { addActivity, updateStatus } from './stats.js';

const JUPITER_QUOTE_API = 'https://api.jup.ag/swap/v1/quote';
const JUPITER_SWAP_API = 'https://api.jup.ag/swap/v1/swap';
const SOL_MINT = 'So11111111111111111111111111111111111111112';

interface SwapResult {
  success: boolean;
  tokensReceived?: number;
  txSignature?: string;
  error?: string;
}

export async function swapSolToToken(
  connection: Connection,
  wallet: Keypair,
  solAmount: number,
  tokenMint: string,
  jupiterApiKey: string
): Promise<SwapResult> {
  try {
    updateStatus('swapping');
    addActivity('info', `🔄 Swapping ${solAmount.toFixed(4)} SOL → $BBBBB...`);

    const inputAmount = Math.floor(solAmount * LAMPORTS_PER_SOL);

    // Step 1: Get quote
    const quoteUrl = `${JUPITER_QUOTE_API}?inputMint=${SOL_MINT}&outputMint=${tokenMint}&amount=${inputAmount}&slippageBps=500`;

    const quoteRes = await fetch(quoteUrl, {
      headers: { 'x-api-key': jupiterApiKey },
    });

    if (!quoteRes.ok) {
      const err = await quoteRes.text();
      throw new Error(`Quote failed: ${err}`);
    }

    const quoteData = await quoteRes.json();

    if (!quoteData || quoteData.error) {
      throw new Error(`No route found: ${quoteData?.error || 'unknown'}`);
    }

    // Get decimals from quote (or assume 6)
    const decimals = quoteData.outputDecimals || 6;
    const expectedOutput = Number(quoteData.outAmount) / Math.pow(10, decimals);

    addActivity('info', `📊 Quote: ~${expectedOutput.toLocaleString()} $BBBBB`);

    // Step 2: Get swap transaction
    const swapRes = await fetch(JUPITER_SWAP_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': jupiterApiKey,
      },
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: wallet.publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 100000,
      }),
    });

    if (!swapRes.ok) {
      const err = await swapRes.text();
      throw new Error(`Swap API failed: ${err}`);
    }

    const swapData = await swapRes.json();

    if (!swapData.swapTransaction) {
      throw new Error('No swap transaction returned');
    }

    // Deserialize and sign
    const txBuf = Buffer.from(swapData.swapTransaction, 'base64');
    const tx = VersionedTransaction.deserialize(txBuf);
    tx.sign([wallet]);

    addActivity('info', '📝 Sending swap transaction...');

    // Send
    const txSignature = await connection.sendTransaction(tx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3,
    });

    // Confirm
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: txSignature,
      blockhash,
      lastValidBlockHeight,
    });

    addActivity('swap', `✅ Swapped ${solAmount.toFixed(4)} SOL → ${expectedOutput.toLocaleString()} $BBBBB`, txSignature);

    return {
      success: true,
      tokensReceived: expectedOutput,
      txSignature,
    };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    addActivity('error', `❌ Swap failed: ${msg}`);
    updateStatus('error');

    return { success: false, error: msg };
  }
}

export async function getSolBalance(connection: Connection, wallet: PublicKey): Promise<number> {
  const balance = await connection.getBalance(wallet);
  return balance / LAMPORTS_PER_SOL;
}
