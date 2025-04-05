import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import WorldIdAuthButton from '../components/WorldIdAuthButton';

export default function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
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
            <WorldIdAuthButton />
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
  );
}
