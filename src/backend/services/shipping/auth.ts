import axios from 'axios';

import { SHIPROCKET_CONSTANTS } from './constants';
import type {
  ShiprocketAuthResponse,
  ShiprocketTokenCache,
  StandardShippingResponse,
} from './types';

/**
 * In-Memory Token Cache
 * Token is stored safely in server memory and auto-refreshed before 10-day expiry.
 * Never exposed to frontend clients.
 */
let tokenCache: ShiprocketTokenCache | null = null;
let activeAuthPromise: Promise<string> | null = null;

/**
 * Validates and returns Shiprocket environment credentials.
 */
export function getShiprocketCredentials(): { email: string; password: string } {
  const email = process.env.SHIPROCKET_EMAIL || '';
  const password = process.env.SHIPROCKET_PASSWORD || '';

  if (!email || !password) {
    throw new Error(SHIPROCKET_CONSTANTS.ERRORS.MISSING_CREDENTIALS);
  }

  return { email, password };
}

/**
 * Directly authenticates with Shiprocket API using credentials to fetch a new token.
 */
export async function authenticateShiprocket(): Promise<
  StandardShippingResponse<ShiprocketAuthResponse>
> {
  try {
    const credentials = getShiprocketCredentials();
    const loginUrl = `${SHIPROCKET_CONSTANTS.BASE_URL}${SHIPROCKET_CONSTANTS.ENDPOINTS.AUTH_LOGIN}`;

    console.log('[SHIPROCKET_AUTH] Initiating authentication request...');

    const response = await axios.post<ShiprocketAuthResponse>(
      loginUrl,
      {
        email: credentials.email,
        password: credentials.password,
      },
      {
        timeout: SHIPROCKET_CONSTANTS.REQUEST_TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.data || !response.data.token) {
      throw new Error('Received invalid authentication response structure from Shiprocket.');
    }

    const now = Date.now();
    tokenCache = {
      token: response.data.token,
      createdAt: now,
      expiresAt: now + SHIPROCKET_CONSTANTS.TOKEN_TTL_MS,
    };

    console.log(
      `[SHIPROCKET_AUTH_SUCCESS] Authenticated successfully as ${response.data.email}. Token cached until ${new Date(tokenCache.expiresAt).toISOString()}.`,
    );

    return {
      success: true,
      message: 'Authenticated with Shiprocket successfully.',
      statusCode: 200,
      data: response.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || error.message || SHIPROCKET_CONSTANTS.ERRORS.AUTH_FAILED;

    console.error('[SHIPROCKET_AUTH_ERROR]', {
      status: error.response?.status,
      message: errorMessage,
      data: error.response?.data,
    });

    return {
      success: false,
      message: errorMessage,
      statusCode: error.response?.status || 500,
      error: {
        code: 'SHIPROCKET_AUTH_FAILURE',
        details: error.response?.data || error.message,
      },
    };
  }
}

/**
 * Returns a valid cached Shiprocket bearer token.
 * Automatically authenticates or refreshes token if missing, expired, or near expiration.
 * Prevents concurrent authentication requests via Promise deduplication.
 */
export async function getShiprocketToken(forceRefresh = false): Promise<string> {
  const now = Date.now();

  // Return cached token if valid and not forcing refresh
  if (!forceRefresh && tokenCache && tokenCache.expiresAt > now) {
    return tokenCache.token;
  }

  // Deduplicate concurrent authentication calls
  if (activeAuthPromise) {
    return activeAuthPromise;
  }

  activeAuthPromise = (async () => {
    try {
      const authResult = await authenticateShiprocket();
      if (!authResult.success || !authResult.data?.token) {
        throw new Error(authResult.message || SHIPROCKET_CONSTANTS.ERRORS.AUTH_FAILED);
      }
      return authResult.data.token;
    } finally {
      activeAuthPromise = null;
    }
  })();

  return activeAuthPromise;
}

/**
 * Manually clears the in-memory token cache.
 */
export function clearShiprocketTokenCache(): void {
  tokenCache = null;
  console.log('[SHIPROCKET_AUTH] In-memory token cache cleared.');
}

/**
 * Inspects current in-memory token status (for diagnostic / health checks).
 */
export function getShiprocketTokenStatus(): {
  hasToken: boolean;
  expiresAt: string | null;
  isExpired: boolean;
} {
  if (!tokenCache) {
    return { hasToken: false, expiresAt: null, isExpired: true };
  }

  const isExpired = Date.now() >= tokenCache.expiresAt;
  return {
    hasToken: true,
    expiresAt: new Date(tokenCache.expiresAt).toISOString(),
    isExpired,
  };
}

/**
 * Checks if a valid non-expired token is currently cached in memory.
 */
export function isShiprocketTokenValid(): boolean {
  return Boolean(tokenCache && tokenCache.expiresAt > Date.now());
}
