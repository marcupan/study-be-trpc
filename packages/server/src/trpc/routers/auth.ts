import { TRPCError } from '@trpc/server';

import { UserCreateSchema, UserLoginSchema } from '@tasksync/shared';

import { comparePassword, generateToken, hashPassword } from '../../utils/auth';
import { protectedProcedure, publicProcedure, router } from '../trpc';

export const authRouter = router({
  // Register a new user
  register: publicProcedure.input(UserCreateSchema).mutation(async ({ ctx, input }) => {
    const { email, password, name } = input;

    // Check if a user already exists
    const existingUser = await ctx.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User with this email already exists',
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user
    const user = await ctx.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name ?? null,
      },
    });

    // Generate a token
    const token = generateToken({ id: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }),

  // Log in a user
  login: publicProcedure.input(UserLoginSchema).mutation(async ({ ctx, input }) => {
    const { email, password } = input;

    // Find the user
    const user = await ctx.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Check the password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid password',
      });
    }

    // Generate a token
    const token = generateToken({ id: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };
  }),

  // Get the current user
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }),
});
