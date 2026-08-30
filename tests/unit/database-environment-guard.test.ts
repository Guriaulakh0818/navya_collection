import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { validateEnvironment } from '../../src/backend/security/env.config';

describe('Database Environment Safety Guards', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should allow valid local database configuration', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_ENV = 'local';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/navya_collection_local';
    process.env.JWT_SECRET = 'a_very_long_test_secret_key_minimum_16_chars';

    expect(() => validateEnvironment(true)).not.toThrow();
  });

  it('should block local dev if DATABASE_URL points to production database', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_ENV = 'local';
    process.env.DATABASE_URL =
      'postgresql://postgres.zisieyoodosjbuocrjqd:password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';
    process.env.JWT_SECRET = 'a_very_long_test_secret_key_minimum_16_chars';

    expect(() => validateEnvironment(true)).toThrow(/Refusing to connect to production database/);
  });

  it('should block if DATABASE_ENV is production but NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_ENV = 'production';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/navya_collection_local';
    process.env.JWT_SECRET = 'a_very_long_test_secret_key_minimum_16_chars';

    expect(() => validateEnvironment(true)).toThrow(
      /DATABASE_ENV is set to "production" but NODE_ENV is not "production"/,
    );
  });
});
