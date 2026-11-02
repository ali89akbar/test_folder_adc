import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import transitRoutes from '../../../backend/routes/transitRecords.js';
import { mockDb } from '../setup.js';

describe('Transit Records Routes (/api/transit-records)', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = { user: { id: 1, username: 'admin', role: 'admin', site: 'KHI' } };
      next();
    });
    app.use('/api/transit-records', transitRoutes);
  });

  describe('GET /api/transit-records', () => {
    it('fetches all transit records with joined entry metadata', async () => {
      const records = [
        { id: 'TR-1', entry_id: 10, from_site: 'KHI', to_site: 'LHE', quantity: 100, status: 'IN_TRANSIT' },
      ];
      mockDb.query.mockResolvedValueOnce([records]);

      const res = await request(app).get('/api/transit-records');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(records);
    });
  });

  describe('POST /api/transit-records', () => {
    it('returns 400 when entryId is missing', async () => {
      const res = await request(app).post('/api/transit-records').send({
        fromSite: 'KHI',
        toSite: 'LHE',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('entryId is required');
    });

    it('returns 400 when fromSite or toSite is invalid', async () => {
      const res = await request(app).post('/api/transit-records').send({
        entryId: 10,
        fromSite: 'INVALID',
        toSite: 'LHE',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid fromSite');
    });

    it('creates transit record successfully with 200', async () => {
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).post('/api/transit-records').send({
        entryId: 101,
        fromSite: 'KHI',
        toSite: 'LHE',
        date: '2026-10-31',
        quantity: 50,
        note: 'Stock transfer to LHE',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.id).toContain('TR-101-');
      expect(res.body.createdAt).toBeDefined();
    });
  });

  describe('PUT /api/transit-records/:id/deliver', () => {
    it('marks record delivered in transit_records_hot with 200', async () => {
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).put('/api/transit-records/TR-101/deliver');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deliveredAt).toBeDefined();
    });

    it('falls back to transit_records_archive if not in hot and delivers', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ affectedRows: 0 }]) // hot
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // archive

      const res = await request(app).put('/api/transit-records/TR-ARCHIVE-99/deliver');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 when transit record does not exist', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ affectedRows: 0 }])
        .mockResolvedValueOnce([{ affectedRows: 0 }]);

      const res = await request(app).put('/api/transit-records/TR-NONEXISTENT/deliver');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Transit record not found');
    });
  });
});
