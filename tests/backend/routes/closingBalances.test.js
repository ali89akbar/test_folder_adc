import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import closingBalanceRoutes from '../../../backend/routes/closingBalances.js';
import { mockDb } from '../setup.js';

describe('Closing Balances Routes (/api/closing-balances)', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = { user: { id: 1, username: 'admin', site: 'KHI', role: 'admin' } };
      next();
    });
    app.use('/api/closing-balances', closingBalanceRoutes);
  });

  describe('POST /api/closing-balances', () => {
    it('returns 400 when balanceKey is missing or empty', async () => {
      const res = await request(app).post('/api/closing-balances').send({
        balanceKey: '',
        value: 100,
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Valid balanceKey is required');
    });

    it('returns 400 when value is non-numeric', async () => {
      const res = await request(app).post('/api/closing-balances').send({
        balanceKey: 'KHI|PLASTIC|PayPak',
        value: 'not-a-number',
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Valid numeric value is required');
    });

    it('upserts closing balance successfully with 200', async () => {
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const res = await request(app).post('/api/closing-balances').send({
        balanceKey: 'KHI|PLASTIC|PayPak|Standard|Classic',
        value: 500,
        entryDate: '2026-10-31',
        updatedBy: 'tester',
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO closing_balances'),
        expect.any(Array)
      );
    });
  });

  describe('GET /api/closing-balances', () => {
    it('returns balances formatted as an object keyed by balance_key', async () => {
      const dbRows = [
        { balance_key: 'KHI|PLASTIC|Visa', value: 120, updated_at: '2026-10-31 10:00:00', entry_date: '2026-10-31', updated_by: 'admin' },
        { balance_key: 'LHE|MAILER|Standard', value: 300, updated_at: '2026-10-31 11:00:00', entry_date: '2026-10-31', updated_by: 'admin' },
      ];
      mockDb.query.mockResolvedValueOnce([dbRows]);

      const res = await request(app).get('/api/closing-balances');

      expect(res.status).toBe(200);
      expect(res.body['KHI|PLASTIC|Visa']).toEqual({
        value: 120,
        updatedAt: '2026-10-31 10:00:00',
        date: '2026-10-31',
        updatedBy: 'admin',
      });
      expect(res.body['LHE|MAILER|Standard'].value).toBe(300);
    });
  });

  describe('DELETE /api/closing-balances', () => {
    it('returns 400 when site or invType query params are invalid', async () => {
      const res = await request(app).delete('/api/closing-balances?site=INVALID&invType=PLASTIC');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Valid site and invType');
    });

    it('deletes balances matching prefix site and invType', async () => {
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 4 }]);

      const res = await request(app).delete('/api/closing-balances?site=KHI&invType=PLASTIC');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true });
      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM closing_balances WHERE balance_key LIKE ?',
        ['KHI|PLASTIC|%']
      );
    });
  });

  describe('POST /api/closing-balances/bulk', () => {
    it('rejects invalid or empty records payload with 400', async () => {
      const res = await request(app).post('/api/closing-balances/bulk').send({ records: [] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('records array is required');
    });

    it('rejects bulk payloads exceeding maximum 500 limit with 400', async () => {
      const largeArray = new Array(501).fill({ balanceKey: 'key', value: 10 });
      const res = await request(app).post('/api/closing-balances/bulk').send({ records: largeArray });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('maximum record limit');
    });

    it('executes bulk upsert and returns count with 200', async () => {
      mockDb.query.mockResolvedValueOnce([{ affectedRows: 2 }]);

      const records = [
        { balanceKey: 'KHI|PLASTIC|Visa', value: 150, entryDate: '2026-10-31', updatedBy: 'admin' },
        { balanceKey: 'KHI|PLASTIC|Mastercard', value: 250, entryDate: '2026-10-31', updatedBy: 'admin' },
      ];

      const res = await request(app).post('/api/closing-balances/bulk').send({ records });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, count: 2 });
    });
  });
});
