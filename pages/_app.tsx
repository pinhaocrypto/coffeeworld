import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import '../styles/globals.css';
import ErrorBoundary from '../components/ErrorBoundary';
import { WorldIDProvider } from '../components/WorldIDProvider';
import WorldIDButton from '../components/WorldIDButton';

const SafeHydration = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : <div className="min-h-screen bg-amber-50">Loading...</div>;
};

const WorldAppDetector = ({ children }: { children: React.ReactNode }) => {
  const [isWorldApp, setIsWorldApp] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const inWorldApp = !!(
          window.location.hostname.includes('worldcoin.org') ||
          window.navigator.userAgent.includes('WorldApp') ||
          (window.parent && window.parent !== window) ||
          // @ts-ignore
          (window.MiniKit && typeof window.MiniKit.isInstalled === 'function')
        );
        setIsWorldApp(inWorldApp);

        if (inWorldApp) {
          document.body.classList.add('world-app-environment');
        }
      } catch (error) {
        console.error('Error detecting World App environment:', error);
      }
    }
  }, []);

  return (
    <>
      {children}
      {isWorldApp && (
        <div className="fixed bottom-0 left-0 w-full bg-amber-700 text-white text-xs py-1 text-center z-50">
          Running in World App
        </div>
      )}
    </>
  );
};

export default function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalOnError = window.onerror;

      window.onerror = (message, source, lineno, colno, error) => {
        console.log('Global error caught:', { message, source, lineno, colno });
        if (originalOnError) {
          return originalOnError(message, source, lineno, colno, error);
        }
        return false;
      };

      window.addEventListener('unhandledrejection', (event) => {
        console.log('Unhandled Promise Rejection:', event.reason);
      });

      return () => {
        window.onerror = originalOnError;
        window.removeEventListener('unhandledrejection', () => { });
      };
    }
  }, []);

  return (
    <ErrorBoundary>
      <SafeHydration>
        <SessionProvider session={session}>
          <WorldIDProvider>
            <WorldAppDetector>
              <Head>
                <title>Coffee World</title>
                <meta name="description" content="Find and review the best coffee shops" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
                <meta property="wld:app_name" content="Coffee World" />
                <meta property="wld:app_description" content="Find and review coffee shops near you" />
                <meta property="wld:requires_auth" content="true" />
                <meta property="wld:requires_profile" content="true" />
                <meta property="wld:requires_location" content="true" />
                <meta property="wld:app_icon" content="https://coffeeworld.vercel.app/coffee-world-icon.png" />
              </Head>
              <div className="min-h-screen bg-amber-50">
                <header className="bg-amber-800 text-white shadow-md">
                  <div className="container mx-auto p-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Coffee World</h1>
                    <ErrorBoundary fallback={<button className="px-4 py-2 bg-amber-700 text-white rounded">Auth Error</button>}>
                      <div className="flex items-center space-x-2">
                        {/* 暫時移除 DevModeAuth 組件 */}
                        {/* <DevModeAuth /> */}
                        <WorldIDButton />
                      </div>
                    </ErrorBoundary>
                  </div>
                </header>
                <main className="container mx-auto p-4 pt-6">
                  <Component {...pageProps} />
                </main>
                <footer className="bg-amber-800 text-white p-4 mt-8">
                  <div className="container mx-auto text-center">
                    <p> 2025 Coffee World. Powered by Worldcoin.</p>
                  </div>
                </footer>
              </div>
            </WorldAppDetector>
          </WorldIDProvider>
        </SessionProvider>
      </SafeHydration>
    </ErrorBoundary>
  );
}
