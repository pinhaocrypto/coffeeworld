"use client"; // Required for Next.js

import { ReactNode, createContext, useContext, useState, useEffect } from "react";

// Define the context type for MiniKit status
interface MiniKitContextType {
  isMiniKitInstalled: boolean;
}

const defaultContext: MiniKitContextType = {
  isMiniKitInstalled: false,
};

const MiniKitContext = createContext<MiniKitContextType>(defaultContext);

// Hook to use MiniKit context
export const useMiniKit = () => useContext(MiniKitContext);

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  const [isMiniKitInstalled, setIsMiniKitInstalled] = useState<boolean>(false);

  // Effect to check for MiniKit installation
  useEffect(() => {
    let isMounted = true; // Track mount status for cleanup
    const checkMiniKit = () => {
      try {
        if (typeof window !== 'undefined') {
          // Log the current state of MiniKit for debugging
          console.log("MiniKit environment check in Provider:", {
            windowExists: typeof window !== 'undefined',
            miniKitExists: typeof window.MiniKit !== 'undefined',
            isInstalledFunc: typeof window.MiniKit?.isInstalled,
            commandsAsync: window.MiniKit?.commandsAsync ? Object.keys(window.MiniKit.commandsAsync) : 'undefined'
          });
          
          // Check if MiniKit is installed using optional chaining
          const isInstalled = window.MiniKit?.isInstalled?.() === true;
                           
          console.log("MiniKit installed check in Provider:", isInstalled);
          if (isMounted) {
            setIsMiniKitInstalled(isInstalled);
          }
        }
      } catch (error) {
        console.error("Error checking MiniKit in Provider:", error);
        if (isMounted) {
           setIsMiniKitInstalled(false);
        }
      }
    };

    // Initial check
    checkMiniKit();

    // Optional: Add a small delay check in case MiniKit loads slightly asynchronously
    const timer = setTimeout(checkMiniKit, 500);
    
    // Return cleanup function
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []); // Run only once on mount
  
  // Provide context values
  const contextValue: MiniKitContextType = {
    isMiniKitInstalled
  };

  return (
    <MiniKitContext.Provider value={contextValue}>
      {children}
    </MiniKitContext.Provider>
  );
}
