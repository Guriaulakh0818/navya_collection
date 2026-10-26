'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ShopAvatarProps {
  logo?: string | null;
  shopName: string;
  isNavya?: boolean;
  size?: number; // width & height in px
  className?: string; // extra classes on outer container
  shape?: 'rounded-2xl' | 'rounded-xl' | 'rounded-full' | 'rounded-3xl' | 'rounded-lg';
  priority?: boolean;
}

/**
 * Universal Default Profile Avatar (WhatsApp & Instagram style)
 * Displayed whenever a seller has NOT uploaded their own profile photo / shop logo.
 * If the seller uploads their photo, their photo is cleanly displayed with fallback on load error.
 */
export function DefaultProfileAvatarSilhouette({
  className = 'w-full h-full',
}: {
  className?: string;
}) {
  return (
    <div
      className={`w-full h-full bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200/90 flex items-center justify-center select-none overflow-hidden ${className}`}
      aria-label="No profile photo"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none"
      >
        {/* Head */}
        <circle cx="50" cy="38" r="17" fill="#94A3B8" />
        {/* Smooth Torso / Shoulders arch */}
        <path
          d="M16 98 C16 74 32 63 50 63 C68 63 84 74 84 98 C84 100 82 100 80 100 H20 C18 100 16 100 16 98 Z"
          fill="#94A3B8"
        />
      </svg>
    </div>
  );
}

export function ShopAvatar({
  logo,
  shopName,
  isNavya = false,
  size = 96,
  className = '',
  shape = 'rounded-2xl',
  priority = false,
}: ShopAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Navya Collection official store uses the official brand logo.
  // Other sellers ONLY display a photo if they explicitly uploaded their own.
  const hasUploadedLogo = Boolean(
    logo &&
    typeof logo === 'string' &&
    logo.trim() !== '' &&
    logo !== '/images/navya-logo.png' &&
    logo !== '/images/logo.png',
  );

  const shouldShowLogo = (isNavya || hasUploadedLogo) && !imageError;
  const imageSrc = isNavya ? '/images/navya-logo.png' : logo!;

  if (shouldShowLogo && imageSrc) {
    return (
      <div
        className={`relative overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center shadow-xs select-none ${shape} ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={imageSrc}
          alt={shopName || 'Shop logo'}
          width={size}
          height={size}
          priority={priority}
          onError={() => setImageError(true)}
          className="w-full h-full object-contain p-1 select-none overflow-hidden"
        />
      </div>
    );
  }

  // Instagram / WhatsApp style "No Profile Photo" default interface
  return (
    <div
      className={`relative overflow-hidden border border-slate-200/90 shrink-0 shadow-xs select-none ${shape} ${className}`}
      style={{ width: size, height: size }}
      title={shopName ? `${shopName} (No profile photo uploaded)` : 'No profile photo'}
    >
      <DefaultProfileAvatarSilhouette />
    </div>
  );
}
