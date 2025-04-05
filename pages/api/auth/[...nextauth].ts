import NextAuth from 'next-auth';
import { DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyWorldcoinProof } from '../../../utils/worldcoin';

export default NextAuth({
  providers: [
    CredentialsProvider({
      id: 'worldcoin',
      name: 'Worldcoin',
      credentials: {
        proof: { label: 'Proof', type: 'text' },
        nullifier_hash: { label: 'Nullifier Hash', type: 'text' },
        merkle_root: { label: 'Merkle Root', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        try {
          // Use our simulated Worldcoin verification
          const verification = await verifyWorldcoinProof({
            proof: credentials.proof,
            nullifier_hash: credentials.nullifier_hash,
            merkle_root: credentials.merkle_root,
          });

          if (verification.success) {
            // Create a user object based on the verification
            return {
              id: verification.nullifier_hash || '1',
              name: 'Worldcoin User',
              email: `user-${verification.nullifier_hash?.substring(0, 8)}@example.com`,
              image: `https://ui-avatars.com/api/?name=Worldcoin+User&background=random`,
              worldcoinVerified: true,
            };
          }
          
          throw new Error('Worldcoin verification failed');
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.worldcoinVerified = user.worldcoinVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.worldcoinVerified = token.worldcoinVerified as boolean;
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-fallback-secret-do-not-use-in-production',
  debug: process.env.NODE_ENV === 'development',
});

// Augment the next-auth module to include our custom types
declare module 'next-auth' {
  interface User {
    worldcoinVerified?: boolean;
  }
  
  interface Session {
    user: {
      id?: string;
      worldcoinVerified?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    worldcoinVerified?: boolean;
  }
}
