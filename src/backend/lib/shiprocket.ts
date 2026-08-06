import axios, { AxiosInstance, AxiosResponse } from 'axios';

import { clearShiprocketTokenCache, getShiprocketToken } from '@/services/shipping/auth';
import { SHIPROCKET_CONSTANTS } from '@/services/shipping/constants';
import { ShiprocketLogger } from '@/services/shipping/logger';

// Rate Limiting Metrics
const requestTimestamps: number[] = [];
let totalRequestsCount = 0;
let failedRequestsCount = 0;
let rateLimitedCount = 0;

/**
 * Enforces sliding window rate limit (Max 100 requests per minute).
 */
export function checkAndRegisterRateLimit(): boolean {
  const now = Date.now();
  const windowStart = now - SHIPROCKET_CONSTANTS.RATE_LIMIT.WINDOW_MS;

  // Purge timestamps older than 1 minute
  while (requestTimestamps.length > 0 && requestTimestamps[0] < windowStart) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= SHIPROCKET_CONSTANTS.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
    rateLimitedCount++;
    ShiprocketLogger.warn(
      `[RATE_LIMIT_WARNING] Throttling request. ${requestTimestamps.length} requests in the last minute.`,
    );
    return false;
  }

  requestTimestamps.push(now);
  totalRequestsCount++;
  return true;
}

export function getShiprocketMetrics() {
  return {
    totalRequests: totalRequestsCount,
    failedRequests: failedRequestsCount,
    rateLimitedRequests: rateLimitedCount,
    activeRequestsInWindow: requestTimestamps.length,
  };
}

/**
 * Singleton Axios Instance for Shiprocket API
 * Configured with timeout, Bearer token injection, sliding-window rate limiting,
 * exponential backoff retries, and centralized logger metrics.
 */
export const shiprocketClient: AxiosInstance = axios.create({
  baseURL: SHIPROCKET_CONSTANTS.BASE_URL,
  timeout: SHIPROCKET_CONSTANTS.REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor: Injects valid token, checks rate limits, and records metrics.
 */
shiprocketClient.interceptors.request.use(
  async (config) => {
    // Check Rate Limiter
    const isAllowed = checkAndRegisterRateLimit();
    if (!isAllowed) {
      throw new Error(SHIPROCKET_CONSTANTS.ERRORS.RATE_LIMIT_EXCEEDED);
    }

    // Skip token injection for login endpoint
    if (config.url?.includes(SHIPROCKET_CONSTANTS.ENDPOINTS.AUTH_LOGIN)) {
      return config;
    }

    try {
      const token = await getShiprocketToken();
      config.headers.Authorization = `Bearer ${token}`;
      (config as any)._startTime = Date.now();
    } catch (err: any) {
      failedRequestsCount++;
      ShiprocketLogger.error('[SHIPROCKET_CLIENT_INTERCEPTOR_ERROR]', undefined, {
        error: err.message,
      });
      throw err;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response Interceptor: Retries 401 (token refresh) and transient 5xx server errors with exponential backoff.
 */
shiprocketClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const startTime = (response.config as any)._startTime;
    const latencyMs = startTime ? Date.now() - startTime : undefined;

    ShiprocketLogger.metric(
      `Shiprocket API Call Success: ${response.config.method?.toUpperCase()} ${response.config.url}`,
      undefined,
      { status: response.status, latencyMs },
    );

    return response;
  },
  async (error) => {
    failedRequestsCount++;
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 1. Handle 401 Unauthorized (Token Expiration & Refresh)
    if (
      error.response?.status === 401 &&
      !originalRequest._retryAuth &&
      !originalRequest.url?.includes(SHIPROCKET_CONSTANTS.ENDPOINTS.AUTH_LOGIN)
    ) {
      originalRequest._retryAuth = true;
      ShiprocketLogger.warn(
        '[SHIPROCKET_CLIENT] Encountered 401 Unauthorized. Refreshing token...',
      );

      try {
        clearShiprocketTokenCache();
        const newToken = await getShiprocketToken(true);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return shiprocketClient(originalRequest);
      } catch (retryErr) {
        ShiprocketLogger.error('[SHIPROCKET_CLIENT_RETRY_FAILED] Token refresh retry failed.');
        return Promise.reject(retryErr);
      }
    }

    // 2. Handle Transient 5xx Errors with Exponential Backoff Retry Strategy
    const isServerError = error.response?.status >= 500 && error.response?.status <= 599;
    const isNetworkTimeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    const currentRetryCount = originalRequest._retryCount || 0;

    if (
      (isServerError || isNetworkTimeout) &&
      currentRetryCount < SHIPROCKET_CONSTANTS.CLIENT_RETRY.MAX_RETRIES
    ) {
      originalRequest._retryCount = currentRetryCount + 1;
      const delayMs =
        SHIPROCKET_CONSTANTS.CLIENT_RETRY.INITIAL_DELAY_MS *
        Math.pow(SHIPROCKET_CONSTANTS.CLIENT_RETRY.BACKOFF_FACTOR, currentRetryCount);

      ShiprocketLogger.warn(
        `[SHIPROCKET_CLIENT_RETRY] Retrying request (${originalRequest._retryCount}/${SHIPROCKET_CONSTANTS.CLIENT_RETRY.MAX_RETRIES}) after ${delayMs}ms due to ${error.message}`,
        undefined,
        { url: originalRequest.url, status: error.response?.status },
      );

      await new Promise((res) => setTimeout(res, delayMs));
      return shiprocketClient(originalRequest);
    }

    ShiprocketLogger.error(
      `[SHIPROCKET_CLIENT_ERROR] API Request Failed: ${error.message}`,
      undefined,
      {
        url: originalRequest.url,
        status: error.response?.status,
        responseData: error.response?.data,
      },
    );

    return Promise.reject(error);
  },
);

export default shiprocketClient;
