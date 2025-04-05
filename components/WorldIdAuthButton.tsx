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

// Get environment variables safely
const getWorldcoinAppId = () => {
  const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
  // Ensure it's formatted as expected by IDKit (app_xxx format)
  if (appId && appId.startsWith('app_')) {
    return appId as `app_${string}`;
  }
  // Fallback to hard-coded value if not properly set
  return "app_6bd93d77f6ac5663b82b4a4894eb3417" as `app_${string}`;
};

export default function WorldIdAuthButton() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Handle client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if running as a Mini App inside World App
  const isInWorldApp = mounted && typeof window !== 'undefined' && (
    (() => {
      try {
        return window.location.hostname.includes('worldcoin.org') || 
          window.navigator.userAgent.includes('WorldApp') ||
          (!!window.parent && window.parent !== window);
      } catch (e) {
        // Handle potential cross-origin errors when checking window.parent
        console.error('Error checking World App environment:', e);
        return false;
      }
    })()
  );

  const handleVerify = async (proof: ISuccessResult) => {
    setIsLoading(true);
    setErrorMsg(null);
    
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
        setErrorMsg('Authentication failed. Please try again.');
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Error during verification:', error);
      setErrorMsg('Authentication error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      // Clear any stored permission and authentication data
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('locationPermissionGranted');
          localStorage.removeItem('worldcoin_session');
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
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
      setErrorMsg('Sign out failed. Please try again.');
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  if (session) {
    return (
      <div>
        {errorMsg && <div className="text-red-600 text-xs mb-2">{errorMsg}</div>}
        <button 
          className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 focus:outline-none"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      {errorMsg && <div className="text-red-600 text-xs mb-2">{errorMsg}</div>}
      {isInWorldApp ? (
        // Special streamlined UI for World App users
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 focus:outline-none"
          onClick={() => {
            try {
              // Create a mock credential that satisfies the ISuccessResult interface
              const worldAppCredential: WorldAppCredential & ISuccessResult = {
                credential_type: 'orb',
                proof: 'world-app-mock-proof',
                merkle_root: 'world-app-mock-root',
                nullifier_hash: 'world-app-mock-hash',
                verification_level: VerificationLevel.Orb
              };
              handleVerify(worldAppCredential);
            } catch (error) {
              console.error('Error during World App auth:', error);
              setErrorMsg('Authentication failed. Please try again.');
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify with World ID'}
        </button>
      ) : (
        // Regular web UI with IDKit widget
        <div className="idkit-widget-wrapper">
          <IDKitWidget
            app_id={getWorldcoinAppId()}
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
                onClick={() => {
                  try {
                    open();
                  } catch (error) {
                    console.error('Error opening IDKit:', error);
                    setErrorMsg('Failed to open verification dialog. Please try again.');
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Sign in with World ID'}
              </button>
            )}
          </IDKitWidget>
        </div>
      )}
    </div>
  );
}
