import { z } from 'zod';

import { BoardCreateSchema, BoardUpdateSchema } from '@tasksync/shared';

import { checkBoardAccess, requireBoardOwner } from '../../utils/permissions';
import { protectedProcedure, router } from '../trpc';

export const boardRouter = router({
  // Create a new board
  create: protectedProcedure.input(BoardCreateSchema).mutation(async ({ ctx, input }) => {
    const { name, description } = input;

    return ctx.prisma.board.create({
      data: {
        name,
        description: description ?? null,
        ownerId: ctx.user.id,
      },
    });
  }),

  // Get all boards for the current user (owned and collaborated) with pagination
  getAll: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;

      // Get boards owned by the user with pagination
      const ownedBoards = await ctx.prisma.board.findMany({
        where: {
          ownerId: ctx.user.id,
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Get boards the user collaborates on with pagination
      const collaboratedBoards = await ctx.prisma.board.findMany({
        where: {
          collaborations: {
            some: {
              userId: ctx.user.id,
            },
          },
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          collaborations: {
            where: {
              userId: ctx.user.id,
            },
            select: {
              accessLevel: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Calculate next cursor for owned boards
      let ownedNextCursor: string | undefined;
      if (ownedBoards.length > limit) {
        const nextItem = ownedBoards.pop();
        ownedNextCursor = nextItem?.id;
      }

      // Calculate next cursor for collaborated boards
      let collaboratedNextCursor: string | undefined;
      if (collaboratedBoards.length > limit) {
        const nextItem = collaboratedBoards.pop();
        collaboratedNextCursor = nextItem?.id;
      }

      // Format collaborated boards to include access level
      const formattedCollaboratedBoards = collaboratedBoards.map((board) => ({
        ...board,
        accessLevel: board.collaborations[0]?.accessLevel ?? 'read',
        collaborations: undefined, // Remove the collaborations array
      }));

      return {
        owned: ownedBoards,
        collaborated: formattedCollaboratedBoards,
        nextCursor: {
          owned: ownedNextCursor,
          collaborated: collaboratedNextCursor,
        },
      };
    }),

  // Get a single board by ID
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const { id } = input;

    // Check access and get board
    await checkBoardAccess(ctx.prisma, id, ctx.user.id);

    // Fetch full board with relations
    return ctx.prisma.board.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        collaborations: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }),

  // Update a board
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: BoardUpdateSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Check if a user has write access
      await checkBoardAccess(ctx.prisma, id, ctx.user.id, 'write');

      // Update the board
      return ctx.prisma.board.update({
        where: { id },
        data,
      });
    }),

  // Delete a board
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Check if the user is the owner
      await requireBoardOwner(ctx.prisma, id, ctx.user.id);

      // Delete the board (cascades to tasks and collaborations)
      await ctx.prisma.board.delete({
        where: { id },
      });

      return { success: true };
    }),
});
