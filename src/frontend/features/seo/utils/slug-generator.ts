/**
 * Formats and normalizes product strings into clean, SEO-friendly URL slugs.
 * Rules:
 * - lowercase
 * - hyphen separated
 * - removes all special characters
 * - trims extra spaces/dashes
 */
export function generateSeoSlug(text: string): string {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters except hyphens
    .replace(/\-\-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Trim starting hyphen
    .replace(/-+$/, ''); // Trim ending hyphen
}

/**
 * Ensures slug uniqueness by appending a suffix if collision detected
 */
export function ensureUniqueSlug(slug: string, existingSlugs: string[] = []): string {
  const baseSlug = generateSeoSlug(slug);
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  while (existingSlugs.includes(`${baseSlug}-${counter}`)) {
    counter += 1;
  }
  return `${baseSlug}-${counter}`;
}
