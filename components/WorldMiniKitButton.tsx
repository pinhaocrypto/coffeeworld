"use client";
import { useCallback, useState, useEffect } from "react";
import { signIn, signOut, useSession } from 'next-auth/react';

// Since there appear to be TypeScript issues with imports, 
// we'll access MiniKit via the window object and define types locally
interface VerificationLevel {
  Orb: 'orb';
  Device: 'device';
}

const VerificationLevel = {
  Orb: 'orb',
  Device: 'device'
} as const;

interface ISuccessResult {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string;
}

interface VerifyCommandInput {
  action: string;
  signal?: string;
  verification_level?: string;
}

interface MiniKitVerifyResponse {
  status: string;
  finalPayload: ISuccessResult;
}

// Action ID for Coffee World
const ACTION_ID = "coffee-world-auth";

export default function WorldMiniKitButton() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMiniKitAvailable, setIsMiniKitAvailable] = useState(false);
  
  // Check if MiniKit is available (only in World App)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore - Access MiniKit from window for World App environment
        const isMiniKitInstalled = !!(window.MiniKit && typeof window.MiniKit.isInstalled === 'function' && window.MiniKit.isInstalled());
        console.log('MiniKit available:', isMiniKitInstalled);
        setIsMiniKitAvailable(isMiniKitInstalled);
      } catch (error) {
        console.error('Error checking MiniKit availability:', error);
        setIsMiniKitAvailable(false);
      }
    }
  }, []);

  const handleVerify = useCallback(async () => {
    // @ts-ignore
    if (typeof window === 'undefined' || !window.MiniKit || !window.MiniKit.isInstalled()) {
      console.warn("Tried to invoke 'verify', but MiniKit is not installed.");
      setErrorMsg("World App integration not available");
      return null;
    }

    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      // Prepare verification payload
      const verifyPayload: VerifyCommandInput = {
        action: ACTION_ID,
        signal: "", // Optional
        verification_level: VerificationLevel.Orb,
      };
      
      // Request verification from World App
      // @ts-ignore
      const verifyResponse: MiniKitVerifyResponse = await window.MiniKit.commandsAsync.verify(verifyPayload);

      // Handle command error
      if (verifyResponse.status === "error") {
        console.log("Command error:", verifyResponse);
        setErrorMsg("Verification failed. Please try again.");
        setIsLoading(false);
        return verifyResponse;
      }

      console.log("Verification successful:", verifyResponse);
      
      // Verify the proof in the backend
      const verifyResponseJson = await fetch(`/api/worldcoin/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: verifyResponse.finalPayload,
          action: verifyPayload.action,
          signal: verifyPayload.signal,
        }),
      });

      const verifyResponseJsonData = await verifyResponseJson.json();

      if (verifyResponseJsonData.success) {
        console.log("Backend verification success!");
        
        // Sign in with NextAuth
        await signIn('worldcoin', { 
          proof: verifyResponse.finalPayload.proof,
          nullifier_hash: verifyResponse.finalPayload.nullifier_hash,
          merkle_root: verifyResponse.finalPayload.merkle_root,
          verification_level: verifyResponse.finalPayload.verification_level,
          redirect: false,
        });
        
        // Reload to update session
        window.location.reload();
      } else {
        console.error("Backend verification failed:", verifyResponseJsonData);
        setErrorMsg("Authentication failed. Please try again.");
      }

      return verifyResponseJsonData;
    } catch (error) {
      console.error("Error during verification:", error);
      setErrorMsg("Authentication error. Please try again later.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleSignOut = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      // Clear any stored permission and authentication data
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('locationPermissionGranted');
          localStorage.removeItem('worldcoin_session');
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
      }
      
      // Use redirect: false to prevent client-side errors
      await signOut({ 
        callbackUrl: '/',
        redirect: false
      });
      
      // Force reload to clear state
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
      setErrorMsg('Sign out failed. Please try again.');
      setIsLoading(false);
    }
  };

  // If not in World App environment or MiniKit is not available
  if (!isMiniKitAvailable) {
    return null; // Don't render anything, fall back to IDKit button
  }

  if (session) {
    return (
      <div>
        {errorMsg && <div className="text-red-600 text-xs mb-2">{errorMsg}</div>}
        <div className="text-sm text-white mb-2">
          Signed in as <span className="font-semibold">{session.user?.name || 'Worldcoin User'}</span>
        </div>
        <button 
          className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 focus:outline-none"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          {isLoading ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
    );
  }

  return (
    <div>
      {errorMsg && <div className="text-red-600 text-xs mb-2">{errorMsg}</div>}
      <button
        className="px-4 py-2 text-sm font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 focus:outline-none"
        onClick={handleVerify}
        disabled={isLoading}
      >
        {isLoading ? 'Verifying...' : 'Verify with World ID'}
      </button>
    </div>
  );
}
