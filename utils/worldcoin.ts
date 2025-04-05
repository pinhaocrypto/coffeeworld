// This file simulates Worldcoin verification for demonstration purposes
// In a real application, you would use the actual Worldcoin API

import { ISuccessResult } from '@worldcoin/idkit';

// Interfaces for Worldcoin verification
interface WorldcoinProofPayload {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level?: string;
}

interface VerificationResult {
  success: boolean;
  nullifier_hash?: string;
  error?: string;
}

// Verify a Worldcoin proof using the backend API
export async function verifyWorldcoinProof(payload: WorldcoinProofPayload): Promise<VerificationResult> {
  try {
    // In a production app, you would make a call to the Worldcoin verification API
    // For example:
    const response = await fetch('/api/verify-worldcoin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Verification failed'
      };
    }

    return {
      success: true,
      nullifier_hash: payload.nullifier_hash
    };
  } catch (error) {
    console.error('Error verifying Worldcoin proof:', error);
    return {
      success: false,
      error: 'Verification failed'
    };
  }
}

// Format IDKit result for NextAuth
export function formatProofForAuth(result: ISuccessResult): WorldcoinProofPayload {
  return {
    merkle_root: result.merkle_root,
    nullifier_hash: result.nullifier_hash,
    proof: result.proof,
    verification_level: result.verification_level
  };
}
