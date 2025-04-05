import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { verifyWorldcoinProof } from '@/utils/worldcoin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get current session
    const session = await getSession({ req });
    
    // Get the proof from the request body
    const { proof, merkle_root, nullifier_hash, verification_level } = req.body;
    
    if (!proof || !merkle_root || !nullifier_hash || !verification_level) {
      return res.status(400).json({ error: 'Missing required verification parameters' });
    }
    
    // Verify the proof
    const verified = await verifyWorldcoinProof({
      proof,
      merkle_root,
      nullifier_hash,
      verification_level,
    });
    
    if (!verified) {
      return res.status(400).json({ error: 'Invalid proof' });
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
    return res.status(500).json({ error: 'Verification failed', details: String(error) });
  }
}
