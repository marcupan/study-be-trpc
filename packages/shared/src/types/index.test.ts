import { describe, expect, it } from 'vitest';

import {
  BoardCreateSchema,
  BoardUpdateSchema,
  CollaborationAccessLevelEnum,
  CollaborationCreateSchema,
  CollaborationUpdateSchema,
  TaskCreateSchema,
  TaskStatusEnum,
  TaskUpdateSchema,
  UserCreateSchema,
  UserLoginSchema,
} from './index';

describe('Shared Type Schemas', () => {
  describe('User Schemas', () => {
    it('should validate correct user creation data', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const result = UserCreateSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = UserCreateSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: '12345', // Less than 6 characters
      };

      const result = UserCreateSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should validate user login data', () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = UserLoginSchema.safeParse(loginData);
      expect(result.success).toBe(true);
    });
  });

  describe('Board Schemas', () => {
    it('should validate board creation with required fields', () => {
      const validBoard = {
        name: 'My Board',
      };

      const result = BoardCreateSchema.safeParse(validBoard);
      expect(result.success).toBe(true);
    });

    it('should validate board creation with optional description', () => {
      const validBoard = {
        name: 'My Board',
        description: 'A test board',
      };

      const result = BoardCreateSchema.safeParse(validBoard);
      expect(result.success).toBe(true);
    });

    it('should reject board creation without name', () => {
      const invalidBoard = {
        description: 'A test board',
      };

      const result = BoardCreateSchema.safeParse(invalidBoard);
      expect(result.success).toBe(false);
    });

    it('should validate board update with partial data', () => {
      const updateData = {
        name: 'Updated Name',
      };

      const result = BoardUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });

  describe('Task Schemas', () => {
    it('should validate task creation with required fields', () => {
      const validTask = {
        title: 'Test Task',
        boardId: 'board-123',
      };

      const result = TaskCreateSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should use default status if not provided', () => {
      const taskData = {
        title: 'Test Task',
        boardId: 'board-123',
      };

      const result = TaskCreateSchema.parse(taskData);
      expect(result.status).toBe('Todo');
    });

    it('should validate all task statuses', () => {
      const statuses = ['Todo', 'InProgress', 'Done'];

      statuses.forEach((status) => {
        const result = TaskStatusEnum.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid task status', () => {
      const result = TaskStatusEnum.safeParse('InvalidStatus');
      expect(result.success).toBe(false);
    });

    it('should validate task update with partial data', () => {
      const updateData = {
        status: 'InProgress' as const,
      };

      const result = TaskUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });

  describe('Collaboration Schemas', () => {
    it('should validate collaboration creation', () => {
      const validCollaboration = {
        userId: 'user-123',
        boardId: 'board-456',
        accessLevel: 'read' as const,
      };

      const result = CollaborationCreateSchema.safeParse(validCollaboration);
      expect(result.success).toBe(true);
    });

    it('should use default access level if not provided', () => {
      const collabData = {
        userId: 'user-123',
        boardId: 'board-456',
      };

      const result = CollaborationCreateSchema.parse(collabData);
      expect(result.accessLevel).toBe('read');
    });

    it('should validate both access levels', () => {
      const levels = ['read', 'write'];

      levels.forEach((level) => {
        const result = CollaborationAccessLevelEnum.safeParse(level);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid access level', () => {
      const result = CollaborationAccessLevelEnum.safeParse('admin');
      expect(result.success).toBe(false);
    });

    it('should validate collaboration update', () => {
      const updateData = {
        accessLevel: 'write' as const,
      };

      const result = CollaborationUpdateSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });
});
