import { Client } from '@gradio/client';
import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/session';

export const maxDuration = 60; // Allow sufficient time for AI inference

// Environment variable names: HUGGINGFACE_API_TOKEN, HF_TOKEN, HUGGING_FACE_TOKEN

/**
 * POST /api/v1/seller/ai/studio-enhance
 *
 * Removes background and produces high-resolution transparent cutout using
 * official Bria AI RMBG-2.0 via server-side Gradio Client.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please log in.' },
        { status: 401 },
      );
    }

    // 1. Resolve Hugging Face API token
    const clientToken = request.headers.get('x-hf-token')?.trim();
    const token =
      clientToken ||
      process.env.HUGGINGFACE_API_TOKEN?.trim() ||
      process.env.HF_TOKEN?.trim() ||
      process.env.HUGGING_FACE_TOKEN?.trim();

    // 2. Extract image as Blob
    const contentType = request.headers.get('content-type') || '';
    let imageBlob: Blob | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, message: 'No image file provided in payload.' },
          { status: 400 },
        );
      }
      imageBlob = file;
    } else {
      const body = await request.json().catch(() => ({}));
      const raw = body.image || body.imageUrl || body.imageBase64;
      if (!raw) {
        return NextResponse.json(
          { success: false, message: 'No image data provided.' },
          { status: 400 },
        );
      }

      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        const remoteRes = await fetch(raw);
        if (!remoteRes.ok) {
          return NextResponse.json(
            { success: false, message: 'Failed to download original image for AI processing.' },
            { status: 400 },
          );
        }
        imageBlob = await remoteRes.blob();
      } else {
        const cleaned = raw.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        const buf = Buffer.from(cleaned, 'base64');
        imageBlob = new Blob([buf], { type: 'image/png' });
      }
    }

    if (!imageBlob || imageBlob.size === 0) {
      return NextResponse.json(
        { success: false, message: 'Empty image buffer received.' },
        { status: 400 },
      );
    }

    // 3. Connect & predict with Bria AI Engine
    // Primary: briaai/BRIA-RMBG-1.4 on /run (Unlimited, does NOT have ZeroGPU daily quota limits)
    // Fallback: briaai/BRIA-RMBG-2.0 on /image
    let remoteUrl: string | null = null;
    let engineUsed = '';
    const clientOptions = token ? { token: token as any } : undefined;

    // Attempt 1: Bria AI RMBG-1.4 (Unlimited / Non-ZeroGPU space)
    try {
      console.log('[BRIA_AI] Connecting to BRIA-RMBG-1.4...');
      const app14 = await Client.connect('briaai/BRIA-RMBG-1.4', clientOptions);
      const res14 = await app14.predict('/run', [imageBlob]);
      const fileObj = (res14.data as any)?.[1] || (res14.data as any)?.[0];
      remoteUrl =
        fileObj?.url || (Array.isArray(fileObj) ? fileObj[0]?.url : fileObj?.path || null);
      if (remoteUrl) {
        engineUsed = 'BRIA-RMBG-1.4 (Unlimited)';
      }
    } catch (err14: any) {
      console.warn(
        '[BRIA_AI] RMBG-1.4 attempt failed, trying RMBG-2.0 fallback:',
        err14?.message || err14,
      );
    }

    // Attempt 2: Bria AI RMBG-2.0 fallback
    if (!remoteUrl) {
      try {
        console.log('[BRIA_AI] Attempting fallback to BRIA-RMBG-2.0...');
        const app20 = await Client.connect('briaai/BRIA-RMBG-2.0', clientOptions);
        const res20 = await app20.predict('/image', [imageBlob]);
        const fileObj = (res20.data as any)?.[1] || (res20.data as any)?.[0];
        remoteUrl = fileObj?.url || (Array.isArray(fileObj) ? fileObj[0]?.url : null);
        if (remoteUrl) {
          engineUsed = 'BRIA-RMBG-2.0';
        }
      } catch (err20: any) {
        const msg = err20?.message || String(err20);
        console.error('[BRIA_AI] RMBG-2.0 failed:', msg);
        if (msg.includes('ZeroGPU') || msg.includes('quota') || msg.includes('runs limit')) {
          throw new Error(
            'AI Studio is experiencing peak GPU load. Please wait a minute and try again.',
          );
        }
        throw new Error(msg);
      }
    }

    if (!remoteUrl) {
      throw new Error(
        'AI studio engine could not generate transparent cutout for this photo. Please try another photo.',
      );
    }

    // 4. Download transparent cutout PNG and encode to base64
    const cutoutRes = await fetch(remoteUrl);
    if (!cutoutRes.ok) {
      throw new Error(`Failed to retrieve transparent cutout: ${cutoutRes.statusText}`);
    }

    const arrayBuffer = await cutoutRes.arrayBuffer();
    const base64Cutout = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;

    return NextResponse.json({
      success: true,
      message: `Product cutout generated successfully using ${engineUsed || 'Bria AI'}.`,
      data: {
        cutout: base64Cutout,
      },
    });
  } catch (error: any) {
    console.error('[BRIA_AI_STUDIO_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error while processing image with Bria AI.',
      },
      { status: 500 },
    );
  }
}
