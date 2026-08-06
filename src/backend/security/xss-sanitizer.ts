/**
 * Strips script tags, HTML event attributes (onload, onerror, javascript:), and sanitizes strings
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script> tags
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers onEvent="..."
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:[^\s"']*/gi, '') // Remove javascript: pseudo-protocol
    .replace(/<[^>]*>/g, (match) => {
      // Allow basic formatting tags if needed, otherwise strip
      const allowed = [
        '<b>',
        '</b>',
        '<i>',
        '</i>',
        '<strong>',
        '</strong>',
        '<em>',
        '</em>',
        '<p>',
        '</p>',
        '<br>',
        '<br/>',
      ];
      return allowed.includes(match.toLowerCase()) ? match : '';
    })
    .trim();
}

/**
 * Escapes hazardous characters into HTML entities for rendering safety
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return str;

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Recursively sanitizes nested JSON object inputs
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const sanitizedObj: Record<string, any> = {};
    for (const key of Object.keys(obj as Record<string, any>)) {
      sanitizedObj[key] = sanitizeObject((obj as Record<string, any>)[key]);
    }
    return sanitizedObj as T;
  }

  return obj;
}
