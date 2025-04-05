import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Review, VoteStats } from '@/types/review';
import { StarIcon, HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/20/solid';

interface ReviewItemProps {
  review: Review;
}

export default function ReviewItem({ review }: ReviewItemProps) {
  const { data: session } = useSession();
  const [isVoting, setIsVoting] = useState(false);
  const [voteStats, setVoteStats] = useState<VoteStats>(() => {
    // Calculate initial vote stats
    const agreeCount = review.votes.filter(vote => vote.isAgree).length;
    const disagreeCount = review.votes.filter(vote => !vote.isAgree).length;
    
    // Check if current user has voted
    const userVote = session?.user 
      ? review.votes.find(vote => vote.userId === (session.user as any).id)?.isAgree ?? null
      : null;
    
    return { agreeCount, disagreeCount, userVote };
  });

  const handleVote = async (isAgree: boolean) => {
    if (!session) {
      // Not logged in, can't vote
      return;
    }
    
    try {
      setIsVoting(true);
      
      const response = await fetch('/api/reviews/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: review.id,
          isAgree,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setVoteStats(data.voteStats);
      } else {
        console.error('Failed to vote:', data.error);
      }
    } catch (error) {
      console.error('Error voting on review:', error);
    } finally {
      setIsVoting(false);
    }
  };

  // Format date nicely
  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold">{review.userName}</h4>
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <StarIcon 
              key={i} 
              className={`h-4 w-4 ${i < review.rating ? 'text-amber-400' : 'text-gray-300'}`} 
            />
          ))}
        </div>
      </div>
      
      <p className="text-gray-700 mb-4">{review.message}</p>
      
      <div className="flex items-center space-x-4 border-t border-gray-100 pt-3">
        <button 
          onClick={() => handleVote(true)}
          disabled={isVoting || !session}
          className={`flex items-center space-x-1 px-2 py-1 rounded ${
            voteStats.userVote === true 
              ? 'bg-green-100 text-green-700' 
              : 'hover:bg-gray-100 text-gray-600'
          } ${!session ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <HandThumbUpIcon className="h-4 w-4" />
          <span>{voteStats.agreeCount}</span>
        </button>
        
        <button 
          onClick={() => handleVote(false)}
          disabled={isVoting || !session}
          className={`flex items-center space-x-1 px-2 py-1 rounded ${
            voteStats.userVote === false 
              ? 'bg-red-100 text-red-700' 
              : 'hover:bg-gray-100 text-gray-600'
          } ${!session ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <HandThumbDownIcon className="h-4 w-4" />
          <span>{voteStats.disagreeCount}</span>
        </button>
        
        {!session && (
          <span className="text-xs text-gray-500">Sign in to vote</span>
        )}
      </div>
    </div>
  );
}
