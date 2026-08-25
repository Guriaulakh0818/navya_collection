import { describe, expect, it } from 'vitest';

import {
  isValidEmail,
  isValidMobile,
  isValidPincode,
  maskEmail,
} from '../../src/shared/utils/validators';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('validates standard email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('admin@navyacollection.co.in')).toBe(true);
    });

    it('rejects malformed email addresses', () => {
      expect(isValidEmail('plainaddress')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
    });
  });

  describe('maskEmail', () => {
    it('masks emails according to privacy rules matching specified examples', () => {
      expect(maskEmail('guriaulakh0806@gmail.com')).toBe('guriaul***@gmail.com');
      expect(maskEmail('rahul123@gmail.com')).toBe('rah***@gmail.com');
      expect(maskEmail('a@gmail.com')).toBe('*@gmail.com');
    });

    it('handles short and edge case email usernames properly', () => {
      expect(maskEmail('ab@gmail.com')).toBe('a***@gmail.com');
      expect(maskEmail('abc@gmail.com')).toBe('a***@gmail.com');
      expect(maskEmail('rahul@gmail.com')).toBe('ra***@gmail.com');
    });
  });

  describe('isValidMobile', () => {
    it('validates 10-digit Indian mobile numbers', () => {
      expect(isValidMobile('9876543210')).toBe(true);
      expect(isValidMobile('6300011122')).toBe(true);
    });

    it('rejects numbers with invalid lengths or non-digits', () => {
      expect(isValidMobile('12345')).toBe(false);
      expect(isValidMobile('98765432100')).toBe(false);
      expect(isValidMobile('98765abcde')).toBe(false);
    });
  });

  describe('isValidPincode', () => {
    it('validates 6-digit Indian PIN codes', () => {
      expect(isValidPincode('302001')).toBe(true);
      expect(isValidPincode('110001')).toBe(true);
    });

    it('rejects invalid PIN codes', () => {
      expect(isValidPincode('01234')).toBe(false);
      expect(isValidPincode('3020010')).toBe(false);
      expect(isValidPincode('PIN302')).toBe(false);
    });
  });
});
