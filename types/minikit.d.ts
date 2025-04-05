// Type definitions for the MiniKit global object
interface MiniKitGlobal {
  isInstalled: () => boolean;
  walletAddress?: string;
  install: (appId?: string) => void;
  commandsAsync?: {
    walletAuth: (params: any) => Promise<any>;
    verify: (params: any) => Promise<any>;
  };
}

// Extend the global Window interface
interface Window {
  MiniKit?: MiniKitGlobal;
}
