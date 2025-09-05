import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../utils/auth';

// Create a single instance of the Prisma client
const prisma = new PrismaClient();

/**
 * Creates context for the tRPC server
 */
export const createContext = async ({ req, res }: CreateExpressContextOptions) => {
  // Get the user token from the headers
  const token = req.headers.authorization?.split(' ')[1];

  // Try to retrieve a user with the token
  const user = token ? await verifyToken(token) : null;

  return {
    prisma,
    req,
    res,
    user,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
