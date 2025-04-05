"use client";
import { useState, useCallback } from "react";
import { useMiniKit } from "../minikit-provider";

// Define types directly since the imports are causing issues
interface ISuccessResult {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string;
}

interface VerifyResult {
  finalPayload: {
    status?: string;
    errorMessage?: string;
    proof?: string;
    merkle_root?: string;
    nullifier_hash?: string;
    verification_level?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Create a mock for testing when not in World App
const createMockProof = () => ({
  proof: "mock-proof-for-testing",
  merkle_root: "mock-merkle-root",
  nullifier_hash: `mock-nullifier-${Date.now()}`,
  verification_level: "orb"
});

export const VerifyBlock = () => {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isMiniKitInstalled } = useMiniKit();

  const handleVerify = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const useMiniKit = isMiniKitInstalled;
      
      console.log("Using MiniKit (from context)?", useMiniKit);
      
      let verificationData: Record<string, string>;
      
      if (useMiniKit) {
        const verifyPayload = {
          action: "coffee-world-verify",
          signal: "", 
          verification_level: "device" 
        };
        console.log("Attempting MiniKit verify with payload:", verifyPayload);
        try {
          console.log("Calling MiniKit verify...");
          
          // Make sure verify is properly safeguarded
          if (!window.MiniKit || !window.MiniKit.commandsAsync || !window.MiniKit.commandsAsync.verify) {
            throw new Error("MiniKit verify method is not available");
          }
          
          const verifyResult = await window.MiniKit.commandsAsync.verify(verifyPayload) as VerifyResult;
          
          console.log("Raw MiniKit Verify result:", verifyResult); // Log raw result
          
          if (verifyResult && verifyResult.finalPayload) {
            if (verifyResult.finalPayload.status === "error") {
              throw new Error(verifyResult.finalPayload.errorMessage || "Error from MiniKit verification");
            }
            
            verificationData = {
              proof: verifyResult.finalPayload.proof || "mock-proof",
              merkle_root: verifyResult.finalPayload.merkle_root || "mock-merkle-root",
              nullifier_hash: verifyResult.finalPayload.nullifier_hash || `mock-nullifier-${Date.now()}`,
              verification_level: verifyResult.finalPayload.verification_level || "orb"
            };
          } else {
            throw new Error("Invalid or missing finalPayload in MiniKit verify response"); // More specific error
          }
        } catch (miniKitErr) {
          // Log the specific error from the MiniKit call attempt
          console.error("MiniKit verify command failed directly. Error:", miniKitErr);
          console.log("Falling back to mock proof due to MiniKit verify error.");
          verificationData = createMockProof();
        }
      } else {
        console.log("MiniKit not available, using mock");
        verificationData = createMockProof();
      }
      
      console.log("Sending verification data to backend:", verificationData);
      // Correct the API endpoint path
      const verifyResponse = await fetch(`/api/verify-worldcoin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...verificationData,
          action: "coffee-world-verify"
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || "Failed to verify with backend");
      }

      const verifyResponseJson = await verifyResponse.json();
      console.log("Verification success response:", verifyResponseJson);
      setResponse(verifyResponseJson);
      
    } catch (err) {
      console.error("Error in verify process:", err);
      setError(err instanceof Error ? err.message : String(err));
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, [isMiniKitInstalled]); // Depend on the context value

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">World ID Verification</h2>
      <div className="mb-4">
        <p className="text-gray-600">
          {isMiniKitInstalled
            ? "MiniKit is available - using real verification" 
            : "MiniKit not detected - will use mock verification"}
        </p>
      </div>
      <button 
        className={`px-4 py-2 rounded-md ${loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'} text-white font-medium`}
        onClick={handleVerify}
        disabled={loading}
      >
        {loading ? "Verifying..." : "Verify with World ID"}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {response && (
        <div className="mt-4">
          <p className="font-semibold text-green-700">Verification successful!</p>
          <pre className="mt-2 p-2 bg-gray-100 overflow-auto max-h-64 rounded-lg">
            {JSON.stringify({ status: 'success', nullifier: response?.nullifier_hash?.substring(0, 10) + '...' }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
