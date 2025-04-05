import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDevLogin, setShowDevLogin] = useState(false);
  const [username, setUsername] = useState('');

  const handleDevSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await signIn('development', { 
        username: username || 'dev-user',
        callbackUrl: '/' 
      });
    } catch (error) {
      console.error('Error during dev sign in:', error);
      setError('Failed to authenticate. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    
    try {
      // Clear any stored permission and authentication data
      if (typeof window !== 'undefined') {
        // Clear location permission
        localStorage.removeItem('locationPermissionGranted');
        
        // Clear any other auth-related storage
        localStorage.removeItem('worldcoin_session');
      }
      
      // Use callbackUrl and redirect: false to prevent client-side errors
      await signOut({ 
        callbackUrl: '/',
        redirect: false
      });
      
      // Force reload if needed to clear state
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
      setIsLoading(false);
    }
  };

  // Reset loading state when session status changes
  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <button disabled className="btn btn-primary opacity-75">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading...
      </button>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <span className="font-medium">Signed in as </span>
          <span className="font-bold">{session.user?.name}</span>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className="btn btn-outline"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing out...
            </>
          ) : (
            'Sign out'
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="text-sm text-red-600 mb-2">
          {error}
        </div>
      )}
      
      {showDevLogin ? (
        <form onSubmit={handleDevSignIn} className="flex flex-col gap-2">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Developer username"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Signing in...' : 'Sign in (Dev)'}
            </button>
            <button
              type="button"
              onClick={() => setShowDevLogin(false)}
              className="btn btn-outline"
            >
              Back
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setShowDevLogin(true)}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            Developer Login
          </button>
        </div>
      )}
      
    </div>
  );
}
