import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateEnv } from './env';

describe('Environment Validation', () => {
  beforeEach(() => {
    // Clear all environment variable stubs before each test
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    // Restore original environment after each test
    vi.unstubAllEnvs();
  });

  it('should validate correct environment variables', () => {
    vi.stubEnv('DATABASE_URL', 'file:./dev.db');
    vi.stubEnv('JWT_SECRET', 'a'.repeat(32));
    vi.stubEnv('PORT', '4000');
    vi.stubEnv('NODE_ENV', 'development');

    const env = validateEnv();

    expect(env.DATABASE_URL).toBe('file:./dev.db');
    expect(env.JWT_SECRET).toBe('a'.repeat(32));
    expect(env.PORT).toBe('4000');
    expect(env.NODE_ENV).toBe('development');
  });

  it('should use default values for optional variables', () => {
    vi.stubEnv('DATABASE_URL', 'file:./dev.db');
    vi.stubEnv('JWT_SECRET', 'a'.repeat(32));
    vi.stubEnv('PORT', undefined);
    vi.stubEnv('NODE_ENV', undefined);

    const env = validateEnv();

    expect(env.PORT).toBe('4000');
    expect(env.NODE_ENV).toBe('development');
  });

  it('should throw error if DATABASE_URL is missing', () => {
    vi.stubEnv('DATABASE_URL', undefined);
    vi.stubEnv('JWT_SECRET', 'a'.repeat(32));

    expect(() => validateEnv()).toThrow('Invalid environment variables');
  });

  it('should throw error if JWT_SECRET is too short', () => {
    vi.stubEnv('DATABASE_URL', 'file:./dev.db');
    vi.stubEnv('JWT_SECRET', 'short');

    expect(() => validateEnv()).toThrow('Invalid environment variables');
  });

  it('should accept valid NODE_ENV values', () => {
    const validEnvs = ['development', 'production', 'test'] as const;

    validEnvs.forEach((nodeEnv) => {
      vi.stubEnv('DATABASE_URL', 'file:./dev.db');
      vi.stubEnv('JWT_SECRET', 'a'.repeat(32));
      vi.stubEnv('NODE_ENV', nodeEnv);

      const env = validateEnv();
      expect(env.NODE_ENV).toBe(nodeEnv);
    });
  });
});
