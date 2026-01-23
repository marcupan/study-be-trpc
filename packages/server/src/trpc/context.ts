import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import dotenv from 'dotenv';

import { verifyToken } from '../utils/auth';

// Load environment variables before initializing Prisma
dotenv.config();

// Create Prisma adapter for SQLite with Prisma 7
const adapter = new PrismaLibSql({
  url: process.env['DATABASE_URL'] ?? 'file:./prisma/dev.db',
});

// Create a single instance of the Prisma client with an adapter
export const prisma = new PrismaClient({ adapter });

/**
 * Creates context for the tRPC server
 */
export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  // Get the user token from the headers
  const token = req.headers.authorization?.split(' ')[1];

  // Try to retrieve a user with the token
  const user = token ? verifyToken(token) : null;

  return {
    prisma,
    req,
    res,
    user,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
