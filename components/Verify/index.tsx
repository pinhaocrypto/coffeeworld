"use client";
import { useCallback, useState, useEffect } from "react";
import { signIn, signOut, useSession } from 'next-auth/react';

// Types defined locally as MiniKit SDK might have import issues
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
// *** IMPORTANT: Ensure this matches the Action ID in your Worldcoin Developer Portal ***
const ACTION_ID = "coffee-world-auth"; // Or fetch from env var: process.env.NEXT_PUBLIC_WLD_ACTION_NAME || "coffee-world-auth";

// Component to handle MiniKit verification flow
export default function Verify() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMiniKitAvailable, setIsMiniKitAvailable] = useState(false);

  // Check if MiniKit is available (primarily in World App)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (typeof window !== 'undefined') {
      try {
        // @ts-ignore
        const initialCheck = !!(window.MiniKit && typeof window.MiniKit.isInstalled === 'function');
        if (initialCheck) {
          setIsMiniKitAvailable(true);
          return;
        }
        
        // Add delayed check as MiniKit might initialize later
        timeoutId = setTimeout(() => {
          try {
            // @ts-ignore
            const miniKitLoaded = !!(window.MiniKit && typeof window.MiniKit.isInstalled === 'function');
            if (miniKitLoaded) {
              console.log('MiniKit detected after delay');
              setIsMiniKitAvailable(true);
            }
          } catch (e) {
            console.error('Error in delayed MiniKit check:', e);
          }
        }, 1500); // Increased delay slightly

      } catch (error) {
        console.error('Error checking MiniKit availability:', error);
        setIsMiniKitAvailable(false);
      }
    }
    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleVerify = useCallback(async () => {
    // @ts-ignore
    if (typeof window === 'undefined' || !window.MiniKit || typeof window.MiniKit.commandsAsync?.verify !== 'function') {
      console.warn("Tried to invoke 'verify', but MiniKit or command is not available.");
      setErrorMsg("World App integration not available or ready.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Prepare verification payload
      const verifyPayload: VerifyCommandInput = {
        action: ACTION_ID,
        signal: "user-auth-signal", // Example signal
        verification_level: VerificationLevel.Orb, // Or Device
      };

      console.log("Starting MiniKit verification with payload:", verifyPayload);

      // Request verification from World App via MiniKit
      // @ts-ignore
      const response = await window.MiniKit.commandsAsync.verify(verifyPayload);
      console.log("MiniKit verification response:", response);

      // Extract the finalPayload from response
      const { finalPayload } = response;

      // Handle command error
      if (finalPayload.status === "error") {
        console.error("MiniKit command error:", finalPayload);
        setErrorMsg(finalPayload.message || "Verification failed. Please try again.");
        setIsLoading(false);
        return;
      }

      if (!finalPayload.proof || !finalPayload.nullifier_hash || !finalPayload.merkle_root) {
        console.error("MiniKit verification response missing required fields:", finalPayload);
        setErrorMsg("Verification response incomplete.");
        setIsLoading(false);
        return;
      }
      
      console.log("MiniKit verification successful, proceeding to backend:", finalPayload);

      // Verify the proof in the backend
      const verifyResponse = await fetch(`/api/verify-worldcoin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Send data as expected by the backend API
          merkle_root: finalPayload.merkle_root,
          nullifier_hash: finalPayload.nullifier_hash,
          proof: finalPayload.proof,
          verification_level: finalPayload.verification_level || VerificationLevel.Orb // Provide default if missing
        }),
      });

      const verifyData = await verifyResponse.json();
      console.log("Backend verification response:", verifyData);

      if (verifyResponse.ok && verifyData.success) {
        console.log("Backend verification success! Signing in...");

        // Sign in with NextAuth using the verified details
        const signInResult = await signIn('worldcoin', { 
          // Pass necessary details for NextAuth provider
          nullifier_hash: finalPayload.nullifier_hash,
          // Add other fields if your NextAuth provider requires them
          redirect: false, // Handle redirect manually or let page reload
        });

        console.log("Sign in result:", signInResult);

        if (signInResult?.error) {
          setErrorMsg(`Sign-in failed: ${signInResult.error}`);
        } else {
          // Reload to update session state across the app
          window.location.reload();
        }
      } else {
        console.error("Backend verification failed:", verifyData);
        setErrorMsg(verifyData.error || "Backend verification failed.");
      }

    } catch (error) {
      console.error("Error during MiniKit verification process:", error);
      // @ts-ignore
      setErrorMsg(error.message || "Authentication error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed if ACTION_ID is constant

  const handleSignOut = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signOut({ redirect: false });
      window.location.reload(); // Reload to ensure clean state
    } catch (error) {
      console.error('Error during sign out:', error);
      setErrorMsg('Sign out failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render nothing if MiniKit is not available (or show a message)
  if (!isMiniKitAvailable) {
    return <div className="text-xs text-amber-300 p-2">World App features inactive.</div>;
  }

  return (
    <div className="flex flex-col items-end">
      {errorMsg && <div className="text-red-500 text-xs mb-1">Error: {errorMsg}</div>}
      
      {status === 'authenticated' ? (
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
        <button 
          className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleVerify}
          disabled={isLoading || status === 'loading'}
        >
          {isLoading ? 'Verifying...' : (status === 'loading' ? 'Loading...' : 'Verify with World App')}
        </button>
      )}
    </div>
  );
}
