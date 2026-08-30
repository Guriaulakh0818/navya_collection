export interface Env {
  DATABASE_URL: string;
  DATABASE_ENV: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  SHIPROCKET_EMAIL: string;
  SHIPROCKET_PASSWORD: string;
  MSG91_AUTH_KEY: string;
  MSG91_TEMPLATE_ID: string;
  MSG91_SENDER_ID: string;
  OTP_LENGTH: number;
  OTP_EXPIRY_MINUTES: number;
  OTP_MAX_ATTEMPTS: number;
  OTP_RESEND_LIMIT: number;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  GOOGLE_ANALYTICS_ID: string;
}

export const env: Env = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  DATABASE_ENV: process.env.DATABASE_ENV || 'local',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  SHIPROCKET_EMAIL: process.env.SHIPROCKET_EMAIL || '',
  SHIPROCKET_PASSWORD: process.env.SHIPROCKET_PASSWORD || '',
  MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY || '',
  MSG91_TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID || '',
  MSG91_SENDER_ID: process.env.MSG91_SENDER_ID || 'NAVYAC',
  OTP_LENGTH: parseInt(process.env.OTP_LENGTH || '4', 10),
  OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES || '1', 10),
  OTP_MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10),
  OTP_RESEND_LIMIT: parseInt(process.env.OTP_RESEND_LIMIT || '3', 10),
  JWT_SECRET:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === 'production'
      ? ''
      : 'dev_jwt_secret_key_change_in_production_32chars'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID || '',
};
