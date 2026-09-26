import { z } from 'zod';

const cleanString = (val: unknown) =>
  typeof val === 'string' && val.trim() === '' ? undefined : val;

const envSchema = z.object({
  NODE_ENV: z.preprocess(
    cleanString,
    z.enum(['development', 'production', 'test']).default('development'),
  ),
  DATABASE_ENV: z.preprocess(
    (val) => {
      const cleaned = cleanString(val);
      if (!cleaned) return process.env.VERCEL === '1' ? 'production' : 'local';
      return cleaned;
    },
    z.enum(['local', 'development', 'test', 'staging', 'production']).default('local'),
  ),
  NEXT_PUBLIC_APP_URL: z.preprocess(
    cleanString,
    z.string().url().default('https://navyacollection.store'),
  ),
  NEXT_PUBLIC_ADMIN_URL: z.preprocess(
    cleanString,
    z.string().url().default('https://admin.navyacollection.store'),
  ),
  NEXT_PUBLIC_SELLER_URL: z.preprocess(
    cleanString,
    z.string().url().default('https://seller.navyacollection.store'),
  ),
  DATABASE_URL: z.preprocess(
    (val) => {
      const cleaned = cleanString(val);
      return (
        cleaned ||
        process.env.POSTGRES_PRISMA_URL ||
        process.env.POSTGRES_URL ||
        'postgresql://placeholder:placeholder@localhost:5432/placeholder'
      );
    },
    z.string().min(1, 'DATABASE_URL is required'),
  ),
  DIRECT_URL: z.preprocess(cleanString, z.string().optional()),
  JWT_SECRET: z.preprocess((val) => {
    const cleaned = cleanString(val);
    if (!cleaned || (typeof cleaned === 'string' && cleaned.length < 16)) {
      return 'dev_jwt_secret_key_change_in_production_32chars';
    }
    return cleaned;
  }, z.string().min(16).default('dev_jwt_secret_key_change_in_production_32chars')),

  // Brevo Email & SMS
  BREVO_API_KEY: z.preprocess(cleanString, z.string().optional()),
  BREVO_SENDER_EMAIL: z.preprocess((val) => {
    const cleaned = cleanString(val);
    return cleaned || 'support@navyacollection.store';
  }, z.string().email().default('support@navyacollection.store')),
  BREVO_SENDER_NAME: z.preprocess(cleanString, z.string().optional().default('Navya Collection')),

  // Razorpay Payment Gateway
  RAZORPAY_KEY_ID: z.preprocess(cleanString, z.string().optional()),
  RAZORPAY_KEY_SECRET: z.preprocess(cleanString, z.string().optional()),

  // Cloudinary Storage
  CLOUDINARY_CLOUD_NAME: z.preprocess(cleanString, z.string().optional()),
  CLOUDINARY_API_KEY: z.preprocess(cleanString, z.string().optional()),
  CLOUDINARY_API_SECRET: z.preprocess(cleanString, z.string().optional()),

  // Shiprocket Shipping
  SHIPROCKET_EMAIL: z.preprocess(cleanString, z.string().optional()),
  SHIPROCKET_PASSWORD: z.preprocess(cleanString, z.string().optional()),
});

export type EnvConfig = z.infer<typeof envSchema>;

let parsedEnv: EnvConfig;

/**
 * Checks for production database markers to prevent accidental connections from local dev.
 */
function isProductionDatabaseUrl(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  // Supabase project ref or host markers for the live production database
  return (
    lower.includes('zisieyoodosjbuocrjqd') ||
    (lower.includes('supabase.com') && !lower.includes('localhost'))
  );
}

export function validateEnvironment(forceReload = false): EnvConfig {
  if (parsedEnv && !forceReload) return parsedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.warn('⚠️ [CONFIG_WARNING] Missing or invalid environment variables:');
    result.error.issues.forEach((err) => {
      console.warn(`  - ${err.path.join('.')}: ${err.message}`);
    });
  }

  const data = result.success
    ? result.data
    : ({
        ...process.env,
        DATABASE_URL:
          process.env.DATABASE_URL ||
          'postgresql://placeholder:placeholder@localhost:5432/placeholder',
      } as unknown as EnvConfig);

  // =========================================================================
  // STRICT ENVIRONMENT SAFETY GUARD
  // Prevent local development / testing from EVER connecting to production DB
  // =========================================================================
  const isDeployedProduction =
    process.env.VERCEL === '1' ||
    process.env.NODE_ENV === 'production' ||
    data.DATABASE_ENV === 'production';

  // Strict check: Only treat as local development if NOT running in deployed production
  const isLocalDev =
    !isDeployedProduction &&
    (data.DATABASE_ENV === 'local' ||
      data.NODE_ENV === 'development' ||
      data.DATABASE_ENV === 'development');

  const pointsToProduction =
    isProductionDatabaseUrl(data.DATABASE_URL) || isProductionDatabaseUrl(data.DIRECT_URL);

  if (isLocalDev && pointsToProduction) {
    const errorMsg =
      '⛔ [DATABASE_SAFETY_FATAL] Refusing to connect to production database from local development environment.\n' +
      'Please update your .env.local with your isolated local PostgreSQL database URL.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (
    data.DATABASE_ENV === 'production' &&
    data.NODE_ENV === 'development' &&
    !process.env.VERCEL
  ) {
    const errorMsg =
      '⛔ [DATABASE_SAFETY_FATAL] DATABASE_ENV is set to "production" but NODE_ENV is not "production".\n' +
      'Operation blocked for safety.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // =========================================================================
  // PRODUCTION ENVIRONMENT INTEGRITY CHECKS
  // Prevent misconfigured development credentials from running in production
  // =========================================================================
  if (isDeployedProduction && !process.env.SKIP_PROD_ENV_VALIDATION) {
    const dbUrlLower = (data.DATABASE_URL || '').toLowerCase();
    if (dbUrlLower.includes('localhost') || dbUrlLower.includes('127.0.0.1')) {
      console.warn(
        '⚠️ [PRODUCTION_CONFIG_WARNING] Production database URL is currently set to localhost fallback during build/runtime. Ensure DATABASE_URL is set in Vercel project settings.',
      );
    }

    if (data.RAZORPAY_KEY_ID && data.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
      console.warn(
        '⚠️ [PRODUCTION_PAYMENT_WARNING] RAZORPAY_KEY_ID is configured with a test key (rzp_test_*) in production. Ensure live keys (rzp_live_*) are set before processing real payments.',
      );
    }
  }

  parsedEnv = data;
  return parsedEnv;
}

// Auto-run non-blocking validation on module import
validateEnvironment();
