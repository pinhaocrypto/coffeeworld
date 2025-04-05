import { useEffect, useState } from 'react';
import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';
import { signIn, signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import ErrorBoundary from '@/components/ErrorBoundary';

// Get environment variables safely
const getWorldcoinAppId = () => {
  const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
  // Ensure it's formatted as expected by IDKit (app_xxx format)
  if (appId && appId.startsWith('app_')) {
    return appId as `app_${string}`;
  }
  // Use production app ID - make sure you've created this in the Worldcoin Developer Portal
  return "app_staging_6bd93d77f6ac5663b82b4a4894eb3417" as `app_${string}`;
};

export default function WorldIdAuthButton() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Handle client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset error message when session status changes
  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);

  const handleVerify = async (proof: ISuccessResult) => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      console.log('Worldcoin proof received:', proof);
      
      // First verify with our backend
      const verifyResponse = await fetch('/api/verify-worldcoin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Send proof details directly
          merkle_root: proof.merkle_root,
          nullifier_hash: proof.nullifier_hash,
          proof: proof.proof,
          verification_level: proof.verification_level || 'orb'
        }),
      });
      
      const verifyResult = await verifyResponse.json();
      console.log('Verification result:', verifyResult);
      
      if (!verifyResult.success) {
        console.error('Verification failed:', verifyResult);
        setErrorMsg('Verification failed. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Sign in with NextAuth using the Worldcoin provider
      const signInResult = await signIn('worldcoin', { 
        proof: proof.proof,
        nullifier_hash: proof.nullifier_hash,
        merkle_root: proof.merkle_root,
        verification_level: proof.verification_level || 'orb',
        redirect: false,
      });
      
      console.log('Sign in result:', signInResult);
      
      if (signInResult?.error) {
        console.error('Sign in error:', signInResult.error);
        setErrorMsg('Authentication failed. Please try again.');
      } else if (signInResult?.url) {
        window.location.href = signInResult.url;
      } else {
        // If no error and no URL, likely successful but no redirect
        window.location.reload();
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
      // Clear any stored authentication data
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
      
      // Force reload to clear state
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
      setErrorMsg('Sign out failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Don't render anything during SSR
  if (!mounted) return null;

  // If user is signed in, show the sign out button
  if (session) {
    return (
      <div>
        {errorMsg && <div className="text-red-600 text-xs mb-2">{errorMsg}</div>}
        <div className="text-sm text-white mb-2">
          Signed in as <span className="font-semibold">{session.user?.name || 'Worldcoin User'}</span>
        </div>
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

  // If user is not signed in, show the appropriate authentication option based on environment
  return (
    <div className="flex flex-col items-end">
      {errorMsg && <div className="text-red-600 text-xs mb-2">{errorMsg}</div>}
      
      <div className="idkit-widget-wrapper">
        <ErrorBoundary fallback={
          <button 
            className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 focus:outline-none"
            disabled={isLoading}
          >
            World ID Verification Unavailable
          </button>
        }>
          <IDKitWidget
            app_id={getWorldcoinAppId()}
            action="coffee-world-auth"
            signal="coffee-world-user"
            onSuccess={handleVerify}
            verification_level={VerificationLevel.Device}
          >
            {({ open }) => (
              <button 
                className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 focus:outline-none"
                onClick={open}
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify with World ID'}
              </button>
            )}
          </IDKitWidget>
        </ErrorBoundary>
      </div>
    </div>
  );
}
