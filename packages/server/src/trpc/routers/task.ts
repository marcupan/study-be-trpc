import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { TaskCreateSchema, TaskUpdateSchema } from '@tasksync/shared';

import { checkBoardAccess } from '../../utils/permissions';
import { protectedProcedure, router } from '../trpc';

export const taskRouter = router({
  // Create a new task
  create: protectedProcedure.input(TaskCreateSchema).mutation(async ({ ctx, input }) => {
    const { title, description, status, boardId, assigneeId } = input;

    // Check if a user has write access to the board
    await checkBoardAccess(ctx.prisma, boardId, ctx.user.id, 'write');

    // If assigneeId is provided, check if the user exists
    if (assigneeId) {
      const assignee = await ctx.prisma.user.findUnique({
        where: { id: assigneeId },
      });

      if (!assignee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Assignee not found',
        });
      }
    }

    // Create the task
    return ctx.prisma.task.create({
      data: {
        title,
        description: description ?? null,
        status,
        boardId,
        assigneeId: assigneeId ?? null,
        creatorId: ctx.user.id,
        updaterId: ctx.user.id,
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        updater: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }),

  // Get all tasks for a board
  getByBoardId: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { boardId } = input;

      // Check if a user has access to the board
      await checkBoardAccess(ctx.prisma, boardId, ctx.user.id);

      // Get all tasks for the board
      return ctx.prisma.task.findMany({
        where: {
          boardId,
        },
        include: {
          assignee: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          updater: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    }),

  // Get a single task by ID
  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const { id } = input;

    // Find the task
    const task = await ctx.prisma.task.findUnique({
      where: { id },
      include: {
        board: true,
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        updater: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Task not found',
      });
    }

    // Check if a user has access to the board
    await checkBoardAccess(ctx.prisma, task.boardId, ctx.user.id);

    return task;
  }),

  // Update a task
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: TaskUpdateSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Find the task
      const task = await ctx.prisma.task.findUnique({
        where: { id },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Check if a user has write access to the board
      await checkBoardAccess(ctx.prisma, task.boardId, ctx.user.id, 'write');

      // If assigneeId is provided, check if the user exists
      if (data.assigneeId) {
        const assignee = await ctx.prisma.user.findUnique({
          where: { id: data.assigneeId },
        });

        if (!assignee) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Assignee not found',
          });
        }
      }

      // Update the task
      return ctx.prisma.task.update({
        where: { id },
        data: {
          ...data,
          updaterId: ctx.user.id,
        },
        include: {
          assignee: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          updater: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    }),

  // Delete a task
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Find the task
      const task = await ctx.prisma.task.findUnique({
        where: { id },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Check if a user has write access to the board
      await checkBoardAccess(ctx.prisma, task.boardId, ctx.user.id, 'write');

      // Delete the task
      await ctx.prisma.task.delete({
        where: { id },
      });

      return { success: true };
    }),
});
