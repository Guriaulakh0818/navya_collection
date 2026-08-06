export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function convertToPaise(amount: number): number {
  return Math.round(amount * 100);
}

export function convertToRupees(paise: number): number {
  return Math.round(paise / 100);
}
