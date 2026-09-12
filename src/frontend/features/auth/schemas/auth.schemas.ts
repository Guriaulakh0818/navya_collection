import { z } from 'zod';

export const sendOtpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  hp_field: z.string().optional(),
  website: z.string().optional(),
  phone_confirmation: z.string().optional(),
});

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  otp: z.string().min(1, 'OTP code is required').trim().length(6, 'OTP must be 6 digits'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});
