import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import authOptions from '../auth/[...nextauth]';
import { CheckIn } from '@/types/checkin';
import { v4 as uuidv4 } from 'uuid';
import type { Session } from 'next-auth';

// Custom session type with Worldcoin verification
interface WorldcoinSession extends Session {
  user: {
    worldcoinVerified?: boolean;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    [key: string]: any; // Allow for additional properties
  };
}

// Generate a timestamp for a specific time ago in minutes
function getTimestampMinutesAgo(minutesAgo: number): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
}

// Hardcoded check-ins for each coffee shop
let checkIns: CheckIn[] = [
  // Coffee Shop 1 (Brew Haven) - 7 people currently checked in
  { id: '101', userWorldId: 'user1', shopId: '1', timestamp: getTimestampMinutesAgo(15) },
  { id: '102', userWorldId: 'user2', shopId: '1', timestamp: getTimestampMinutesAgo(25) },
  { id: '103', userWorldId: 'user3', shopId: '1', timestamp: getTimestampMinutesAgo(30) },
  { id: '104', userWorldId: 'user4', shopId: '1', timestamp: getTimestampMinutesAgo(35) },
  { id: '105', userWorldId: 'user5', shopId: '1', timestamp: getTimestampMinutesAgo(40) },
  { id: '106', userWorldId: 'user6', shopId: '1', timestamp: getTimestampMinutesAgo(45) },
  { id: '107', userWorldId: 'user7', shopId: '1', timestamp: getTimestampMinutesAgo(50) },
  
  // Coffee Shop 2 (The Roasted Bean) - 4 people currently checked in
  { id: '201', userWorldId: 'user8', shopId: '2', timestamp: getTimestampMinutesAgo(10) },
  { id: '202', userWorldId: 'user9', shopId: '2', timestamp: getTimestampMinutesAgo(20) },
  { id: '203', userWorldId: 'user10', shopId: '2', timestamp: getTimestampMinutesAgo(30) },
  { id: '204', userWorldId: 'user11', shopId: '2', timestamp: getTimestampMinutesAgo(40) },
  
  // Coffee Shop 3 (Morning Ritual) - 5 people currently checked in
  { id: '301', userWorldId: 'user12', shopId: '3', timestamp: getTimestampMinutesAgo(5) },
  { id: '302', userWorldId: 'user13', shopId: '3', timestamp: getTimestampMinutesAgo(15) },
  { id: '303', userWorldId: 'user14', shopId: '3', timestamp: getTimestampMinutesAgo(25) },
  { id: '304', userWorldId: 'user15', shopId: '3', timestamp: getTimestampMinutesAgo(35) },
  { id: '305', userWorldId: 'user16', shopId: '3', timestamp: getTimestampMinutesAgo(45) },
  
  // Coffee Shop 4 (Caffeine Culture) - 3 people currently checked in
  { id: '401', userWorldId: 'user17', shopId: '4', timestamp: getTimestampMinutesAgo(10) },
  { id: '402', userWorldId: 'user18', shopId: '4', timestamp: getTimestampMinutesAgo(20) },
  { id: '403', userWorldId: 'user19', shopId: '4', timestamp: getTimestampMinutesAgo(30) },
  
  // Coffee Shop 5 (Artisan Pours) - 6 people currently checked in
  { id: '501', userWorldId: 'user20', shopId: '5', timestamp: getTimestampMinutesAgo(5) },
  { id: '502', userWorldId: 'user21', shopId: '5', timestamp: getTimestampMinutesAgo(15) },
  { id: '503', userWorldId: 'user22', shopId: '5', timestamp: getTimestampMinutesAgo(25) },
  { id: '504', userWorldId: 'user23', shopId: '5', timestamp: getTimestampMinutesAgo(35) },
  { id: '505', userWorldId: 'user24', shopId: '5', timestamp: getTimestampMinutesAgo(45) },
  { id: '506', userWorldId: 'user25', shopId: '5', timestamp: getTimestampMinutesAgo(55) },
  
  // Coffee Shop 6 (Third Wave Brews) - 4 people currently checked in
  { id: '601', userWorldId: 'user26', shopId: '6', timestamp: getTimestampMinutesAgo(10) },
  { id: '602', userWorldId: 'user27', shopId: '6', timestamp: getTimestampMinutesAgo(20) },
  { id: '603', userWorldId: 'user28', shopId: '6', timestamp: getTimestampMinutesAgo(30) },
  { id: '604', userWorldId: 'user29', shopId: '6', timestamp: getTimestampMinutesAgo(40) }
];

// Check-in validity duration in milliseconds (90 minutes)
const CHECK_IN_VALIDITY_DURATION = 90 * 60 * 1000;

// Rate limiting: minimum time between check-ins for the same user at the same shop
const MIN_CHECK_IN_INTERVAL = 120 * 60 * 1000; // 2 hours

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET: Fetch check-ins for a specific coffee shop (no authentication required)
    if (req.method === 'GET') {
      const { shopId } = req.query;
      
      if (!shopId) {
        return res.status(400).json({ error: 'Coffee shop ID is required' });
      }
      
      // Get current check-ins (not expired)
      const now = new Date();
      const validCheckIns = checkIns.filter(checkIn => 
        checkIn.shopId === shopId && 
        (now.getTime() - new Date(checkIn.timestamp).getTime()) < CHECK_IN_VALIDITY_DURATION
      );
      
      const currentCount = validCheckIns.length;
      
      return res.status(200).json({ 
        currentCount,
        checkIns: validCheckIns
      });
    }
    
    // POST: Create a new check-in (authentication required)
    else if (req.method === 'POST') {
      // Check if user is authenticated
      const session = await getServerSession(req, res, authOptions) as WorldcoinSession;
      if (!session || !session.user) {
        return res.status(401).json({ error: 'You must be signed in to check in' });
      }
      
      // Check if user is verified with Worldcoin
      if (!session.user.worldcoinVerified) {
        return res.status(403).json({ error: 'World ID verification required to check in' });
      }
      
      const { shopId } = req.body;
      
      if (!shopId) {
        return res.status(400).json({ error: 'Coffee shop ID is required' });
      }
      
      // Use a user identifier from the session
      const userWorldId = session.user.email || 
                         session.user.id || 
                         `user-${Math.random().toString(36).substring(2, 15)}`;
      
      // Check if user already has a recent check-in at this shop (rate limiting)
      const now = new Date();
      const userRecentCheckIn = checkIns.find(checkIn => 
        checkIn.userWorldId === userWorldId && 
        checkIn.shopId === shopId && 
        (now.getTime() - new Date(checkIn.timestamp).getTime()) < MIN_CHECK_IN_INTERVAL
      );
      
      if (userRecentCheckIn) {
        const timeLeft = Math.ceil((MIN_CHECK_IN_INTERVAL - (now.getTime() - new Date(userRecentCheckIn.timestamp).getTime())) / (60 * 1000));
        return res.status(429).json({ 
          error: `You've already checked in here recently. Please wait ${timeLeft} minutes before checking in again.`
        });
      }
      
      // Create a new check-in
      const newCheckIn: CheckIn = {
        id: uuidv4(),
        userWorldId,
        shopId,
        timestamp: now.toISOString()
      };
      
      // Add to database
      checkIns.push(newCheckIn);
      
      // Clean up expired check-ins
      checkIns = checkIns.filter(checkIn => 
        (now.getTime() - new Date(checkIn.timestamp).getTime()) < CHECK_IN_VALIDITY_DURATION
      );
      
      // Get updated count for this shop
      const currentCount = checkIns.filter(checkIn => 
        checkIn.shopId === shopId && 
        (now.getTime() - new Date(checkIn.timestamp).getTime()) < CHECK_IN_VALIDITY_DURATION
      ).length;
      
      return res.status(201).json({ 
        checkIn: newCheckIn,
        currentCount
      });
    }
    
    // Method not allowed
    else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error in check-ins API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
