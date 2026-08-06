'use server';

import { apiClient } from '@/services/api/client';

export async function getProducts(filters?: Record<string, unknown>) {
  const query = new URLSearchParams(filters as Record<string, string>).toString();
  return apiClient.get(`/products${query ? `?${query}` : ''}`);
}
