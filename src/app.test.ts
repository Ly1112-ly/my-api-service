import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

describe('service foundation', () => {
  it('reports health and request id', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body).toEqual({ success: true, status: 'ok' });
    expect(response.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('issues a CSRF token', async () => {
    const response = await request(app).get('/api/auth/csrf').expect(200);
    expect(response.body.csrfToken).toEqual(expect.any(String));
    expect(response.headers['set-cookie']).toBeDefined();
  });
});
