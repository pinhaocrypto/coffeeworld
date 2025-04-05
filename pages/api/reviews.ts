import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  worldcoinVerified?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  // Check if user is authenticated
  if (!session || !session.user) {
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

      // Cast the user object to our extended type that includes potential ID
      const user = session.user as ExtendedUser;
      
      // In a real application, you would save this to a database
      // For demo purposes, we'll return a mock review object
      const newReview = {
        id: `review-${Date.now()}`,
        userId: user.id || user.email || `user-${Date.now()}`, // Use email as fallback if ID is missing
        userName: user.name || 'Worldcoin User',
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
      
      // Mock successful response
      return res.status(201).json({
        message: 'Review created successfully',
        review: newReview
      });
    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ error: 'Error creating review' });
    }
  }

  // Handle GET request for fetching reviews (not implemented in this demo)
  if (req.method === 'GET') {
    try {
      const { coffeeShopId } = req.query;
      
      if (!coffeeShopId) {
        return res.status(400).json({ error: 'Coffee shop ID is required' });
      }
      
      // In a real application, you would query your database
      // For demo, return an empty array or mock data
      return res.status(200).json({
        reviews: []
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Error fetching reviews' });
    }
  } 
  
  // If method is not supported
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
