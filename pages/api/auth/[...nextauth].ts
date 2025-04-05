import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyWorldcoinProof } from '@/utils/worldcoin';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

// Extend the built-in session types
declare module 'next-auth' {
  interface User {
    worldcoinVerified?: boolean;
  }
  
  interface Session {
    user: {
      worldcoinVerified?: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// Extend JWT type
declare module 'next-auth/jwt' {
  interface JWT {
    worldcoinVerified?: boolean;
  }
}

// Configure NextAuth.js
const authOptions: NextAuthOptions = {
  providers: [
    // Worldcoin Provider for actual Worldcoin verification
    CredentialsProvider({
      id: 'worldcoin',
      name: 'Worldcoin',
      credentials: {
        proof: { type: 'text' },
        nullifier_hash: { type: 'text' },
        merkle_root: { type: 'text' },
        verification_level: { type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        
        try {
          // Verify the proof with Worldcoin
          const verified = await verifyWorldcoinProof({
            proof: credentials.proof,
            nullifier_hash: credentials.nullifier_hash,
            merkle_root: credentials.merkle_root,
            verification_level: credentials.verification_level,
          });
          
          if (verified.success) {
            // Return the user object
            return {
              id: credentials.nullifier_hash,
              name: `Worldcoin User`,
              worldcoinVerified: true,
            };
          }
          
          return null;
        } catch (error) {
          console.error('Error verifying Worldcoin proof:', error);
          return null;
        }
      },
    }),
    
    // Development Provider (for testing without Worldcoin)
    CredentialsProvider({
      id: 'development',
      name: 'Development Login',
      credentials: {
        username: { label: 'Username', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        
        // In development mode, always authenticate
        return {
          id: `dev-${Date.now()}`,
          name: credentials.username || 'Dev User',
          email: `${credentials.username || 'dev'}@example.com`,
          worldcoinVerified: true, // Consider all development logins as verified
        };
      },
    }),
  ],
  
  // Configure session
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Configure callbacks
  callbacks: {
    async jwt({ token, user }) {
      // Pass worldcoinVerified status to the token
      if (user) {
        token.worldcoinVerified = Boolean(user.worldcoinVerified);
      }
      return token;
    },
    async session({ session, token }) {
      // Pass worldcoinVerified status from the token to the session
      if (session.user) {
        session.user.worldcoinVerified = Boolean(token.worldcoinVerified);
      }
      return session;
    },
  },
  
  // Configure pages
  pages: {
    signIn: '/',
    error: '/',
  },
  
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);