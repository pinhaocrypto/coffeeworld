// CheckIn interface for storing coffee shop check-ins
export interface CheckIn {
  id: string;
  userWorldId: string;
  shopId: string;
  timestamp: string; // ISO date string
}

// Crowd level estimation based on check-in count
export enum CrowdLevel {
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
  VERY_HIGH = 'Very High'
}

// Function to determine crowd level based on check-in count
export function getCrowdLevel(count: number): CrowdLevel {
  if (count <= 2) return CrowdLevel.LOW;
  if (count <= 5) return CrowdLevel.MODERATE;
  if (count <= 10) return CrowdLevel.HIGH;
  return CrowdLevel.VERY_HIGH;
}

// Crowd status for display
export interface CrowdStatus {
  currentCount: number;
  level: CrowdLevel;
  lastUpdated: string; // ISO date string
}
