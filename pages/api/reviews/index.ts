import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { Review } from '@/types/review';
import { v4 as uuidv4 } from 'uuid';
import type { Session } from 'next-auth';

// Import authOptions directly from the file
import authOptions from '../auth/[...nextauth]';

// Enhanced mock database for reviews with more data
let mockReviews: Review[] = [
  {
    id: '1',
    coffeeShopId: '1',
    userId: 'user1',
    userName: 'Coffee Lover',
    content: 'Great atmosphere and friendly staff! The coffee was excellent and they have a nice selection of pastries too.',
    rating: 5,
    date: '2025-03-01T12:00:00Z',
    upvotes: 2,
    downvotes: 0,
    userVote: null
  },
  {
    id: '2',
    coffeeShopId: '2',
    userId: 'user2',
    userName: 'Bean Enthusiast',
    content: 'The coffee was mediocre, but the wifi is fast and it\'s a good place to work.',
    rating: 3,
    date: '2025-03-05T09:00:00Z',
    upvotes: 1,
    downvotes: 1,
    userVote: null
  },
  // Additional mock reviews
  {
    id: '3',
    coffeeShopId: '1',
    userId: 'user3',
    userName: 'Espresso Expert',
    content: 'Their espresso is the best in town! Rich and smooth with perfect crema. Highly recommend!',
    rating: 5,
    date: '2025-03-10T14:22:00Z',
    upvotes: 1,
    downvotes: 0,
    userVote: null
  },
  {
    id: '4',
    coffeeShopId: '1',
    userId: 'user4',
    userName: 'Morning Person',
    content: 'Great place to start the day. Their breakfast menu is limited but delicious. Coffee is strong just how I like it.',
    rating: 4,
    date: '2025-03-15T08:45:00Z',
    upvotes: 0,
    downvotes: 0,
    userVote: null
  },
  {
    id: '5',
    coffeeShopId: '3',
    userId: 'user5',
    userName: 'Latte Artist',
    content: 'Beautiful latte art and the coffee tastes as good as it looks! Nice ambiance for meetings or catching up with friends.',
    rating: 5,
    date: '2025-03-18T16:30:00Z',
    upvotes: 2,
    downvotes: 0,
    userVote: null
  },
  {
    id: '6',
    coffeeShopId: '4',
    userId: 'user6',
    userName: 'Coffee Critic',
    content: 'Decent coffee but overpriced. The service is friendly but slow during peak hours. The pastries are worth trying though!',
    rating: 3,
    date: '2025-03-22T11:40:00Z',
    upvotes: 1,
    downvotes: 0,
    userVote: null
  },
  {
    id: '7',
    coffeeShopId: '5',
    userId: 'user7',
    userName: 'Tea Lover',
    content: 'Even though I prefer tea, their coffee selection impressed me. The atmosphere is cozy and the staff is knowledgeable.',
    rating: 4,
    date: '2025-03-25T15:10:00Z',
    upvotes: 0,
    downvotes: 0,
    userVote: null
  },
  {
    id: '8',
    coffeeShopId: '6',
    userId: 'user8',
    userName: 'Digital Nomad',
    content: 'Great place to work remotely. Fast wifi, plenty of outlets, and they don\'t mind if you stay for hours. Coffee is good too!',
    rating: 5,
    date: '2025-03-28T09:55:00Z',
    upvotes: 2,
    downvotes: 0,
    userVote: null
  }
];

// Custom session type with Worldcoin verification
interface WorldcoinSession extends Session {
  user: {
    worldcoinVerified?: boolean;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    [key: string]: any; // Allow for additional properties
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET: Fetch reviews for a specific coffee shop - No authentication required
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
    
    // POST: Add a new review - Authentication required
    else if (req.method === 'POST') {
      // Check if user is authenticated - use getServerSession instead of getSession
      const session = await getServerSession(req, res, authOptions) as WorldcoinSession;
      
      // Check if user is authenticated
      if (!session) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      
      // Check if user is verified with Worldcoin
      if (!session.user?.worldcoinVerified) {
        return res.status(403).json({ error: 'World ID verification required to submit reviews' });
      }
      
      const { coffeeShopId, content, rating } = req.body;
      
      console.log('Review submission received:', { coffeeShopId, content, rating });
      console.log('User session:', session.user);
      
      if (!coffeeShopId || !content || rating === undefined) {
        return res.status(400).json({ error: 'Coffee shop ID, content, and rating are required' });
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
        content,
        rating,
        date: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0,
        userVote: null
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
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
