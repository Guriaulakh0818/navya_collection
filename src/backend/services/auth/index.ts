import { ApiClient } from '../api/client';

const authClient = new ApiClient('/api/auth');

export async function sendOtp(mobile: string) {
  return authClient.post<{ success: boolean; message: string }>('/send-otp', { mobile });
}

export async function verifyOtp(mobile: string, otp: string) {
  return authClient.post<{ success: boolean; token?: string; user?: object; message?: string }>(
    '/verify-otp',
    {
      mobile,
      otp,
    },
  );
}

export async function logout() {
  return authClient.post<{ success: boolean; message?: string }>('/logout', {});
}

export async function getSession() {
  return authClient.get<{ authenticated: boolean; user?: unknown; message?: string }>('/session');
}
