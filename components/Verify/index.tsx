"use client";
// Fix imports to match actual export names
import { VerificationLevel } from "@worldcoin/idkit";
import { useState, useCallback } from "react";

// Define types directly since the imports are causing issues
interface ISuccessResult {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string;
}

interface MiniAppVerifyActionErrorPayload {
  status: string;
  errorMessage?: string;
}

interface IVerifyResponse {
  status: string;
  [key: string]: any;
}

export type VerifyCommandInput = {
  action: string;
  signal?: string;
  verification_level?: string; // Default: Orb
};

const verifyPayload: VerifyCommandInput = {
  action: "test-action", // This is your action ID from the Developer Portal
  signal: "",
  verification_level: "orb", // Orb | Device
};

export const VerifyBlock = () => {
  const [handleVerifyResponse, setHandleVerifyResponse] = useState<
    MiniAppVerifyActionErrorPayload | IVerifyResponse | null
  >(null);

  const handleVerify = useCallback(async () => {
    try {
      // Access MiniKit through the window object
      if (!window.MiniKit || !window.MiniKit.isInstalled()) {
        console.warn("Tried to invoke 'verify', but MiniKit is not installed.");
        setHandleVerifyResponse({
          status: "error",
          errorMessage: "MiniKit is not installed"
        });
        return null;
      }

      // Check if commandsAsync exists
      if (!window.MiniKit.commandsAsync) {
        console.warn("MiniKit is installed but commandsAsync is not available");
        setHandleVerifyResponse({
          status: "error",
          errorMessage: "MiniKit commandsAsync not available"
        });
        return null;
      }

      // Check if verify method exists
      if (!window.MiniKit.commandsAsync.verify) {
        console.warn("MiniKit is installed but verify method is not available");
        setHandleVerifyResponse({
          status: "error",
          errorMessage: "MiniKit verify method not available"
        });
        return null;
      }

      const { finalPayload } = await window.MiniKit.commandsAsync.verify(verifyPayload);

      // no need to verify if command errored
      if (finalPayload.status === "error") {
        console.log("Command error");
        console.log(finalPayload);

        setHandleVerifyResponse(finalPayload);
        return finalPayload;
      }

      // Verify the proof in the backend
      const verifyResponse = await fetch(`/api/worldcoin/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: finalPayload as ISuccessResult, // Parses only the fields we need to verify
          action: verifyPayload.action,
          signal: verifyPayload.signal, // Optional
        }),
      });

      // TODO: Handle Success!
      const verifyResponseJson = await verifyResponse.json();

      if (verifyResponseJson.status === 200 || verifyResponseJson.success) {
        console.log("Verification success!");
        console.log(finalPayload);
      }

      setHandleVerifyResponse(verifyResponseJson);
      return verifyResponseJson;
    } catch (error) {
      console.error("Error in verify process:", error);
      setHandleVerifyResponse({
        status: "error",
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }, []);

  return (
    <div>
      <h1>Verify Block</h1>
      <button className="bg-green-500 p-4" onClick={handleVerify}>
        Test Verify
      </button>
      <pre className="mt-4 p-2 bg-gray-100 overflow-auto max-h-64">
        {handleVerifyResponse ? JSON.stringify(handleVerifyResponse, null, 2) : "No response yet"}
      </pre>
    </div>
  );
};
