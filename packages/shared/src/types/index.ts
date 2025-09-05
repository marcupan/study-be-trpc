import { z } from 'zod';

// User types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

export const UserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export type UserCreate = z.infer<typeof UserCreateSchema>;

export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type UserLogin = z.infer<typeof UserLoginSchema>;

// Board types
export const BoardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  ownerId: z.string(),
});

export type Board = z.infer<typeof BoardSchema>;

export const BoardCreateSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export type BoardCreate = z.infer<typeof BoardCreateSchema>;

export const BoardUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional().nullable(),
});

export type BoardUpdate = z.infer<typeof BoardUpdateSchema>;

// Task types
export const TaskStatusEnum = z.enum(['Todo', 'InProgress', 'Done']);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: TaskStatusEnum,
  createdAt: z.date(),
  updatedAt: z.date(),
  boardId: z.string(),
  assigneeId: z.string().nullable(),
  creatorId: z.string(),
  updaterId: z.string(),
});

export type Task = z.infer<typeof TaskSchema>;

export const TaskCreateSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatusEnum.optional().default('Todo'),
  boardId: z.string(),
  assigneeId: z.string().optional(),
});

export type TaskCreate = z.infer<typeof TaskCreateSchema>;

export const TaskUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  status: TaskStatusEnum.optional(),
  assigneeId: z.string().optional().nullable(),
});

export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;

// Collaboration types
export const CollaborationAccessLevelEnum = z.enum(['read', 'write']);
export type CollaborationAccessLevel = z.infer<typeof CollaborationAccessLevelEnum>;

export const CollaborationSchema = z.object({
  id: z.string(),
  accessLevel: CollaborationAccessLevelEnum,
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string(),
  boardId: z.string(),
});

export type Collaboration = z.infer<typeof CollaborationSchema>;

export const CollaborationCreateSchema = z.object({
  userId: z.string(),
  boardId: z.string(),
  accessLevel: CollaborationAccessLevelEnum.optional().default('read'),
});

export type CollaborationCreate = z.infer<typeof CollaborationCreateSchema>;

export const CollaborationUpdateSchema = z.object({
  accessLevel: CollaborationAccessLevelEnum,
});

export type CollaborationUpdate = z.infer<typeof CollaborationUpdateSchema>;
