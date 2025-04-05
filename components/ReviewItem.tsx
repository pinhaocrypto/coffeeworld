import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Review } from '@/types/review';

// 獎勵閾值 - 獲得這麼多讚就有資格獲得商家獎勵
const REWARD_THRESHOLD = 5;

interface ReviewItemProps {
  review: Review;
}

export default function ReviewItem({ review }: ReviewItemProps) {
  const { data: session } = useSession();
  const [vote, setVote] = useState<'up' | 'down' | null>(review.userVote);
  const [upvotes, setUpvotes] = useState(review.upvotes);
  const [downvotes, setDownvotes] = useState(review.downvotes);
  const [isVoting, setIsVoting] = useState(false);

  // Function to format the date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Use native JavaScript date formatting
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'some time ago';
    }
  };
  
  // Function to render stars based on rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={`full-${i}`} className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    // Half star
    if (halfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    // Empty stars
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    for (let i = 0; i <emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    return stars;
  };
  
  // 檢查評論是否達到獎勵資格
  const hasRewardEligibility = upvotes >= REWARD_THRESHOLD;

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!session) {
      alert('You must be signed in to vote on reviews');
      return;
    }
    
    // If clicking the same button again, remove the vote
    if (vote === voteType) {
      setVote(null);
      setUpvotes(voteType === 'up' ? upvotes - 1 : upvotes);
      setDownvotes(voteType === 'down' ? downvotes - 1 : downvotes);
      return;
    }
    
    setIsVoting(true);
    
    // If changing vote from one type to another
    if (vote) {
      setUpvotes(voteType === 'up' ? upvotes + 1 : (vote === 'up' ? upvotes - 1 : upvotes));
      setDownvotes(voteType === 'down' ? downvotes + 1 : (vote === 'down' ? downvotes - 1 : downvotes));
    } else {
      // New vote
      setUpvotes(voteType === 'up' ? upvotes + 1 : upvotes);
      setDownvotes(voteType === 'down' ? downvotes + 1 : downvotes);
    }
    
    setVote(voteType);
    setIsVoting(false);
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${hasRewardEligibility ? 'border-l-4 border-amber-400' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <div className="flex mr-2">
              {renderStars(review.rating)}
            </div>
            <h4 className="font-semibold">{review.userName}</h4>
            
            {/* 獎勵資格標記 */}
            {hasRewardEligibility && (
              <div className="ml-2 flex items-center bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs">
                <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Reward Eligible
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">{formatDate(review.date)}</p>
        </div>
      </div>
      <p className="mt-3 text-gray-700">{review.content}</p>
      
      <div className="mt-4 flex justify-between">
        {/* 左側顯示獎勵說明，只在有獎勵資格時顯示 */}
        {hasRewardEligibility && (
          <div className="text-xs text-amber-700 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            This review is eligible for rewards
          </div>
        )}
        
        {/* 右側點讚/倒讚按鈕 */}
        <div className="flex space-x-2">
          <button 
            onClick={() => handleVote('up')}
            disabled={isVoting || !session}
            className={`flex items-center px-2 py-1 rounded-md ${
              vote === 'up' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-100'
            } ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            {upvotes}
          </button>
          <button 
            onClick={() => handleVote('down')}
            disabled={isVoting || !session}
            className={`flex items-center px-2 py-1 rounded-md ${
              vote === 'down' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:bg-gray-100'
            } ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {downvotes}
          </button>
        </div>
      </div>
    </div>
  );
}
