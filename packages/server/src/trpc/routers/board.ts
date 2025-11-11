import {TRPCError} from '@trpc/server';
import {z} from 'zod';
import {protectedProcedure, router} from '../trpc';
import {BoardCreateSchema, BoardUpdateSchema} from '@tasksync/shared';

export const boardRouter = router({
    // Create a new board
    create: protectedProcedure
        .input(BoardCreateSchema)
        .mutation(async ({ctx, input}) => {
            const {name, description} = input;

            const board = await ctx.prisma.board.create({
                data: {
                    name,
                    description: description || null,
                    ownerId: ctx.user.id,
                },
            });

            return board;
        }),

    // Get all boards for the current user (owned and collaborated)
    getAll: protectedProcedure.query(async ({ctx}) => {
        // Get boards owned by the user
        const ownedBoards = await ctx.prisma.board.findMany({
            where: {
                ownerId: ctx.user.id,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        // Get boards the user collaborates on
        const collaboratedBoards = await ctx.prisma.board.findMany({
            where: {
                collaborations: {
                    some: {
                        userId: ctx.user.id,
                    },
                },
            },
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

        // Format collaborated boards to include access level
        const formattedCollaboratedBoards = collaboratedBoards.map((board) => ({
            ...board,
            accessLevel: board.collaborations[0]?.accessLevel || 'read',
            collaborations: undefined, // Remove the collaborations array
        }));

        return {
            owned: ownedBoards,
            collaborated: formattedCollaboratedBoards,
        };
    }),

    // Get a single board by ID
    getById: protectedProcedure
        .input(z.object({id: z.string()}))
        .query(async ({ctx, input}) => {
            const {id} = input;

            // Find the board
            const board = await ctx.prisma.board.findUnique({
                where: {id},
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

            if (!board) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Board not found',
                });
            }

            // Check if user is owner or collaborator
            const isOwner = board.ownerId === ctx.user.id;
            const isCollaborator = board.collaborations.some(
                (collab) => collab.userId === ctx.user.id
            );

            if (!isOwner && !isCollaborator) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have access to this board',
                });
            }

            return board;
        }),

    // Update a board
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: BoardUpdateSchema,
            })
        )
        .mutation(async ({ctx, input}) => {
            const {id, data} = input;

            // Find the board
            const board = await ctx.prisma.board.findUnique({
                where: {id},
                include: {
                    collaborations: true,
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
            const hasWriteAccess = board.collaborations.some(
                (collab) => collab.userId === ctx.user.id && collab.accessLevel === 'write'
            );

            if (!isOwner && !hasWriteAccess) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to update this board',
                });
            }

            // Update the board
            const updatedBoard = await ctx.prisma.board.update({
                where: {id},
                data,
            });

            return updatedBoard;
        }),

    // Delete a board
    delete: protectedProcedure
        .input(z.object({id: z.string()}))
        .mutation(async ({ctx, input}) => {
            const {id} = input;

            // Find the board
            const board = await ctx.prisma.board.findUnique({
                where: {id},
            });

            if (!board) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Board not found',
                });
            }

            // Check if user is the owner
            if (board.ownerId !== ctx.user.id) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Only the board owner can delete it',
                });
            }

            // Delete the board
            await ctx.prisma.board.delete({
                where: {id},
            });

            return {success: true};
        }),
});
