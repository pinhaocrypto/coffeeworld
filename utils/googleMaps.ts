import { Loader } from '@googlemaps/js-api-loader';

// Add Google Maps types declaration
declare global {
  interface Window {
    google: any;
  }
}

// Define coffee shop interface with necessary data
export interface CoffeeShop {
  id: string;
  place_id?: string;
  name: string;
  address: string;
  image: string;
  rating: number;
  reviewCount: number;
  latitude: number;
  longitude: number;
  distance?: number;
}

// Load Google Maps API with proper error handling and retry logic
export const loadGoogleMapsAPI = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // Check if API key is valid
    if (!apiKey || apiKey === 'your_google_maps_api_key') {
      console.error('Invalid Google Maps API key:', apiKey);
      reject(new Error('Invalid Google Maps API key. Check your .env file.'));
      return;
    }
    
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded');
      resolve(window.google);
      return;
    }
    
    console.log('Loading Google Maps API...');
    
    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places']
    });
    
    // Set a timeout to prevent hanging if API load fails
    const timeoutId = setTimeout(() => {
      reject(new Error('Google Maps API load timed out. Check your internet connection.'));
    }, 15000);
    
    loader.load()
      .then((google) => {
        clearTimeout(timeoutId);
        console.log('Google Maps API loaded successfully');
        resolve(google);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        console.error('Failed to load Google Maps API:', error);
        reject(error);
      });
  });
};

// Function to find nearby coffee shops using Google Places API
export const findNearbyCoffeeShops = async (
  latitude: number, 
  longitude: number, 
  radius: number = 3000
): Promise<CoffeeShop[]> => {
  try {
    const google = await loadGoogleMapsAPI();
    
    // Create a new PlacesService instance
    const map = new google.maps.Map(document.createElement('div'));
    const service = new google.maps.places.PlacesService(map);
    
    // Create the search request
    const request = {
      location: new google.maps.LatLng(latitude, longitude),
      radius,
      type: 'cafe',
      keyword: 'coffee'
    };
    
    // Wrap the nearbySearch in a promise
    return new Promise((resolve, reject) => {
      service.nearbySearch(
        request, 
        (
          results: any[] | null, 
          status: any
        ) => {
          console.log('Nearby search response status:', status);
          console.log('Results count:', results ? results.length : 0);
          
          if (status !== 'OK' || !results) {
            reject(new Error(`Places API search failed with status: ${status}`));
            return;
          }
          
          // Map the API results to our CoffeeShop interface
          const coffeeShops: CoffeeShop[] = results.map((place, index) => {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            
            return {
              id: place.place_id || `place-${index}`,
              place_id: place.place_id,
              name: place.name || 'Unknown Coffee Shop',
              address: place.vicinity || 'Address unavailable',
              // Use the first photo if available, or fallback to a placeholder
              image: place.photos && place.photos.length > 0
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
                : 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80',
              rating: place.rating || 0,
              reviewCount: place.user_ratings_total || 0,
              latitude: place.geometry?.location.lat() || latitude,
              longitude: place.geometry?.location.lng() || longitude
            };
          });
          
          resolve(coffeeShops);
        }
      );
    });
  } catch (error) {
    console.error('Error finding nearby coffee shops:', error);
    throw error;
  }
};

// Helper function to calculate distance between two coordinates in kilometers
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format distance for display
export const formatDistance = (distance?: number): string => {
  if (distance === undefined) return 'Unknown distance';
  
  if (distance < 1) {
    // If less than 1 km, show in meters
    return `${Math.round(distance * 1000)}m away`;
  }
  
  // Otherwise show in km with 1 decimal place
  return `${distance.toFixed(1)}km away`;
};
