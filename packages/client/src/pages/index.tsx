import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if a user is logged in
    const token = localStorage.getItem('token');

    if (token) {
      // Redirect to boards if logged in
      void router.push('/boards');
    } else {
      // Redirect to log in if not logged in
      void router.push('/login');
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <>
      <Head>
        <title>TaskSync - Collaborative Task Board</title>
        <meta
          name="description"
          content="TaskSync is a collaborative task board application built with Next.js, tRPC, and Prisma"
        />
        <meta property="og:title" content="TaskSync - Collaborative Task Board" />
        <meta
          property="og:description"
          content="TaskSync is a collaborative task board application built with Next.js, tRPC, and Prisma"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </div>
    </>
  );
}

export function getServerSideProps() {
  return { props: {} };
}
