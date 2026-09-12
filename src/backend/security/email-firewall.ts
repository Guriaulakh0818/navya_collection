/**
 * Anti-Bot & Email Abuse Firewall for Navya Collection
 * Prevents automated OTP bombing attacks, disposable email abuse, and Russian/spam bot traffic.
 */

// 1. High-risk & Non-serviceable TLDs for Indian domestic store
const BLOCKED_TLDS = new Set([
  'ru', // Russia (High Botnet / Spam Abuse)
  'su', // Soviet Union legacy
  'by', // Belarus
  'kz', // Kazakhstan
  'cn', // China
  'top',
  'xyz',
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
]);

// 2. Known Russian, Disposable, and Temporary Email Provider Domains
const BLOCKED_DOMAINS = new Set([
  // Russian Mail Providers
  'mail.ru',
  'yandex.ru',
  'ya.ru',
  'yandex.com',
  'yandex.by',
  'yandex.kz',
  'yandex.ua',
  'bk.ru',
  'inbox.ru',
  'list.ru',
  'rambler.ru',
  'internet.ru',
  'autorambler.ru',
  'lenta.ru',
  'myrambler.ru',
  'ro.ru',
  'r0.ru',
  'corp.mail.ru',
  'vk.com',
  'ok.ru',

  // Disposable / Temporary Email Services
  'tempmail.com',
  'tempmail.net',
  'temp-mail.org',
  'temp-mail.io',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.biz',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'mailinator.com',
  'mailinator.net',
  'mailin8r.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'throwawaymail.com',
  'sharklasers.com',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'dispostable.com',
  'fakemailgenerator.com',
  'getairmail.com',
  'crazymailing.com',
  'mohmal.com',
  'burnermail.io',
  'emailondeck.com',
  'generator.email',
  'tempail.com',
  'maildrop.cc',
  'inboxkitten.com',
  'nada.ltd',
  'getnada.com',
  'abcvg.com',
  'dropmail.me',
  'moakt.com',
  'disposablemail.com',
  'mytemp.email',
]);

export interface EmailFirewallResult {
  isAllowed: boolean;
  reason?: string;
  isBotTrap?: boolean;
}

/**
 * Validates an email address against anti-bot and anti-spam firewall rules.
 */
export function validateEmailSafety(email: string): EmailFirewallResult {
  if (!email || typeof email !== 'string') {
    return { isAllowed: false, reason: 'Invalid email address' };
  }

  const cleaned = email.trim().toLowerCase();
  const parts = cleaned.split('@');

  if (parts.length !== 2) {
    return { isAllowed: false, reason: 'Malformed email format' };
  }

  const [localPart, domain] = parts;

  if (!localPart || !domain || domain.indexOf('.') === -1) {
    return { isAllowed: false, reason: 'Invalid email domain' };
  }

  // Check exact domain blocklist
  if (BLOCKED_DOMAINS.has(domain)) {
    return {
      isAllowed: false,
      reason: `Emails from domain '${domain}' are not supported.`,
      isBotTrap: true,
    };
  }

  // Check TLD blocklist
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];

  if (BLOCKED_TLDS.has(tld)) {
    return {
      isAllowed: false,
      reason: `Email domain extension '.${tld}' is not supported.`,
      isBotTrap: true,
    };
  }

  // Check for suspicious disposable subdomain patterns (e.g. *.tempmail.* or *.yopmail.*)
  for (const blocked of BLOCKED_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) {
      return {
        isAllowed: false,
        reason: 'Temporary email domains are not permitted.',
        isBotTrap: true,
      };
    }
  }

  return { isAllowed: true };
}
