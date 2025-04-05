import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { Review } from '@/types/review';
import { v4 as uuidv4 } from 'uuid';

// Mock database for reviews (in a real app, this would be in a database)
let mockReviews: Review[] = [
  {
    id: '1',
    coffeeShopId: '1',
    userId: 'user1',
    userName: 'Coffee Lover',
    message: 'Great atmosphere and friendly staff! The coffee was excellent and they have a nice selection of pastries too.',
    rating: 5,
    createdAt: '2025-03-01T12:00:00Z',
    updatedAt: '2025-03-01T12:00:00Z',
    votes: [
      { id: 'v1', reviewId: '1', userId: 'user2', isAgree: true, createdAt: '2025-03-02T10:30:00Z' },
      { id: 'v2', reviewId: '1', userId: 'user3', isAgree: true, createdAt: '2025-03-03T14:15:00Z' }
    ]
  },
  {
    id: '2',
    coffeeShopId: '2',
    userId: 'user2',
    userName: 'Bean Enthusiast',
    message: 'The coffee was mediocre, but the wifi is fast and it\'s a good place to work.',
    rating: 3,
    createdAt: '2025-03-05T09:00:00Z',
    updatedAt: '2025-03-05T09:00:00Z',
    votes: [
      { id: 'v3', reviewId: '2', userId: 'user1', isAgree: false, createdAt: '2025-03-06T11:45:00Z' },
      { id: 'v4', reviewId: '2', userId: 'user3', isAgree: true, createdAt: '2025-03-07T16:20:00Z' }
    ]
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check if user is authenticated
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // GET: Fetch reviews for a specific coffee shop
    if (req.method === 'GET') {
      const { coffeeShopId } = req.query;
      
      if (!coffeeShopId) {
        return res.status(400).json({ error: 'Coffee shop ID is required' });
      }
      
      const shopReviews = mockReviews.filter(
        review => review.coffeeShopId === coffeeShopId
      );
      
      return res.status(200).json({ reviews: shopReviews });
    }
    
    // POST: Add a new review
    else if (req.method === 'POST') {
      const { coffeeShopId, message, rating } = req.body;
      
      console.log('Review submission received:', { coffeeShopId, message, rating });
      console.log('User session:', session.user);
      
      if (!coffeeShopId || !message || rating === undefined) {
        return res.status(400).json({ error: 'Coffee shop ID, message, and rating are required' });
      }
      
      // Ensure session.user exists before accessing its properties
      if (!session.user) {
        return res.status(401).json({ error: 'User information not found' });
      }
      
      // Create a new review
      const newReview: Review = {
        id: uuidv4(),
        coffeeShopId,
        userId: session.user.email || 'unknown-user', 
        userName: session.user.name || 'Anonymous User',
        message,
        rating,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        votes: []
      };
      
      // Add to mock database
      mockReviews.push(newReview);
      
      console.log('New review added:', newReview);
      
      return res.status(201).json({ review: newReview });
    }
    
    // Method not allowed
    else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error in reviews API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
