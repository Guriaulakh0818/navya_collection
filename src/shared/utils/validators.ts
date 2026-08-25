export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidMobileNumber(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile);
}

export const isValidMobile = isValidMobileNumber;

/**
 * Masks an email address for privacy display.
 * Examples:
 * - guriaulakh0806@gmail.com -> guriaul***@gmail.com
 * - rahul123@gmail.com -> rah***@gmail.com
 * - a@gmail.com -> *@gmail.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.trim().toLowerCase().split('@');
  if (!local || !domain) return email;

  if (local.length <= 1) {
    return `*@${domain}`;
  }
  if (local.length <= 3) {
    return `${local.slice(0, 1)}***@${domain}`;
  }
  if (local.length <= 6) {
    return `${local.slice(0, 2)}***@${domain}`;
  }
  if (local.length <= 9) {
    return `${local.slice(0, 3)}***@${domain}`;
  }
  return `${local.slice(0, 7)}***@${domain}`;
}
