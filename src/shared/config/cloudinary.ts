export const CLOUDINARY_CONFIG = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'default',
  folder: {
    products: 'navya/products',
    categories: 'navya/categories',
    banners: 'navya/banners',
    brands: 'navya/brands',
    reviews: 'navya/reviews',
  },
  maxFileSize: 10 * 1024 * 1024,
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
} as const;
