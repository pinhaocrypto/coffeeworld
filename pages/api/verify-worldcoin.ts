import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

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
        verified: true,
        nullifier_hash: 'dev-nullifier-hash',
        merkle_root: 'dev-merkle-root'
      });
    }
    
    // 使用新的 World ID API v2 端點
    const { proof, nullifier_hash, merkle_root, verification_level, action } = req.body;
    
    // 獲取 app_id
    const APP_ID = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID || 'app_6bd93d77f6ac5663b82b4a4894eb3417';
    
    // 調用 World ID API v2 進行驗證
    try {
      const worldcoinResponse = await fetch(
        `https://developer.worldcoin.org/api/v2/verify/${APP_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            proof, 
            nullifier_hash, 
            merkle_root, 
            verification_level,
            action: action || 'coffeeworld-review'
          }),
        }
      );
      
      if (!worldcoinResponse.ok) {
        const errorData = await worldcoinResponse.json();
        console.error('World ID API error:', worldcoinResponse.status, errorData);
        return res.status(worldcoinResponse.status).json(errorData);
      }
      
      const verificationResponse = await worldcoinResponse.json();
      console.log('World ID verification response:', verificationResponse);
      
      // 成功返回
      return res.status(200).json({
        success: true,
        verified: true,
        ...verificationResponse
      });
    } catch (error) {
      console.error('Error calling World ID API:', error);
      return res.status(500).json({ 
        success: false, 
        verified: false, 
        error: 'Internal server error during verification',
        detail: String(error)
      });
    }
  } catch (error) {
    console.error('Error in verification endpoint:', error);
    return res.status(500).json({ 
      success: false,
      verified: false, 
      error: 'Internal server error',
      detail: String(error)
    });
  }
}
