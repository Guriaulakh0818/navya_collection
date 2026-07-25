'use client';

import { useQuery } from '@tanstack/react-query';

import { getProductBySlug, getProducts } from '../actions/products.actions';

export function useProducts(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
  });
}
