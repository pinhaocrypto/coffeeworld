import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import '../styles/globals.css';
import WorldIdAuthButton from '../components/WorldIdAuthButton';
import ErrorBoundary from '../components/ErrorBoundary';

// Safe environment checking component
const SafeHydration = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return mounted ? <>{children}</> : <div className="min-h-screen bg-amber-50">Loading...</div>;
};

export default function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // Add a global error handler for unhandled errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalOnError = window.onerror;
      
      window.onerror = (message, source, lineno, colno, error) => {
        console.log('Global error caught:', { message, source, lineno, colno });
        // Still call original handler if it exists
        if (originalOnError) {
          return originalOnError(message, source, lineno, colno, error);
        }
        return false;
      };
      
      // Also catch unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        console.log('Unhandled Promise Rejection:', event.reason);
      });
      
      return () => {
        window.onerror = originalOnError;
        window.removeEventListener('unhandledrejection', () => {});
      };
    }
  }, []);
  
  return (
    <ErrorBoundary>
      <SafeHydration>
        <SessionProvider session={session}>
          <Head>
            <title>Coffee World</title>
            <meta name="description" content="Find and review the best coffee shops" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
            
            {/* Meta tags for World App integration */}
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
                <ErrorBoundary fallback={<button className="px-4 py-2 bg-amber-700 text-white rounded">Sign In</button>}>
                  <WorldIdAuthButton />
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
        </SessionProvider>
      </SafeHydration>
    </ErrorBoundary>
  );
}
