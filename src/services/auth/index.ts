import { ApiClient } from '../api/client';

const authClient = new ApiClient('/api/v1/auth');

export async function sendOtp(mobile: string) {
  return authClient.post<{ success: boolean; message: string }>('/send-otp', { mobile });
}

export async function verifyOtp(mobile: string, otp: string) {
  return authClient.post<{ success: boolean; token: string; user: object }>('/verify-otp', {
    mobile,
    otp,
  });
}

export async function logout() {
  return authClient.post<{ success: boolean }>('/logout', {});
}

export async function refreshToken() {
  return authClient.post<{ success: boolean; token: string }>('/refresh-token', {});
}
