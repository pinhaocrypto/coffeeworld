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
    content: 'Great atmosphere and friendly staff! The pour-over coffee is exceptional and they have a great selection of pastries.',
    rating: 5,
    date: '2025-03-01T12:00:00Z',
    upvotes: 8,
    downvotes: 0,
    userVote: null
  },
  {
    id: '2',
    coffeeShopId: '2',
    userId: 'user2',
    userName: 'Barista Enthusiast',
    content: 'Decent coffee but the service was quite slow during my visit. The ambiance is nice though, and they have good WiFi.',
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
    upvotes: 12,
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
  // Add more diverse reviews
  {
    id: '6',
    coffeeShopId: '2',
    userId: 'user6',
    userName: 'Cinnamon Roll',
    content: 'Their specialty cinnamon latte is absolutely to die for! I come here at least twice a week for it. Staff remembers my name now.',
    rating: 5,
    date: '2025-03-20T10:15:00Z',
    upvotes: 3,
    downvotes: 0,
    userVote: null
  },
  {
    id: '7',
    coffeeShopId: '2',
    userId: 'user7',
    userName: 'Digital Nomad',
    content: 'Great place to work remotely. Plenty of outlets, strong WiFi, and they don\'t mind if you stay for hours. Coffee is decent too.',
    rating: 4,
    date: '2025-03-21T13:45:00Z',
    upvotes: 1,
    downvotes: 0,
    userVote: null
  },
  {
    id: '8',
    coffeeShopId: '3',
    userId: 'user8',
    userName: 'Coffee Connoisseur',
    content: 'Their single-origin Ethiopian beans are exceptional. Notes of blueberry and chocolate really come through. A bit pricey though.',
    rating: 4,
    date: '2025-03-22T09:30:00Z',
    upvotes: 10,
    downvotes: 0,
    userVote: null
  },
  {
    id: '9',
    coffeeShopId: '3',
    userId: 'user9',
    userName: 'Weekend Visitor',
    content: 'Way too crowded on weekends. Had to wait 15 minutes for a table and another 10 for my coffee. Tastes good but not worth the wait.',
    rating: 2,
    date: '2025-03-23T11:20:00Z',
    upvotes: 0,
    downvotes: 1,
    userVote: null
  },
  {
    id: '10',
    coffeeShopId: '4',
    userId: 'user10',
    userName: 'Pastry Fan',
    content: 'Their croissants are as good as their coffee! Perfectly flaky and buttery. The small size of the shop gives it a cozy feel.',
    rating: 5,
    date: '2025-03-24T08:15:00Z',
    upvotes: 15,
    downvotes: 0,
    userVote: null
  },
  {
    id: '11',
    coffeeShopId: '4',
    userId: 'user11',
    userName: 'Cold Brew Addict',
    content: 'Their cold brew is smooth with no acidity. I always get the 32oz to go and it lasts me all day. Great flavor!',
    rating: 5,
    date: '2025-03-25T14:40:00Z',
    upvotes: 2,
    downvotes: 0,
    userVote: null
  },
  {
    id: '12',
    coffeeShopId: '4',
    userId: 'user12',
    userName: 'Tea Lover',
    content: 'Came for the coffee, stayed for their amazing tea selection. The masala chai is better than what I had in India!',
    rating: 4,
    date: '2025-03-26T16:10:00Z',
    upvotes: 1,
    downvotes: 0,
    userVote: null
  },
  {
    id: '13',
    coffeeShopId: '5',
    userId: 'user13',
    userName: 'Coffee Student',
    content: 'Attended their coffee brewing workshop. Very educational and the baristas really know their stuff. Highly recommend!',
    rating: 5,
    date: '2025-03-27T18:30:00Z',
    upvotes: 7,
    downvotes: 0,
    userVote: null
  },
  {
    id: '14',
    coffeeShopId: '5',
    userId: 'user14',
    userName: 'Music Enthusiast',
    content: 'They have live acoustic music on Friday nights. Great vibe, great coffee, great experience overall.',
    rating: 5,
    date: '2025-03-28T20:15:00Z',
    upvotes: 2,
    downvotes: 0,
    userVote: null
  },
  {
    id: '15',
    coffeeShopId: '5',
    userId: 'user15',
    userName: 'Budget Conscious',
    content: 'Good coffee but overpriced for what you get. $6 for a basic latte is a bit much, even in this neighborhood.',
    rating: 3,
    date: '2025-03-29T09:45:00Z',
    upvotes: 1,
    downvotes: 2,
    userVote: null
  },
  {
    id: '16',
    coffeeShopId: '6',
    userId: 'user16',
    userName: 'Morning Regular',
    content: 'I\'ve been coming here every morning for the past year. Consistently good coffee and friendly service. They know my order by heart now!',
    rating: 5,
    date: '2025-03-30T07:30:00Z',
    upvotes: 6,
    downvotes: 0,
    userVote: null
  },
  {
    id: '17',
    coffeeShopId: '6',
    userId: 'user17',
    userName: 'Vegan Coffee Lover',
    content: 'Best place for dairy alternatives! Their house-made oat milk is creamy and perfect in a cappuccino.',
    rating: 5,
    date: '2025-03-31T13:20:00Z',
    upvotes: 2,
    downvotes: 0,
    userVote: null
  },
  {
    id: '18',
    coffeeShopId: '6',
    userId: 'user18',
    userName: 'Disappointed Customer',
    content: 'Ordered their signature drink and was really underwhelmed. Too sweet and couldn\'t taste the coffee. The place is cute though.',
    rating: 2,
    date: '2025-04-01T15:10:00Z',
    upvotes: 0,
    downvotes: 1,
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
