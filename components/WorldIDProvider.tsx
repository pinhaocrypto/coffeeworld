"use client"
import React, { createContext, useContext, useState, ReactNode, useRef, useCallback, useMemo } from 'react';
import { ISuccessResult, IDKitWidget, VerificationLevel } from '@worldcoin/idkit';
import { signIn, signOut, useSession } from 'next-auth/react';

// Action ID for the application
const APP_ID = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID || 'app_6bd93d77f6ac5663b82b4a4894eb3417';
const ACTION = "coffeeworld-review";

// 在開發環境中自動模擬成功的驗證 - 安全檢測環境
const IS_DEV = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

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

  // 服務器端驗證 World ID 證明
  const verifyProof = async (proof: ISuccessResult) => {
    console.log('Verifying proof with World ID API:', proof);
    try {
      const response = await fetch('/api/verify-worldcoin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...proof, action: ACTION }),
      });

      if (!response.ok) {
        const { code, detail } = await response.json();
        throw new Error(`Error Code ${code}: ${detail}`);
      }

      const { verified } = await response.json();
      return verified;
    } catch (error) {
      console.error('Error verifying proof:', error);
      throw error;
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

      // 驗證 proof
      const verified = await verifyProof(result);
      
      if (!verified) {
        throw new Error('Proof verification failed');
      }
      
      // 使用 NextAuth 進行身份驗證
      const signInResult = await signIn('worldcoin', {
        proof: JSON.stringify(result.proof),
        nullifier_hash: result.nullifier_hash,
        merkle_root: result.merkle_root,
        verification_level: result.verification_level,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(`Sign-in failed: ${signInResult.error}`);
      }

      // 刷新頁面以更新會話
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

      <IDKitWidget
        app_id={APP_ID.startsWith('app_') ? APP_ID as `app_${string}` : `app_${APP_ID}` as `app_${string}`}
        action={ACTION}
        signal=""
        onSuccess={handleVerificationSuccess}
        handleVerify={verifyProof}
        verification_level={VerificationLevel.Device}
        autoClose
      >
        {({ open }) => {
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
