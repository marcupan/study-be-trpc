import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { validateEnv } from './env';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset the environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should validate correct environment variables', () => {
    process.env.DATABASE_URL = 'file:./dev.db';
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.PORT = '4000';
    process.env.NODE_ENV = 'development';

    const env = validateEnv();

    expect(env.DATABASE_URL).toBe('file:./dev.db');
    expect(env.JWT_SECRET).toBe('a'.repeat(32));
    expect(env.PORT).toBe('4000');
    expect(env.NODE_ENV).toBe('development');
  });

  it('should use default values for optional variables', () => {
    process.env.DATABASE_URL = 'file:./dev.db';
    process.env.JWT_SECRET = 'a'.repeat(32);
    delete process.env.PORT;
    delete process.env.NODE_ENV;

    const env = validateEnv();

    expect(env.PORT).toBe('4000');
    expect(env.NODE_ENV).toBe('development');
  });

  it('should throw error if DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    process.env.JWT_SECRET = 'a'.repeat(32);

    expect(() => validateEnv()).toThrow('Invalid environment variables');
  });

  it('should throw error if JWT_SECRET is too short', () => {
    process.env.DATABASE_URL = 'file:./dev.db';
    process.env.JWT_SECRET = 'short';

    expect(() => validateEnv()).toThrow('Invalid environment variables');
  });

  it('should accept valid NODE_ENV values', () => {
    const validEnvs = ['development', 'production', 'test'];

    validEnvs.forEach((nodeEnv) => {
      process.env.DATABASE_URL = 'file:./dev.db';
      process.env.JWT_SECRET = 'a'.repeat(32);
      process.env.NODE_ENV = nodeEnv;

      const env = validateEnv();
      expect(env.NODE_ENV).toBe(nodeEnv);
    });
  });
});
