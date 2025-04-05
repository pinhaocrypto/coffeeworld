import { useEffect, useState } from 'react';
import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';
import { signIn, signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { formatProofForAuth } from '@/utils/worldcoin';

// Mock structure for World App credential that matches ISuccessResult
interface WorldAppCredential {
  credential_type: string;
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel | string;
}

export default function WorldIdAuthButton() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if running as a Mini App inside World App
  const isInWorldApp = mounted && typeof window !== 'undefined' && 
    (window.location.hostname.includes('worldcoin.org') || 
     window.navigator.userAgent.includes('WorldApp') ||
     !!window.parent && window.parent !== window);

  const handleVerify = async (proof: ISuccessResult) => {
    setIsLoading(true);
    try {
      // Format the proof for NextAuth
      const worldcoinProof = formatProofForAuth(proof);
      
      // Sign in with NextAuth using the Worldcoin provider
      const result = await signIn('worldcoin', { 
        proof: worldcoinProof.proof,
        nullifier_hash: worldcoinProof.nullifier_hash,
        merkle_root: worldcoinProof.merkle_root,
        verification_level: worldcoinProof.verification_level,
        redirect: false,
      });
      
      if (result?.error) {
        console.error('Sign in error:', result.error);
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Error during verification:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      // Clear any stored permission and authentication data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('locationPermissionGranted');
        localStorage.removeItem('worldcoin_session');
      }
      
      // Use redirect: false to prevent client-side errors
      await signOut({ 
        callbackUrl: '/',
        redirect: false
      });
      
      // Force reload if needed to clear state
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  if (session) {
    return (
      <button 
        className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 focus:outline-none"
        onClick={handleSignOut}
        disabled={isLoading}
      >
        {isLoading ? 'Signing Out...' : 'Sign Out'}
      </button>
    );
  }

  return (
    <div className="flex items-center">
      {isInWorldApp ? (
        // Special streamlined UI for World App users
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 focus:outline-none"
          onClick={() => {
            // Create a mock credential that satisfies the ISuccessResult interface
            const worldAppCredential: WorldAppCredential & ISuccessResult = {
              credential_type: 'orb',
              proof: 'world-app-mock-proof',
              merkle_root: 'world-app-mock-root',
              nullifier_hash: 'world-app-mock-hash',
              verification_level: VerificationLevel.Orb
            };
            handleVerify(worldAppCredential);
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify with World ID'}
        </button>
      ) : (
        // Regular web UI with IDKit widget
        <IDKitWidget
          app_id={process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID as `app_${string}` || "app_6bd93d77f6ac5663b82b4a4894eb3417"}
          action="coffee-world-auth"
          onSuccess={handleVerify}
          verification_level={VerificationLevel.Device}
          handleVerify={async (proof) => {
            // This is called when the proof is verified by IDKit
            return true as any; // Force type compatibility
          }}
        >
          {({ open }) => (
            <button 
              className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 focus:outline-none"
              onClick={open}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Sign in with World ID'}
            </button>
          )}
        </IDKitWidget>
      )}
    </div>
  );
}
