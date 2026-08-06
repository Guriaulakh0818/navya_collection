import { sendEmailOtp } from '@/backend/lib/brevo';
import { OtpService } from '@/frontend/features/auth/services/otp.service';

export async function testEmailAuthModule() {
  // Test email format validation
  if (!OtpService.isValidEmail('user@navyacollection.store')) {
    throw new Error('Valid email address check failed.');
  }

  if (OtpService.isValidEmail('invalid_email_string')) {
    throw new Error('Invalid email check failed.');
  }

  // Test OTP generation
  const otp = OtpService.generateSecureOtp();
  if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    throw new Error(`Generated OTP must be 6 numeric digits, got: ${otp}`);
  }

  // Test Email dispatch API function signature
  const res = await sendEmailOtp('test@navyacollection.store', otp);
  if (typeof res.success !== 'boolean') {
    throw new Error('Email OTP result must return a boolean success property.');
  }

  return true;
}

testEmailAuthModule();
