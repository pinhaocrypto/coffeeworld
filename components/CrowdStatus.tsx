import { useState, useEffect } from 'react';
import { CrowdLevel, getCrowdLevel } from '@/types/checkin';

interface CrowdStatusProps {
  coffeeShopId: string;
  compact?: boolean;
}

export default function CrowdStatus({ coffeeShopId, compact = false }: CrowdStatusProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentCount, setCurrentCount] = useState(0);
  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel>(CrowdLevel.LOW);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch current check-in status
  useEffect(() => {
    if (coffeeShopId) {
      fetchCheckInStatus();
    }
  }, [coffeeShopId]);
  
  const fetchCheckInStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/checkins?shopId=${coffeeShopId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCurrentCount(data.currentCount);
        setCrowdLevel(getCrowdLevel(data.currentCount));
      } else {
        setError('Could not fetch crowd status');
      }
    } catch (error) {
      console.error('Error fetching check-in status:', error);
      setError('Could not fetch crowd status');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className={`${compact ? 'text-xs' : 'text-sm'} animate-pulse text-gray-500`}>
        Loading crowd status...
      </div>
    );
  }
  
  if (error) {
    return null; // Don't show anything if there's an error
  }
  
  // Determine color based on crowd level
  const getStatusColor = () => {
    switch (crowdLevel) {
      case CrowdLevel.LOW:
        return 'bg-green-500';
      case CrowdLevel.MODERATE:
        return 'bg-yellow-500';
      case CrowdLevel.HIGH:
        return 'bg-orange-500';
      case CrowdLevel.VERY_HIGH:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Compact version for coffee shop cards
  if (compact) {
    return (
      <div className="flex items-center">
        <span className={`inline-flex h-2 w-2 rounded-full mr-1 ${getStatusColor()}`}></span>
        <span className="text-xs font-medium">
          {currentCount > 0 ? 
            `${crowdLevel} • ${currentCount} ${currentCount === 1 ? 'person' : 'people'}` : 
            'No check-ins yet'}
        </span>
      </div>
    );
  }
  
  // Standard version for coffee shop detail page
  return (
    <div className="flex items-center">
      <span className={`inline-flex h-3 w-3 rounded-full mr-2 ${getStatusColor()}`}></span>
      <span className="text-sm font-medium">
        Live Crowd: {crowdLevel} ({currentCount} {currentCount === 1 ? 'person' : 'people'})
      </span>
    </div>
  );
}
