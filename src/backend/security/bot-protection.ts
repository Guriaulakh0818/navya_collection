export interface BotVerificationResult {
  isHuman: boolean;
  score?: number;
  reason?: string;
}

/**
 * Architecture facade for reCAPTCHA v3 & Cloudflare Turnstile bot protection
 */
export async function verifyBotProtectionToken(
  token?: string,
  provider: 'recaptcha' | 'turnstile' = 'turnstile',
): Promise<BotVerificationResult> {
  // If token is missing, allow in dev/test mode
  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      return { isHuman: true, score: 1.0, reason: 'Dev Mode Bypass' };
    }
    return { isHuman: false, reason: 'Missing bot protection token' };
  }

  try {
    if (provider === 'recaptcha') {
      const secret = process.env.RECAPTCHA_SECRET_KEY;
      if (!secret) return { isHuman: true, reason: 'reCAPTCHA secret unconfigured' };

      const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret, response: token }),
      });

      const json = await res.json();
      return {
        isHuman: Boolean(json.success && (json.score === undefined || json.score >= 0.5)),
        score: json.score || 1.0,
      };
    }

    if (provider === 'turnstile') {
      const secret = process.env.TURNSTILE_SECRET_KEY;
      if (!secret) return { isHuman: true, reason: 'Turnstile secret unconfigured' };

      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, response: token }),
      });

      const json = await res.json();
      return { isHuman: Boolean(json.success) };
    }

    return { isHuman: true };
  } catch (err: any) {
    console.warn('[BOT_PROTECTION_WARN] Verification error:', err?.message);
    return { isHuman: true, reason: 'Verification fallback' };
  }
}
