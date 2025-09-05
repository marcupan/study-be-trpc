import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { TaskCreateSchema, TaskUpdateSchema } from '@tasksync/shared';

export const taskRouter = router({
  // Create a new task
  create: protectedProcedure
    .input(TaskCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { title, description, status, boardId, assigneeId } = input;

      // Check if board exists and user has access
      const board = await ctx.prisma.board.findUnique({
        where: { id: boardId },
        include: {
          collaborations: {
            where: {
              userId: ctx.user.id,
              accessLevel: 'write',
            },
          },
        },
      });

      if (!board) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Board not found',
        });
      }

      // Check if user is owner or has write access
      const isOwner = board.ownerId === ctx.user.id;
      const hasWriteAccess = board.collaborations.length > 0;

      if (!isOwner && !hasWriteAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create tasks in this board',
        });
      }

      // If assigneeId is provided, check if user exists
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
      const task = await ctx.prisma.task.create({
        data: {
          title,
          description: description || null,
          status: status || 'Todo',
          boardId,
          assigneeId: assigneeId || null,
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

      return task;
    }),

  // Get all tasks for a board
  getByBoardId: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { boardId } = input;

      // Check if board exists and user has access
      const board = await ctx.prisma.board.findUnique({
        where: { id: boardId },
        include: {
          collaborations: {
            where: {
              userId: ctx.user.id,
            },
          },
        },
      });

      if (!board) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Board not found',
        });
      }

      // Check if user is owner or collaborator
      const isOwner = board.ownerId === ctx.user.id;
      const isCollaborator = board.collaborations.length > 0;

      if (!isOwner && !isCollaborator) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this board',
        });
      }

      // Get all tasks for the board
      const tasks = await ctx.prisma.task.findMany({
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

      return tasks;
    }),

  // Get a single task by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
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

      // Check if user has access to the board
      const board = await ctx.prisma.board.findUnique({
        where: { id: task.boardId },
        include: {
          collaborations: {
            where: {
              userId: ctx.user.id,
            },
          },
        },
      });

      if (!board) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Board not found',
        });
      }

      // Check if user is owner or collaborator
      const isOwner = board.ownerId === ctx.user.id;
      const isCollaborator = board.collaborations.length > 0;

      if (!isOwner && !isCollaborator) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this task',
        });
      }

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
        include: {
          board: true,
        },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Check if user has access to the board
      const board = await ctx.prisma.board.findUnique({
        where: { id: task.boardId },
        include: {
          collaborations: {
            where: {
              userId: ctx.user.id,
              accessLevel: 'write',
            },
          },
        },
      });

      if (!board) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Board not found',
        });
      }

      // Check if user is owner or has write access
      const isOwner = board.ownerId === ctx.user.id;
      const hasWriteAccess = board.collaborations.length > 0;

      if (!isOwner && !hasWriteAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this task',
        });
      }

      // If assigneeId is provided, check if user exists
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
      const updatedTask = await ctx.prisma.task.update({
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

      return updatedTask;
    }),

  // Delete a task
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Find the task
      const task = await ctx.prisma.task.findUnique({
        where: { id },
        include: {
          board: true,
        },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Check if user has access to the board
      const board = await ctx.prisma.board.findUnique({
        where: { id: task.boardId },
        include: {
          collaborations: {
            where: {
              userId: ctx.user.id,
              accessLevel: 'write',
            },
          },
        },
      });

      if (!board) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Board not found',
        });
      }

      // Check if user is owner or has write access
      const isOwner = board.ownerId === ctx.user.id;
      const hasWriteAccess = board.collaborations.length > 0;

      if (!isOwner && !hasWriteAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this task',
        });
      }

      // Delete the task
      await ctx.prisma.task.delete({
        where: { id },
      });

      return { success: true };
    }),
});
