import { describe, it, expect, vi, beforeEach } from 'vitest';
import requireAuth from '../../../backend/middleware/auth.js';
import { mockDb } from '../setup.js';

describe('requireAuth Middleware (Single / Concurrent Session Enforcement)', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      sessionID: 'sess-abc-123',
      session: {
        user: { id: 1, username: 'admin', role: 'admin', site: 'KHI' },
        destroy: vi.fn((cb) => cb && cb()),
      },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      clearCookie: vi.fn(),
    };
    next = vi.fn();
  });

  it('rejects unauthenticated requests without session user with 401', async () => {
    delete req.session.user;
    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  it('destroys session and returns 401 if user account is not found in database', async () => {
    mockDb.query.mockResolvedValueOnce([[]]); // empty rows

    await requireAuth(req, res, next);

    expect(req.session.destroy).toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('ubl_session');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'User account not found.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('terminates current session and returns 401 when concurrent login is detected', async () => {
    // DB has a different session ID stored for this user (logged in elsewhere)
    mockDb.query.mockResolvedValueOnce([
      [{ id: 1, current_session_id: 'sess-another-device-456' }],
    ]);

    await requireAuth(req, res, next);

    expect(req.session.destroy).toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalledWith('ubl_session');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Session expired: Your account was logged in from another device or window.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('binds current_session_id to DB if user has null current_session_id and calls next()', async () => {
    mockDb.query
      .mockResolvedValueOnce([[{ id: 1, current_session_id: null }]]) // select
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // update

    await requireAuth(req, res, next);

    expect(mockDb.query).toHaveBeenCalledWith(
      'UPDATE users SET current_session_id = ? WHERE id = ?',
      ['sess-abc-123', 1]
    );
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows request to proceed when current session ID matches the active session in DB', async () => {
    mockDb.query.mockResolvedValueOnce([
      [{ id: 1, current_session_id: 'sess-abc-123' }],
    ]);

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('handles database errors gracefully with 500 without leaking stack traces', async () => {
    mockDb.query.mockRejectedValueOnce(new Error('DB Connection Lost'));

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication verification failed' });
    expect(next).not.toHaveBeenCalled();
  });
});
