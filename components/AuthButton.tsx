import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { IDKitWidget, ISuccessResult } from '@worldcoin/idkit';
import { formatProofForAuth } from '../utils/worldcoin';

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDevLogin, setShowDevLogin] = useState(false);
  const [username, setUsername] = useState('');

  const handleSignIn = async (result: ISuccessResult) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Worldcoin verification successful:', result);
      
      // Format the proof for NextAuth
      const worldcoinProof = formatProofForAuth(result);
      
      // Sign in with NextAuth using the Worldcoin provider
      await signIn('worldcoin', { 
        proof: worldcoinProof.proof,
        nullifier_hash: worldcoinProof.nullifier_hash,
        merkle_root: worldcoinProof.merkle_root,
        verification_level: worldcoinProof.verification_level,
        callbackUrl: '/' 
      });
    } catch (error) {
      console.error('Error during sign in:', error);
      setError('Failed to authenticate. Please try again.');
      setIsLoading(false);
    }
  };

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
    await signOut({ callbackUrl: '/' });
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
          <IDKitWidget
            app_id={process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID ?? "app_staging_d89b3a6453cf9bb7eb9902f62e5d2639"}
            action="login"
            onSuccess={handleSignIn}
            verification_level="orb"
            {...{} as any}
          >
            {({ open }) => (
              <button
                onClick={open}
                disabled={isLoading}
                className="btn btn-primary flex items-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z" fill="white"/>
                      <path d="M20 36.6667C29.2048 36.6667 36.6667 29.2048 36.6667 20C36.6667 10.7952 29.2048 3.33334 20 3.33334C10.7953 3.33334 3.33337 10.7952 3.33337 20C3.33337 29.2048 10.7953 36.6667 20 36.6667Z" fill="currentColor"/>
                      <path d="M20 28.3333C24.6024 28.3333 28.3334 24.6024 28.3334 20C28.3334 15.3976 24.6024 11.6667 20 11.6667C15.3976 11.6667 11.6667 15.3976 11.6667 20C11.6667 24.6024 15.3976 28.3333 20 28.3333Z" fill="white"/>
                    </svg>
                    Sign in with Worldcoin
                  </>
                )}
              </button>
            )}
          </IDKitWidget>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowDevLogin(true)}
              className="text-sm text-gray-500 hover:text-amber-600 underline"
            >
              Use development login (for testing)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
