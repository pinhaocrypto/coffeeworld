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
  { label: 'Example', value: -1 }, // Special value to indicate example data
];

// Example coffee shop data
const exampleCoffeeShops: CoffeeShop[] = [
  {
    id: '1',
    name: 'Brew Haven',
    address: '123 Coffee Lane, San Francisco',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
    rating: 4.8,
    reviewCount: 120,
    latitude: 37.7749,
    longitude: -122.4194,
  },
  {
    id: '2',
    name: 'The Roasted Bean',
    address: '456 Barista Avenue, San Francisco',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
    rating: 4.2,
    reviewCount: 85,
    latitude: 37.7859,
    longitude: -122.4364,
  },
  {
    id: '3',
    name: 'Morning Ritual',
    address: '789 Espresso Street, San Francisco',
    image: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80',
    rating: 4.5,
    reviewCount: 96,
    latitude: 37.7963,
    longitude: -122.4574,
  },
  {
    id: '4',
    name: 'Caffeine Culture',
    address: '321 Latte Drive, San Francisco',
    image: 'https://images.unsplash.com/photo-1501747315-124a0eaca060?w=800&q=80',
    rating: 4.3,
    reviewCount: 78,
    latitude: 37.8083,
    longitude: -122.4156,
  },
  {
    id: '5',
    name: 'Artisan Pours',
    address: '555 Macchiato Street, San Francisco',
    image: 'https://images.unsplash.com/photo-1515215316771-2742baa337f4?w=800&q=80',
    rating: 4.7,
    reviewCount: 135,
    latitude: 37.7719,
    longitude: -122.4024,
  },
  {
    id: '6',
    name: 'Third Wave Brews',
    address: '999 Pour-Over Place, San Francisco',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=800&q=80',
    rating: 4.6,
    reviewCount: 112,
    latitude: 37.7867,
    longitude: -122.3872,
  }
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
    if (selectedRadius === -1) {
      // Special case for example data, no location needed
      setCoffeeShops(exampleCoffeeShops);
      setLocationStatus('success'); // Set to success to display the grid
      setLoading(false);
    } else if (userLocation) {
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

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-amber-800">Search Options</h3>
          <div className="flex flex-wrap gap-2">
            {distanceOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setSelectedRadius(option.value)}
                className={`px-4 py-2 rounded-full border transition-all ${
                  selectedRadius === option.value
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-amber-400 hover:bg-amber-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
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
