import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeString,
  isValidId,
  isValidNumber,
  isValidDate,
  isValidSite,
  isValidRole,
  isValidInvType,
  validateLogin,
  validateCreateUser,
  validateUpdateUser,
  validateNumericId,
} from '../../../backend/middleware/validation.js';

describe('Validation Middleware & Helper Functions', () => {
  describe('Helper Functions', () => {
    it('sanitizeString trims and caps length correctly', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
      expect(sanitizeString('abcdef', 3)).toBe('abc');
      expect(sanitizeString(12345)).toBe('');
      expect(sanitizeString(null)).toBe('');
    });

    it('isValidId correctly validates positive integers', () => {
      expect(isValidId(1)).toBe(true);
      expect(isValidId('42')).toBe(true);
      expect(isValidId(0)).toBe(false);
      expect(isValidId(-5)).toBe(false);
      expect(isValidId('abc')).toBe(false);
      expect(isValidId(1.5)).toBe(false);
    });

    it('isValidNumber validates numeric ranges and types', () => {
      expect(isValidNumber(100, 0, 1000)).toBe(true);
      expect(isValidNumber('50', 0, 100)).toBe(true);
      expect(isValidNumber(-1, 0, 100)).toBe(false);
      expect(isValidNumber(150, 0, 100)).toBe(false);
      expect(isValidNumber('invalid')).toBe(false);
      expect(isValidNumber(NaN)).toBe(false);
      expect(isValidNumber(Infinity)).toBe(false);
    });

    it('isValidDate validates YYYY-MM-DD date formats', () => {
      expect(isValidDate('2026-10-31')).toBe(true);
      expect(isValidDate('2026-02-28')).toBe(true);
      expect(isValidDate('2026/10/31')).toBe(false);
      expect(isValidDate('31-10-2026')).toBe(false);
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });

    it('isValidSite checks allowed sites KHI and LHE', () => {
      expect(isValidSite('KHI')).toBe(true);
      expect(isValidSite('khi')).toBe(true);
      expect(isValidSite('LHE')).toBe(true);
      expect(isValidSite('lhe')).toBe(true);
      expect(isValidSite('ISB')).toBe(false);
      expect(isValidSite('')).toBe(false);
      expect(isValidSite(123)).toBe(false);
    });

    it('isValidRole checks allowed roles admin and user', () => {
      expect(isValidRole('admin')).toBe(true);
      expect(isValidRole('ADMIN')).toBe(true);
      expect(isValidRole('user')).toBe(true);
      expect(isValidRole('USER')).toBe(true);
      expect(isValidRole('superadmin')).toBe(false);
      expect(isValidRole('')).toBe(false);
    });

    it('isValidInvType checks allowed inventory types', () => {
      expect(isValidInvType('PLASTIC')).toBe(true);
      expect(isValidInvType('plastic')).toBe(true);
      expect(isValidInvType('MAILER')).toBe(true);
      expect(isValidInvType('ENVELOPE')).toBe(true);
      expect(isValidInvType('STATIONERY')).toBe(true);
      expect(isValidInvType('ETC')).toBe(true);
      expect(isValidInvType('UNKNOWN')).toBe(false);
      expect(isValidInvType(null)).toBe(false);
    });
  });

  describe('validateLogin Middleware', () => {
    const createMocks = (body) => {
      const req = { body };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      const next = vi.fn();
      return { req, res, next };
    };

    it('passes valid login request to next()', () => {
      const { req, res, next } = createMocks({ username: ' admin ', password: 'password123' });
      validateLogin(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.body.username).toBe('admin');
      expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects missing or empty username with 400', () => {
      const { req, res, next } = createMocks({ username: '', password: 'password123' });
      validateLogin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Username is required.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects username exceeding 50 characters with 400', () => {
      const { req, res, next } = createMocks({ username: 'a'.repeat(51), password: 'password123' });
      validateLogin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Username cannot exceed 50 characters.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects missing password with 400', () => {
      const { req, res, next } = createMocks({ username: 'admin' });
      validateLogin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Password is required.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects oversized password (> 72 characters) to mitigate bcrypt DoS with 400', () => {
      const { req, res, next } = createMocks({ username: 'admin', password: 'a'.repeat(73) });
      validateLogin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Password length is invalid.' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateCreateUser Middleware', () => {
    const createMocks = (body) => {
      const req = { body };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      const next = vi.fn();
      return { req, res, next };
    };

    it('passes valid user payload to next()', () => {
      const { req, res, next } = createMocks({
        username: 'new_user.1',
        password: 'ValidPassword123!',
        site: 'khi',
        role: 'ADMIN',
      });
      validateCreateUser(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.body.site).toBe('KHI');
      expect(req.body.role).toBe('admin');
    });

    it('rejects invalid username characters or short lengths with 400', () => {
      const { req, res, next } = createMocks({
        username: 'ab', // < 3 chars
        password: 'ValidPassword123!',
        site: 'KHI',
      });
      validateCreateUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Username must be 3-50 alphanumeric characters'),
      }));
    });

    it('rejects passwords shorter than 8 characters with 400', () => {
      const { req, res, next } = createMocks({
        username: 'validuser',
        password: 'short',
        site: 'KHI',
      });
      validateCreateUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Password must be between 8 and 72 characters.',
      }));
    });

    it('rejects invalid site with 400', () => {
      const { req, res, next } = createMocks({
        username: 'validuser',
        password: 'ValidPassword123!',
        site: 'ISB',
      });
      validateCreateUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Site must be either 'KHI' or 'LHE'." });
    });

    it('rejects invalid role with 400', () => {
      const { req, res, next } = createMocks({
        username: 'validuser',
        password: 'ValidPassword123!',
        site: 'KHI',
        role: 'superadmin',
      });
      validateCreateUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Role must be either 'admin' or 'user'." });
    });
  });

  describe('validateUpdateUser Middleware', () => {
    const createMocks = (body) => {
      const req = { body };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      const next = vi.fn();
      return { req, res, next };
    };

    it('passes valid update payload', () => {
      const { req, res, next } = createMocks({ role: 'admin', site: 'lhe' });
      validateUpdateUser(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.body.role).toBe('admin');
      expect(req.body.site).toBe('LHE');
    });

    it('rejects empty update with 400', () => {
      const { req, res, next } = createMocks({});
      validateUpdateUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Provide role and/or site to update.' });
    });

    it('rejects invalid role with 400', () => {
      const { req, res, next } = createMocks({ role: 'manager' });
      validateUpdateUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects invalid site with 400', () => {
      const { req, res, next } = createMocks({ site: 'NYC' });
      validateUpdateUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateNumericId Middleware', () => {
    it('accepts valid numeric id in req.params', () => {
      const req = { params: { id: '123' } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();
      validateNumericId(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects non-numeric id with 400', () => {
      const req = { params: { id: 'abc' } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();
      validateNumericId(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID parameter.' });
    });
  });
});
