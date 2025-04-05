"use client";
import { useCallback, useState, useEffect } from "react";
import { signIn, signOut, useSession } from 'next-auth/react';

// Since there are TypeScript issues with imports, we define types locally
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
  status?: string;
}

interface VerifyCommandInput {
  action: string;
  signal?: string;
  verification_level?: string;
}

// Action ID for Coffee World - should match your Developer Portal
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
        // A more accurate check for World App environment
        const inWorldApp = (
          window.location.hostname.includes('worldcoin.org') || 
          window.navigator.userAgent.includes('World') || 
          // Also check referrer if coming from World domains
          (window.document.referrer && window.document.referrer.includes('worldcoin.org')) ||
          // @ts-ignore - Only check parent if we're in an iframe
          (window !== window.top && window.parent && window.parent !== window) ||
          // @ts-ignore - Check for MiniKit API
          (window.MiniKit && typeof window.MiniKit.isInstalled === 'function')
        );
        
        // Add delayed check for MiniKit which might load after component mounts
        if (!inWorldApp) {
          setTimeout(() => {
            try {
              // @ts-ignore
              const miniKitLoaded = !!(window.MiniKit && typeof window.MiniKit.isInstalled === 'function');
              if (miniKitLoaded && !isMiniKitAvailable) {
                console.log('MiniKit detected after delay');
                setIsMiniKitAvailable(true);
              }
            } catch (e) {
              console.error('Error in delayed MiniKit check:', e);
            }
          }, 1000);
        }
        
        // For debugging
        console.log('World App environment detected:', inWorldApp);
        console.log('User agent:', window.navigator.userAgent);
        
        // Only set to true if we're really in World App
        setIsMiniKitAvailable(!!inWorldApp);
      } catch (error) {
        console.error('Error checking MiniKit availability:', error);
        setIsMiniKitAvailable(false);
      }
    }
  }, [isMiniKitAvailable]);
  
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
      // Prepare verification payload - follow MiniKit docs
      const verifyPayload: VerifyCommandInput = {
        action: ACTION_ID,
        signal: "default-signal", // Optional 
        verification_level: VerificationLevel.Device,
      };
      
      console.log("Starting World App verification with payload:", verifyPayload);
      
      // Request verification from World App
      // @ts-ignore
      const response = await window.MiniKit.commandsAsync.verify(verifyPayload);
      console.log("World App verification response:", response);
      
      // Extract the finalPayload from response
      const { finalPayload } = response;

      // Handle command error
      if (finalPayload.status === "error") {
        console.error("Command error:", finalPayload);
        setErrorMsg("Verification failed. Please try again.");
        setIsLoading(false);
        return finalPayload;
      }

      console.log("Verification successful:", finalPayload);
      
      // Verify the proof in the backend
      const verifyResponseJson = await fetch(`/api/verify-worldcoin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Direct format expected by the API
          merkle_root: finalPayload.merkle_root,
          nullifier_hash: finalPayload.nullifier_hash,
          proof: finalPayload.proof,
          verification_level: finalPayload.verification_level
        }),
      });

      const verifyData = await verifyResponseJson.json();
      
      console.log("Backend verification response:", verifyData);

      if (verifyData.success) {
        console.log("Backend verification success!");
        
        // Sign in with NextAuth
        const signInResult = await signIn('worldcoin', { 
          proof: finalPayload.proof,
          nullifier_hash: finalPayload.nullifier_hash,
          merkle_root: finalPayload.merkle_root,
          verification_level: finalPayload.verification_level,
          redirect: false,
        });
        
        console.log("Sign in result:", signInResult);
        
        // Reload to update session
        window.location.reload();
      } else {
        console.error("Backend verification failed:", verifyData);
        setErrorMsg("Authentication failed. Please try again.");
      }

      return verifyData;
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
      // Clear any stored authentication data
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
