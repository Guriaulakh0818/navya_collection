import { NextResponse } from 'next/server';

/**
 * Standard user-friendly error message for 500 server errors.
 * Never expose raw database errors, schema issues, or technical stack traces to end-users.
 */
export const USER_FRIENDLY_SERVER_ERROR = 'Server error: please try again after sometime';

interface ErrorHandlerOptions {
  status?: number;
  isAdmin?: boolean;
  userMessage?: string;
}

/**
 * Centralized API Error Handler:
 * - Logs the full technical error to server console for troubleshooting.
 * - Always returns a user-friendly message to real-time users.
 * - Avoids leaking database details, column errors, or raw code exceptions.
 */
export function handleApiError(
  error: unknown,
  context: string,
  options?: ErrorHandlerOptions,
): NextResponse {
  const err = error as any;
  console.error(`❌ [${context}]:`, err);

  const status = options?.status || 500;
  const userMessage =
    options?.userMessage ||
    (options?.isAdmin
      ? `[${context}]: ${err?.message || 'Server operation error'}`
      : USER_FRIENDLY_SERVER_ERROR);

  const responseBody: Record<string, any> = {
    success: false,
    message: userMessage,
  };

  // When admin requests with isAdmin flag or in development mode, include debug field
  if ((options?.isAdmin || process.env.NODE_ENV === 'development') && err?.message) {
    responseBody.debug = err.message;
  }

  return NextResponse.json(responseBody, { status });
}
