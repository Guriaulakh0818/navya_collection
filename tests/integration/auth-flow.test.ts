import { describe, expect, it } from 'vitest';

import { SendOtpSchema, VerifyOtpSchema } from '../../src/backend/security/zod-schemas';

describe('Integration: Authentication Flow Validation & Processing', () => {
  it('validates step 1: OTP Request with valid mobile', () => {
    const payload = { mobile: '9876543210' };
    const parsed = SendOtpSchema.safeParse(payload);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.mobile).toBe('9876543210');
    }
  });

  it('validates step 2: OTP Verification with 6-digit OTP', () => {
    const payload = { mobile: '9876543210', otp: '556677' };
    const parsed = VerifyOtpSchema.safeParse(payload);

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.otp).toBe('556677');
    }
  });

  it('rejects invalid OTP attempts safely', () => {
    const invalidPayload = { mobile: '9876543210', otp: 'abc' };
    const parsed = VerifyOtpSchema.safeParse(invalidPayload);

    expect(parsed.success).toBe(false);
  });
});
