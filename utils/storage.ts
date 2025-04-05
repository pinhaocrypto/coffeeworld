/**
 * Safe storage utilities for Next.js - handles both client and server environments
 */

// Check if code is running in browser 
export const isBrowser = typeof window !== 'undefined';

// Safe version of localStorage.getItem
export function getStorageItem(key: string): string | null {
  if (!isBrowser) {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
}

// Safe version of localStorage.setItem
export function setStorageItem(key: string, value: string): boolean {
  if (!isBrowser) {
    return false;
  }
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('Error setting localStorage:', error);
    return false;
  }
}

// Safe version of localStorage.removeItem
export function removeStorageItem(key: string): boolean {
  if (!isBrowser) {
    return false;
  }
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing localStorage item:', error);
    return false;
  }
}
