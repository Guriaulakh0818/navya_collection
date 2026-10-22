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

    // 3. Connect to official Bria AI RMBG-2.0 Space
    let app: any = null;
    const clientOptions = token ? { token: token as any } : undefined;
    try {
      app = await Client.connect('briaai/BRIA-RMBG-2.0', clientOptions);
    } catch (err: any) {
      console.warn('[BRIA_AI] Failed to connect to RMBG-2.0, falling back to RMBG-1.4:', err);
      app = await Client.connect('briaai/BRIA-RMBG-1.4', clientOptions);
    }

    // 4. Run prediction
    const result = await app.predict('/image', [imageBlob]);

    const fileObj = result.data?.[1] || result.data?.[0];
    const remoteUrl = fileObj?.url || (Array.isArray(fileObj) ? fileObj[0]?.url : null);

    if (!remoteUrl) {
      throw new Error('AI engine did not return output image URL.');
    }

    // 5. Download transparent cutout PNG and encode to base64
    const cutoutRes = await fetch(remoteUrl);
    if (!cutoutRes.ok) {
      throw new Error(`Failed to retrieve transparent cutout: ${cutoutRes.statusText}`);
    }

    const arrayBuffer = await cutoutRes.arrayBuffer();
    const base64Cutout = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;

    return NextResponse.json({
      success: true,
      message: 'Product cutout generated successfully with Bria AI RMBG-2.0.',
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
