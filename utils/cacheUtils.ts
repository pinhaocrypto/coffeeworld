// Cache utility functions to improve API reliability
import { CoffeeShop } from '../pages/api/coffeeShops';

// Interface for the cache items with timestamp
interface CacheItem<T> {
  data: T;
  timestamp: number;
  params: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

// 30 minutes in milliseconds
const CACHE_EXPIRY = 30 * 60 * 1000;

// Threshold for considering coordinates to be close enough (about 100m)
const COORDINATE_THRESHOLD = 0.001;

/**
 * Save coffee shop search results to local storage
 */
export const cacheSearchResults = (
  latitude: number,
  longitude: number, 
  radius: number,
  coffeeShops: CoffeeShop[]
): void => {
  try {
    const cacheKey = getCacheKey(latitude, longitude, radius);
    const cacheItem: CacheItem<CoffeeShop[]> = {
      data: coffeeShops,
      timestamp: Date.now(),
      params: { latitude, longitude, radius }
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    console.log(`Cached ${coffeeShops.length} coffee shops for location (${latitude}, ${longitude}) with radius ${radius}m`);
  } catch (error) {
    console.error('Failed to cache search results:', error);
  }
};

/**
 * Get cached coffee shop results if available and not expired
 */
export const getCachedSearchResults = (
  latitude: number, 
  longitude: number, 
  radius: number
): CoffeeShop[] | null => {
  try {
    // First try exact match
    const exactCacheKey = getCacheKey(latitude, longitude, radius);
    const exactCache = checkCacheItem(exactCacheKey, latitude, longitude, radius);
    if (exactCache) return exactCache;
    
    // If no exact match, check other radius values that might be in cache
    // Try to find results for a larger radius that we can filter down
    const potentialRadii = [1000, 3000, 5000, 10000];
    for (const potentialRadius of potentialRadii) {
      // Only use larger radius caches
      if (potentialRadius <= radius) continue;
      
      const cacheKey = getCacheKey(latitude, longitude, potentialRadius);
      const cachedResults = checkCacheItem(cacheKey, latitude, longitude, potentialRadius);
      
      if (cachedResults) {
        // Filter the results to match the current radius
        return filterByRadius(cachedResults, latitude, longitude, radius);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to retrieve cached search results:', error);
    return null;
  }
};

/**
 * Check if coordinates are close enough to be considered the same location
 */
const areCoordinatesClose = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): boolean => {
  return (
    Math.abs(lat1 - lat2) < COORDINATE_THRESHOLD &&
    Math.abs(lng1 - lng2) < COORDINATE_THRESHOLD
  );
};

/**
 * Filter coffee shops by distance from a location
 */
const filterByRadius = (
  coffeeShops: CoffeeShop[], 
  latitude: number, 
  longitude: number, 
  radius: number
): CoffeeShop[] => {
  // Defensive check for undefined or null coffeeShops
  if (!coffeeShops || !Array.isArray(coffeeShops)) {
    console.warn('Invalid coffee shops array passed to filterByRadius');
    return [];
  }
  
  return coffeeShops.filter(shop => {
    // Ensure the shop has valid latitude and longitude
    if (!shop || typeof shop.latitude !== 'number' || typeof shop.longitude !== 'number') {
      return false;
    }
    
    const distance = calculateDistance(
      latitude, 
      longitude, 
      shop.latitude, 
      shop.longitude
    );
    // Convert km to meters
    return distance * 1000 <= radius;
  });
};

/**
 * Calculate distance between two coordinates in kilometers
 */
const calculateDistance = (
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

/**
 * Convert degrees to radians
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

/**
 * Check if a cache item exists, is valid, and matches the parameters
 */
const checkCacheItem = (
  cacheKey: string, 
  latitude: number, 
  longitude: number, 
  radius: number
): CoffeeShop[] | null => {
  // Perform safe checks to prevent undefined access
  if (!cacheKey || typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const cachedItem = localStorage.getItem(cacheKey);
    if (!cachedItem) return null;
    
    const cacheItem: CacheItem<CoffeeShop[]> = JSON.parse(cachedItem);
    
    // Ensure cacheItem and cacheItem.data exist and are properly formed
    if (!cacheItem || !cacheItem.data || !Array.isArray(cacheItem.data)) {
      console.warn('Invalid cache structure, removing:', cacheKey);
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    const now = Date.now();
    
    // Check if cache is expired (older than 30 minutes)
    if (now - cacheItem.timestamp > CACHE_EXPIRY) {
      console.log('Cache expired, removing:', cacheKey);
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    // Verify cacheItem.params exists before accessing properties
    if (!cacheItem.params || 
        typeof cacheItem.params.latitude !== 'number' || 
        typeof cacheItem.params.longitude !== 'number') {
      console.warn('Cache params invalid, removing:', cacheKey);
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    // Verify that the cached coordinates are close enough to the requested ones
    if (!areCoordinatesClose(
      latitude, 
      longitude, 
      cacheItem.params.latitude, 
      cacheItem.params.longitude
    )) {
      return null;
    }
    
    console.log(`Using cached results for (${latitude}, ${longitude}) with radius ${radius}m`);
    return cacheItem.data;
  } catch (error) {
    console.error('Error parsing cached data:', error);
    try {
      localStorage.removeItem(cacheKey);
    } catch (e) {
      console.error('Error removing invalid cache:', e);
    }
    return null;
  }
};

/**
 * Generate a cache key for the given parameters
 */
const getCacheKey = (
  latitude: number, 
  longitude: number, 
  radius: number
): string => {
  // Round coordinates to 3 decimal places (about 100m precision)
  const roundedLat = Math.round(latitude * 1000) / 1000;
  const roundedLng = Math.round(longitude * 1000) / 1000;
  return `coffee_shops_${roundedLat}_${roundedLng}_${radius}`;
};
