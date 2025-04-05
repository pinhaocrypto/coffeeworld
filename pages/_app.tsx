import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';
import MiniKitProvider from '../components/minikit-provider';

export default function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <MiniKitProvider>
        <Head>
          <title>Coffee Finder</title>
          <meta name="description" content="Find and review the best coffee shops" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className="min-h-screen bg-amber-50">
          <header className="bg-amber-800 text-white shadow-md">
            <div className="container mx-auto p-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold">Coffee Finder</h1>
            </div>
          </header>
          <main className="container mx-auto p-4">
            <Component {...pageProps} />
          </main>
          <footer className="bg-amber-800 text-white mt-8 py-6">
            <div className="container mx-auto px-4 text-center">
              <p> {new Date().getFullYear()} Coffee Finder. Powered by Worldcoin.</p>
            </div>
          </footer>
        </div>
      </MiniKitProvider>
    </SessionProvider>
  );
}
