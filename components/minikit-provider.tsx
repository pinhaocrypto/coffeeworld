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
  
  // Add a script tag for MiniKit instead of trying to import it
  useEffect(() => {
    try {
      // Check if we need to add a script tag
      if (typeof window !== 'undefined' && !window.MiniKit) {
        console.log("Adding MiniKit script...");
        
        // Create a script tag to load MiniKit
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@worldcoin/minikit-js@latest/+esm';
        script.type = 'module';
        script.async = true;
        
        script.onload = () => {
          console.log("MiniKit script loaded");
          
          // Initialize MiniKit if it's available
          if (window.MiniKit && typeof window.MiniKit.install === 'function') {
            const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
            console.log("Installing MiniKit with app ID:", appId);
            window.MiniKit.install(appId);
            
            // Check installation after a short delay
            setTimeout(() => {
              const isInstalled = window.MiniKit && 
                                 typeof window.MiniKit.isInstalled === 'function' && 
                                 window.MiniKit.isInstalled();
              console.log("MiniKit installed:", isInstalled);
              setIsMiniKitInstalled(!!isInstalled);
            }, 1000);
          }
        };
        
        script.onerror = (err) => {
          console.error("Error loading MiniKit script:", err);
        };
        
        document.head.appendChild(script);
      } else if (window.MiniKit) {
        // MiniKit is already available
        console.log("MiniKit already available in window");
        const isInstalled = typeof window.MiniKit.isInstalled === 'function' && 
                           window.MiniKit.isInstalled();
        setIsMiniKitInstalled(isInstalled);
      }
    } catch (error) {
      console.error("Error initializing MiniKit:", error);
    }
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
