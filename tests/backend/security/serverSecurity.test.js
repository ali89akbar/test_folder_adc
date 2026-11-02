import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../../backend/server.js';

describe('Server Security Controls & Global Middleware', () => {
  it('enforces Clickjacking defense with X-Frame-Options: DENY', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('enforces Content Security Policy with frame-ancestors: none', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });

  it('suppresses X-Powered-By header to prevent technology disclosure', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('sets X-Content-Type-Options: nosniff to prevent MIME sniffing', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets Strict-Transport-Security (HSTS) headers', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
  });

  it('blocks unauthorized origins with 403 Forbidden via CORS middleware', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Origin', 'http://unauthorized-malicious-site.com');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('CORS request rejected.');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('allows whitelisted origins with Access-Control-Allow-Origin header', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Origin', 'http://localhost:5173');

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('returns clean 404 JSON for unknown endpoints without disclosing internal directories', async () => {
    const res = await request(app).get('/non-existent-api-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Endpoint not found' });
    expect(JSON.stringify(res.body)).not.toContain('C:\\');
    expect(JSON.stringify(res.body)).not.toContain('node_modules');
  });
});
