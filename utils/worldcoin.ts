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

// Verify a Worldcoin proof using the backend API or direct verification
export async function verifyWorldcoinProof(payload: WorldcoinProofPayload): Promise<VerificationResult> {
  try {
    // Check if we're running on the server side
    const isServer = typeof window === 'undefined';
    
    if (isServer) {
      // When running on the server, do direct verification instead of API call
      console.log("Performing direct Worldcoin verification on server side");
      
      // For development/demo purposes, we'll always return success
      // This lets you test the app without actual World ID verification
      console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
      
      // In development mode, always simulate successful verification
      if (process.env.NODE_ENV !== 'production') {
        console.log('Development mode - simulating successful verification');
        return {
          success: true,
          nullifier_hash: payload.nullifier_hash || 'mock-nullifier-hash'
        };
      }
      
      // For production, call the actual Worldcoin API
      try {
        // Get app ID and ensure correct format
        const worldcoinAppId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID || '';
        const formattedAppId = worldcoinAppId.startsWith('app_') 
          ? worldcoinAppId.substring(4) // Remove 'app_' prefix if present
          : worldcoinAppId;
        
        console.log(`Calling Worldcoin API with app ID: ${formattedAppId}`);
        console.log('Verification payload:', {
          merkle_root: payload.merkle_root,
          nullifier_hash: payload.nullifier_hash,
          proof: payload.proof,
          verification_level: payload.verification_level || "device"
        });
        
        const verifyRes = await fetch(
          `https://developer.worldcoin.org/api/v1/verify/app_${formattedAppId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              merkle_root: payload.merkle_root,
              nullifier_hash: payload.nullifier_hash,
              proof: payload.proof,
              verification_level: payload.verification_level || "device"
            }),
          }
        );
        
        if (!verifyRes.ok) {
          const errorText = await verifyRes.text();
          console.error('Worldcoin API error:', verifyRes.status, errorText);
          return {
            success: false,
            error: `Worldcoin API error: ${verifyRes.status}`
          };
        }
        
        const verification = await verifyRes.json();
        
        return {
          success: true,
          nullifier_hash: payload.nullifier_hash
        };
      } catch (error) {
        console.error('Error calling Worldcoin API directly:', error);
        return {
          success: false,
          error: `Direct verification error: ${error}`
        };
      }
    } else {
      // Client-side - use the API route
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
      const verifyUrl = new URL('/api/verify-worldcoin', baseUrl).toString();
      
      const response = await fetch(verifyUrl, {
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
    }
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
