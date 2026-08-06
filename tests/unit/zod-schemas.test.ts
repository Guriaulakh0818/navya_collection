import { describe, expect, it } from 'vitest';

import { SendOtpSchema, VerifyOtpSchema } from '../../src/backend/security/zod-schemas';

describe('Security Zod Validation Schemas', () => {
  describe('SendOtpSchema', () => {
    it('accepts valid 10-digit Indian mobile numbers', () => {
      const result = SendOtpSchema.safeParse({ mobile: '9876543210' });
      expect(result.success).toBe(true);
    });

    it('rejects non-10 digit numbers', () => {
      const result = SendOtpSchema.safeParse({ mobile: '1234' });
      expect(result.success).toBe(false);
    });
  });

  describe('VerifyOtpSchema', () => {
    it('accepts valid 6-digit numeric OTP and mobile number', () => {
      const result = VerifyOtpSchema.safeParse({ mobile: '9876543210', otp: '123456' });
      expect(result.success).toBe(true);
    });

    it('rejects OTP with non-numeric or invalid length', () => {
      const result = VerifyOtpSchema.safeParse({ mobile: '9876543210', otp: '12345' });
      expect(result.success).toBe(false);
    });
  });
});
