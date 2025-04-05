/**
 * Utility functions for generating UUIDs and simulating World IDs
 */

/**
 * Generate a random UUID v4
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Generate a simulated World ID
 * This is just for demonstration purposes - real World IDs would be verified through the Worldcoin protocol
 */
export const generateSimulatedWorldId = (): string => {
  // Generate a random string that looks like a nullifier hash
  const characters = 'abcdef0123456789';
  let result = '0x';
  const length = 64; // 32 bytes = 64 hex chars
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * Check if a string is a valid UUID
 */
export const isValidUUID = (id: string): boolean => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(id);
};
