import { execSync } from 'child_process';

import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { afterAll, beforeAll, beforeEach } from 'vitest';

import { createContext } from '../../context';
import { appRouter } from '../index';

// Create test database adapter
const testAdapter = new PrismaLibSql({
  url: 'file:./test.db',
});

export const prisma = new PrismaClient({ adapter: testAdapter });

// Create a tRPC caller for testing
export const createCaller = (token?: string) => {
  const mockReq: Partial<CreateExpressContextOptions['req']> = {
    headers: {
      authorization: token ? `Bearer ${token}` : undefined,
    },
  };

  const mockRes: Partial<CreateExpressContextOptions['res']> = {};
  const mockInfo: Partial<CreateExpressContextOptions['info']> = {};

  const ctx = createContext({
    req: mockReq as CreateExpressContextOptions['req'],
    res: mockRes as CreateExpressContextOptions['res'],
    info: mockInfo as CreateExpressContextOptions['info'],
  } as CreateExpressContextOptions);

  return appRouter.createCaller(ctx);
};

// Helper to clean up database between tests
export const cleanupDatabase = async () => {
  await prisma.task.deleteMany();
  await prisma.collaboration.deleteMany();
  await prisma.board.deleteMany();
  await prisma.user.deleteMany();
};

// Hooks for test setup/teardown
export const setupTestDatabase = () => {
  beforeAll(() => {
    // Push schema to test database (doesn't require migrations)
    try {
      execSync('DATABASE_URL="file:./test.db" npx prisma db push --skip-generate', {
        cwd: '/Users/marcupan/WebstormProjects/practice/be-trpc/packages/server',
        stdio: 'ignore',
      });
    } catch (error) {
      console.error('Failed to push schema to test database:', error);
      // Continue anyway - table might already exist
    }
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await prisma.$disconnect();
  });
};
