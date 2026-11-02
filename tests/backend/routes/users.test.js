import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import userRoutes from '../../../backend/routes/users.js';
import { mockDb } from '../setup.js';

describe('User Management Routes (/api/users)', () => {
  let app;
  let currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = { user: currentUser };
      next();
    });
    app.use('/api/users', userRoutes);
  });

  describe('GET /api/users', () => {
    it('blocks non-admin users with 403', async () => {
      currentUser = { id: 2, username: 'operator1', role: 'user', site: 'KHI' };

      const res = await request(app).get('/api/users');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Admins only');
    });

    it('returns user list to admins with 200 (excluding password_hash)', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      const usersList = [
        { id: 1, username: 'admin', site: 'KHI', role: 'admin', created_at: '2026-10-01' },
      ];
      mockDb.query.mockResolvedValueOnce([usersList]);

      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(usersList);
      expect(res.body[0].password_hash).toBeUndefined();
    });
  });

  describe('POST /api/users', () => {
    it('creates new user and returns 200 with new userId', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      mockDb.query.mockResolvedValueOnce([{ insertId: 5 }]);

      const res = await request(app).post('/api/users').send({
        username: 'new_operator',
        password: 'SecurePassword123!',
        site: 'KHI',
        role: 'user',
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        userId: 5,
        username: 'new_operator',
        site: 'KHI',
        role: 'user',
      });
    });

    it('returns 409 Conflict when username already exists (ER_DUP_ENTRY)', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      const dupError = new Error('Duplicate entry');
      dupError.code = 'ER_DUP_ENTRY';
      mockDb.query.mockRejectedValueOnce(dupError);

      const res = await request(app).post('/api/users').send({
        username: 'existing_user',
        password: 'SecurePassword123!',
        site: 'KHI',
        role: 'user',
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Username already exists');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('prevents demoting the last remaining admin with 400', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      mockDb.query
        .mockResolvedValueOnce([[{ role: 'admin' }]]) // targetUser
        .mockResolvedValueOnce([[{ adminCount: 1 }]]); // adminCount

      const res = await request(app).put('/api/users/1').send({
        role: 'user',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cannot demote the last remaining admin');
    });

    it('updates user role and site successfully with 200', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).put('/api/users/2').send({
        site: 'LHE',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('PUT /api/users/:id/password (Reset Password)', () => {
    it('rejects passwords shorter than 8 characters with 400', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      const res = await request(app).put('/api/users/2/password').send({ password: '123' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('between 8 and 72 characters');
    });

    it('resets password successfully with 200', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).put('/api/users/2/password').send({
        password: 'NewStrongPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('prevents deleting the last remaining admin with 400', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      mockDb.query
        .mockResolvedValueOnce([[{ role: 'admin' }]])
        .mockResolvedValueOnce([[{ adminCount: 1 }]]);

      const res = await request(app).delete('/api/users/1');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Cannot delete the last remaining admin');
    });

    it('deletes user successfully with 200', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      mockDb.query
        .mockResolvedValueOnce([[{ role: 'user' }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).delete('/api/users/3');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
