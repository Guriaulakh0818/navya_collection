import {
  addCartItemSchema,
  addressSchema,
  adminLoginSchema,
  applyCouponSchema,
  captureSecurityError,
  categorySchema,
  checkRateLimit,
  contactFormSchema,
  createCouponSchema,
  createOrderSchema,
  createProductSchema,
  logSecurityEvent,
  orderStatusUpdateSchema,
  RATE_LIMIT_POLICIES,
  sanitizeObject,
  sanitizeString,
  searchQuerySchema,
  sendOtpSchema,
  submitReviewSchema,
  updateProfileSchema,
  validateCsrfOrigin,
  validateEnvironment,
  validateImageUpload,
  verifyBotProtectionToken,
  verifyOtpSchema,
} from '../../backend/security';

export async function testSecurityModule() {
  console.log('--- Running Enterprise Security Unit Tests ---');

  // 1. Rate Limiting Tests
  const identifier = `test_ip_${Date.now()}`;
  for (let i = 0; i < 5; i++) {
    const res = checkRateLimit(identifier, 5, 60000);
    if (!res.allowed) {
      throw new Error(`Rate limiter incorrectly blocked request ${i + 1} when limit was 5.`);
    }
  }

  const blockedRes = checkRateLimit(identifier, 5, 60000);
  if (blockedRes.allowed) {
    throw new Error('Rate limiter failed to block 6th request when limit was 5.');
  }

  // Verify predefined policies exist and match specification
  if (
    RATE_LIMIT_POLICIES.OTP.limit !== 5 ||
    RATE_LIMIT_POLICIES.LOGIN.limit !== 10 ||
    RATE_LIMIT_POLICIES.SEARCH.limit !== 100 ||
    RATE_LIMIT_POLICIES.CHECKOUT.limit !== 10 ||
    RATE_LIMIT_POLICIES.CONTACT.limit !== 10 ||
    RATE_LIMIT_POLICIES.REVIEWS.limit !== 10 ||
    RATE_LIMIT_POLICIES.ADMIN_API.limit !== 30
  ) {
    throw new Error('Rate limit policy thresholds do not match OWASP enterprise specifications.');
  }

  // 2. XSS Sanitization Tests
  const maliciousInput =
    '<script>alert("XSS Attack!");</script><img src="x" onerror="alert(\'XSS\')"/>Hello World';
  const cleanInput = sanitizeString(maliciousInput);
  if (cleanInput.includes('<script>') || cleanInput.includes('onerror=')) {
    throw new Error(`XSS Sanitizer failed to clean malicious input: '${cleanInput}'`);
  }

  const maliciousObj = {
    name: '<script>evil()</script>Navya User',
    email: 'user@example.com',
    comment: 'Good product <iframe src="http://evil.com"></iframe>',
  };
  const cleanObj = sanitizeObject(maliciousObj);
  if (cleanObj.name.includes('<script>') || cleanObj.comment.includes('<iframe')) {
    throw new Error('sanitizeObject failed to clean nested object fields.');
  }

  // 3. File Upload Safety Tests
  const validFile = validateImageUpload('shirt-photo.jpg', 'image/jpeg', 2 * 1024 * 1024);
  if (!validFile.valid) {
    throw new Error(`File validator rejected valid JPG file: ${validFile.reason}`);
  }

  const invalidMime = validateImageUpload('script.js', 'application/javascript', 1024);
  if (invalidMime.valid) {
    throw new Error('File validator failed to reject application/javascript MIME type.');
  }

  const executableFile = validateImageUpload('payload.exe', 'image/jpeg', 1024);
  if (executableFile.valid) {
    throw new Error('File validator failed to reject executable file extension (.exe).');
  }

  const oversizedFile = validateImageUpload('large.jpg', 'image/jpeg', 10 * 1024 * 1024);
  if (oversizedFile.valid) {
    throw new Error('File validator failed to reject file exceeding 5MB limit.');
  }

  // 4. Zod Domain Validation Schemas Tests
  const validOtpReq = sendOtpSchema.safeParse({ email: 'CUSTOMER@EXAMPLE.COM' });
  if (!validOtpReq.success || validOtpReq.data.email !== 'customer@example.com') {
    throw new Error('sendOtpSchema failed valid email parsing & lowercasing.');
  }

  const invalidOtpReq = sendOtpSchema.safeParse({ email: 'not-an-email' });
  if (invalidOtpReq.success) {
    throw new Error('sendOtpSchema failed to reject malformed email address.');
  }

  const validOrderReq = createOrderSchema.safeParse({
    addressId: 'addr-101',
    paymentMethod: 'COD',
  });
  if (!validOrderReq.success) {
    throw new Error('createOrderSchema failed valid COD order payload parsing.');
  }

  const validAdminLogin = adminLoginSchema.safeParse({
    email: 'ADMIN@NAVYACOLLECTION.IN',
    password: 'superSecurePassword123',
  });
  if (!validAdminLogin.success || validAdminLogin.data.email !== 'admin@navyacollection.in') {
    throw new Error('adminLoginSchema failed valid payload validation.');
  }

  const validContactReq = contactFormSchema.safeParse({
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    subject: 'Inquiry about Silk Sarees',
    message: 'Hello, I would like to know if you deliver to Mumbai within 2 days.',
  });
  if (!validContactReq.success) {
    throw new Error('contactFormSchema failed valid contact form parsing.');
  }

  const validReviewReq = submitReviewSchema.safeParse({
    productId: 'prod-001',
    rating: 5,
    comment: 'Exquisite silk saree! Highly recommended.',
  });
  if (!validReviewReq.success) {
    throw new Error('submitReviewSchema failed valid review parsing.');
  }

  const validCouponReq = applyCouponSchema.safeParse({ code: 'welcome10' });
  if (!validCouponReq.success || validCouponReq.data.code !== 'WELCOME10') {
    throw new Error('applyCouponSchema failed code uppercase transformation.');
  }

  // 5. Audit Logger Redaction Tests
  const auditEntry = logSecurityEvent('AUTH_FAILURE', 'Failed login attempt', {
    email: 'user@example.com',
    password: 'superSecretPassword123',
    otp: '123456',
    razorpaySignature: 'sig_secret_xyz',
  });

  if (
    auditEntry.meta?.password !== '[REDACTED]' ||
    auditEntry.meta?.otp !== '[REDACTED]' ||
    auditEntry.meta?.razorpaySignature !== '[REDACTED]'
  ) {
    throw new Error('logSecurityEvent failed to redact sensitive credentials!');
  }

  // 6. CSRF Origin Validation Tests
  const validCsrf = validateCsrfOrigin(
    '/api/v1/orders',
    'POST',
    'https://navyacollection.in',
    'https://navyacollection.in/checkout',
  );
  if (!validCsrf) {
    throw new Error('validateCsrfOrigin rejected valid matching origin domain.');
  }

  const webhookCsrf = validateCsrfOrigin('/api/v1/webhooks/razorpay', 'POST', null, null);
  if (!webhookCsrf) {
    throw new Error('validateCsrfOrigin failed to exempt webhook routes from CSRF origin check.');
  }

  // 7. Bot Protection Architecture Test
  const botResult = await verifyBotProtectionToken(undefined, 'turnstile');
  if (!botResult.isHuman && process.env.NODE_ENV !== 'production') {
    throw new Error('verifyBotProtectionToken failed dev mode verification bypass.');
  }

  // 8. Environment Configuration Audit Test
  const envVars = validateEnvironment();
  if (!envVars) {
    throw new Error('validateEnvironment returned invalid environment configuration object.');
  }

  // 9. Security Monitoring Sentry Integration Test
  const sentryEvent = captureSecurityError(new Error('Test Security Exception'), {
    ip: '127.0.0.1',
  });
  if (!sentryEvent.message || sentryEvent.message !== 'Test Security Exception') {
    throw new Error('captureSecurityError failed event payload creation.');
  }

  console.log('✅ All Enterprise Security unit tests passed successfully!');
  return true;
}

testSecurityModule();
