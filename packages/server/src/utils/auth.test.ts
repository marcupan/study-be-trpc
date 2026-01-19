import { describe, expect, it } from 'vitest';

import { comparePassword, generateToken, hashPassword, verifyToken } from './auth';

describe('Auth Utilities', () => {
  describe('JWT Token Generation and Verification', () => {
    it('should generate a valid JWT token', () => {
      const user = { id: 'test-user-id', email: 'test@example.com' };
      const token = generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify a valid token', () => {
      const user = { id: 'test-user-id', email: 'test@example.com' };
      const token = generateToken(user);

      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.id).toBe(user.id);
      expect(decoded?.email).toBe(user.email);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should return null for expired token', () => {
      // Create a token that's already expired
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.invalid';

      const decoded = verifyToken(expiredToken);

      expect(decoded).toBeNull();
    });
  });

  describe('Password Hashing and Comparison', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // bcrypt uses random salt
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const isValid = await comparePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);

      const isValid = await comparePassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });
});
