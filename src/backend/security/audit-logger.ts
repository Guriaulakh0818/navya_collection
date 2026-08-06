export type SecurityEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CSRF_VIOLATION'
  | 'PAYMENT_FAILURE'
  | 'ADMIN_ACTION'
  | 'SUSPICIOUS_ACTIVITY';

const SENSITIVE_KEYS = [
  'password',
  'otp',
  'hashedotp',
  'secret',
  'razorpaysignature',
  'cvv',
  'cardnumber',
  'token',
  'authorization',
];

/**
 * Redacts sensitive credentials (passwords, OTPs, secret keys) before logging
 */
function sanitizeMeta(meta: any): any {
  if (!meta || typeof meta !== 'object') return meta;

  if (Array.isArray(meta)) {
    return meta.map((item) => sanitizeMeta(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMeta(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function logSecurityEvent(
  type: SecurityEventType,
  message: string,
  meta?: Record<string, any>,
) {
  const timestamp = new Date().toISOString();
  const safeMeta = meta ? sanitizeMeta(meta) : undefined;

  const logPayload = {
    timestamp,
    type,
    message,
    ...(safeMeta ? { meta: safeMeta } : {}),
  };

  if (
    type === 'AUTH_FAILURE' ||
    type === 'RATE_LIMIT_EXCEEDED' ||
    type === 'CSRF_VIOLATION' ||
    type === 'SUSPICIOUS_ACTIVITY'
  ) {
    console.warn(
      `🚨 [SECURITY_WARN] ${type} | ${message}`,
      safeMeta ? JSON.stringify(safeMeta) : '',
    );
  } else {
    console.log(
      `🔒 [SECURITY_AUDIT] ${type} | ${message}`,
      safeMeta ? JSON.stringify(safeMeta) : '',
    );
  }

  return logPayload;
}
