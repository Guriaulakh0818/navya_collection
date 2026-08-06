export function captureSecurityError(error: Error | string, extraContext?: Record<string, any>) {
  const message = typeof error === 'string' ? error : error.message;
  const stack = error instanceof Error ? error.stack : undefined;

  const eventPayload = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message,
    ...(stack ? { stack } : {}),
    ...(extraContext ? { context: extraContext } : {}),
  };

  // Production Sentry / SIEM forwarding hook
  if (process.env.SENTRY_DSN) {
    // Sentry SDK captureException call hook
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('[SECURITY_MONITORING_EVENT]', JSON.stringify(eventPayload));
  }

  return eventPayload;
}
