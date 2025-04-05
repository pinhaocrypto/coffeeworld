"use client";

import { ReactNode, useState, createContext, useContext } from "react";
import { IDKitWidget, ISuccessResult, VerificationLevel } from "@worldcoin/idkit";
import { signIn } from "next-auth/react";

// This provider will now primarily be responsible for housing the IDKitWidget 
// and handling the verification flow.
// Define the type for the open function manually
type OpenIDKitFunction = () => void;

// Context to share the IDKitWidget open function
interface WorldIdContextType {
  open?: OpenIDKitFunction; // Use the manually defined type
  isLoading: boolean;
  errorMsg: string | null;
}

const WorldIdContext = createContext<WorldIdContextType>({ 
  isLoading: false, 
  errorMsg: null 
});

export const useWorldId = () => useContext(WorldIdContext);

// Rename provider for clarity
export default function WorldIdProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // State to hold the open function from the widget
  const [openFunc, setOpenFunc] = useState<OpenIDKitFunction | undefined>(undefined); // Use the manually defined type

  const handleVerify = async (proof: ISuccessResult) => {
    setIsLoading(true);
    setErrorMsg(null);
    console.log("IDKit proof received:", proof);

    try {
      // --- Step 1: Backend Verification --- 
      console.log("Sending proof to backend for verification...");
      const response = await fetch('/api/verify-worldcoin', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: proof, 
          action: process.env.NEXT_PUBLIC_WLD_ACTION_NAME || "coffee-world-auth",
          signal: "user-auth" // Example signal for authentication
        }), 
      });

      console.log("Backend verification response status:", response.status);
      const verifyResult = await response.json();
      console.log('Backend verification result:', verifyResult);
      
      if (!response.ok || !verifyResult.success) {
        console.error('Backend verification failed:', verifyResult);
        setErrorMsg(verifyResult.error || 'Backend verification failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // --- Step 2: Sign In with NextAuth --- 
      console.log("Backend verification successful. Signing in...");
      // Use the verified nullifier_hash (or other data returned) for sign-in
      const signInResponse = await signIn('worldcoin', { 
        redirect: false, // Prevent page reload
        nullifier_hash: proof.nullifier_hash, // Send nullifier to NextAuth provider
        // Add any other necessary fields your NextAuth provider expects
      });

      if (signInResponse?.error) {
        console.error("NextAuth sign-in failed:", signInResponse.error);
        setErrorMsg(`Sign-in failed: ${signInResponse.error}`);
      } else if (signInResponse?.ok) {
        console.log("NextAuth sign-in successful!");
        // Session update will be handled automatically by useSession hook
      } else {
        console.warn("Sign-in response status unknown:", signInResponse);
        setErrorMsg("Sign-in process completed with unknown status.");
      }

    } catch (error) {
      console.error("Error during verification/sign-in:", error);
      setErrorMsg(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Get the Worldcoin App ID securely
  const getAppId = () => {
    const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
    if (appId && appId.startsWith('app_')) {
      return appId as `app_${string}`;
    }
    // Fallback to a default staging/dev ID if not set
    console.warn("NEXT_PUBLIC_WORLDCOIN_APP_ID not set or invalid, using default staging ID.");
    return "app_staging_6bd93d77f6ac5663b82b4a4894eb3417" as `app_${string}`;
  };

  return (
    <WorldIdContext.Provider value={{ open: openFunc, isLoading, errorMsg }}>
      {/* Render children immediately */}
      {children}

      {/* IDKitWidget is included but initially hidden or controlled by a button elsewhere */}
      {/* The actual button to trigger 'open' will be in WorldIdAuthButton */}
      <IDKitWidget
        app_id={getAppId()} 
        action={process.env.NEXT_PUBLIC_WLD_ACTION_NAME || "coffee-world-auth"}
        signal="user-auth" // Match the signal sent to the backend
        onSuccess={handleVerify} // Use the combined verification + sign-in handler
        // handleVerify={handleVerify} // Deprecated prop, use onSuccess
        verification_level={VerificationLevel.Orb} // Or Device, depending on requirement
        // Other props as needed
      >
        {({ open }: { open: OpenIDKitFunction }) => { // Add type annotation here
          // Set the open function in state when the widget provides it
          if (open && !openFunc) {
            setOpenFunc(() => open); // Store the function
          }
          // Widget itself doesn't render anything visible here
          return <></>;
        }}
      </IDKitWidget>

      {/* Remove global loading/error display from here, handle in AuthButton or elsewhere */}
      {/* {isLoading && <p>Verifying...</p>} */}
      {/* {errorMsg && <p style={{ color: 'red' }}>Error: {errorMsg}</p>} */}
    </WorldIdContext.Provider>
  );
}
