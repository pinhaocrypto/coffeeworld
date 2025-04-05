"use client";
import { useState, useCallback, useEffect } from "react";
import { VerificationLevel } from "@worldcoin/idkit";

// Define types directly since the imports are causing issues
interface ISuccessResult {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string;
}

interface VerifyCommandInput {
  action: string;
  signal?: string;
  verification_level?: string; // Default: Orb
}

// Create a mock for testing when not in World App
const createMockResult = () => ({
  proof: "mock-proof-for-testing",
  merkle_root: "mock-merkle-root",
  nullifier_hash: `mock-nullifier-${Date.now()}`,
  verification_level: "orb"
});

export const VerifyBlock = () => {
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if we're in the World App environment
  const isInWorldApp = typeof window !== 'undefined' && 
                      window.MiniKit !== undefined && 
                      typeof window.MiniKit?.isInstalled === 'function' && 
                      window.MiniKit.isInstalled();

  const handleVerify = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Safe check for all MiniKit properties
      const miniKitAvailable = typeof window !== 'undefined' && window.MiniKit !== undefined;
      const isInstalled = miniKitAvailable && typeof window.MiniKit?.isInstalled === 'function' && window.MiniKit.isInstalled();
      const hasCommandsAsync = miniKitAvailable && window.MiniKit?.commandsAsync !== undefined;
      const hasVerifyCommand = hasCommandsAsync && typeof window.MiniKit?.commandsAsync?.verify === 'function';
      
      console.log("MiniKit environment detection:", {
        hasWindow: typeof window !== 'undefined',
        hasMiniKit: miniKitAvailable,
        hasIsInstalled: miniKitAvailable && typeof window.MiniKit?.isInstalled === 'function',
        isInstalled,
        hasCommandsAsync,
        hasVerifyCommand
      });
      
      let result: ISuccessResult;

      if (isInstalled && hasVerifyCommand) {
        // We're in the World App and can use MiniKit
        console.log("Using real MiniKit verify...");
        const verifyPayload = {
          action: "coffee-world-verify",
          signal: "",
          verification_level: "orb"
        };
        
        if (window.MiniKit?.commandsAsync?.verify) {
          const { finalPayload } = await window.MiniKit.commandsAsync.verify(verifyPayload);
          
          if (finalPayload.status === "error") {
            throw new Error(finalPayload.errorMessage || "Error from MiniKit verification");
          }
          
          result = finalPayload;
        } else {
          throw new Error("MiniKit verify method not available despite checks");
        }
      } else {
        // We're not in the World App - use a mock for testing
        console.log("Using mock verification for testing...");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        result = createMockResult();
      }
      
      // Now verify with our backend
      console.log("Sending to backend for verification:", result);
      const verifyResponse = await fetch(`/api/worldcoin/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: result,
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
  }, []);

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">World ID Verification</h2>
      <div className="mb-4">
        <p>
          {isInWorldApp 
            ? "Detected World App environment" 
            : "Not running in World App - will use mock data"}
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
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
