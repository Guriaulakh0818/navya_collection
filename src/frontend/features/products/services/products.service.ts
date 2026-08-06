import { ApiClient } from '@/services/api/client';

const productsClient = new ApiClient('/api/products');

export async function listProducts(params?: Record<string, string>) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return productsClient.get(`/${query ? `?${query}` : ''}`);
}

export async function getProduct(slug: string) {
  return productsClient.get(`/${slug}`);
}
