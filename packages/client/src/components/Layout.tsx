import type { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { trpc } from '@/utils/trpc';

type LayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export default function Layout({ children, title, description }: LayoutProps) {
  const router = useRouter();
  const { data: user, isError } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });

  // React Query v5: Handle errors via isError instead of onError callback
  if (isError && router.pathname !== '/login' && router.pathname !== '/register') {
    void router.push('/login');
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    void router.push('/login');
  };

  // Don't show the layout on login and register pages
  if (router.pathname === '/login' || router.pathname === '/register') {
    return <>{children}</>;
  }

  const pageTitle = title ? `${title} - TaskSync` : 'TaskSync';
  const pageDescription = description ?? 'Collaborative task board application';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="shrink-0 flex items-center">
                  <Link href="/boards" className="text-xl font-bold text-blue-600">
                    TaskSync
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href="/boards"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      router.pathname === '/boards'
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Boards
                  </Link>
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">{user?.email}</span>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="py-10">
          <header>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {title && <h1 className="text-3xl font-bold text-gray-900">{title}</h1>}
            </div>
          </header>
          <main>
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
              <div className="px-4 py-8 sm:px-0">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
