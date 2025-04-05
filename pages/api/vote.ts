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
    const { reviewId, voteType } = req.body;

    // Validate input
    if (!reviewId || !voteType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (voteType !== 'up' && voteType !== 'down') {
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    // In a real application, you would update the vote in the database
    // For demo purposes, we'll simulate the response
    
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 300));

    // Simulate a response with updated vote counts
    // In a real app, this would be the result of a database operation
    const updatedReview = {
      id: reviewId,
      upvotes: voteType === 'up' ? Math.floor(Math.random() * 20) + 1 : Math.floor(Math.random() * 10),
      downvotes: voteType === 'down' ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 3),
      userVote: voteType, // Record the user's vote
    };

    return res.status(200).json(updatedReview);
  } catch (error) {
    console.error('Error processing vote:', error);
    return res.status(500).json({ error: 'Failed to process vote' });
  }
}
