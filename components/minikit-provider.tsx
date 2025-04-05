"use client"; // Required for Next.js

import { ReactNode, useEffect, useState, createContext, useContext } from "react";

// Define types based on Worldcoin documentation
export interface WalletAuthInput {
  nonce: string;
  expirationTime?: Date;
  statement?: string;
  requestId?: string;
  notBefore?: Date;
}

export interface WalletAuthSuccessPayload {
  status: 'success';
  message: string;
  signature: string;
  address: string;
  version: number;
}

export interface WalletAuthErrorPayload {
  status: 'error';
  error: string;
}

export type WalletAuthResult = {
  commandPayload?: any;
  finalPayload: WalletAuthSuccessPayload | WalletAuthErrorPayload;
};

// Define a context to track MiniKit initialization and share methods
interface MinikitContextType {
  isInitialized: boolean;
  isInstalled: boolean;
  walletAuth: (params: WalletAuthInput) => Promise<WalletAuthResult>;
  walletAddress: string | null;
}

const defaultContext: MinikitContextType = {
  isInitialized: false,
  isInstalled: false,
  walletAuth: async () => ({ 
    finalPayload: { 
      status: 'error', 
      error: 'MiniKit not initialized' 
    } 
  }),
  walletAddress: null
};

const MinikitContext = createContext<MinikitContextType>(defaultContext);

// Hook to use MiniKit throughout the app
export const useMinikit = () => useContext(MinikitContext);

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [minikit, setMinikit] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const initializeMinikit = async () => {
      try {
        // Dynamically import MiniKit to avoid SSR issues
        const minikitModule = await import('@worldcoin/minikit-js');
        console.log('MiniKit module loaded:', Object.keys(minikitModule));
        
        // Since TypeScript doesn't know the structure, use any type
        const moduleAny = minikitModule as any;
        
        // Store the raw module for later use
        setMinikit(moduleAny);
        
        // Check if MiniKit is installed by finding the isInstalled method
        let isInstalledFn;
        
        if (moduleAny.default?.isInstalled) {
          isInstalledFn = moduleAny.default.isInstalled;
        } else if (moduleAny.isInstalled) {
          isInstalledFn = moduleAny.isInstalled;
        } else if (moduleAny.MiniKit?.isInstalled) {
          isInstalledFn = moduleAny.MiniKit.isInstalled;
        } else if (moduleAny.default?.MiniKit?.isInstalled) {
          isInstalledFn = moduleAny.default.MiniKit.isInstalled;
        } else if (moduleAny.commandsAsync?.isInstalled) {
          isInstalledFn = moduleAny.commandsAsync.isInstalled;
        } else if (moduleAny.default?.commandsAsync?.isInstalled) {
          isInstalledFn = moduleAny.default.commandsAsync.isInstalled;
        }
        
        const installed = typeof isInstalledFn === 'function' ? 
                          isInstalledFn() : false;
                          
        setIsInstalled(installed);
        console.log('MiniKit installed:', installed);
        
        // Try to get the wallet address if available
        if (moduleAny.walletAddress) {
          setWalletAddress(moduleAny.walletAddress);
        } else if (moduleAny.MiniKit?.walletAddress) {
          setWalletAddress(moduleAny.MiniKit.walletAddress);
        } else if (moduleAny.default?.walletAddress) {
          setWalletAddress(moduleAny.default.walletAddress);
        } else if (moduleAny.default?.MiniKit?.walletAddress) {
          setWalletAddress(moduleAny.default.MiniKit.walletAddress);
        } else if (window?.MiniKit?.walletAddress) {
          setWalletAddress(window.MiniKit.walletAddress);
        }
        
        // Consider initialized if we have a reference to the module
        setIsInitialized(true);
        console.log('MiniKit initialization successful');
      } catch (error) {
        console.error('Error initializing MiniKit:', error);
      }
    };

    initializeMinikit();
  }, []);

  // Update wallet address if it changes
  useEffect(() => {
    const checkWalletAddress = () => {
      if (!minikit) return;
      
      let address = null;
      if (minikit.walletAddress) {
        address = minikit.walletAddress;
      } else if (minikit.MiniKit?.walletAddress) {
        address = minikit.MiniKit.walletAddress;
      } else if (minikit.default?.walletAddress) {
        address = minikit.default.walletAddress;
      } else if (minikit.default?.MiniKit?.walletAddress) {
        address = minikit.default.MiniKit.walletAddress;
      } else if (window?.MiniKit?.walletAddress) {
        address = window.MiniKit.walletAddress;
      }
      
      if (address && address !== walletAddress) {
        setWalletAddress(address);
      }
    };
    
    // Check immediately and set up interval to check regularly
    checkWalletAddress();
    const interval = setInterval(checkWalletAddress, 1000);
    
    return () => clearInterval(interval);
  }, [minikit, walletAddress]);

  // Create a walletAuth method that uses MiniKit's commandsAsync.walletAuth
  const walletAuth = async (params: WalletAuthInput): Promise<WalletAuthResult> => {
    try {
      if (!minikit || !isInstalled) {
        console.error('MiniKit not loaded or not installed');
        return { 
          finalPayload: { 
            status: 'error', 
            error: 'MiniKit not installed or not loaded' 
          } 
        };
      }
      
      console.log('Attempting wallet auth with MiniKit using params:', params);
      
      // Handle different possible structures of the MiniKit module
      let walletAuthCommand;
      
      // Try all possible paths to find the walletAuth command
      if (minikit.default?.commandsAsync?.walletAuth) {
        console.log('Using default.commandsAsync.walletAuth');
        walletAuthCommand = minikit.default.commandsAsync.walletAuth;
      } else if (minikit.commandsAsync?.walletAuth) {
        console.log('Using commandsAsync.walletAuth');
        walletAuthCommand = minikit.commandsAsync.walletAuth;
      } else if (minikit.default?.walletAuth) {
        console.log('Using default.walletAuth');
        walletAuthCommand = minikit.default.walletAuth;
      } else if (minikit.walletAuth) {
        console.log('Using direct walletAuth method');
        walletAuthCommand = minikit.walletAuth;
      } else if (minikit.MiniKit?.commandsAsync?.walletAuth) {
        console.log('Using MiniKit.commandsAsync.walletAuth');
        walletAuthCommand = minikit.MiniKit.commandsAsync.walletAuth;
      } else if (minikit.default?.MiniKit?.commandsAsync?.walletAuth) {
        console.log('Using default.MiniKit.commandsAsync.walletAuth');
        walletAuthCommand = minikit.default.MiniKit.commandsAsync.walletAuth;
      }
      
      if (!walletAuthCommand) {
        console.error('Could not find walletAuth command in MiniKit');
        return {
          finalPayload: {
            status: 'error',
            error: 'walletAuth command not available'
          }
        };
      }
      
      // Bind the walletAuth command to its parent object if needed
      if (minikit.default?.commandsAsync?.walletAuth) {
        walletAuthCommand = walletAuthCommand.bind(minikit.default.commandsAsync);
      } else if (minikit.commandsAsync?.walletAuth) {
        walletAuthCommand = walletAuthCommand.bind(minikit.commandsAsync);
      } else if (minikit.MiniKit?.commandsAsync?.walletAuth) {
        walletAuthCommand = walletAuthCommand.bind(minikit.MiniKit.commandsAsync);
      } else if (minikit.default?.MiniKit?.commandsAsync?.walletAuth) {
        walletAuthCommand = walletAuthCommand.bind(minikit.default.MiniKit.commandsAsync);
      }
      
      // Use the walletAuth command
      const result = await walletAuthCommand(params);
      console.log('walletAuth result:', result);
      
      // Update wallet address after successful authentication
      if (result.finalPayload?.status === 'success') {
        if (result.finalPayload.address) {
          setWalletAddress(result.finalPayload.address);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error with walletAuth command:', error);
      return { 
        finalPayload: { 
          status: 'error', 
          error: String(error) 
        } 
      };
    }
  };

  // Provide the context to children
  const contextValue: MinikitContextType = {
    isInitialized,
    isInstalled,
    walletAuth,
    walletAddress
  };

  return (
    <MinikitContext.Provider value={contextValue}>
      {children}
    </MinikitContext.Provider>
  );
}
