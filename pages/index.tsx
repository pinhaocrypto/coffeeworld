import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import AuthButton from '@/components/AuthButton';
import CoffeeShopCard from '@/components/CoffeeShopCard';
import { calculateDistance } from '@/utils/googleMaps';

// Interface for coffee shop data
interface CoffeeShop {
  id: string;
  name: string;
  address: string;
  image: string;
  rating: number;
  reviewCount: number;
  latitude: number;
  longitude: number;
  distance?: number; // Optional distance from user
}

// Available distance filters in kilometers
const distanceOptions = [
  { label: '1km', value: 1000 },
  { label: '3km', value: 3000 },
  { label: '5km', value: 5000 },
  { label: '10km', value: 10000 },
];

export default function Home() {
  const { data: session } = useSession();
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied' | 'unavailable' | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(3000); // Default to 3km

  // Get user location and fetch coffee shops
  useEffect(() => {
    if (session) {
      getUserLocation();
    } else {
      setCoffeeShops([]);
      setLoading(false);
    }
  }, [session]);

  // Function to get the user's location
  const getUserLocation = () => {
    setLocationStatus('loading');
    
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setLocationStatus('success');
        fetchCoffeeShops(latitude, longitude, selectedRadius);
      },
      // Error callback
      (error) => {
        console.error('Error getting location:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
          setError('Location access was denied. Allow location access to find coffee shops near you.');
        } else {
          setLocationStatus('error');
          setError('Unable to retrieve your location. Please try again later.');
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Function to fetch coffee shops from our API with specified radius
  const fetchCoffeeShops = async (latitude: number, longitude: number, radius: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/coffeeShops?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch coffee shops');
      }
      
      const data = await response.json();
      
      // Add distance calculation to each coffee shop
      const shopsWithDistance = data.coffeeShops.map((shop: CoffeeShop) => {
        if (shop.latitude && shop.longitude) {
          const distance = calculateDistance(
            latitude,
            longitude,
            shop.latitude,
            shop.longitude
          );
          return { ...shop, distance };
        }
        return shop;
      });
      
      // Sort by distance (nearest first)
      shopsWithDistance.sort((a: CoffeeShop, b: CoffeeShop) => {
        if (a.distance === undefined || b.distance === undefined) return 0;
        return a.distance - b.distance;
      });
      
      setCoffeeShops(shopsWithDistance);
    } catch (err) {
      console.error('Error fetching coffee shops:', err);
      setError('Failed to load coffee shops. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for changing the distance filter
  const handleRadiusChange = (radius: number) => {
    setSelectedRadius(radius);
    if (userLocation) {
      fetchCoffeeShops(userLocation.latitude, userLocation.longitude, radius);
    }
  };

  // Retry getting location and fetching coffee shops
  const handleRetry = () => {
    if (session) {
      getUserLocation();
    }
  };

  return (
    <div className="space-y-8">
      <section className="text-center py-10">
        <h1 className="text-4xl font-bold text-amber-800">Coffee World</h1>
        <p className="mt-2 text-gray-600 max-w-2xl mx-auto">Find the best coffee shops around you, verified by Worldcoin.</p>
        <div className="mt-6">
          <AuthButton />
        </div>
      </section>

      {session ? (
        <section>
          <h2 className="text-2xl font-bold mb-4">Coffee Shops Near You</h2>
          
          {/* Location status messages */}
          {locationStatus === 'denied' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
              <p>{error}</p>
              <button 
                onClick={handleRetry}
                className="mt-2 px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
              >
                Try Again
              </button>
            </div>
          )}
          
          {locationStatus === 'error' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
              <p>{error}</p>
              <button 
                onClick={handleRetry}
                className="mt-2 px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
              >
                Try Again
              </button>
            </div>
          )}
          
          {locationStatus === 'unavailable' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
              <p>{error}</p>
            </div>
          )}
          
          {error && locationStatus !== 'denied' && locationStatus !== 'error' && locationStatus !== 'unavailable' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
              <p>{error}</p>
              <button 
                onClick={handleRetry}
                className="mt-2 px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
              >
                Try Again
              </button>
            </div>
          )}
          
          {/* Distance filter */}
          {locationStatus === 'success' && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Distance Filter</h3>
              <div className="flex flex-wrap gap-2">
                {distanceOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleRadiusChange(option.value)}
                    className={`px-4 py-2 rounded-full border ${
                      selectedRadius === option.value
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-amber-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Coffee shop listing */}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-700"></div>
            </div>
          ) : coffeeShops.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coffeeShops.map((shop) => (
                <CoffeeShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-lg">No coffee shops found within {selectedRadius/1000}km.</p>
              <p className="text-gray-600 mt-2">Try increasing your search radius or check back later!</p>
              {locationStatus === 'success' && (
                <button 
                  onClick={handleRetry}
                  className="mt-4 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                >
                  Retry Search
                </button>
              )}
            </div>
          )}
        </section>
      ) : (
        <section className="text-center py-10 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Sign in to Discover</h2>
          <p className="text-gray-600 mb-6">
            Sign in with Worldcoin to find coffee shops near you and leave reviews.
          </p>
          <AuthButton />
        </section>
      )}
    </div>
  );
}
