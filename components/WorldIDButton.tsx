"use client"
import { useWorldID } from './WorldIDProvider';
import { useState, useEffect } from 'react';

export default function WorldIDButton() {
  // 使用狀態來跟踪客戶端渲染
  const [isMounted, setIsMounted] = useState(false);

  // 在組件掛載後設置 isMounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 在服務器渲染或組件未掛載時不渲染任何內容
  if (!isMounted) {
    return null;
  }

  // 安全獲取 WorldID context
  let worldIDContext;
  try {
    worldIDContext = useWorldID();
  } catch (error) {
    console.error('Error accessing WorldID context:', error);
    // 返回簡單的備用按鈕
    return (
      <button 
        className="px-3 py-1 text-sm font-medium text-white bg-amber-700 rounded hover:bg-amber-800 disabled:opacity-50 transition duration-200"
      >
        Verify with World ID
      </button>
    );
  }

  // 如果無法安全訪問 context 屬性，使用安全默認值
  const {
    isVerified = false,
    isLoading = false,
    error = null,
    openWidget = () => {},
    handleSignOut = async () => {},
    devModeLogin = async () => {}
  } = worldIDContext || {};

  // 安全檢測環境，避免直接訪問 process.env
  const isDev = typeof window !== 'undefined' && 
    window.location.hostname === 'localhost';

  return (
    <div className="flex flex-col items-end">
      {error && <div className="text-red-500 text-xs mb-1">Error: {error}</div>}
      
      {isVerified ? (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white">Verified</span>
          <button 
            className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
            onClick={handleSignOut}
            disabled={isLoading}
          >
            {isLoading ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      ) : (
        <div className="flex space-x-2">
          <button 
            className="px-3 py-1 text-sm font-medium text-white bg-amber-700 rounded hover:bg-amber-800 disabled:opacity-50 transition duration-200"
            onClick={openWidget}
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify with World ID'}
          </button>
          
          {isDev && (
            <button 
              className="px-3 py-1 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50 transition duration-200"
              onClick={devModeLogin}
              disabled={isLoading}
            >
              Dev Login
            </button>
          )}
        </div>
      )}
    </div>
  );
}
