import { AppProps } from 'next/app';
import { trpc } from '../utils/trpc';
import '../styles/globals.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for authentication on initial load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const publicPaths = ['/', '/login', '/register'];
    const isPublicPath = publicPaths.includes(router.pathname);

    if (!token && !isPublicPath) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-gray-500">Please wait while we set things up</p>
        </div>
      </div>
    );
  }

  return <Component {...pageProps} />;
}

export default trpc.withTRPC(MyApp);
