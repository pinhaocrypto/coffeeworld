import { useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function DevModeAuth() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  
  // 只在開發環境中啟用
  const isDev = typeof process !== 'undefined' && 
                process.env.NODE_ENV !== 'production';
  
  // 如果不是開發環境或者會話還在加載中，不渲染任何內容
  if (!isDev || status === 'loading') return null;
  
  const isAuthenticated = !!session?.user?.worldcoinVerified;

  const handleDevLogin = async () => {
    setIsLoading(true);
    try {
      // 使用 development provider 直接登入
      const result = await signIn('development', {
        redirect: false,
        username: 'DevUser'
      });
      
      if (result?.error) {
        console.error("Dev login failed:", result.error);
      } else {
        console.log("Dev login success!");
        // 強制重新加載以更新會話
        window.location.reload();
      }
    } catch (error) {
      console.error("Error during dev login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      window.location.reload();
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return isAuthenticated ? (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
    >
      {isLoading ? 'Signing Out...' : 'Dev Sign Out'}
    </button>
  ) : (
    <button
      onClick={handleDevLogin}
      disabled={isLoading}
      className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
    >
      {isLoading ? 'Logging in...' : ' Dev Mode Login'}
    </button>
  );
}
