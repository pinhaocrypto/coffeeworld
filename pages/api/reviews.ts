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
  // Move authentication check to the specific methods that require it
  // Rather than requiring it for all endpoints

  // Handle POST request for creating a review
  if (req.method === 'POST') {
    // Check authentication for POST requests
    const session = await getSession({ req });
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Authentication required to post reviews' });
    }

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
      // For mock data, return a few sample reviews
      const mockReviews = [
        {
          id: 'review-1',
          userId: 'user-1',
          userName: 'Coffee Lover',
          coffeeShopId: coffeeShopId,
          rating: 4.5,
          content: 'Great atmosphere and amazing coffee! The baristas really know their craft.',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
          upvotes: 5,
          downvotes: 1,
          userVote: null,
        },
        {
          id: 'review-2',
          userId: 'user-2',
          userName: 'Morning Person',
          coffeeShopId: coffeeShopId,
          rating: 5,
          content: 'Best cappuccino in town! I come here every morning before work.',
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
          upvotes: 8,
          downvotes: 0,
          userVote: null,
        }
      ];
      
      return res.status(200).json({
        reviews: mockReviews
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
