// Review interface for storing coffee shop reviews
export interface Review {
  id: string;
  coffeeShopId: string;
  userId: string;
  userName: string;
  content: string;  // Changed from 'message' to match API response
  rating: number;
  date: string;     // Changed from 'createdAt' to match API response
  upvotes: number;  // Added to match API response
  downvotes: number; // Added to match API response
  userVote: 'up' | 'down' | null; // Added to match API response
}

// Vote interface for storing user votes on reviews
export interface Vote {
  id: string;
  reviewId: string;
  userId: string;
  isAgree: boolean;
  createdAt: string;
}

// VoteStats interface for tracking vote counts and user's vote status
export interface VoteStats {
  agreeCount: number;
  disagreeCount: number;
  userVote: boolean | null; // true = agree, false = disagree, null = not voted
}
