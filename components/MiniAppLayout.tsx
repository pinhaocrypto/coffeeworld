import { ReactNode, useEffect, useState } from 'react';
import Head from 'next/head';
import { useWorldcoin } from './minikit-provider';

interface MiniAppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function MiniAppLayout({ children, title = 'Coffee World' }: MiniAppLayoutProps) {
  const [isInWorldApp, setIsInWorldApp] = useState(false);
  
  // Detect if running in World App environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isInApp = 
        window.location.hostname.includes('worldcoin.org') || 
        window.navigator.userAgent.includes('WorldApp') ||
        !!window.parent && window.parent !== window;
      
      setIsInWorldApp(isInApp);
      
      // Add class to body for World App-specific styling
      if (isInApp) {
        document.body.classList.add('in-world-app');
      }
    }
  }, []);

  return (
    <>
      <div className={`min-h-screen ${isInWorldApp ? 'pb-16' : ''}`}>
        {/* Mini App specific styling */}
        {isInWorldApp && (
          <style jsx global>{`
            /* Mini App specific styles */
            body.in-world-app {
              /* World App has its own navigation, adjust padding */
              padding-bottom: env(safe-area-inset-bottom, 16px);
            }
            
            /* Smaller headers in Mini App */
            .in-world-app .header-title {
              font-size: 1.25rem;
            }
            
            /* Adjust card sizes for Mini App */
            .in-world-app .card {
              margin-bottom: 0.75rem;
            }
          `}</style>
        )}
        
        {/* Display a subtle indicator when in World App */}
        {isInWorldApp && (
          <div className="fixed bottom-0 left-0 right-0 bg-amber-800 text-white text-xs text-center py-1 z-50">
            Running in World App
          </div>
        )}
        
        {/* Regular content */}
        {children}
      </div>
    </>
  );
}
