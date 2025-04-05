import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CrowdLevel, getCrowdLevel } from '@/types/checkin';

interface CheckInButtonProps {
  coffeeShopId: string;
}

export default function CheckInButton({ coffeeShopId }: CheckInButtonProps) {
  const { data: session, status } = useSession();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentCount, setCurrentCount] = useState(0);
  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel>(CrowdLevel.LOW);
  
  // Fetch current check-in status
  useEffect(() => {
    if (coffeeShopId) {
      fetchCheckInStatus();
    }
  }, [coffeeShopId]);
  
  const fetchCheckInStatus = async () => {
    try {
      const response = await fetch(`/api/checkins?shopId=${coffeeShopId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCurrentCount(data.currentCount);
        setCrowdLevel(getCrowdLevel(data.currentCount));
      }
    } catch (error) {
      console.error('Error fetching check-in status:', error);
    }
  };
  
  const handleCheckIn = async () => {
    if (!session) {
      setError('You must be logged in to check in');
      return;
    }
    
    // For the simulation environment, we consider all authenticated users verified
    // In a real app, you would check: session.user?.worldcoinVerified
    
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopId: coffeeShopId,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check in');
      }
      
      setIsCheckedIn(true);
      setCurrentCount(data.currentCount);
      setCrowdLevel(getCrowdLevel(data.currentCount));
      setSuccessMessage('Checked in! Thanks for reporting.');
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (err: any) {
      console.error('Error checking in:', err);
      setError(err.message || 'Failed to check in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render a message when not authenticated or still loading
  if (status === 'loading') {
    return <div className="animate-pulse">Loading check-in status...</div>;
  }
  
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center">
        <span className={`inline-flex h-3 w-3 rounded-full mr-2 ${
          crowdLevel === CrowdLevel.LOW ? 'bg-green-500' :
          crowdLevel === CrowdLevel.MODERATE ? 'bg-yellow-500' :
          crowdLevel === CrowdLevel.HIGH ? 'bg-orange-500' : 'bg-red-500'
        }`}></span>
        <span className="text-sm font-medium">
          Live Crowd: {crowdLevel} ({currentCount} {currentCount === 1 ? 'person' : 'people'})
        </span>
      </div>
      
      {!isCheckedIn && (
        <button
          onClick={handleCheckIn}
          disabled={isSubmitting || !session}
          className={`flex items-center justify-center px-4 py-2 rounded-md text-white font-medium
            ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'} 
            ${!session ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking In...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              I'm Here (Check In)
            </>
          )}
        </button>
      )}
      
      {error && (
        <div className="p-2 text-sm bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="p-2 text-sm bg-green-50 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
    </div>
  );
}
