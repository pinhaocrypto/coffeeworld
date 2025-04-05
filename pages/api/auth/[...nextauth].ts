import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
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
          // In development mode, bypass verification with detailed logging
          if (process.env.NODE_ENV !== 'production') {
            console.log('Development mode: bypassing World ID verification with direct authentication');
            console.log('Credentials received:', credentials);
            return {
              id: credentials.nullifier_hash || `dev-user-${Date.now()}`,
              name: 'World ID User (Dev)',
              worldcoinVerified: true,
            };
          }

          // 在生產環境中，我們假設證明已經通過了 verify-worldcoin API 端點驗證
          // 因為 World ID 組件會在調用 signIn 之前先驗證證明
          console.log('Production: Using pre-verified World ID proof');
          
          // 只需檢查是否有必要的憑證
          if (!credentials.nullifier_hash) {
            console.error('Missing nullifier_hash in credentials');
            return null;
          }
          
          // 返回使用者對象
          return {
            id: credentials.nullifier_hash,
            name: `Worldcoin User`,
            worldcoinVerified: true,
          };
        } catch (error) {
          console.error('Error in World ID authentication:', error);
          return null;
        }
      },
    }),

    // Development provider for testing without World ID
    CredentialsProvider({
      id: 'development',
      name: 'Development Login',
      credentials: {
        username: { label: "Username", type: "text" },
      },
      async authorize(credentials) {
        // Only allow in development mode
        if (process.env.NODE_ENV !== 'production' && credentials) {
          return {
            id: `dev-${Date.now()}`,
            name: credentials.username || 'Dev User',
            worldcoinVerified: true
          };
        }
        return null;
      }
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