import { httpBatchLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';

// Import the AppRouter type from the server package
import type { AppRouter } from '@tasksync/server';

function getBaseUrl() {
  // Always return the absolute URL to the API server
  // This ensures the client makes requests to the correct endpoint
  return process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          // You can pass any HTTP headers you wish here
          headers() {
            let token = '';
            // Check if a window is defined (client-side)
            if (typeof window !== 'undefined') {
              token = localStorage.getItem('token') ?? '';
            }
            return {
              authorization: token ? `Bearer ${token}` : '',
            };
          },
        }),
      ],
    };
  },
  /**
   * Disable SSR for tRPC - all queries are client-side only
   * This is recommended for apps with authentication
   * @link https://trpc.io/docs/client/nextjs/setup
   */
  ssr: false,
});
