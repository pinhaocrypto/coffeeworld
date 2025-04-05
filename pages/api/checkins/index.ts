import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { CheckIn } from '@/types/checkin';
import { v4 as uuidv4 } from 'uuid';

// Simulated database for check-ins (would be an actual database in production)
let checkIns: CheckIn[] = [];

// Check-in validity duration in milliseconds (90 minutes)
const CHECK_IN_VALIDITY_DURATION = 90 * 60 * 1000;

// Rate limiting: minimum time between check-ins for the same user at the same shop
const MIN_CHECK_IN_INTERVAL = 120 * 60 * 1000; // 2 hours

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check if user is authenticated
    const session = await getSession({ req });
    if (!session || !session.user) {
      return res.status(401).json({ error: 'You must be signed in to check in' });
    }

    // For the simulated Worldcoin system, we'll consider all authenticated users as verified
    // In a real implementation, you would check session.user.worldcoinVerified

    // GET: Fetch check-ins for a specific coffee shop
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
    
    // POST: Create a new check-in
    else if (req.method === 'POST') {
      const { shopId } = req.body;
      
      if (!shopId) {
        return res.status(400).json({ error: 'Coffee shop ID is required' });
      }
      
      // Use a user identifier from the session
      // In a real app, this would be the Worldcoin ID. For our simulation, use email or a generated ID
      const userWorldId = session.user.email || 
                         (session.user as any).id || 
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
