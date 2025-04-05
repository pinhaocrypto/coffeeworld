import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  // Check if user is authenticated
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Handle POST request for creating a review
  if (req.method === 'POST') {
    try {
      const { coffeeShopId, rating, content } = req.body;

      // Validate input
      if (!coffeeShopId || !rating || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (content.trim().length < 5) {
        return res.status(400).json({ error: 'Review content must be at least 5 characters' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      // In a real application, you would save this to a database
      // For demo purposes, we'll return a mock review object
      const newReview = {
        id: `review-${Date.now()}`,
        userId: session.user.id,
        userName: session.user.name || 'Worldcoin User',
        coffeeShopId,
        rating,
        content,
        date: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0,
        userVote: null,
      };

      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 500));

      return res.status(201).json(newReview);
    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ error: 'Failed to create review' });
    }
  }

  // Handle GET request for fetching reviews (not implemented in this demo)
  if (req.method === 'GET') {
    const { coffeeShopId } = req.query;

    if (!coffeeShopId) {
      return res.status(400).json({ error: 'Missing coffee shop ID' });
    }

    // In a real application, you would fetch reviews from a database
    // For this demo, return an empty array
    return res.status(200).json([]);
  }

  // If method is not supported
  return res.status(405).json({ error: 'Method not allowed' });
}
