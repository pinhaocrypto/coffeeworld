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
    
    // 開發環境：記錄收到的請求以便調試
    if (process.env.NODE_ENV !== 'production') {
      console.log('Development mode: verify-worldcoin API request received');
      console.log('Request body:', JSON.stringify(req.body));
      console.log('Current session:', session);
      
      // 自動返回成功響應，無論請求內容如何
      return res.status(200).json({
        success: true,
        verification: {
          verified: true,
          action: 'verify',
          nullifier_hash: 'dev-nullifier-hash',
          merkle_root: 'dev-merkle-root'
        },
        user: {
          isAuthenticated: true,
          name: 'Dev User',
          worldcoinVerified: true
        }
      });
    }
    
    // 生產環境：提取參數
    const { merkle_root, nullifier_hash, proof, verification_level } = req.body;
    
    if (!merkle_root || !nullifier_hash || !proof) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required verification parameters' 
      });
    }

    // Call the World ID verification API
    try {
      // Make sure you have NEXT_PUBLIC_WORLDCOIN_APP_ID set in your environment variables
      if (!process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID) {
        return res.status(500).json({
          success: false,
          error: 'Worldcoin app ID is not configured'
        });
      }

      // Format the app ID correctly - strip 'app_' prefix if needed
      const worldcoinAppId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID.startsWith('app_')
        ? process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID.substring(4)
        : process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;

      console.log(`Verifying proof with Worldcoin API for app ID: ${worldcoinAppId}`);

      const verifyRes = await fetch(
        `https://developer.worldcoin.org/api/v1/verify/app_${worldcoinAppId}`,
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

      if (!verifyRes.ok) {
        const errorText = await verifyRes.text();
        console.error('Worldcoin API error:', verifyRes.status, errorText);
        return res.status(verifyRes.status).json({
          success: false,
          error: `Worldcoin API error: ${verifyRes.status}`,
          details: errorText
        });
      }

      const verification = await verifyRes.json();
      console.log('Worldcoin verification result:', verification);

      // Return success response with verification details
      return res.status(200).json({
        success: true,
        verification,
        user: session ? {
          isAuthenticated: !!session,
          name: session.user?.name || null,
          worldcoinVerified: true
        } : null
      });
    } catch (error) {
      console.error('Error calling Worldcoin API:', error);
      return res.status(500).json({
        success: false,
        error: 'Error calling Worldcoin API',
        details: String(error)
      });
    }
  } catch (error) {
    console.error('Error in verification process:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during verification'
    });
  }
}
