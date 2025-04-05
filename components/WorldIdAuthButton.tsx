import { useEffect, useState } from 'react';
import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';
import { signIn } from 'next-auth/react';
import { useSession } from 'next-auth/react';

// Mock structure for World App credential that matches ISuccessResult
interface WorldAppCredential {
  credential_type: string;
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: VerificationLevel | string;
}

export default function WorldIdAuthButton() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  
  // Handle client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if running as a Mini App inside World App
  const isInWorldApp = mounted && typeof window !== 'undefined' && 
    (window.location.hostname.includes('worldcoin.org') || 
     window.navigator.userAgent.includes('WorldApp') ||
     !!window.parent && window.parent !== window);

  const handleVerify = async (proof: ISuccessResult) => {
    // Handle successful verification by signing in with credentials
    await signIn('credentials', {
      proof: JSON.stringify(proof),
      redirect: false
    });
  };

  if (!mounted) return null;

  if (session) {
    return (
      <button 
        className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 focus:outline-none"
        onClick={() => signIn('credentials', { action: 'logout', redirect: false })}
      >
        Sign Out
      </button>
    );
  }

  return (
    <div className="flex items-center">
      {isInWorldApp ? (
        // Special streamlined UI for World App users
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 focus:outline-none"
          onClick={() => {
            // Create a mock credential that satisfies the ISuccessResult interface
            const worldAppCredential: WorldAppCredential & ISuccessResult = {
              credential_type: 'orb',
              proof: 'world-app-mock-proof',
              merkle_root: 'world-app-mock-root',
              nullifier_hash: 'world-app-mock-hash',
              verification_level: VerificationLevel.Orb
            };
            handleVerify(worldAppCredential);
          }}
        >
          Verify with World ID
        </button>
      ) : (
        // Regular IDKit widget for web users
        <IDKitWidget
          app_id={process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID as `app_${string}` || "app_6bd93d77f6ac5663b82b4a4894eb3417"}
          action="coffee-world-login"
          onSuccess={handleVerify}
          verification_level={VerificationLevel.Device}
          handleVerify={() => Promise.resolve()}
        >
          {({ open }) => (
            <button 
              className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 focus:outline-none"
              onClick={open}
            >
              Verify with World ID
            </button>
          )}
        </IDKitWidget>
      )}
    </div>
  );
}
