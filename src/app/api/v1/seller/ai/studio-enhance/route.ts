import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/session';

export const maxDuration = 60; // Allow sufficient time for AI inference

const HF_PRIMARY_MODEL_URL = 'https://router.huggingface.co/hf-inference/models/briaai/RMBG-2.0';
const HF_FALLBACK_MODEL_URL = 'https://router.huggingface.co/hf-inference/models/briaai/RMBG-1.4';

/**
 * POST /api/v1/seller/ai/studio-enhance
 *
 * Removes background and produces transparent cutout using Bria AI RMBG models
 * hosted on Hugging Face Serverless Inference API.
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

    if (!token) {
      return NextResponse.json({
        success: false,
        code: 'TOKEN_REQUIRED',
        message:
          'Hugging Face Free Token is required to activate Bria AI Studio. You can get one for free at huggingface.co in 30 seconds.',
      });
    }

    // 2. Extract image buffer
    const contentType = request.headers.get('content-type') || '';
    let imageBuffer: Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, message: 'No image file provided in payload.' },
          { status: 400 },
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      const body = await request.json().catch(() => ({}));
      const rawBase64 = body.image || body.imageUrl || body.imageBase64;
      if (!rawBase64) {
        return NextResponse.json(
          { success: false, message: 'No image data provided.' },
          { status: 400 },
        );
      }

      // If it's a remote URL, fetch the image buffer
      if (rawBase64.startsWith('http://') || rawBase64.startsWith('https://')) {
        const remoteRes = await fetch(rawBase64);
        if (!remoteRes.ok) {
          return NextResponse.json(
            { success: false, message: 'Failed to download original image for AI processing.' },
            { status: 400 },
          );
        }
        const ab = await remoteRes.arrayBuffer();
        imageBuffer = Buffer.from(ab);
      } else {
        // Strip data:image/...;base64,
        const cleaned = rawBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        imageBuffer = Buffer.from(cleaned, 'base64');
      }
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Empty image buffer received.' },
        { status: 400 },
      );
    }

    // Size sanity check (max 8MB for serverless inference)
    if (imageBuffer.length > 8 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: 'Image size exceeds 8MB limit. Please compress before processing.',
        },
        { status: 400 },
      );
    }

    // 3. Query Bria AI Inference API
    const callBriaModel = async (modelUrl: string) => {
      const hfRes = await fetch(modelUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
      });
      return hfRes;
    };

    let response = await callBriaModel(HF_PRIMARY_MODEL_URL);

    // If primary (RMBG-2.0) is unavailable or rate-limited or 404, fallback to RMBG-1.4
    if (
      !response.ok &&
      (response.status === 404 || response.status === 503 || response.status === 429)
    ) {
      console.warn(
        `[BRIA_AI] Primary RMBG-2.0 returned ${response.status}, trying fallback RMBG-1.4...`,
      );
      response = await callBriaModel(HF_FALLBACK_MODEL_URL);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      let errMsg = `Bria AI inference error (${response.status})`;

      try {
        const errJson = JSON.parse(errText);
        if (errJson.error) {
          errMsg = errJson.error;
        }
      } catch {
        if (errText) errMsg = errText;
      }

      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          code: 'INVALID_TOKEN',
          message:
            'The provided Hugging Face token is invalid or expired. Please check your token.',
        });
      }

      if (response.status === 503) {
        return NextResponse.json({
          success: false,
          code: 'MODEL_LOADING',
          message:
            'Bria AI model is warming up on the cloud server. Please try again in 10 seconds.',
        });
      }

      return NextResponse.json(
        { success: false, message: errMsg },
        { status: response.status >= 500 ? 502 : 400 },
      );
    }

    // Read transparent PNG cutout
    const resultBuffer = await response.arrayBuffer();
    const base64Cutout = `data:image/png;base64,${Buffer.from(resultBuffer).toString('base64')}`;

    return NextResponse.json({
      success: true,
      message: 'Product cutout generated successfully with Bria AI.',
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
