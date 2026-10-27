/* eslint-disable @next/next/no-img-element */
'use client';

import {
  Check,
  Eye,
  Info,
  Key,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface AiStudioEnhancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageUrl?: string;
  onApply: (enhancedFile: File, previewUrl: string) => Promise<void> | void;
}

type StudioBackground = 'white' | 'grey' | 'warm' | 'dark' | 'transparent';

export function AiStudioEnhancerModal({
  isOpen,
  onClose,
  initialImageUrl,
  onApply,
}: AiStudioEnhancerModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewOriginalUrl, setPreviewOriginalUrl] = useState<string>('');
  const [cutoutBase64, setCutoutBase64] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressStatus, setProgressStatus] = useState<string>('Processing with AI...');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);
  const [hfToken, setHfToken] = useState<string>('');

  // Studio Adjustments
  const [bgStyle, setBgStyle] = useState<StudioBackground>('white');
  const [enableShadow, setEnableShadow] = useState<boolean>(true);
  const [enableLightingBoost, setEnableLightingBoost] = useState<boolean>(true);
  const [paddingPercent, setPaddingPercent] = useState<number>(8);
  const [viewMode, setViewMode] = useState<'after' | 'before' | 'split'>('after');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved token from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('NAVYA_HF_TOKEN') || '';
      setHfToken(saved);
    }
  }, []);

  // Initialize preview if initialImageUrl is provided
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (initialImageUrl) {
        setPreviewOriginalUrl(initialImageUrl);
        setCutoutBase64('');
      } else {
        setPreviewOriginalUrl('');
        setCutoutBase64('');
        setSelectedFile(null);
      }
    }
  }, [isOpen, initialImageUrl]);

  const handleSaveToken = () => {
    const trimmed = hfToken.trim();
    if (trimmed) {
      localStorage.setItem('NAVYA_HF_TOKEN', trimmed);
      setShowTokenInput(false);
      setErrorMessage(null);
    }
  };

  const handleSelectLocalFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    setSelectedFile(file);
    setPreviewOriginalUrl(URL.createObjectURL(file));
    setCutoutBase64('');
    setErrorMessage(null);
  };

  // Call Bria AI Backend API to generate cutout
  const handleGenerateCutout = async () => {
    if (!previewOriginalUrl && !selectedFile) {
      setErrorMessage('Please select or upload a photo first.');
      return;
    }

    setIsProcessing(true);
    setProgressStatus('Running Bria AI RMBG-2.0 Studio Engine...');
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = {};
      if (hfToken.trim()) {
        headers['x-hf-token'] = hfToken.trim();
      }

      let response: Response;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        response = await fetch('/api/v1/seller/ai/studio-enhance', {
          method: 'POST',
          headers,
          body: formData,
        });
      } else {
        response = await fetch('/api/v1/seller/ai/studio-enhance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify({ imageUrl: previewOriginalUrl }),
        });
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success || !data.data?.cutout) {
        if (data.code === 'TOKEN_REQUIRED' || data.code === 'INVALID_TOKEN') {
          setShowTokenInput(true);
        }
        throw new Error(
          data.message || 'Bria AI could not process this image. Please try another image.',
        );
      }

      setCutoutBase64(data.data.cutout);
      setViewMode('after');
    } catch (err: any) {
      console.error('[AI_STUDIO_MODAL_ERROR]', err);
      setErrorMessage(err.message || 'Error occurred while creating studio photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render Studio Composite on HTML5 Canvas
  const renderStudioCanvas = useCallback(() => {
    if (!cutoutBase64 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const width = img.naturalWidth || 1200;
      const height = img.naturalHeight || 1600;

      canvas.width = width;
      canvas.height = height;

      // 1. Draw Background
      if (bgStyle === 'white') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      } else if (bgStyle === 'grey') {
        ctx.fillStyle = '#F3F4F6';
        ctx.fillRect(0, 0, width, height);
      } else if (bgStyle === 'warm') {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#FFFDF8');
        gradient.addColorStop(1, '#F7F3EB');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      } else if (bgStyle === 'dark') {
        ctx.fillStyle = '#18181B';
        ctx.fillRect(0, 0, width, height);
      } else {
        // Transparent
        ctx.clearRect(0, 0, width, height);
      }

      // 2. Draw 3D Studio Floor Shadow
      const pad = (paddingPercent / 100) * Math.min(width, height);
      const targetW = width - pad * 2;
      const targetH = height - pad * 2;

      // Maintain aspect ratio while fitting inside target bounds
      const aspect = img.naturalWidth / img.naturalHeight;
      let drawW = targetW;
      let drawH = drawW / aspect;

      if (drawH > targetH) {
        drawH = targetH;
        drawW = drawH * aspect;
      }

      const drawX = (width - drawW) / 2;
      const drawY = height - pad - drawH; // Anchor near bottom with padding

      if (enableShadow && bgStyle !== 'transparent') {
        ctx.save();
        const shadowY = drawY + drawH * 0.96;
        const shadowRadiusX = drawW * 0.38;
        const shadowRadiusY = drawH * 0.04;

        ctx.beginPath();
        ctx.ellipse(width / 2, shadowY, shadowRadiusX, shadowRadiusY, 0, 0, 2 * Math.PI);
        const shadowGrad = ctx.createRadialGradient(
          width / 2,
          shadowY,
          shadowRadiusX * 0.1,
          width / 2,
          shadowY,
          shadowRadiusX,
        );
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
        shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGrad;
        ctx.fill();
        ctx.restore();
      }

      // 3. Draw Product Cutout with optional Lighting Boost
      ctx.save();
      if (enableLightingBoost) {
        // Slight contrast and vibrancy adjustment
        ctx.filter = 'contrast(106%) saturate(105%) brightness(102%)';
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    };
    img.src = cutoutBase64;
  }, [cutoutBase64, bgStyle, enableShadow, enableLightingBoost, paddingPercent]);

  useEffect(() => {
    renderStudioCanvas();
  }, [renderStudioCanvas]);

  // Convert canvas to File and apply
  const handleApplyStudioPhoto = async () => {
    if (!canvasRef.current) return;
    setIsApplying(true);

    try {
      const canvas = canvasRef.current;
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setErrorMessage('Failed to export canvas image.');
            setIsApplying(false);
            return;
          }

          const fileName = `studio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;
          const enhancedFile = new File([blob], fileName, { type: 'image/webp' });
          const previewUrl = URL.createObjectURL(blob);

          await onApply(enhancedFile, previewUrl);
          setIsApplying(false);
          onClose();
        },
        'image/webp',
        0.92,
      );
    } catch (err: any) {
      console.error('[APPLY_STUDIO_PHOTO_ERROR]', err);
      setErrorMessage(err.message || 'Failed to apply studio photo.');
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center text-orange">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-navy">AI Studio Photo Enhancer</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Powered by Bria AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Instantly convert raw phone photos into pristine e-commerce studio catalog images.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Token Config Alert / Banner */}
          {showTokenInput && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2.5">
              <div className="flex items-start gap-2">
                <Key className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Free Hugging Face Token Required</strong>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Bria AI runs on Hugging Face Serverless free tier. You can create a 100% free
                    token at{' '}
                    <a
                      href="https://huggingface.co/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold text-orange hover:text-orange-hover"
                    >
                      huggingface.co/settings/tokens
                    </a>{' '}
                    (takes only 30 seconds).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="password"
                  placeholder="Paste your free token: hf_..."
                  value={hfToken}
                  onChange={(e) => setHfToken(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-navy"
                />
                <button
                  type="button"
                  onClick={handleSaveToken}
                  className="px-4 py-2 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Save & Activate
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-[10px] font-bold text-rose-600 hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Main Workspace (Preview & Controls) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Preview Stage (Left / Center) */}
            <div className="lg:col-span-8 flex flex-col items-center justify-center bg-slate-100 rounded-2xl border border-slate-200 p-3 sm:p-4 min-h-[340px] relative overflow-hidden">
              {/* View Mode Switcher (When cutout is ready) */}
              {cutoutBase64 && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-xs border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setViewMode('after')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      viewMode === 'after'
                        ? 'bg-orange text-white shadow-xs'
                        : 'text-slate-600 hover:text-navy'
                    }`}
                  >
                    Studio AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('before')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      viewMode === 'before'
                        ? 'bg-orange text-white shadow-xs'
                        : 'text-slate-600 hover:text-navy'
                    }`}
                  >
                    Original
                  </button>
                </div>
              )}

              {/* Display Area */}
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-orange/10 border-2 border-orange border-t-transparent animate-spin flex items-center justify-center" />
                    <Sparkles className="w-6 h-6 text-orange absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-navy">
                      Bria AI is creating studio cutout...
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Detecting garment edges, zari borders, and clearing background.
                    </p>
                  </div>
                </div>
              ) : previewOriginalUrl ? (
                <div className="w-full h-full max-h-[480px] flex items-center justify-center relative">
                  {/* Studio Canvas (Shown when cutout is ready and viewMode is 'after') */}
                  <canvas
                    ref={canvasRef}
                    className={`max-w-full max-h-[440px] object-contain rounded-xl shadow-md transition-all ${
                      cutoutBase64 && viewMode === 'after' ? 'block' : 'hidden'
                    }`}
                  />

                  {/* Original Image (Shown when cutout not generated yet or viewMode is 'before') */}
                  <img
                    src={previewOriginalUrl}
                    alt="Original Upload"
                    loading="lazy"
                    decoding="async"
                    className={`max-w-full max-h-[440px] object-contain rounded-xl shadow-xs ${
                      !cutoutBase64 || viewMode === 'before' ? 'block' : 'hidden'
                    }`}
                  />
                </div>
              ) : (
                /* Drop / Select Initial Image */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:bg-slate-200/50 rounded-2xl transition-all border-2 border-dashed border-slate-300 w-full h-full"
                >
                  <Upload className="w-10 h-10 text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-700">Click to select product photo</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports mobile camera clicks, JPG, PNG, WebP up to 8MB
                  </p>
                  <button
                    type="button"
                    className="mt-3 px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Choose Photo
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleSelectLocalFile(e.target.files[0]);
                }}
                className="hidden"
              />
            </div>

            {/* Controls Panel (Right Column) */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="space-y-4">
                {/* 1. Action to Generate Cutout */}
                {!cutoutBase64 ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-orange-50/50 border border-orange/20 text-xs text-slate-700">
                      <div className="flex items-center gap-1.5 font-bold text-orange">
                        <Sparkles className="w-4 h-4" /> 1-Click Studio Magic
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Bria AI will automatically remove the messy room/floor background and set up
                        a clean boutique studio look.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!previewOriginalUrl || isProcessing}
                      onClick={handleGenerateCutout}
                      className="w-full py-3 px-4 bg-orange hover:bg-orange-hover text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          {progressStatus || 'Processing with AI...'}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Convert to Studio Photo
                        </>
                      )}
                    </button>

                    {previewOriginalUrl && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 text-xs font-bold text-slate-500 hover:text-navy hover:underline"
                      >
                        Choose Different Photo
                      </button>
                    )}
                  </div>
                ) : (
                  /* 2. Customization Controls when Cutout is Ready */
                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                        Studio Background
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBgStyle('white')}
                          className={`p-2.5 rounded-xl border text-left font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            bgStyle === 'white'
                              ? 'border-navy bg-white shadow-xs ring-2 ring-navy/15 text-navy'
                              : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full border border-slate-300 bg-white shadow-2xs" />
                          <span>Pure White</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBgStyle('grey')}
                          className={`p-2.5 rounded-xl border text-left font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            bgStyle === 'grey'
                              ? 'border-navy bg-white shadow-xs ring-2 ring-navy/15 text-navy'
                              : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full border border-slate-300 bg-slate-200 shadow-2xs" />
                          <span>Soft Grey</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBgStyle('warm')}
                          className={`p-2.5 rounded-xl border text-left font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            bgStyle === 'warm'
                              ? 'border-navy bg-white shadow-xs ring-2 ring-navy/15 text-navy'
                              : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full border border-amber-200 bg-amber-50 shadow-2xs" />
                          <span>Warm Boutique</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBgStyle('transparent')}
                          className={`p-2.5 rounded-xl border text-left font-bold flex items-center gap-2 transition-all cursor-pointer ${
                            bgStyle === 'transparent'
                              ? 'border-navy bg-white shadow-xs ring-2 ring-navy/15 text-navy'
                              : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full border border-dashed border-slate-400 bg-transparent" />
                          <span>Cutout (PNG)</span>
                        </button>
                      </div>
                    </div>

                    {/* Studio Effects */}
                    <div className="space-y-2.5 pt-1 border-t border-slate-200">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                        Lighting & Shadow
                      </label>
                      <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                        <span className="text-xs font-bold text-slate-700">
                          Realistic 3D Shadow
                        </span>
                        <input
                          type="checkbox"
                          checked={enableShadow}
                          onChange={(e) => setEnableShadow(e.target.checked)}
                          className="w-4 h-4 accent-navy rounded cursor-pointer"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                        <span className="text-xs font-bold text-slate-700">
                          Studio Color & Vibrancy Pop
                        </span>
                        <input
                          type="checkbox"
                          checked={enableLightingBoost}
                          onChange={(e) => setEnableLightingBoost(e.target.checked)}
                          className="w-4 h-4 accent-navy rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Re-generate or change photo */}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <button
                        type="button"
                        onClick={handleGenerateCutout}
                        disabled={isProcessing}
                        className="text-orange hover:underline font-bold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Re-run AI
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-slate-500 hover:underline font-bold"
                      >
                        Upload Another
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Apply Action (Only when cutout is ready) */}
              {cutoutBase64 && (
                <div className="pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    disabled={isApplying}
                    onClick={handleApplyStudioPhoto}
                    className="w-full py-3 px-4 bg-navy hover:bg-navy-hover text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isApplying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Saving Studio Photo...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" /> Apply Studio Photo to Product
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Free AI E-Commerce Photography Studio • Navya Collection Engine</span>
          </div>
          <button
            type="button"
            onClick={() => setShowTokenInput((prev) => !prev)}
            className="text-[10px] font-bold text-slate-400 hover:text-navy flex items-center gap-1"
          >
            <Key className="w-3 h-3" /> {hfToken ? 'API Token Configured' : 'Configure Free Token'}
          </button>
        </div>
      </div>
    </div>
  );
}
