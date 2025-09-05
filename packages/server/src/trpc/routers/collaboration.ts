import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { CollaborationCreateSchema, CollaborationUpdateSchema } from '@tasksync/shared';

export const collaborationRouter = router({
  // Share a board with another user
  create: protectedProcedure
    .input(CollaborationCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { boardId, userId, accessLevel } = input;

      // Check if board exists and user is the owner
      const board = await ctx.prisma.board.findUnique({
        where: { id: boardId },
      });

      if (!board) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Board not found',
        });
      }

      // Only the board owner can share it
      if (board.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the board owner can share it',
        });
      }

      // Check if user to share with exists
      const userToShareWith = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userToShareWith) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check if user is trying to share with themselves
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
      const collaboration = await ctx.prisma.collaboration.create({
        data: {
          boardId,
          userId,
          accessLevel: accessLevel || 'read',
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

      return collaboration;
    }),

  // Get all collaborators for a board
  getByBoardId: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { boardId } = input;

      // Check if board exists
      const board = await ctx.prisma.board.findUnique({
        where: { id: boardId },
      });

      if (!board) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Board not found',
        });
      }

      // Check if user is owner or collaborator
      const isOwner = board.ownerId === ctx.user.id;

      if (!isOwner) {
        const collaboration = await ctx.prisma.collaboration.findUnique({
          where: {
            userId_boardId: {
              userId: ctx.user.id,
              boardId,
            },
          },
        });

        if (!collaboration) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this board',
          });
        }
      }

      // Get all collaborations for the board
      const collaborations = await ctx.prisma.collaboration.findMany({
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

      return collaborations;
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

      // Check if user is the board owner
      if (collaboration.board.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the board owner can update collaborations',
        });
      }

      // Update the collaboration
      const updatedCollaboration = await ctx.prisma.collaboration.update({
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

      return updatedCollaboration;
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

      // Check if user is the board owner
      if (collaboration.board.ownerId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the board owner can remove collaborations',
        });
      }

      // Delete the collaboration
      await ctx.prisma.collaboration.delete({
        where: { id },
      });

      return { success: true };
    }),
});
