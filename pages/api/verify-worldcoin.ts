import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { IVerifyResponse, verifyCloudProof } from '@worldcoin/idkit';

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
    
    // 使用 Cloud Proof 驗證方法
    const { proof, nullifier_hash, merkle_root, verification_level, signal } = req.body;
    
    // 從環境變量獲取 APP_ID 和 ACTION_ID
    const appIdValue = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID || '';
    const app_id = `app_${appIdValue.replace(/^app_/, '')}` as `app_${string}`;
    const action = "verify"; // 或者從環境變量獲取
    
    if (!proof) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required verification parameters: proof' 
      });
    }

    // 使用官方的 verifyCloudProof 方法驗證
    const verifyRes = await verifyCloudProof(proof, app_id, action, signal) as IVerifyResponse;

    if (verifyRes.success) {
      // 驗證成功
      return res.status(200).json({
        success: true,
        verification: verifyRes,
        user: {
          isAuthenticated: true,
          name: session?.user?.name || 'World ID User',
          worldcoinVerified: true,
          nullifier_hash
        }
      });
    } else {
      // 驗證失敗
      console.error('World ID verification failed:', verifyRes);
      return res.status(400).json({
        success: false,
        error: 'Verification failed',
        detail: verifyRes.detail,
        code: verifyRes.code
      });
    }
  } catch (error) {
    console.error('Error verifying World ID:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error during verification' 
    });
  }
}
