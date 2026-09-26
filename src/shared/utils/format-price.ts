export function formatPrice(amount?: number | string | any, currency = 'INR'): string {
  const num = typeof amount === 'number' ? amount : Number(amount ?? 0);
  const safeNum = Number.isFinite(num) ? num : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(safeNum);
}
