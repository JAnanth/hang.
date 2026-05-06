import { describe, it, expect } from 'vitest';
import { generateInviteCode } from '../../src/services/groupService.js';

describe('groupService', () => {
  describe('generateInviteCode', () => {
    it('generates an 8-character uppercase hex code', () => {
      const code = generateInviteCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[A-F0-9]+$/);
    });

    it('generates unique codes', () => {
      const codes = new Set(Array.from({ length: 20 }, () => generateInviteCode()));
      expect(codes.size).toBeGreaterThan(15);
    });
  });
});
