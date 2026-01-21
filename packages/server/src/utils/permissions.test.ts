import type { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkBoardAccess, requireBoardOwner } from './permissions';

// Mock Prisma Client with proper typing
const mockFindUnique = vi.fn();

const mockPrismaClient = {
  board: {
    findUnique: mockFindUnique,
  },
} as unknown as PrismaClient;

describe('Permission Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkBoardAccess', () => {
    it('should return owner access level for board owner', async () => {
      const boardId = 'board-123';
      const userId = 'user-123';

      mockFindUnique.mockResolvedValue({
        id: boardId,
        ownerId: userId,
        collaborations: [],
      });

      const result = await checkBoardAccess(mockPrismaClient, boardId, userId);

      expect(result.accessLevel).toBe('owner');
      expect(result.board).toBeDefined();
    });

    it('should return write access level for collaborator with write access', async () => {
      const boardId = 'board-123';
      const userId = 'user-456';

      mockFindUnique.mockResolvedValue({
        id: boardId,
        ownerId: 'different-user',
        collaborations: [{ userId, accessLevel: 'write' }],
      });

      const result = await checkBoardAccess(mockPrismaClient, boardId, userId);

      expect(result.accessLevel).toBe('write');
    });

    it('should return read access level for collaborator with read access', async () => {
      const boardId = 'board-123';
      const userId = 'user-456';

      mockFindUnique.mockResolvedValue({
        id: boardId,
        ownerId: 'different-user',
        collaborations: [{ userId, accessLevel: 'read' }],
      });

      const result = await checkBoardAccess(mockPrismaClient, boardId, userId);

      expect(result.accessLevel).toBe('read');
    });

    it('should throw NOT_FOUND error if board does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(checkBoardAccess(mockPrismaClient, 'board-123', 'user-123')).rejects.toThrow(
        TRPCError
      );

      await expect(
        checkBoardAccess(mockPrismaClient, 'board-123', 'user-123')
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw FORBIDDEN error if user has no access', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'board-123',
        ownerId: 'different-user',
        collaborations: [],
      });

      await expect(checkBoardAccess(mockPrismaClient, 'board-123', 'user-123')).rejects.toThrow(
        TRPCError
      );

      await expect(
        checkBoardAccess(mockPrismaClient, 'board-123', 'user-123')
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });

    it('should throw FORBIDDEN error if required access level is not met', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'board-123',
        ownerId: 'different-user',
        collaborations: [{ userId: 'user-123', accessLevel: 'read' }],
      });

      await expect(
        checkBoardAccess(mockPrismaClient, 'board-123', 'user-123', 'write')
      ).rejects.toThrow(TRPCError);

      await expect(
        checkBoardAccess(mockPrismaClient, 'board-123', 'user-123', 'write')
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });

  describe('requireBoardOwner', () => {
    it('should return board if user is the owner', async () => {
      const boardId = 'board-123';
      const userId = 'user-123';

      mockFindUnique.mockResolvedValue({
        id: boardId,
        ownerId: userId,
        name: 'Test Board',
      });

      const result = await requireBoardOwner(mockPrismaClient, boardId, userId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(boardId);
    });

    it('should throw NOT_FOUND error if board does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      await expect(requireBoardOwner(mockPrismaClient, 'board-123', 'user-123')).rejects.toThrow(
        TRPCError
      );

      await expect(
        requireBoardOwner(mockPrismaClient, 'board-123', 'user-123')
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw FORBIDDEN error if user is not the owner', async () => {
      mockFindUnique.mockResolvedValue({
        id: 'board-123',
        ownerId: 'different-user',
        name: 'Test Board',
      });

      await expect(requireBoardOwner(mockPrismaClient, 'board-123', 'user-123')).rejects.toThrow(
        TRPCError
      );

      await expect(
        requireBoardOwner(mockPrismaClient, 'board-123', 'user-123')
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });
});
