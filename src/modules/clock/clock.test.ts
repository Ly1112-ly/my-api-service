import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../app.js';

describe('digital clock API', () => {
  it('returns clocks for the default time zones', async () => {
    const response = await request(app).get('/api/clock').expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.clocks).toHaveLength(5);
    expect(response.body.clocks[0]).toMatchObject({ timeZone: 'UTC' });
    expect(response.body.generatedAt).toEqual(expect.any(String));
  });

  it('returns clocks for requested IANA time zones', async () => {
    const response = await request(app)
      .get('/api/clock?zones=UTC,Asia%2FTokyo')
      .expect(200);

    expect(response.body.clocks.map((clock: { timeZone: string }) => clock.timeZone))
      .toEqual(['UTC', 'Asia/Tokyo']);
  });

  it('rejects an invalid time zone', async () => {
    const response = await request(app)
      .get('/api/clock?zones=Not%2FA%2FZone')
      .expect(400);

    expect(response.body.message).toContain('Invalid IANA time zone');
  });
});
