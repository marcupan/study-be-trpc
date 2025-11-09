import {createTRPCNext} from '@trpc/next';
import {httpBatchLink} from '@trpc/client';

// Import the AppRouter type from the server package
import type {AppRouter} from '../../../server/src/trpc/routers';

function getBaseUrl() {
    // Always return the absolute URL to the API server
    // This ensures the client makes requests to the correct endpoint
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export const trpc = createTRPCNext<AppRouter>({
    config() {
        return {
            links: [
                httpBatchLink({
                    url: `${getBaseUrl()}/api/trpc`,
                    // You can pass any HTTP headers you wish here
                    async headers() {
                        let token = '';
                        // Check if window is defined (client-side)
                        if (typeof window !== 'undefined') {
                            token = localStorage.getItem('token') || '';
                        }
                        return {
                            authorization: token ? `Bearer ${token}` : '',
                        };
                    },
                }),
            ],
        };
    },
    ssr: false,
});
