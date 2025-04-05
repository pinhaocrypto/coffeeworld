import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
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
  const { data: session } = useSession(); // Keep session check for enabling features later
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error' | 'denied' | 'unavailable' | 'permission_needed' | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(3000); // Default to 3km
  const [showLocationPrompt, setShowLocationPrompt] = useState<boolean>(false);

  // Check for location permission on component mount (no longer depends on session)
  useEffect(() => {
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
  }, []); // Empty dependency array means this runs only once on mount

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

  // Effect to refetch coffee shops when the radius changes
  useEffect(() => {
    if (userLocation) {
      fetchCoffeeShops(userLocation.latitude, userLocation.longitude, selectedRadius);
    }
  }, [selectedRadius, userLocation]); // Re-run when radius or location changes

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-amber-800">CoffeeWorld</h1>
          {/* The Verify component is now rendered in _app.tsx and will handle auth status */}
        </div>

        {/* Location Permission Prompt */}
        {showLocationPrompt && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-6 rounded-md shadow">
            <p className="font-semibold">Location Access Required</p>
            <p className="text-sm mb-3">We need your location to find coffee shops near you.</p>
            <button 
              onClick={requestLocationPermission}
              className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 text-sm"
            >
              Allow Location Access
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {loading && <p className="text-center text-amber-600">Loading...</p>}
        {error && <p className="text-center text-red-600">Error: {error}</p>}

        {!loading && locationStatus === 'success' && (
          <div className="mb-6">
            <label htmlFor="radius-select" className="block text-sm font-medium text-gray-700 mb-1">
              Search Radius:
            </label>
            <select
              id="radius-select"
              value={selectedRadius}
              onChange={(e) => setSelectedRadius(Number(e.target.value))}
              className="block w-full max-w-xs px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
            >
              {distanceOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {!loading && locationStatus === 'success' && coffeeShops.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coffeeShops.map((shop) => (
              <CoffeeShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}

        {!loading && locationStatus === 'success' && coffeeShops.length === 0 && (
          <p className="text-center text-gray-500">No coffee shops found within the selected radius.</p>
        )}

        {!loading && locationStatus === 'denied' && (
          <p className="text-center text-red-600">Location access is required to find nearby coffee shops.</p>
        )}

        {!loading && locationStatus === 'error' && (
          <p className="text-center text-red-600">Could not retrieve location. Please try again.</p>
        )}

        {!loading && locationStatus === 'unavailable' && (
          <p className="text-center text-red-600">Location services are unavailable on this device/browser.</p>
        )}
      </div>
    </div>
  );
}
