import {
  authenticateShiprocket,
  getShiprocketCredentials,
  getShiprocketToken,
  getShiprocketTokenStatus,
} from './auth';
import type { ShiprocketAuthStatus, StandardShippingResponse } from './types';

export class ShiprocketService {
  /**
   * Verifies Shiprocket environment credentials & connection health.
   * Does NOT expose Shiprocket tokens to the caller.
   */
  static async verifyConnection(): Promise<StandardShippingResponse<ShiprocketAuthStatus>> {
    try {
      const credentials = getShiprocketCredentials();
      const token = await getShiprocketToken();
      const status = getShiprocketTokenStatus();

      return {
        success: true,
        message: 'Shiprocket authentication and connection verified successfully.',
        statusCode: 200,
        data: {
          authenticated: true,
          user: {
            email: credentials.email,
          },
          expiresAt: status.expiresAt || undefined,
          isCachedToken: !status.isExpired,
        },
      };
    } catch (error: any) {
      console.error('[SHIPROCKET_SERVICE_VERIFY_ERROR]', error.message);
      return {
        success: false,
        message: error.message || 'Shiprocket connection verification failed.',
        statusCode: 500,
        error: {
          code: 'SHIPROCKET_CONNECTION_FAILED',
          details: error.message,
        },
      };
    }
  }

  /**
   * Forcefully refreshes the Shiprocket authentication token.
   */
  static async refreshToken(): Promise<StandardShippingResponse<ShiprocketAuthStatus>> {
    try {
      const authResult = await authenticateShiprocket();
      if (!authResult.success) {
        return {
          success: false,
          message: authResult.message,
          statusCode: authResult.statusCode,
          error: authResult.error,
        };
      }

      const status = getShiprocketTokenStatus();

      return {
        success: true,
        message: 'Shiprocket authentication token refreshed successfully.',
        statusCode: 200,
        data: {
          authenticated: true,
          user: {
            email: authResult.data?.email || '',
            companyName: authResult.data?.company_name,
          },
          expiresAt: status.expiresAt || undefined,
          isCachedToken: false,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to refresh Shiprocket token.',
        statusCode: 500,
      };
    }
  }
}
