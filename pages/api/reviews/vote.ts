import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { Review, Vote } from '@/types/review';
import { v4 as uuidv4 } from 'uuid';

// This would be in a database in a real application
// Importing from the index.ts would cause circular references in actual usage
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
  // Check if user is authenticated
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { reviewId, isAgree } = req.body;
  
  if (!reviewId || isAgree === undefined) {
    return res.status(400).json({ error: 'Review ID and vote value are required' });
  }
  
  // Find the review to vote on
  const reviewIndex = mockReviews.findIndex(review => review.id === reviewId);
  
  if (reviewIndex === -1) {
    return res.status(404).json({ error: 'Review not found' });
  }
  
  const review = mockReviews[reviewIndex];
  
  // Ensure session and user exist
  if (!session.user) {
    return res.status(401).json({ error: 'User information not found' });
  }
  
  // Use email as a fallback identifier if id is not available (NextAuth default user doesn't have id)
  const userId = session.user.email || 'unknown-user';
  
  // Check if user has already voted on this review
  const existingVoteIndex = review.votes.findIndex(vote => vote.userId === userId);
  
  if (existingVoteIndex !== -1) {
    // Update existing vote
    review.votes[existingVoteIndex].isAgree = isAgree;
    review.votes[existingVoteIndex].createdAt = new Date().toISOString();
  } else {
    // Add new vote
    const newVote: Vote = {
      id: uuidv4(),
      reviewId,
      userId,
      isAgree,
      createdAt: new Date().toISOString()
    };
    
    review.votes.push(newVote);
  }
  
  // Update the review in the mock database
  mockReviews[reviewIndex] = review;
  
  // Calculate vote stats for the response
  const voteStats = {
    agreeCount: review.votes.filter(v => v.isAgree).length,
    disagreeCount: review.votes.filter(v => !v.isAgree).length,
    userVote: existingVoteIndex !== -1 ? isAgree : isAgree
  };
  
  return res.status(200).json({ success: true, voteStats });
}
