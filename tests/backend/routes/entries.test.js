import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import entryRoutes from '../../../backend/routes/entries.js';
import { mockDb, mockConnection } from '../setup.js';

describe('Entries Routes (/api/entries)', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // Simulate authenticated session middleware
    app.use((req, res, next) => {
      req.session = {
        user: { id: 1, username: 'tester', site: 'KHI', role: 'admin' },
      };
      next();
    });
    app.use('/api/entries', entryRoutes);
  });

  describe('POST /api/entries', () => {
    it('rejects invalid or missing date format with 400', async () => {
      const res = await request(app).post('/api/entries').send({
        date: 'invalid-date',
        site: 'KHI',
        invType: 'PLASTIC',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Valid date');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('rejects invalid site with 400', async () => {
      const res = await request(app).post('/api/entries').send({
        date: '2026-10-31',
        site: 'INVALID_SITE',
        invType: 'PLASTIC',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Valid site');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('rejects PLASTIC entry missing subProduct with 400', async () => {
      mockConnection.query.mockResolvedValueOnce([{ insertId: 101 }]); // base entry insert

      const res = await request(app).post('/api/entries').send({
        date: '2026-10-31',
        site: 'KHI',
        invType: 'PLASTIC',
        cardType: 'Debit',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('subProduct is required');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('rejects MAILER entry missing pageSize with 400', async () => {
      mockConnection.query.mockResolvedValueOnce([{ insertId: 102 }]);

      const res = await request(app).post('/api/entries').send({
        date: '2026-10-31',
        site: 'LHE',
        invType: 'MAILER',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('pageSize is required');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });

    it('creates a valid PLASTIC entry with vendor association and commits transaction', async () => {
      mockConnection.query
        .mockResolvedValueOnce([{ insertId: 103 }]) // base entry
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // plastic entry
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // vendor upsert
        .mockResolvedValueOnce([[{ id: 5 }]]) // vendor select
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // entry_vendors

      const res = await request(app).post('/api/entries').send({
        date: '2026-10-31',
        site: 'KHI',
        invType: 'PLASTIC',
        cardType: 'Debit EMV',
        subProduct: 'Classic',
        openingBalance: 100,
        receivedFromVendor: 50,
        batchCount: 20,
        vendors: [{ name: 'Giesecke+Devrient', qty: 50 }],
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, entryId: 103 });
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('PUT /api/entries/:id', () => {
    it('returns 400 for non-numeric id', async () => {
      const res = await request(app).put('/api/entries/abc').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid entry ID');
    });

    it('updates entry in entries_hot when found and commits', async () => {
      mockConnection.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).put('/api/entries/103').send({
        receivedFromVendor: 60,
        closingBalance: 140,
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, entryId: '103' });
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('falls back to entries_archive if not found in entries_hot', async () => {
      mockConnection.query
        .mockResolvedValueOnce([{ affectedRows: 0 }]) // hot not found
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // archive updated

      const res = await request(app).put('/api/entries/103').send({
        closingBalance: 200,
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, entryId: '103' });
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it('returns 404 when entry is not in hot or archive', async () => {
      mockConnection.query
        .mockResolvedValueOnce([{ affectedRows: 0 }])
        .mockResolvedValueOnce([{ affectedRows: 0 }]);

      const res = await request(app).put('/api/entries/999').send({});
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('No entry found with specified ID');
      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe('GET /api/entries', () => {
    it('fetches entries joined with sub_products and mailer metadata', async () => {
      const sampleEntries = [
        { id: 1, date: '2026-10-31', site: 'KHI', inv_type: 'PLASTIC', card_type: 'Mastercard' },
      ];
      mockDb.query.mockResolvedValueOnce([sampleEntries]);

      const res = await request(app).get('/api/entries');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(sampleEntries);
    });
  });

  describe('DELETE /api/entries/:id', () => {
    it('returns 400 for invalid ID', async () => {
      const res = await request(app).delete('/api/entries/invalid');
      expect(res.status).toBe(400);
    });

    it('deletes entry successfully from hot or archive', async () => {
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
      const res = await request(app).delete('/api/entries/50');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
    });
  });

  describe('DELETE /api/entries (Site Reset)', () => {
    it('deletes entries for current session user site', async () => {
      mockDb.query
        .mockResolvedValueOnce([{ affectedRows: 5 }]) // hot
        .mockResolvedValueOnce([{ affectedRows: 3 }]); // archive

      const res = await request(app).delete('/api/entries');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, deleted: 8, site: 'KHI' });
    });
  });
});
