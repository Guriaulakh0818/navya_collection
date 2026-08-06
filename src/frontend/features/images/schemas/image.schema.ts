import { z } from 'zod';

export const uploadSingleImageSchema = z.object({
  imageUrl: z.string().trim().min(1, 'Image URL or base64 data is required'),
  altText: z.string().trim().optional().nullable(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export const uploadMultipleImagesSchema = z.object({
  images: z.array(uploadSingleImageSchema).min(1, 'At least one image must be provided'),
});

export const updateImageSchema = z.object({
  altText: z.string().trim().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
  imageUrl: z.string().trim().optional(), // For replacing image file
});

export const reorderImagesSchema = z.object({
  imageOrders: z
    .array(
      z.object({
        imageId: z.string().trim().min(1, 'Image ID is required'),
        sortOrder: z.number().int().min(0, 'Sort order must be 0 or greater'),
      }),
    )
    .min(1, 'At least one image order must be specified'),
});

export const setPrimaryImageSchema = z.object({
  imageId: z.string().trim().min(1, 'Image ID is required'),
});

export type UploadSingleImageInput = z.infer<typeof uploadSingleImageSchema>;
export type UploadMultipleImagesInput = z.infer<typeof uploadMultipleImagesSchema>;
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
export type SetPrimaryImageInput = z.infer<typeof setPrimaryImageSchema>;
