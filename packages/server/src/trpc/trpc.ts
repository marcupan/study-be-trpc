import {initTRPC, TRPCError} from '@trpc/server';

import {Context} from './context';

// Initialize tRPC
const t = initTRPC.context<Context>().create();

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to check if user is authenticated
const isAuthenticated = t.middleware(({ctx, next}) => {
    if (!ctx.user) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to access this resource',
        });
    }
    return next({
        ctx: {
            ...ctx,
            // Add user to context
            user: ctx.user,
        },
    });
});

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(isAuthenticated);
