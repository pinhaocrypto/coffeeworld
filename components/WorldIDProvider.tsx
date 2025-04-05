"use client"
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { ISuccessResult, IDKitWidget, VerificationLevel } from '@worldcoin/idkit';
import { signIn, signOut, useSession } from 'next-auth/react';

// Action ID for the application
const APP_ID = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID || 'app_6bd93d77f6ac5663b82b4a4894eb3417';
const ACTION = "coffeeworld-review";

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
  // 追踪組件是否已在客戶端掛載
  const [isMounted, setIsMounted] = useState(false);
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetOpened, setWidgetOpened] = useState(false);

  // 安全檢測環境變量
  const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  // 在組件掛載後設置 isMounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 檢查用戶是否已經通過 World ID 驗證
  const isVerified = !!session?.user?.worldcoinVerified;

  // 處理 IDKit 驗證成功
  const handleVerificationSuccess = useCallback(async (result: ISuccessResult) => {
    if (!isMounted) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 在開發環境中模擬成功的驗證
      if (isDev) {
        console.log('Development mode: simulating successful verification');
        const devResult = await signIn('credentials', {
          redirect: false,
          nullifier_hash: `dev-user-${Date.now()}`,
          worldcoinVerified: true
        });
        
        if (devResult?.error) {
          setError(`Dev auth error: ${devResult.error}`);
          console.error('Dev auth error:', devResult.error);
        }
        
        setWidgetOpened(false);
        return;
      }
      
      // 驗證 World ID proof
      const response = await fetch('/api/verify-worldcoin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...result, action: ACTION }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify World ID proof');
      }
      
      // 使用驗證結果登入
      const signInResult = await signIn('credentials', {
        redirect: false,
        nullifier_hash: result.nullifier_hash,
        worldcoinVerified: true
      });
      
      if (signInResult?.error) {
        setError(`Auth error: ${signInResult.error}`);
        console.error('Sign in error:', signInResult.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during verification';
      setError(errorMessage);
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
      setWidgetOpened(false);
    }
  }, [isDev, isMounted]);

  // 處理登出
  const handleSignOut = useCallback(async () => {
    if (!isMounted) return;
    
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      // 可以選擇重新加載頁面以重置狀態
      // window.location.reload();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isMounted]);

  // 開發模式直接登入
  const devModeLogin = useCallback(async () => {
    if (!isMounted || !isDev) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        nullifier_hash: `dev-user-${Date.now()}`,
        worldcoinVerified: true
      });
      
      if (result?.error) {
        setError(`Dev login error: ${result.error}`);
        console.error('Dev login error:', result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during dev login';
      setError(errorMessage);
      console.error('Dev login error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isDev, isMounted]);

  // 打開 IDKit widget
  const openWidget = useCallback(() => {
    if (!isMounted) return;
    setWidgetOpened(true);
  }, [isMounted]);

  // 將上下文值與客戶端安全機制結合
  const contextValue = {
    isVerified,
    isLoading,
    error,
    openWidget,
    handleVerificationSuccess,
    handleSignOut,
    devModeLogin
  };

  return (
    <WorldIDContext.Provider value={contextValue}>
      {children}
      
      {/* 只在客戶端渲染 IDKitWidget */}
      {isMounted && (
        <IDKitWidget
          app_id={APP_ID.startsWith('app_') ? APP_ID as `app_${string}` : `app_${APP_ID}` as `app_${string}`}
          action={ACTION}
          onSuccess={handleVerificationSuccess}
          verification_level={VerificationLevel.Device}
          handleVerify={(data) => {
            // Required by IDKit but we handle actual verification in onSuccess
            return new Promise<void>((resolve) => {
              resolve();
            });
          }}
          autoClose
        >
          {/* IDKitWidget 需要子元素，但我們通過 openWidget 函數觸發 */}
          {({ open }) => {
            // 當 widgetOpened 為 true 時自動打開
            if (widgetOpened && !isVerified && !isLoading) {
              open();
              // 重置 widgetOpened 以防止多次調用
              setWidgetOpened(false);
            }
            return <div style={{ display: 'none' }} />;
          }}
        </IDKitWidget>
      )}
    </WorldIDContext.Provider>
  );
}

// Custom hook to use World ID context
export const useWorldID = (): WorldIDContextType => {
  const context = useContext(WorldIDContext);
  if (context === undefined) {
    throw new Error('useWorldID must be used within a WorldIDProvider');
  }
  return context;
}
