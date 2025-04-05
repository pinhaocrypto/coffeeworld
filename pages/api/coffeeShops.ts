import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import axios from 'axios';

// Define coffee shop interface with geographic coordinates
export interface CoffeeShop {
  id: string;
  name: string;
  address: string;
  image: string;
  rating: number;
  reviewCount: number;
  // Geographic coordinates for location-based sorting
  latitude: number;
  longitude: number;
  placeId?: string; // Google Maps place ID
}

// Fallback mock data if Google API fails or is not configured
const mockCoffeeShops: CoffeeShop[] = [
  {
    id: '1',
    name: 'Brew Haven',
    address: '123 Orchard Road, Singapore',
    image: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80',
    rating: 4.7,
    reviewCount: 0,
    // Near Orchard Road
    latitude: 1.3050,
    longitude: 103.8320
  },
  {
    id: '2',
    name: 'The Roasted Bean',
    address: '456 Bugis Street, Singapore',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
    rating: 4.3,
    reviewCount: 0,
    // Near Bugis
    latitude: 1.3007,
    longitude: 103.8558
  },
  {
    id: '3',
    name: 'Morning Ritual',
    address: '789 Tiong Bahru Road, Singapore',
    image: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=800&q=80',
    rating: 4.9,
    reviewCount: 0,
    // Tiong Bahru area
    latitude: 1.2847,
    longitude: 103.8320
  },
  {
    id: '4',
    name: 'Caffeine Culture',
    address: '101 Tanjong Pagar Road, Singapore',
    image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
    rating: 4.5,
    reviewCount: 0,
    // Tanjong Pagar area
    latitude: 1.2795,
    longitude: 103.8437
  },
  {
    id: '5',
    name: 'Artisan Pours',
    address: '202 Arab Street, Singapore',
    image: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&q=80',
    rating: 4.2,
    reviewCount: 0,
    // Near Arab Street/Kampong Glam
    latitude: 1.3028,
    longitude: 103.8605
  },
  {
    id: '6',
    name: 'Third Wave Brews',
    address: '303 Holland Village, Singapore',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    rating: 4.6,
    reviewCount: 0,
    // Holland Village area
    latitude: 1.3116,
    longitude: 103.7963
  }
];

// Function to fetch coffee shops from Google Places API
async function fetchGooglePlaces(latitude: number, longitude: number, radius: number = 3000): Promise<CoffeeShop[]> {
  try {
    // Google Places API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    console.log('Google Maps API key available:', !!apiKey);
    console.log('Request parameters:', { latitude, longitude, radius });
    
    if (!apiKey) {
      console.warn('Google Maps API key not configured, using mock data');
      return filterMockShopsByDistance(mockCoffeeShops, latitude, longitude, radius);
    }
    
    // Create the Google Places API URL
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant|cafe|bakery&keyword=coffee|茶|咖啡&key=${apiKey}`;
    console.log('Requesting Google Places API:', url.replace(apiKey, '[REDACTED]'));
    
    // Make the API request
    const response = await axios.get(url);
    
    console.log('Google Places API response status:', response.status);
    console.log('Google Places API response data status:', response.data.status);
    console.log('Results count:', response.data.results ? response.data.results.length : 0);
    
    if (response.data.error_message) {
      console.error('Google Places API error message:', response.data.error_message);
    }
    
    if (response.status !== 200 || !response.data.results) {
      console.error('Google Places API error:', response.data.status);
      return filterMockShopsByDistance(mockCoffeeShops, latitude, longitude, radius);
    }
    
    // Map Google Places data to our CoffeeShop interface
    const coffeeShops: CoffeeShop[] = response.data.results.map((place: any, index: number) => {
      return {
        id: place.place_id || `place-${index}`,
        name: place.name || 'Unknown Coffee Shop',
        address: place.vicinity || 'Address unavailable',
        // Use the first photo if available, or fallback to a placeholder
        image: place.photos && place.photos.length > 0
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
          : 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80',
        rating: place.rating || 0,
        reviewCount: 0, // Start with 0 reviews as we'll manage our own review system
        latitude: place.geometry?.location.lat || latitude,
        longitude: place.geometry?.location.lng || longitude,
        placeId: place.place_id
      };
    });
    
    return coffeeShops;
  } catch (error) {
    console.error('Error fetching from Google Places API:', error);
    return filterMockShopsByDistance(mockCoffeeShops, latitude, longitude, radius);
  }
}

// Filter mock data based on distance for consistent behavior with real API
function filterMockShopsByDistance(shops: CoffeeShop[], userLat: number, userLng: number, radius: number): CoffeeShop[] {
  return shops.filter(shop => {
    const distance = calculateDistance(userLat, userLng, shop.latitude, shop.longitude);
    // Convert distance to meters (calculateDistance returns km)
    return distance * 1000 <= radius;
  });
}

// Calculate distance between two coordinates in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { latitude, longitude, radius, id } = req.query;
    
    // Log for debugging
    console.log('API request received with:', { latitude, longitude, radius, id });
    
    // If an ID is provided, return that specific coffee shop
    if (id) {
      // Check in mock data first
      const mockShop = mockCoffeeShops.find(shop => shop.id === id);
      if (mockShop) {
        return res.status(200).json({ coffeeShops: [mockShop] });
      }
      
      // If not in mock data and API key is available, try to fetch from Google
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey || apiKey === 'your_google_maps_api_key') {
        return res.status(404).json({ error: 'Coffee shop not found' });
      }
      
      // Here you would typically fetch the specific shop from Google Places API
      // For now, return a 404 if not found in mock data
      return res.status(404).json({ error: 'Coffee shop not found' });
    }
    
    // Check if Google Maps API key is configured
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key') {
      console.log('Google Maps API key not configured, using mock data');
      const parsedRadius = radius ? parseInt(radius as string) : 3000;
      const lat = parseFloat(latitude as string || '0');
      const lng = parseFloat(longitude as string || '0');
      const filteredShops = filterMockShopsByDistance(mockCoffeeShops, lat, lng, parsedRadius);
      return res.status(200).json({ coffeeShops: filteredShops });
    }
    
    // Check for required parameters for location-based search
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required for location-based search' });
    }
    
    // Convert to numbers
    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const searchRadius = radius ? parseInt(radius as string) : 3000; // Default to 3km (3000m)
    
    // Fetch coffee shops from Google Maps API
    const coffeeShops = await fetchGooglePlaces(lat, lng, searchRadius);
    
    return res.status(200).json({ coffeeShops });
  } catch (error) {
    console.error('Error fetching coffee shops:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}