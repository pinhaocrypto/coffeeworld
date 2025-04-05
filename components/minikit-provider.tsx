"use client"; // Required for Next.js

import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { IDKitWidget, VerificationLevel, ISuccessResult } from "@worldcoin/idkit";

// Define the context type for our Worldcoin integration
interface WorldcoinContextType {
  isVerified: boolean;
  credential: ISuccessResult | null;
  setCredential: (credential: ISuccessResult | null) => void;
  isMiniKitInstalled: boolean;
}

const defaultContext: WorldcoinContextType = {
  isVerified: false,
  credential: null,
  setCredential: () => {},
  isMiniKitInstalled: false
};

const WorldcoinContext = createContext<WorldcoinContextType>(defaultContext);

// Hook to use Worldcoin context throughout the app
export const useWorldcoin = () => useContext(WorldcoinContext);

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  const [credential, setCredential] = useState<ISuccessResult | null>(null);
  const [isMiniKitInstalled, setIsMiniKitInstalled] = useState<boolean>(false);
  
  // Simplified approach - don't try to load MiniKit dynamically
  // Instead, let's just check if it's available and log diagnostics
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // Log the current state of MiniKit for debugging
        console.log("MiniKit environment check:", {
          windowExists: typeof window !== 'undefined',
          miniKitExists: typeof window.MiniKit !== 'undefined',
          isInstalled: window.MiniKit && typeof window.MiniKit.isInstalled === 'function' 
                      ? window.MiniKit.isInstalled() 
                      : false,
          commandsAsync: window.MiniKit && window.MiniKit.commandsAsync 
                        ? Object.keys(window.MiniKit.commandsAsync) 
                        : 'undefined'
        });
        
        // Check if MiniKit is installed
        const isInstalled = window.MiniKit && 
                           typeof window.MiniKit.isInstalled === 'function' && 
                           window.MiniKit.isInstalled();
                           
        console.log("MiniKit installed check:", isInstalled);
        setIsMiniKitInstalled(!!isInstalled);
      }
    } catch (error) {
      console.error("Error checking MiniKit:", error);
    }
    
    // Return cleanup function
    return () => {
      // Nothing to clean up
    };
  }, []);
  
  // Handle successful verification
  const handleVerify = (credential: ISuccessResult) => {
    console.log("Worldcoin verification successful:", credential);
    setCredential(credential);
  };

  // Provide context values for components to consume
  const contextValue: WorldcoinContextType = {
    isVerified: !!credential,
    credential,
    setCredential,
    isMiniKitInstalled
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
