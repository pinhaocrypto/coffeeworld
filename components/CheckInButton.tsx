import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CrowdLevel, getCrowdLevel } from '@/types/checkin';
import Verify from '@/components/Verify'; // Import the Verify component

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
  
  // Display crowd level indicator
  const renderCrowdIndicator = () => (
    <div className="flex items-center mb-2">
      <span className={`inline-flex h-3 w-3 rounded-full mr-2 ${
        crowdLevel === CrowdLevel.LOW ? 'bg-green-500' :
        crowdLevel === CrowdLevel.MODERATE ? 'bg-yellow-500' :
        crowdLevel === CrowdLevel.HIGH ? 'bg-orange-500' : 'bg-red-500'
      }`}></span>
      <span className="text-sm font-medium">
        Live Crowd: {crowdLevel} ({currentCount} {currentCount === 1 ? 'person' : 'people'})
      </span>
    </div>
  );
  
  // Render a message when still loading session status
  if (status === 'loading') {
    return <div className="animate-pulse">Loading check-in status...</div>;
  }
  
  return (
    <div className="flex flex-col space-y-3">
      {renderCrowdIndicator()}
      
      <div className="flex flex-col space-y-2">
        {!session ? (
          <>
            <button 
              onClick={() => setError('You must verify with World ID first')}
              className="px-4 py-3 rounded-lg font-medium bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 transition-colors w-full text-center"
            >
              Check In Here
            </button>
            <div className="flex items-center justify-center mt-2">
              <span className="text-sm text-gray-500 mr-2">Verify first:</span>
              <Verify />
            </div>
            {error && (
              <div className="text-sm text-red-600 mt-1">
                {error}
              </div>
            )}
          </>
        ) : (
          <button 
            onClick={handleCheckIn}
            disabled={isSubmitting || isCheckedIn}
            className={`px-4 py-3 rounded-lg font-medium transition-colors w-full ${
              isCheckedIn 
                ? 'bg-green-100 text-green-800 cursor-default' 
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking in...
              </div>
            ) : isCheckedIn ? (
              'You are checked in ✓'
            ) : (
              'Check in here'
            )}
          </button>
        )}
        
        {successMessage && (
          <div className="text-sm text-green-600">
            {successMessage}
          </div>
        )}
      </div>
    </div>
  );
}
