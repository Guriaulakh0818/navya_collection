import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('https://navyacollection.in'),
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

export function validateEnvironment(): EnvConfig {
  if (parsedEnv) return parsedEnv;

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

  parsedEnv = result.success ? result.data : (process.env as unknown as EnvConfig);
  return parsedEnv;
}

// Auto-run non-blocking validation on module import
validateEnvironment();
