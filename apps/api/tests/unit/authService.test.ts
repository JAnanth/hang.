import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateSessionToken, hashToken } from '../../src/services/authService.js';

describe('authService', () => {
  describe('generateSessionToken', () => {
    it('generates a 96-character hex token', () => {
      const token = generateSessionToken();
      expect(token).toHaveLength(96);
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it('generates unique tokens each call', () => {
      const t1 = generateSessionToken();
      const t2 = generateSessionToken();
      expect(t1).not.toBe(t2);
    });
  });

  describe('hashToken', () => {
    it('produces a 64-character hex SHA-256 hash', () => {
      const hash = hashToken('some-token');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('produces consistent output for the same input', () => {
      const token = 'deterministic-token';
      expect(hashToken(token)).toBe(hashToken(token));
    });

    it('produces different hashes for different inputs', () => {
      expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
    });
  });
});
