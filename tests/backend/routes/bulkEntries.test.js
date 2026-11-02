import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import bulkRoutesBuilder from '../../../backend/routes/Bulkentryroute.js';
import { mockDb, mockConnection } from '../setup.js';

describe('Bulk Entries Route (POST /api/entries/bulk)', () => {
  let app;
  let sessionUser = { id: 1, username: 'admin', role: 'admin', site: 'KHI' };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.session = { user: sessionUser };
      next();
    });
    app.use('/api', bulkRoutesBuilder(mockDb));
  });

  it('rejects invalid date format with 400', async () => {
    const res = await request(app).post('/api/entries/bulk').send({
      date: 'not-a-date',
      invType: 'PLASTIC',
      rows: [{ cardType: 'Visa' }],
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Valid date');
  });

  it('rejects invalid invType with 400', async () => {
    const res = await request(app).post('/api/entries/bulk').send({
      date: '2026-10-31',
      invType: 'INVALID_TYPE',
      rows: [{ cardType: 'Visa' }],
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Valid invType');
  });

  it('rejects empty rows array with 400', async () => {
    const res = await request(app).post('/api/entries/bulk').send({
      date: '2026-10-31',
      invType: 'PLASTIC',
      rows: [],
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('rows array is required');
  });

  it('rejects payload exceeding 2000 rows limit with 400', async () => {
    const rows = new Array(2001).fill({ cardType: 'Visa' });
    const res = await request(app).post('/api/entries/bulk').send({
      date: '2026-10-31',
      invType: 'PLASTIC',
      rows,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('maximum row limit');
  });

  it('processes new entries, updates closing balances and handles auto-transits', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[]]) // balanceRows check
      .mockResolvedValueOnce([[]]) // find existing entry check (none found)
      .mockResolvedValueOnce([{ insertId: 501 }]) // insert base entry
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // insert plastic details
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // insert closing balances
      .mockResolvedValueOnce([{ insertId: 901 }]); // insert auto-transit

    const res = await request(app).post('/api/entries/bulk').send({
      date: '2026-10-31',
      invType: 'PLASTIC',
      rows: [
        {
          cardType: 'Visa Gold',
          scheme: 'VISA',
          plasticCategory: 'Standard',
          subProduct: 'Debit EMV',
          stockReceived: 1000,
          batchCount: 200,
          transferred: 100, // triggers auto transit to LHE
        },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.saved).toBe(1);
    expect(res.body.transitRecords.length).toBe(1);
    expect(res.body.transitRecords[0].toSite).toBe('LHE');
    expect(mockConnection.commit).toHaveBeenCalled();
  });

  it('rolls back transaction on database error without disclosing internal paths', async () => {
    mockConnection.query
      .mockResolvedValueOnce([[]]) // balanceRows
      .mockRejectedValueOnce(new Error('Fatal Query Error in C:\\routes\\Bulkentryroute.js'));

    const res = await request(app).post('/api/entries/bulk').send({
      date: '2026-10-31',
      invType: 'PLASTIC',
      rows: [{ cardType: 'Visa' }],
    });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Bulk entries processing failed.');
    expect(mockConnection.rollback).toHaveBeenCalled();
  });
});
