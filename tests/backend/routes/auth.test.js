import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import bcrypt from 'bcrypt';
import authRoutes from '../../../backend/routes/auth.js';
import { mockDb } from '../setup.js';

describe('Auth Routes (/api/auth)', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
      })
    );
    app.use('/api/auth', authRoutes);
  });

  describe('POST /api/auth/login', () => {
    it('returns 400 when username or password is missing', async () => {
      const res = await request(app).post('/api/auth/login').send({ username: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Username is required.');
    });

    it('returns 401 when user is not found in database', async () => {
      mockDb.query.mockResolvedValueOnce([[]]); // User not found

      const res = await request(app).post('/api/auth/login').send({
        username: 'nonexistent',
        password: 'Password123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('returns 401 when password does not match hash', async () => {
      const hash = await bcrypt.hash('CorrectPassword123!', 4);
      mockDb.query.mockResolvedValueOnce([
        [{ id: 1, username: 'testuser', password_hash: hash, site: 'KHI', role: 'user' }],
      ]);

      const res = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'WrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('logs in successfully, binds session, and updates current_session_id', async () => {
      const hash = await bcrypt.hash('CorrectPassword123!', 4);
      mockDb.query
        .mockResolvedValueOnce([
          [{ id: 1, username: 'testuser', password_hash: hash, site: 'KHI', role: 'user', current_session_id: 'old-session' }],
        ]) // select
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // update current_session_id

      const res = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'CorrectPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toEqual({
        id: 1,
        username: 'testuser',
        site: 'KHI',
        role: 'user',
      });
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('handles unexpected database exception gracefully without disclosing internal paths', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Fatal DB Crash in C:\\Server\\db.js'));

      const res = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'Password123!',
      });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('An unexpected error occurred during login.');
      expect(JSON.stringify(res.body)).not.toContain('C:\\');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('logs out and clears session and cookie', async () => {
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]); // clear current_session_id

      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Not authenticated');
    });

    it('returns user data when valid authenticated session exists', async () => {
      const agent = request.agent(app);
      const hash = await bcrypt.hash('Password123!', 4);

      mockDb.query
        .mockResolvedValueOnce([
          [{ id: 2, username: 'validuser', password_hash: hash, site: 'LHE', role: 'admin', current_session_id: null }],
        ]) // login select
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // login update

      // Login first
      const loginRes = await agent.post('/api/auth/login').send({
        username: 'validuser',
        password: 'Password123!',
      });
      expect(loginRes.status).toBe(200);

      // Now call /me
      mockDb.query.mockResolvedValueOnce([
        [{ id: 2, username: 'validuser', site: 'LHE', role: 'admin', current_session_id: null }],
      ]);

      const meRes = await agent.get('/api/auth/me');
      expect(meRes.status).toBe(200);
      expect(meRes.body.user).toMatchObject({
        id: 2,
        username: 'validuser',
        site: 'LHE',
        role: 'admin',
      });
    });
  });
});
