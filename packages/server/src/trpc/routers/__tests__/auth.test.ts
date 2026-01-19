import { beforeEach, describe, expect, it } from 'vitest';

import { createCaller, prisma, setupTestDatabase } from './test-helpers';
import { hashPassword } from '../../../utils/auth';


// TODO: Set up test database schema before running these tests
// Run: cd packages/server && DATABASE_URL="file:./test.db" npx prisma db push
describe.skip('Auth Router - Integration Tests', () => {
  setupTestDatabase();

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const caller = createCaller();

      const result = await caller.auth.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(result.user).toHaveProperty('id');
      expect(typeof result.token).toBe('string');
    });

    it('should register a user without a name', async () => {
      const caller = createCaller();

      const result = await caller.auth.register({
        email: 'test2@example.com',
        password: 'password123',
      });

      expect(result.user).toMatchObject({
        email: 'test2@example.com',
        name: null,
      });
    });

    it('should throw CONFLICT error if user already exists', async () => {
      const caller = createCaller();

      // Register first user
      await caller.auth.register({
        email: 'duplicate@example.com',
        password: 'password123',
      });

      // Try to register with same email
      await expect(
        caller.auth.register({
          email: 'duplicate@example.com',
          password: 'password456',
        })
      ).rejects.toThrow('User with this email already exists');
    });

    it('should hash the password before storing', async () => {
      const caller = createCaller();

      await caller.auth.register({
        email: 'hash-test@example.com',
        password: 'password123',
      });

      const user = await prisma.user.findUnique({
        where: { email: 'hash-test@example.com' },
      });

      expect(user).not.toBeNull();
      if (user) {
        expect(user.password).not.toBe('password123');
        expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
      }
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a test user
      await prisma.user.create({
        data: {
          email: 'login-test@example.com',
          password: await hashPassword('password123'),
          name: 'Login Test',
        },
      });
    });

    it('should login successfully with correct credentials', async () => {
      const caller = createCaller();

      const result = await caller.auth.login({
        email: 'login-test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user).toMatchObject({
        email: 'login-test@example.com',
        name: 'Login Test',
      });
    });

    it('should throw NOT_FOUND error for non-existent user', async () => {
      const caller = createCaller();

      await expect(
        caller.auth.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('User not found');
    });

    it('should throw UNAUTHORIZED error for invalid password', async () => {
      const caller = createCaller();

      await expect(
        caller.auth.login({
          email: 'login-test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid password');
    });
  });

  describe('me', () => {
    it('should return current user when authenticated', async () => {
      // First register a user
      const registerCaller = createCaller();
      const { token, user } = await registerCaller.auth.register({
        email: 'me-test@example.com',
        password: 'password123',
        name: 'Me Test',
      });

      // Now use the token to call me
      const caller = createCaller(token);
      const result = await caller.auth.me();

      expect(result).toMatchObject({
        id: user.id,
        email: user.email,
        name: user.name,
      });
    });

    it('should throw UNAUTHORIZED error when not authenticated', async () => {
      const caller = createCaller(); // No token

      await expect(caller.auth.me()).rejects.toThrow('UNAUTHORIZED');
    });

    it('should throw UNAUTHORIZED error with invalid token', async () => {
      const caller = createCaller('invalid-token');

      await expect(caller.auth.me()).rejects.toThrow();
    });
  });
});
