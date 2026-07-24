'use server';

import { revalidatePath } from 'next/cache';

import { MESSAGES } from '@/constants/messages';
import { apiClient } from '@/services/api/client';

export async function addToCart(productId: string, quantity = 1) {
  try {
    const response = await apiClient.post('/cart/add', { productId, quantity });
    revalidatePath('/cart');
    return { success: true, data: response };
  } catch {
    return { success: false, message: MESSAGES.ERROR.GENERIC };
  }
}

export async function removeFromCart(productId: string) {
  try {
    const response = await apiClient.delete(`/cart/${productId}`);
    revalidatePath('/cart');
    return { success: true, data: response };
  } catch {
    return { success: false, message: MESSAGES.ERROR.GENERIC };
  }
}
