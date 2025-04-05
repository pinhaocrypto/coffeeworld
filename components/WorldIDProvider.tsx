import React, { createContext, useContext, useState, ReactNode, useRef, useCallback, useMemo } from 'react';
import { ISuccessResult, IDKitWidget, VerificationLevel } from '@worldcoin/idkit';
import { signIn, signOut, useSession } from 'next-auth/react';

// Action ID for the application
const APP_ID = 'coffeeworld-review'; // This should match your World ID App ID

// Context to manage World ID verification state
interface WorldIDContextType {
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
  openWidget: () => void;
  handleVerificationSuccess: (result: ISuccessResult) => Promise<void>;
  handleSignOut: () => Promise<void>;
}

const WorldIDContext = createContext<WorldIDContextType | undefined>(undefined);

// Provider component
export function WorldIDProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openWidgetRef = useRef<(() => void) | null>(null);

  // Check if user is verified based on session
  const isVerified = !!session?.user?.worldcoinVerified;

  // Handle World ID verification success
  const handleVerificationSuccess = async (result: ISuccessResult) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('World ID verification successful:', result);
      
      // Send proof to backend for verification
      const verifyResponse = await fetch('/api/verify-worldcoin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merkle_root: result.merkle_root,
          nullifier_hash: result.nullifier_hash,
          proof: result.proof,
          verification_level: result.verification_level
        }),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Backend verification failed');
      }
      
      // Sign in with NextAuth using verified credentials
      const signInResult = await signIn('worldcoin', {
        proof: result.proof,
        nullifier_hash: result.nullifier_hash,
        merkle_root: result.merkle_root,
        verification_level: result.verification_level,
        redirect: false,
      });
      
      if (signInResult?.error) {
        throw new Error(`Sign-in failed: ${signInResult.error}`);
      }
      
      // Refresh page to update session state
      window.location.reload();
    } catch (error) {
      console.error('Verification error:', error);
      setError(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Sign out failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to open the World ID widget
  const openWidget = useCallback(() => {
    if (openWidgetRef.current) {
      openWidgetRef.current();
    } else {
      console.error('World ID widget not ready');
      setError('World ID verification not available');
    }
  }, []);

  // Context value
  const contextValue = useMemo(() => ({
    isVerified,
    isLoading,
    error,
    openWidget,
    handleVerificationSuccess,
    handleSignOut,
  }), [isVerified, isLoading, error, openWidget, handleVerificationSuccess, handleSignOut]);

  return (
    <>
      <WorldIDContext.Provider value={contextValue}>
        {children}
      </WorldIDContext.Provider>
      
      <IDKitWidget
        app_id={`app_${APP_ID}`}
        action="verify"
        onSuccess={handleVerificationSuccess}
        handleVerify={(proof) => {
          console.log('Proof received for verification:', proof);
          return Promise.resolve();
        }}
        verification_level={VerificationLevel.Device}
      >
        {({ open }) => {
          // Store the open function in ref for later use
          openWidgetRef.current = open;
          return <div style={{ display: 'none' }} />; 
        }}
      </IDKitWidget>
    </>
  );
}

// Custom hook to use World ID context
export function useWorldID() {
  const context = useContext(WorldIDContext);
  if (context === undefined) {
    throw new Error('useWorldID must be used within a WorldIDProvider');
  }
  return context;
}
