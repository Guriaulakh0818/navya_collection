'use server';

import { revalidatePath } from 'next/cache';

import { getProduct, listProducts } from '../services/products.service';

export async function getProducts(params?: Record<string, string>) {
  return listProducts(params);
}

export async function getProductBySlug(slug: string) {
  return getProduct(slug);
}
