import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { CollaborationCreateSchema, CollaborationUpdateSchema } from '@tasksync/shared';

import { checkBoardAccess, requireBoardOwner } from '../../utils/permissions';
import { protectedProcedure, router } from '../trpc';

export const collaborationRouter = router({
  // Share a board with another user
  create: protectedProcedure.input(CollaborationCreateSchema).mutation(async ({ ctx, input }) => {
    const { boardId, userId, accessLevel } = input;

    // Check if the user is the board owner
    await requireBoardOwner(ctx.prisma, boardId, ctx.user.id);

    // Check if a user to share with exists
    const userToShareWith = await ctx.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToShareWith) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Check if a user is trying to share with themselves
    if (userId === ctx.user.id) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'You cannot share a board with yourself',
      });
    }

    // Check if collaboration already exists
    const existingCollaboration = await ctx.prisma.collaboration.findUnique({
      where: {
        userId_boardId: {
          userId,
          boardId,
        },
      },
    });

    if (existingCollaboration) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'This board is already shared with this user',
      });
    }

    // Create the collaboration
    return ctx.prisma.collaboration.create({
      data: {
        boardId,
        userId,
        accessLevel,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        board: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }),

  // Get all collaborators for a board
  getByBoardId: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { boardId } = input;

      // Check if a user has access to the board
      await checkBoardAccess(ctx.prisma, boardId, ctx.user.id);

      // Get all collaborations for the board
      return ctx.prisma.collaboration.findMany({
        where: {
          boardId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    }),

  // Update a collaboration (change access level)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: CollaborationUpdateSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Find the collaboration
      const collaboration = await ctx.prisma.collaboration.findUnique({
        where: { id },
        include: {
          board: true,
        },
      });

      if (!collaboration) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collaboration not found',
        });
      }

      // Check if the user is the board owner
      await requireBoardOwner(ctx.prisma, collaboration.board.id, ctx.user.id);

      // Update the collaboration
      return ctx.prisma.collaboration.update({
        where: { id },
        data,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          board: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }),

  // Remove a collaboration (unshare a board)
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Find the collaboration
      const collaboration = await ctx.prisma.collaboration.findUnique({
        where: { id },
        include: {
          board: true,
        },
      });

      if (!collaboration) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collaboration not found',
        });
      }

      // Check if the user is the board owner
      await requireBoardOwner(ctx.prisma, collaboration.board.id, ctx.user.id);

      // Delete the collaboration
      await ctx.prisma.collaboration.delete({
        where: { id },
      });

      return { success: true };
    }),
});
