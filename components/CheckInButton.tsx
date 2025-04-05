import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CrowdLevel, getCrowdLevel } from '@/types/checkin';
import WorldIDButton from '@/components/WorldIDButton'; // Import the WorldIDButton component

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
        
        // Check if user is already checked in
        if (session && data.userCheckedIn) {
          setIsCheckedIn(true);
        }
      }
    } catch (error) {
      console.error('Error fetching check-in status:', error);
    }
  };
  
  const handleCheckIn = async () => {
    if (!session) {
      setError('You must be verified with World ID to check in');
      return;
    }
    
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
      setSuccessMessage('You\'re checked in!');
      
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
  
  // Render a message when still loading session status
  if (status === 'loading') {
    return <div className="animate-pulse text-sm text-gray-500">Loading...</div>;
  }
  
  return (
    <div className="flex flex-col">
      <div className="text-sm font-medium text-amber-800 mb-2">
        {isCheckedIn ? 'You\'re here!' : 'Are you at this location?'}
      </div>
      
      {!session ? (
        <div className="flex flex-col space-y-2">
          <button 
            onClick={() => setError('Please verify with World ID first')}
            className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors w-full text-center flex justify-center items-center"
            disabled={isSubmitting}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Check In
          </button>
          <p className="text-center mb-4">
            Please verify with World ID to check in.
          </p>
          <div className="flex justify-center">
            <WorldIDButton />
          </div>
          {error && (
            <div className="text-xs text-red-600 mt-1">
              {error}
            </div>
          )}
        </div>
      ) : (
        <button 
          onClick={handleCheckIn}
          disabled={isSubmitting || isCheckedIn}
          className={`px-4 py-2 rounded-lg font-medium transition-colors w-full flex justify-center items-center ${
            isCheckedIn 
              ? 'bg-green-100 text-green-800 cursor-default' 
              : 'bg-amber-600 text-white hover:bg-amber-700'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking in...
            </>
          ) : isCheckedIn ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              You're checked in
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Check in here
            </>
          )}
        </button>
      )}
      
      {successMessage && (
        <div className="text-xs text-green-600 mt-1 text-center">
          {successMessage}
        </div>
      )}
    </div>
  );
}
