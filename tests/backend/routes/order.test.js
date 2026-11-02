import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import orderRoutes from '../../../backend/routes/order.js';
import { mockDb, mockConnection } from '../setup.js';

describe('Order Routes (/api/orders)', () => {
  let app;
  let currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = { user: currentUser };
      next();
    });
    app.use('/api/orders', orderRoutes);
  });

  describe('POST /api/orders', () => {
    it('returns 400 when product key is missing', async () => {
      const res = await request(app).post('/api/orders').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Valid product key is required');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('auto-approves order placed by admin user', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      mockConnection.query
        .mockResolvedValueOnce([[]]) // existing check
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // insert

      const res = await request(app).post('/api/orders').send({
        key: 'ORD-KEY-1',
        invType: 'PLASTIC',
        cardType: 'Visa Classic',
        qty: 500,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.approvalStatus).toBe('APPROVED');
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('marks order as PENDING when placed by a regular user', async () => {
      currentUser = { id: 2, username: 'staff1', role: 'user', site: 'KHI' };
      mockConnection.query
        .mockResolvedValueOnce([[]]) // existing check
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // insert

      const res = await request(app).post('/api/orders').send({
        key: 'ORD-KEY-2',
        invType: 'PLASTIC',
        cardType: 'Visa Gold',
        qty: 250,
      });

      expect(res.status).toBe(200);
      expect(res.body.approvalStatus).toBe('PENDING');
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('rejects marking received if order is not yet approved with 400', async () => {
      mockConnection.query.mockResolvedValueOnce([
        [{ approval_status: 'PENDING' }],
      ]);

      const res = await request(app).post('/api/orders').send({
        key: 'ORD-KEY-2',
        received: true,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Order must be approved by an admin');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe('Admin Actions (Pending Count, List, Approve, Reject)', () => {
    it('blocks non-admin users from accessing pending approvals with 403', async () => {
      currentUser = { id: 2, username: 'staff1', role: 'user', site: 'KHI' };

      const res = await request(app).get('/api/orders/pending-count');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Admins only');
    });

    it('returns pending count to admin with 200', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      mockDb.query.mockResolvedValueOnce([[{ count: 3 }]]);

      const res = await request(app).get('/api/orders/pending-count');
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(3);
    });

    it('lists pending orders for admin approval panel', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      const pendingRows = [
        { product_key: 'KEY-1', inv_type: 'PLASTIC', quantity: 100, requested_by: 'staff1' },
      ];
      mockDb.query.mockResolvedValueOnce([pendingRows]);

      const res = await request(app).get('/api/orders/pending');
      expect(res.status).toBe(200);
      expect(res.body[0].key).toBe('KEY-1');
      expect(res.body[0].qty).toBe(100);
    });

    it('approves a pending order successfully', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).put('/api/orders/KEY-1/approve');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 when approving non-existent order', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const res = await request(app).put('/api/orders/UNKNOWN-KEY/approve');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('No pending order found');
    });

    it('rejects a pending order successfully', async () => {
      currentUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).put('/api/orders/KEY-1/reject');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE & GET /api/orders', () => {
    it('deletes active order item', async () => {
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).delete('/api/orders/KEY-1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns all orders formatted as an object keyed by product_key', async () => {
      const dbRows = [
        {
          product_key: 'PK-1',
          inv_type: 'PLASTIC',
          card_type: 'Classic',
          quantity: 200,
          order_date_str: '2026-10-31',
          received: 0,
        },
      ];
      mockDb.query.mockResolvedValueOnce([dbRows]);

      const res = await request(app).get('/api/orders?site=KHI');
      expect(res.status).toBe(200);
      expect(res.body['PK-1']).toBeDefined();
      expect(res.body['PK-1'].qty).toBe(200);
      expect(res.body['PK-1'].received).toBe(false);
    });
  });
});
