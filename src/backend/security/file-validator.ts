export interface FileValidationResult {
  valid: boolean;
  reason?: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const DISALLOWED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.php',
  '.js',
  '.html',
  '.htm',
  '.jar',
  '.vbs',
  '.ps1',
  '.py',
  '.pl',
  '.cgi',
  '.dll',
  '.so',
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageUpload(
  fileName: string,
  mimeType: string,
  sizeInBytes: number,
  maxSizeBytes: number = MAX_FILE_SIZE_BYTES,
): FileValidationResult {
  // 1. File Size check
  if (sizeInBytes > maxSizeBytes) {
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      reason: `File size exceeds maximum allowed limit of ${maxMb}MB.`,
    };
  }

  // 2. Allowed MIME Type check
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      reason: 'Invalid file format. Only JPG, PNG, and WebP images are allowed.',
    };
  }

  // 3. Executable File Extension check
  const lowerFileName = fileName.toLowerCase();
  const hasDisallowedExt = DISALLOWED_EXTENSIONS.some((ext) => lowerFileName.endsWith(ext));

  if (hasDisallowedExt) {
    return {
      valid: false,
      reason: 'Executable or dangerous file types are strictly prohibited.',
    };
  }

  return { valid: true };
}
