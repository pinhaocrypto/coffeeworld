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
const ACTION_ID = "coffeeworld-review"; // Or fetch from env var: process.env.NEXT_PUBLIC_WLD_ACTION_NAME || "coffeeworld-review";

// Component to handle MiniKit verification flow
export default function Verify() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMiniKitAvailable, setIsMiniKitAvailable] = useState(false);

  // Log session and status on render
  console.log('[Verify Component Render] Session:', session);
  console.log('[Verify Component Render] Status:', status);

  // Check if MiniKit is available (primarily in World App)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let mounted = true; // Track component mount state

    if (typeof window !== 'undefined') {
      try {
        // Safe check for MiniKit
        const hasMiniKit = typeof window !== 'undefined' && 
                        window.hasOwnProperty('MiniKit') && 
                        // @ts-ignore - MiniKit is injected by World App
                        window.MiniKit && 
                        // @ts-ignore
                        typeof window.MiniKit.isInstalled === 'function';
                        
        if (hasMiniKit) {
          if (mounted) setIsMiniKitAvailable(true);
          return;
        }
        
        // Add delayed check as MiniKit might initialize later
        timeoutId = setTimeout(() => {
          try {
            // Repeat the same safe check
            const miniKitLoaded = typeof window !== 'undefined' && 
                            window.hasOwnProperty('MiniKit') && 
                            // @ts-ignore
                            window.MiniKit && 
                            // @ts-ignore
                            typeof window.MiniKit.isInstalled === 'function';
                            
            if (miniKitLoaded && mounted) {
              console.log('MiniKit detected after delay');
              setIsMiniKitAvailable(true);
            }
          } catch (e) {
            console.error('Error in delayed MiniKit check:', e);
          }
        }, 1500); // Increased delay slightly

      } catch (error) {
        console.error('Error checking MiniKit availability:', error);
        if (mounted) setIsMiniKitAvailable(false);
      }
    }
    
    // Cleanup timeout on unmount
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleVerify = useCallback(async () => {
    // Enhanced safety check for MiniKit availability
    if (
      typeof window === 'undefined' || 
      !window.hasOwnProperty('MiniKit') || 
      // @ts-ignore
      !window.MiniKit || 
      // @ts-ignore
      typeof window.MiniKit.commandsAsync?.verify !== 'function'
    ) {
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
        verification_level: VerificationLevel.Device, // Or Device
      };

      console.log("Starting MiniKit verification with payload:", verifyPayload);

      // Request verification from World App via MiniKit
      // @ts-ignore
      const response = await window.MiniKit.commandsAsync.verify(verifyPayload);
      console.log("MiniKit verification response:", response);

      // Safely extract the finalPayload from response with defensive coding
      if (!response || typeof response !== 'object') {
        throw new Error("Invalid response from MiniKit verification");
      }
      
      const finalPayload = response.finalPayload || response;
      
      // Handle command error with safe checks
      if (!finalPayload || finalPayload.status === "error") {
        console.error("MiniKit command error:", finalPayload);
        setErrorMsg(finalPayload?.message || "Verification failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Safety check for required fields
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
      setErrorMsg(error?.message || "Authentication error. Please try again later.");
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

  const handleFallbackVerify = async () => {
    console.log("MiniKit not available, using fallback verification");
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      // Use NextAuth's signIn directly with worldcoin provider
      const result = await signIn('worldcoin', { 
        // Simulate a verification for development
        redirect: false,
      });
      
      if (result?.error) {
        console.error("Fallback verification failed:", result.error);
        setErrorMsg(`Verification failed: ${result.error}`);
      } else {
        console.log("Fallback verification succeeded");
        window.location.reload(); // Refresh to update session
      }
    } catch (error) {
      console.error("Error during fallback verification:", error);
      setErrorMsg("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  console.log('[Verify Component Before Return] isLoading:', isLoading, 'errorMsg:', errorMsg, 'isMiniKitAvailable:', isMiniKitAvailable);

  // Check if already authenticated regardless of MiniKit availability
  const isAuthenticated = status === 'authenticated' && !!session;

  return (
    <div className="flex flex-col items-end">
      {errorMsg && <div className="text-red-500 text-xs mb-1">Error: {errorMsg}</div>}
      
      {isAuthenticated ? (
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
          className="px-3 py-1 text-sm font-medium text-white bg-amber-700 rounded hover:bg-amber-800 disabled:opacity-50 transition duration-200"
          onClick={isMiniKitAvailable ? handleVerify : handleFallbackVerify}
          disabled={isLoading || status === 'loading'}
        >
          {isLoading ? 'Verifying...' : (status === 'loading' ? 'Loading...' : 'Verify with World ID')}
        </button>
      )}
    </div>
  );
}
