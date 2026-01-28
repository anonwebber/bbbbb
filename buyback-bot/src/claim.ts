import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import { addActivity } from './stats.js';

const PUMPPORTAL_API = 'https://pumpportal.fun/api/trade-local';

interface ClaimResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export async function claimCreatorFees(
  connection: Connection,
  wallet: Keypair
): Promise<ClaimResult> {
  try {
    addActivity('info', '💸 Attempting to claim creator fees...');

    const response = await fetch(PUMPPORTAL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'collectCreatorFee',
        pool: 'pump',
        priorityFee: 0.0001,
        publicKey: wallet.publicKey.toString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Common "no fees" responses
      if (
        errorText.includes('no fees') ||
        errorText.includes('nothing to claim') ||
        errorText.includes('0 SOL') ||
        errorText.includes('No claimable')
      ) {
        return { success: false, error: 'No fees to claim' };
      }

      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.arrayBuffer();
    const tx = VersionedTransaction.deserialize(new Uint8Array(data));

    // Sign and send
    tx.sign([wallet]);

    const signature = await connection.sendTransaction(tx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
      maxRetries: 3,
    });

    // Confirm
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    addActivity('claim', `✅ Claimed creator fees!`, signature);
    return { success: true, signature };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    // Ignore "no fees" errors silently
    if (msg.includes('no fees') || msg.includes('nothing')) {
      return { success: false, error: 'No fees to claim' };
    }

    addActivity('error', `❌ Claim failed: ${msg}`);
    return { success: false, error: msg };
  }
}
