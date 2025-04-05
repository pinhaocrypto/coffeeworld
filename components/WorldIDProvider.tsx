import React, { createContext, useContext, useState, ReactNode, useRef, useCallback, useMemo } from 'react';
import { ISuccessResult, IDKitWidget, VerificationLevel } from '@worldcoin/idkit';
import { signIn, signOut, useSession } from 'next-auth/react';

// Action ID for the application
const APP_ID = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID || 'wld_staging_1234567890';

// 在開發環境中自動模擬成功的驗證
const IS_DEV = process.env.NODE_ENV !== 'production';

// Context to manage World ID verification state
interface WorldIDContextType {
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
  openWidget: () => void;
  handleVerificationSuccess: (result: ISuccessResult) => Promise<void>;
  handleSignOut: () => Promise<void>;
  // 添加開發模式直接登入功能
  devModeLogin: () => Promise<void>;
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

  // 開發模式直接登入
  const devModeLogin = async () => {
    if (!IS_DEV) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Using dev mode login bypass");
      const result = await signIn('development', {
        redirect: false,
        username: 'DevUser'
      });
      
      if (result?.error) {
        throw new Error(`Dev login failed: ${result.error}`);
      }
      
      // Refresh to update session
      window.location.reload();
    } catch (error) {
      console.error('Dev login error:', error);
      setError(error instanceof Error ? error.message : 'Dev login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle World ID verification success
  const handleVerificationSuccess = async (result: ISuccessResult) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('World ID verification successful:', result);
      
      // 在開發模式直接使用 development provider
      if (IS_DEV) {
        console.log('Development mode: using dev provider instead of verifying proof');
        await devModeLogin();
        return;
      }
      
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
    // 在開發模式下，直接使用開發者登入
    if (IS_DEV) {
      devModeLogin();
      return;
    }
    
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
    devModeLogin,
  }), [isVerified, isLoading, error, openWidget, handleVerificationSuccess, handleSignOut]);

  return (
    <>
      <WorldIDContext.Provider value={contextValue}>
        {children}
      </WorldIDContext.Provider>
      
      {/* 只在生產環境中使用真實的 IDKitWidget */}
      {!IS_DEV && (
        <IDKitWidget
          app_id={`app_${APP_ID.replace(/^app_/, '')}`}
          action="verify"
          signal=""
          onSuccess={handleVerificationSuccess}
          handleVerify={(proof) => {
            console.log('Received World ID proof for verification:', proof);
            return Promise.resolve();
          }}
          verification_level={VerificationLevel.Device}
          // 確保使用正確的環境配置
          autoClose
        >
          {({ open }) => {
            openWidgetRef.current = open;
            return <div style={{ display: 'none' }} />; 
          }}
        </IDKitWidget>
      )}
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
