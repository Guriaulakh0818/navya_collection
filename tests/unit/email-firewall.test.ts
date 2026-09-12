import { describe, expect, it } from 'vitest';

import { validateEmailSafety } from '@/backend/security/email-firewall';

describe('Email Firewall & Anti-Bot Protection', () => {
  it('should block Russian domains (.ru, mail.ru, yandex.ru, ya.ru)', () => {
    expect(validateEmailSafety('andrei179@mail.ru').isAllowed).toBe(false);
    expect(validateEmailSafety('vera671@mail.ru').isAllowed).toBe(false);
    expect(validateEmailSafety('vladimir_popov283@yandex.ru').isAllowed).toBe(false);
    expect(validateEmailSafety('tatyana_volkov@ya.ru').isAllowed).toBe(false);
    expect(validateEmailSafety('user@bk.ru').isAllowed).toBe(false);
    expect(validateEmailSafety('spammer@rambler.ru').isAllowed).toBe(false);
    expect(validateEmailSafety('bot@customdomain.ru').isAllowed).toBe(false);
  });

  it('should block disposable and temp-mail domains', () => {
    expect(validateEmailSafety('bot@tempmail.com').isAllowed).toBe(false);
    expect(validateEmailSafety('bot@10minutemail.com').isAllowed).toBe(false);
    expect(validateEmailSafety('bot@guerrillamail.com').isAllowed).toBe(false);
    expect(validateEmailSafety('bot@mailinator.com').isAllowed).toBe(false);
    expect(validateEmailSafety('bot@yopmail.com').isAllowed).toBe(false);
  });

  it('should allow legitimate customer email providers', () => {
    expect(validateEmailSafety('gurvinder@gmail.com').isAllowed).toBe(true);
    expect(validateEmailSafety('customer@yahoo.com').isAllowed).toBe(true);
    expect(validateEmailSafety('buyer@outlook.com').isAllowed).toBe(true);
    expect(validateEmailSafety('support@navyacollection.store').isAllowed).toBe(true);
    expect(validateEmailSafety('business@company.in').isAllowed).toBe(true);
  });

  it('should handle malformed email formats cleanly', () => {
    expect(validateEmailSafety('').isAllowed).toBe(false);
    expect(validateEmailSafety('notanemail').isAllowed).toBe(false);
    expect(validateEmailSafety('@domain.com').isAllowed).toBe(false);
  });
});
