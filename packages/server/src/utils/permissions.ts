import { TRPCError } from '@trpc/server';

import type { Prisma, PrismaClient } from '@prisma/client';

export type AccessLevel = 'read' | 'write' | 'owner';

type BoardWithCollaborations = Prisma.BoardGetPayload<{
  include: { collaborations: true };
}>;

type BoardAccessResult = {
  board: BoardWithCollaborations;
  accessLevel: AccessLevel;
};

/**
 * Check if user has access to a board and return the access level
 * @throws TRPCError if board not found or user doesn't have access
 */
export async function checkBoardAccess(
  prisma: PrismaClient,
  boardId: string,
  userId: string,
  requiredAccess?: AccessLevel
): Promise<BoardAccessResult> {
  const board = (await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      collaborations: {
        where: { userId },
      },
    },
  })) as BoardWithCollaborations | null;

  if (!board) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Board not found',
    });
  }

  const isOwner = board.ownerId === userId;
  const collaboration = board.collaborations[0];

  let accessLevel: AccessLevel;
  if (isOwner) {
    accessLevel = 'owner';
  } else if (collaboration) {
    accessLevel = collaboration.accessLevel as 'read' | 'write';
  } else {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this board',
    });
  }

  // Check if a user has the required access level
  if (requiredAccess) {
    const accessHierarchy: Record<AccessLevel, number> = {
      read: 1,
      write: 2,
      owner: 3,
    };

    if (accessHierarchy[accessLevel] < accessHierarchy[requiredAccess]) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You need ${requiredAccess} access to perform this action`,
      });
    }
  }

  return { board, accessLevel };
}

/**
 * Check if user is the owner of a board
 * @throws TRPCError if board not found or user is not the owner
 */
export async function requireBoardOwner(
  prisma: PrismaClient,
  boardId: string,
  userId: string
): Promise<Awaited<ReturnType<PrismaClient['board']['findUnique']>>> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  if (!board) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Board not found',
    });
  }

  if (board.ownerId !== userId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only the board owner can perform this action',
    });
  }

  return board;
}
