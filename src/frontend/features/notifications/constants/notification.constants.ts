export const NOTIFICATION_CONSTANTS = {
  EMAIL_PROVIDER: {
    API_URL: 'https://api.brevo.com/v3',
    SMS_ENDPOINT: '/transactionalSMS/sms',
    EMAIL_ENDPOINT: '/smtp/email',
    SENDER_NAME: process.env.BREVO_SENDER_NAME || 'Navya Collection',
    SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || 'support@navyacollection.in',
    SMS_SENDER: process.env.BREVO_SMS_SENDER || 'NAVYA',
  },
  BREVO: {
    API_URL: 'https://api.brevo.com/v3',
    SMS_ENDPOINT: '/transactionalSMS/sms',
    EMAIL_ENDPOINT: '/smtp/email',
    SENDER_NAME: process.env.BREVO_SENDER_NAME || 'Navya Collection',
    SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || 'support@navyacollection.in',
    SMS_SENDER: process.env.BREVO_SMS_SENDER || 'NAVYA',
  },
  ADMIN: {
    EMAIL:
      process.env.ADMIN_ALERT_EMAIL || process.env.BREVO_SENDER_EMAIL || 'admin@navyacollection.in',
    MOBILE: process.env.ADMIN_ALERT_MOBILE || '9991983125',
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY_MS: 1000,
    BACKOFF_FACTOR: 2,
  },
  DEFAULT_CURRENCY_SYMBOL: '₹',
};
