import { cookies } from 'next/headers';

export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get('auth-token')?.value || null;
}

export async function isAuthenticated() {
  const token = await getAuthToken();
  return !!token;
}
