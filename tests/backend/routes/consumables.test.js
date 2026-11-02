import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import consumablesRoutes from '../../../backend/routes/consumables.js';
import { mockDb } from '../setup.js';

describe('Consumables Stock Routes (/api/consumables-stock)', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = { user: { id: 1, username: 'admin', role: 'admin', site: 'KHI' } };
      next();
    });
    app.use('/api/consumables-stock', consumablesRoutes);
  });

  describe('GET /api/consumables-stock', () => {
    it('returns 400 when siteId is missing', async () => {
      const res = await request(app).get('/api/consumables-stock');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('siteId is required');
    });

    it('returns consumables stock mapped by item_id with 200', async () => {
      const rows = [
        {
          item_id: 'RIBBON-YMCKO',
          opening_value: 50,
          closing_value: 45,
          base_date: '2026-10-01',
          updated_at: '2026-10-31 09:00:00',
          updated_by: 'admin',
        },
      ];
      mockDb.query.mockResolvedValueOnce([rows]);

      const res = await request(app).get('/api/consumables-stock?siteId=KHI');
      expect(res.status).toBe(200);
      expect(res.body['RIBBON-YMCKO']).toEqual({
        value: 50,
        closingValue: 45,
        baseDate: '2026-10-01',
        updatedAt: '2026-10-31 09:00:00',
        updatedBy: 'admin',
      });
    });
  });

  describe('POST /api/consumables-stock', () => {
    it('returns 400 when siteId or itemId is missing', async () => {
      const res = await request(app).post('/api/consumables-stock').send({
        siteId: 'KHI',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('siteId and itemId are required');
    });

    it('upserts consumable stock successfully with 200', async () => {
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).post('/api/consumables-stock').send({
        siteId: 'KHI',
        itemId: 'FOIL-GOLD',
        value: 120,
        closingValue: 110,
        baseDate: '2026-10-31',
        updatedBy: 'admin',
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });
  });

  describe('Snapshots (/api/consumables-stock/snapshots)', () => {
    it('returns 400 for GET snapshots without siteId', async () => {
      const res = await request(app).get('/api/consumables-stock/snapshots');
      expect(res.status).toBe(400);
    });

    it('returns snapshots filtered by date when provided', async () => {
      const snapshots = [{ id: 1, site_id: 'KHI', snapshot_date: '2026-10-31', item_id: 'FOIL' }];
      mockDb.query.mockResolvedValueOnce([snapshots]);

      const res = await request(app).get('/api/consumables-stock/snapshots?siteId=KHI&date=2026-10-31');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(snapshots);
    });

    it('rejects POST snapshots with invalid date format with 400', async () => {
      const res = await request(app).post('/api/consumables-stock/snapshots').send({
        siteId: 'KHI',
        date: 'bad-date',
        items: [{ itemId: 'FOIL', opening: 10, consumed: 2, closing: 8 }],
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid date format');
    });

    it('saves daily snapshots successfully with 200', async () => {
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).post('/api/consumables-stock/snapshots').send({
        siteId: 'KHI',
        date: '2026-10-31',
        items: [
          { itemId: 'RIBBON', opening: 50, consumed: 5, closing: 45 },
        ],
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });
  });
});
