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
  
  const getTextColor = () => {
    switch (crowdLevel) {
      case CrowdLevel.LOW:
        return 'text-green-700';
      case CrowdLevel.MODERATE:
        return 'text-yellow-700';
      case CrowdLevel.HIGH:
        return 'text-orange-700';
      case CrowdLevel.VERY_HIGH:
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };
  
  // Get description based on crowd level
  const getDescription = () => {
    switch (crowdLevel) {
      case CrowdLevel.LOW:
        return 'Plenty of seats available';
      case CrowdLevel.MODERATE:
        return 'Getting busy, but seats available';
      case CrowdLevel.HIGH:
        return 'Very busy, limited seating';
      case CrowdLevel.VERY_HIGH:
        return 'Extremely crowded';
      default:
        return 'No data available';
    }
  };
  
  // Person icon count display
  const renderPersonIcons = () => {
    if (currentCount === 0) return null;
    
    // Limit to maximum of 5 icons visually
    const displayCount = Math.min(currentCount, 5);
    
    return (
      <div className="flex mt-1 mb-1">
        {[...Array(displayCount)].map((_, i) => (
          <svg key={i} className={`w-4 h-4 ${getTextColor()} ${i > 0 ? '-ml-1' : ''}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        ))}
        {currentCount > 5 && (
          <span className="text-xs ml-1 text-gray-600">+{currentCount - 5} more</span>
        )}
      </div>
    );
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
  
  // Enhanced version for coffee shop detail page
  return (
    <div className="mt-1">
      <div className="flex items-center mb-1">
        <span className={`inline-flex h-3 w-3 rounded-full mr-2 ${getStatusColor()}`}></span>
        <span className={`text-sm font-medium ${getTextColor()}`}>
          {crowdLevel} • {currentCount} {currentCount === 1 ? 'person' : 'people'}
        </span>
      </div>
      
      {renderPersonIcons()}
      
      <p className="text-xs text-gray-600 mt-1">{getDescription()}</p>
    </div>
  );
}
