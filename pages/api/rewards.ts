import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, amount } = req.body;

    // Validate input
    if (!userId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In a real application, this would call a smart contract to distribute rewards
    // For demo purposes, we'll simulate the response

    // Simulate API latency and blockchain transaction time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate a successful transaction
    const transaction = {
      id: `tx-${Date.now()}`,
      userId,
      amount,
      status: 'success',
      timestamp: new Date().toISOString(),
      txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };

    return res.status(200).json({ 
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error distributing rewards:', error);
    return res.status(500).json({ error: 'Failed to distribute rewards' });
  }
}
