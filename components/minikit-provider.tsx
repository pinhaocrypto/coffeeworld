"use client"; // Required for Next.js

import { ReactNode, createContext, useContext, useState } from "react";
import { IDKitWidget, VerificationLevel, ISuccessResult } from "@worldcoin/idkit";

// Define the context type for our Worldcoin integration
interface WorldcoinContextType {
  isVerified: boolean;
  credential: ISuccessResult | null;
  setCredential: (credential: ISuccessResult | null) => void;
}

const defaultContext: WorldcoinContextType = {
  isVerified: false,
  credential: null,
  setCredential: () => {}
};

const WorldcoinContext = createContext<WorldcoinContextType>(defaultContext);

// Hook to use Worldcoin context throughout the app
export const useWorldcoin = () => useContext(WorldcoinContext);

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  const [credential, setCredential] = useState<ISuccessResult | null>(null);
  
  // Handle successful verification
  const handleVerify = (credential: ISuccessResult) => {
    console.log("Worldcoin verification successful:", credential);
    setCredential(credential);
  };

  // Provide context values for components to consume
  const contextValue: WorldcoinContextType = {
    isVerified: !!credential,
    credential,
    setCredential
  };

  return (
    <WorldcoinContext.Provider value={contextValue}>
      <IDKitWidget
        app_id={process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID as `app_${string}` || "app_6bd93d77f6ac5663b82b4a4894eb3417"}
        action="coffee-world-auth"
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
      {children}
    </WorldcoinContext.Provider>
  );
}
