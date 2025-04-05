import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import AuthButton from '@/components/AuthButton';
import CoffeeShopCard from '@/components/CoffeeShopCard';
import { calculateDistance } from '@/utils/googleMaps';
import { getCachedSearchResults, cacheSearchResults } from '@/utils/cacheUtils';
import { getStorageItem, setStorageItem } from '@/utils/storage';

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
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied' | 'unavailable' | 'permission_needed' | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(3000); // Default to 3km
  const [showLocationPrompt, setShowLocationPrompt] = useState<boolean>(false);
  const [permissionChecked, setPermissionChecked] = useState<boolean>(false);

  // Check if user has previously granted location permission
  useEffect(() => {
    if (session) {
      // Safely check localStorage for previous permission
      const storedPermission = getStorageItem('locationPermissionGranted');
      
      if (storedPermission === 'true') {
        // User previously granted permission, get location automatically
        setShowLocationPrompt(false);
        getUserLocation();
      } else if (storedPermission === 'false') {
        // User previously denied permission
        setLocationStatus('denied');
        setError('Location access was denied. Allow location access to find coffee shops near you.');
        setLoading(false);
      } else {
        // No stored preference, show the prompt
        setShowLocationPrompt(true);
        setLocationStatus('permission_needed');
        setLoading(false);
      }
      
      setPermissionChecked(true);
    } else if (!session) {
      setCoffeeShops([]);
      setLoading(false);
    }
  }, [session]);

  // Function to request location permission explicitly
  const requestLocationPermission = () => {
    setShowLocationPrompt(false);
    setLoading(true);
    getUserLocation();
  };

  // Function to get the user's location
  const getUserLocation = () => {
    setLocationStatus('loading');
    
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
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
        
        // Store permission in localStorage safely
        setStorageItem('locationPermissionGranted', 'true');
        
        fetchCoffeeShops(latitude, longitude, selectedRadius);
      },
      // Error callback
      (error) => {
        console.error('Error getting location:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
          setError('Location access was denied. Allow location access to find coffee shops near you.');
          
          // Store denied permission in localStorage safely
          setStorageItem('locationPermissionGranted', 'false');
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
      
      // Check for cached results first
      const cachedResults = getCachedSearchResults(latitude, longitude, radius);
      if (cachedResults && cachedResults.length > 0) {
        console.log(`Using ${cachedResults.length} cached coffee shops for ${radius}m radius`);
        
        // Add distance calculation to each coffee shop
        const shopsWithDistance = cachedResults.map((shop: CoffeeShop) => {
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
        setLoading(false);
        return;
      }
      
      // No cache available, fetch from API
      console.log(`Fetching coffee shops from API for ${radius}m radius`);
      const response = await fetch(`/api/coffeeShops?latitude=${latitude}&longitude=${longitude}&radius=${radius}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch coffee shops');
      }
      
      const data = await response.json();
      
      // Add defensive check to ensure data.coffeeShops exists
      if (!data || !data.coffeeShops || !Array.isArray(data.coffeeShops)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from API');
      }
      
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
      
      // Cache the results for future use
      cacheSearchResults(latitude, longitude, radius, data.coffeeShops);
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

  // Retry getting location and fetching coffee shops with cache clearing option
  const handleRetry = useCallback((clearCache = false) => {
    if (clearCache) {
      // Clear all coffee shop caches
      const keysToRemove: string[] = [];
      
      // Safely access localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('coffeeShops_')) {
            keysToRemove.push(key);
          }
        }
        
        // Remove all cache keys
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
      }
    }
    
    setError(null);
    getUserLocation();
  }, []);

  return (
    <div className="space-y-8">
      <section className="text-center py-10">
        <h1 className="text-4xl font-bold text-amber-800">Coffee World</h1>
        <p className="mt-2 text-gray-600 max-w-2xl mx-auto">Find the best coffee shops around you, verified by Worldcoin.</p>
      </section>

      {session ? (
        <section>
          <h2 className="text-2xl font-bold mb-4">Coffee Shops Near You</h2>
          
          {/* Location permission prompt */}
          {showLocationPrompt && (
            <div className="bg-white border border-amber-200 rounded-lg p-6 mb-6 shadow-md">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <svg className="h-10 w-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Location Access Required</h3>
                  <p className="text-gray-600 mb-4">
                    To show you coffee shops nearby, Coffee World needs access to your location. 
                    Your location is only used to find coffee shops and is never stored or shared.
                  </p>
                  <button
                    onClick={requestLocationPermission}
                    className="inline-flex items-center px-5 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Share My Location
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Location status messages */}
          {locationStatus === 'denied' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
              <p>{error}</p>
              <p className="mt-2">
                <strong>How to enable location access:</strong>
              </p>
              <ul className="list-disc ml-5 mt-1">
                <li>Click the lock/info icon in your browser's address bar</li>
                <li>Find "Location" and change it to "Allow"</li>
                <li>Refresh the page and try again</li>
              </ul>
              <button 
                onClick={() => handleRetry(false)}
                className="mt-4 px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
              >
                Try Again
              </button>
            </div>
          )}
          
          {locationStatus === 'error' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
              <p>{error}</p>
              <button 
                onClick={() => handleRetry(false)}
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
          
          {error && locationStatus !== 'denied' && locationStatus !== 'error' && locationStatus !== 'unavailable' && locationStatus !== 'permission_needed' && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
              <p>{error}</p>
              <button 
                onClick={() => handleRetry(false)}
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
          ) : locationStatus === 'success' ? (
            <div className="text-center py-10">
              <p className="text-lg">No coffee shops found within {selectedRadius/1000}km.</p>
              <p className="text-gray-600 mt-2">Try increasing your search radius or check back later!</p>
              <div className="flex justify-center space-x-4 mt-4">
                <button 
                  onClick={() => handleRetry(false)}
                  className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                >
                  Retry Search
                </button>
                <button 
                  onClick={() => handleRetry(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Clear Cache & Retry
                </button>
              </div>
            </div>
          ) : null}
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
