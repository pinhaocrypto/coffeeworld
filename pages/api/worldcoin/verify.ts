import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { verifyWorldcoinProof } from '@/utils/worldcoin';

// Define types locally instead of importing from minikit-js
interface ISuccessResult {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current session
    const session = await getSession({ req });
    
    // Check if this is coming from MiniKit or IDKit
    const isMiniKitRequest = req.body.payload && typeof req.body.payload === 'object';
    
    let proof, merkle_root, nullifier_hash, verification_level;
    
    if (isMiniKitRequest) {
      // Extract from MiniKit format
      const payload = req.body.payload as ISuccessResult;
      proof = payload.proof;
      merkle_root = payload.merkle_root;
      nullifier_hash = payload.nullifier_hash;
      verification_level = payload.verification_level;
    } else {
      // Extract from regular format (IDKit or direct API call)
      ({ proof, merkle_root, nullifier_hash, verification_level } = req.body);
    }
    
    if (!proof || !merkle_root || !nullifier_hash) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required verification parameters' 
      });
    }
    
    // For development/simulation, bypass real verification for mock proofs
    const isMockProof = 
      proof === 'world-app-mock-proof' || 
      proof.includes('mock') || 
      proof.length < 50;
    
    if (isMockProof) {
      console.log('SIMULATION MODE: Using mock proof, auto-approving');
      return res.status(200).json({
        success: true,
        message: 'Verification successful (simulation mode)',
        user: session ? {
          isAuthenticated: !!session,
          name: session.user?.name || 'World ID User',
          worldcoinVerified: true
        } : null
      });
    }
    
    // Verify the proof
    const verified = await verifyWorldcoinProof({
      proof,
      merkle_root,
      nullifier_hash,
      verification_level,
    });
    
    if (!verified.success) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid proof',
        message: verified.error 
      });
    }
    
    // If successful, return success response
    return res.status(200).json({
      success: true,
      message: 'Verification successful',
      user: session ? {
        isAuthenticated: !!session,
        name: session.user?.name || null,
        worldcoinVerified: true
      } : null
    });
  } catch (error) {
    console.error('Worldcoin verification error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Verification failed', 
      details: String(error) 
    });
  }
}
