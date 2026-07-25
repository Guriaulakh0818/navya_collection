'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { logout as authLogout, getSession, sendOtp, verifyOtp } from '@/services/auth';

export async function sendOtpAction(mobile: string) {
  try {
    const result = await sendOtp(mobile);
    return { success: result.success, message: result.message };
  } catch {
    return { success: false, message: 'Failed to send OTP. Please try again.' };
  }
}

export async function verifyOtpAction(mobile: string, otp: string) {
  try {
    const result = await verifyOtp(mobile, otp);
    if (result.success && result.token) {
      const cookieStore = await cookies();
      cookieStore.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
      revalidatePath('/');
      return { success: true };
    }
    return { success: false, message: result.message || 'Invalid OTP' };
  } catch {
    return { success: false, message: 'Verification failed. Please try again.' };
  }
}

export async function logoutAction() {
  try {
    await authLogout();
  } finally {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    revalidatePath('/');
    redirect('/login');
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return null;
    return getSession();
  } catch {
    return null;
  }
}
