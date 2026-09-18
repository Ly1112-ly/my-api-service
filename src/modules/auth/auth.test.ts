import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../app.js';
import { prisma } from '../../db/prisma.js';

const email = `auth.${Date.now()}@example.com`;
const password = 'super-secret-password';
const name = 'Auth Test User';

function cookieValues(setCookie: string[] = []) {
  return setCookie.map((cookie) => cookie.split(';', 1)[0]);
}

function mergeCookies(...headers: string[][]) {
  const values = new Map<string, string>();
  for (const cookie of headers.flatMap(cookieValues)) {
    const separator = cookie.indexOf('=');
    if (separator > 0) values.set(cookie.slice(0, separator), cookie);
  }
  return [...values.values()].join('; ');
}

describe('auth lifecycle', () => {
  beforeEach(async () => {
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({ where: { email } });
  });

  afterEach(async () => {
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({ where: { email } });
  });

  it('registers a user and returns the created profile', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name, email, password })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.name).toBe(name);
    expect(response.body.user.role).toBe('USER');
  });

  it('logs in and issues cookies', async () => {
    await request(app).post('/api/auth/register').send({ name, email, password }).expect(201);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe(email);
    expect(response.headers['set-cookie']).toEqual(expect.arrayContaining([
      expect.stringContaining('access_token='),
      expect.stringContaining('refresh_token=')
    ]));
  });

  it('rejects a protected request without a matching CSRF token', async () => {
    await request(app).post('/api/auth/register').send({ name, email, password }).expect(201);
    const loginResponse = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    const csrfResponse = await request(app).get('/api/auth/csrf').set('Cookie', loginResponse.headers['set-cookie']).expect(200);

    await request(app)
      .post('/api/auth/protected-check')
      .set('Cookie', mergeCookies(loginResponse.headers['set-cookie'], csrfResponse.headers['set-cookie']))
      .expect(403);
  });

  it('logs in, refreshes tokens, and verifies a protected route with CSRF', async () => {
    await request(app).post('/api/auth/register').send({ name, email, password }).expect(201);

    const loginResponse = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    const csrfResponse = await request(app).get('/api/auth/csrf').set('Cookie', loginResponse.headers['set-cookie']).expect(200);
    const csrfToken = csrfResponse.body.csrfToken as string;
    const cookies = mergeCookies(loginResponse.headers['set-cookie'], csrfResponse.headers['set-cookie']);

    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies)
      .expect(200);

    expect(refreshResponse.body.success).toBe(true);
    expect(refreshResponse.headers['set-cookie']).toEqual(expect.arrayContaining([
      expect.stringContaining('access_token='),
      expect.stringContaining('refresh_token=')
    ]));

    const protectedResponse = await request(app)
      .post('/api/auth/protected-check')
      .set('Cookie', mergeCookies(
        csrfResponse.headers['set-cookie'],
        refreshResponse.headers['set-cookie']
      ))
      .set('x-csrf-token', csrfToken)
      .expect(200);

    expect(protectedResponse.body.success).toBe(true);
  });

  it('logs a user out and invalidates the session', async () => {
    await request(app).post('/api/auth/register').send({ name, email, password }).expect(201);

    const loginResponse = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    const cookieHeader = loginResponse.headers['set-cookie'];

    await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookieHeader)
      .expect(200);

    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookieHeader)
      .expect(401);

    expect(refreshResponse.body.success).toBe(false);
  });
});
