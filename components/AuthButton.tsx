import { signIn, signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useMinikit, WalletAuthInput } from './minikit-provider';
import { generateMockWorldcoinProof } from '../utils/worldcoin';

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized, isInstalled, walletAuth, walletAddress } = useMinikit();

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Starting Worldcoin authentication...');
      console.log('MiniKit initialized:', isInitialized);
      console.log('MiniKit installed:', isInstalled);
      
      if (isInitialized && isInstalled) {
        // Try using real Worldcoin wallet auth
        console.log('Attempting to use MiniKit wallet auth');
        
        try {
          // Generate a random nonce - in a real app, get this from server for security
          const nonce = Math.random().toString(36).substring(2, 15);
          
          // Define the wallet auth parameters
          const authParams: WalletAuthInput = {
            nonce: nonce,
            expirationTime: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
            statement: 'Sign in to Coffee Finder',
          };
          
          const response = await walletAuth(authParams);
          console.log('Wallet auth response:', response);
          
          if (response.finalPayload.status === 'success') {
            const successPayload = response.finalPayload;
            console.log('Successful wallet auth, signing in with NextAuth');
            console.log('Wallet address:', walletAddress);
            
            // In a real app, you would verify the signature on the server side
            // Here, we're just passing the data to NextAuth
            await signIn('worldcoin', { 
              // We're still using the NextAuth Worldcoin provider, but with wallet auth data
              // Our mock implementation in nextauth.js should handle this
              address: successPayload.address,
              signature: successPayload.signature,
              message: successPayload.message,
              callbackUrl: '/' 
            });
            return;
          } else {
            console.warn('Wallet auth failed, falling back to mock proof', response);
            setError('Worldcoin wallet authentication failed. Using mock authentication instead.');
          }
        } catch (authError) {
          console.error('Error with wallet auth:', authError);
          setError('Error connecting to Worldcoin wallet. Using mock authentication instead.');
        }
      } else {
        console.log('MiniKit not initialized or installed');
        setError('Worldcoin not available. Using mock authentication instead.');
      }
      
      // Fallback to mock proof if MiniKit failed or is not initialized/installed
      console.log('Using mock Worldcoin proof as fallback');
      const mockProof = generateMockWorldcoinProof();
      
      await signIn('worldcoin', { 
        proof: mockProof.proof,
        nullifier_hash: mockProof.nullifier_hash,
        merkle_root: mockProof.merkle_root,
        callbackUrl: '/' 
      });
    } catch (error) {
      console.error('Error during sign in:', error);
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
      <div className="flex flex-col items-center space-y-3">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Verified with Worldcoin</p>
              <p className="text-sm text-gray-500">Welcome, {session.user?.name || 'User'}</p>
              {walletAddress && (
                <p className="text-xs text-gray-400">Wallet: {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}</p>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={handleSignOut}
          disabled={isLoading}
          className="btn btn-secondary"
        >
          {isLoading ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md text-sm mb-2">
          {error}
        </div>
      )}
      <button 
        onClick={handleSignIn}
        disabled={isLoading}
        className="btn btn-primary"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting...
          </>
        ) : (
          <>
            <svg className="mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Login with Worldcoin
          </>
        )}
      </button>
    </div>
  );
}
