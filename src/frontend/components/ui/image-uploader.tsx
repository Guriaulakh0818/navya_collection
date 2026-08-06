'use client';

import React, { useCallback, useRef, useState } from 'react';

import { CloudinaryFolder } from '@/lib/cloudinary';

export interface UploadedImageItem {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
  fileSize?: number;
}

export interface ImageUploaderProps {
  folder?: CloudinaryFolder;
  categorySlug?: string;
  productSlug?: string;
  bannerSlug?: string;
  multiple?: boolean;
  maxFiles?: number;
  initialImages?: UploadedImageItem[];
  onImagesChange?: (images: UploadedImageItem[]) => void;
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  folder = 'products',
  categorySlug,
  productSlug,
  bannerSlug,
  multiple = true,
  maxFiles = 10,
  initialImages = [],
  onImagesChange,
  className = '',
}) => {
  const [images, setImages] = useState<UploadedImageItem[]>(initialImages);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateImagesState = useCallback(
    (newImages: UploadedImageItem[]) => {
      setImages(newImages);
      if (onImagesChange) {
        onImagesChange(newImages);
      }
    },
    [onImagesChange],
  );

  const maxSizeBytes = folder === 'banners' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  const maxSizeLabel = folder === 'banners' ? '10 MB' : '5 MB';

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const fileArray = Array.from(files);

    if (fileArray.length === 0) return;

    if (!multiple && fileArray.length > 1) {
      setErrorMessage('Single file upload mode. Only one image can be uploaded.');
      return;
    }

    if (images.length + fileArray.length > maxFiles) {
      setErrorMessage(
        `Maximum limit of ${maxFiles} images exceeded. Cannot upload ${fileArray.length} more file(s).`,
      );
      return;
    }

    // Client-side Validation according to Task 4.4.1
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

    for (const file of fileArray) {
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        setErrorMessage(
          `Invalid file format '${file.name}'. Allowed formats: JPG, JPEG, PNG, WEBP, AVIF.`,
        );
        return;
      }
      if (file.size > maxSizeBytes) {
        setErrorMessage(
          `File '${file.name}' (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds max allowed size of ${maxSizeLabel} for ${folder}.`,
        );
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(15);
    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      fileArray.forEach((file) => formData.append('file', file));

      const queryParams = new URLSearchParams({ folder });
      if (categorySlug) queryParams.set('categorySlug', categorySlug);
      if (productSlug) queryParams.set('productSlug', productSlug);
      if (bannerSlug) queryParams.set('bannerSlug', bannerSlug);

      setUploadProgress(45);

      const response = await fetch(`/api/v1/upload?${queryParams.toString()}`, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      setUploadProgress(85);
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Image upload failed.');
      }

      setUploadProgress(100);

      const newUploadedRecords: UploadedImageItem[] = json.data.map((item: any, idx: number) => ({
        id: `img_${Date.now()}_${idx}`,
        publicId: item.publicId,
        url: item.url,
        secureUrl: item.secureUrl,
        isPrimary: images.length === 0 && idx === 0,
        sortOrder: images.length + idx,
        fileSize: item.fileSize,
      }));

      const combined = [...images, ...newUploadedRecords];
      updateImagesState(combined);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setErrorMessage('Upload cancelled by user.');
      } else {
        setErrorMessage(err.message || 'An error occurred during upload. Please try again.');
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    updateImagesState(updated);
  };

  const executeDeleteImage = async (index: number) => {
    const targetImage = images[index];

    if (targetImage?.publicId) {
      fetch(`/api/v1/upload?publicId=${encodeURIComponent(targetImage.publicId)}`, {
        method: 'DELETE',
      }).catch(() => {});
    }

    const updated = images.filter((_, i) => i !== index);
    if (targetImage.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }

    updateImagesState(updated);
    setConfirmDeleteId(null);
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    const updated = [...images];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    const reordered = updated.map((img, i) => ({ ...img, sortOrder: i }));
    updateImagesState(reordered);
  };

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Dropzone Container */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-amber-500'
        }`}
      >
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
          multiple={multiple}
          onChange={handleFileInputChange}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
          <svg
            className="w-10 h-10 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              Click to upload
            </span>{' '}
            or drag and drop
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            JPG, PNG, WEBP, AVIF up to{' '}
            <span className="font-semibold text-amber-600">{maxSizeLabel}</span> (Folder:{' '}
            <span className="font-mono">{folder}</span>)
          </p>
        </div>
      </div>

      {/* Upload Queue & Progress Indicator */}
      {isUploading && (
        <div className="w-full space-y-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
          <div className="flex justify-between items-center text-xs text-amber-900 dark:text-amber-200 font-medium">
            <span>Uploading to Cloudinary... ({uploadProgress}%)</span>
            <button
              type="button"
              onClick={handleCancelUpload}
              className="text-red-600 hover:text-red-800 underline text-xs font-semibold"
            >
              Cancel Upload
            </button>
          </div>
          <div className="w-full h-2 bg-amber-200 dark:bg-amber-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Validation Error Alert */}
      {errorMessage && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex justify-between items-center">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="font-bold text-red-500 hover:text-red-700 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Uploaded Images List with Preview, Reordering, and Primary Selection */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              className={`group relative rounded-xl border p-2 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all duration-200 ${
                img.isPrimary
                  ? 'border-amber-500 ring-2 ring-amber-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Preview Thumbnail */}
              <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.secureUrl || img.url}
                  alt={img.altText || `Product Image ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Primary Badge */}
                {img.isPrimary && (
                  <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    PRIMARY
                  </span>
                )}

                {/* Delete Confirmation Overlay */}
                {confirmDeleteId === img.id && (
                  <div className="absolute inset-0 bg-slate-950/80 p-2 flex flex-col justify-center items-center text-center backdrop-blur-xs">
                    <p className="text-[11px] text-white font-medium mb-2">Delete image?</p>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => executeDeleteImage(idx)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white text-[10px] font-bold rounded"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="mt-2 flex items-center justify-between gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => handleSetPrimary(idx)}
                  disabled={img.isPrimary}
                  className={`px-2 py-1 rounded font-medium transition ${
                    img.isPrimary
                      ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {img.isPrimary ? 'Primary' : 'Make Primary'}
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleMoveImage(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                    title="Move Left/Up"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveImage(idx, 'down')}
                    disabled={idx === images.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                    title="Move Right/Down"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(img.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Delete Image"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
