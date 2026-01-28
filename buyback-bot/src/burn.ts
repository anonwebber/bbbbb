import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createBurnInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { addActivity, updateStatus, recordBurn } from './stats.js';

interface BurnResult {
  success: boolean;
  amountBurned?: number;
  txSignature?: string;
  error?: string;
}

// Detect which token program the mint uses
async function getTokenProgram(
  connection: Connection,
  mint: PublicKey
): Promise<PublicKey> {
  const accountInfo = await connection.getAccountInfo(mint);
  if (!accountInfo) {
    throw new Error('Mint account not found');
  }

  // Token-2022 program ID check
  if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    return TOKEN_2022_PROGRAM_ID;
  }

  return TOKEN_PROGRAM_ID;
}

export async function getTokenBalance(
  connection: Connection,
  wallet: PublicKey,
  mint: PublicKey
): Promise<{ balance: number; decimals: number }> {
  try {
    const tokenProgram = await getTokenProgram(connection, mint);
    const tokenAccount = await getAssociatedTokenAddress(
      mint,
      wallet,
      false,
      tokenProgram
    );

    const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
    return {
      balance: Number(accountInfo.value.uiAmount) || 0,
      decimals: accountInfo.value.decimals,
    };
  } catch {
    return { balance: 0, decimals: 6 };
  }
}

export async function burnAllTokens(
  connection: Connection,
  wallet: Keypair,
  mint: PublicKey,
  solUsedForSwap: number
): Promise<BurnResult> {
  try {
    updateStatus('burning');

    // Get token program
    const tokenProgram = await getTokenProgram(connection, mint);
    const programName = tokenProgram.equals(TOKEN_2022_PROGRAM_ID) ? 'Token-2022' : 'SPL Token';
    addActivity('info', `🔥 Preparing burn (${programName})...`);

    // Get token account
    const tokenAccount = await getAssociatedTokenAddress(
      mint,
      wallet.publicKey,
      false,
      tokenProgram
    );

    // Get balance
    const balanceInfo = await connection.getTokenAccountBalance(tokenAccount);
    const balance = Number(balanceInfo.value.uiAmount) || 0;
    const rawBalance = BigInt(balanceInfo.value.amount);

    if (rawBalance === BigInt(0)) {
      addActivity('info', 'No tokens to burn');
      return { success: false, error: 'No tokens to burn' };
    }

    addActivity('info', `🔥 Burning ${balance.toLocaleString()} $BBBBB...`);

    // Create burn instruction
    const burnIx = createBurnInstruction(
      tokenAccount,
      mint,
      wallet.publicKey,
      rawBalance,
      [],
      tokenProgram
    );

    const tx = new Transaction().add(burnIx);

    // Send transaction
    const txSignature = await sendAndConfirmTransaction(
      connection,
      tx,
      [wallet],
      { commitment: 'confirmed' }
    );

    addActivity('burn', `🔥 BURNED ${balance.toLocaleString()} $BBBBB!`, txSignature);

    // Record stats
    recordBurn(solUsedForSwap, balance, txSignature);

    return {
      success: true,
      amountBurned: balance,
      txSignature,
    };

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    addActivity('error', `❌ Burn failed: ${msg}`);
    updateStatus('error');

    return { success: false, error: msg };
  }
}
