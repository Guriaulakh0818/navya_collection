import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_ENV: z.enum(['local', 'development', 'test', 'staging', 'production']).default('local'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('https://navyacollection.store'),
  NEXT_PUBLIC_ADMIN_URL: z.string().url().default('https://admin.navyacollection.store'),
  NEXT_PUBLIC_SELLER_URL: z.string().url().default('https://seller.navyacollection.store'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters')
    .default('dev_jwt_secret_key_change_in_production_32chars'),

  // Brevo Email & SMS
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().optional().default('support@navyacollection.in'),
  BREVO_SENDER_NAME: z.string().optional().default('Navya Collection'),

  // Razorpay Payment Gateway
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  // Cloudinary Storage
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Shiprocket Shipping
  SHIPROCKET_EMAIL: z.string().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
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
    console.error('❌ [SECURITY_FATAL] Invalid or missing environment variables:');
    result.error.issues.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Application failed to start due to missing environment variables.');
    }
  }

  const data = result.success ? result.data : (process.env as unknown as EnvConfig);

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
