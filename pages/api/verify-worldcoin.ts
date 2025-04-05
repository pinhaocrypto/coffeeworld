import { NextApiRequest, NextApiResponse } from 'next';

// Worldcoin verification API endpoint
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract the verification payload from the request
    const { merkle_root, nullifier_hash, proof, verification_level } = req.body;

    if (!merkle_root || !nullifier_hash || !proof) {
      return res.status(400).json({ error: 'Missing required verification parameters' });
    }

    // Verify the proof with the Worldcoin API
    // Documentation: https://docs.worldcoin.org/reference/api-reference/verification-endpoints
    const verifyRes = await fetch(
      `https://developer.worldcoin.org/api/v1/verify/app_${process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merkle_root,
          nullifier_hash,
          proof,
          verification_level: verification_level || "orb"
        }),
      }
    );

    const verification = await verifyRes.json();

    // If the verification was successful, return a success response
    if (verifyRes.status === 200) {
      return res.status(200).json({
        success: true,
        verification
      });
    }

    // Otherwise, return an error
    return res.status(400).json({
      success: false,
      error: 'Invalid verification proof',
      details: verification
    });
  } catch (error) {
    console.error('Error verifying Worldcoin proof:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during verification'
    });
  }
}
