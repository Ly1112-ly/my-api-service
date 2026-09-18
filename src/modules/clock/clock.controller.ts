import type { Request, Response } from 'express';

export const defaultTimeZones = [
  'UTC',
  'America/New_York',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney'
] as const;

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

function getOffset(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset'
  }).formatToParts(date);
  return parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
}

export function clockController(req: Request, res: Response) {
  const requestedZones = typeof req.query.zones === 'string'
    ? req.query.zones.split(',').map((zone) => zone.trim()).filter(Boolean)
    : [...defaultTimeZones];

  const zones = [...new Set(requestedZones)];
  if (zones.length === 0 || zones.length > 12) {
    return res.status(400).json({
      success: false,
      message: 'Provide between 1 and 12 comma-separated IANA time zones'
    });
  }

  const invalidZone = zones.find((zone) => !isValidTimeZone(zone));
  if (invalidZone) {
    return res.status(400).json({
      success: false,
      message: `Invalid IANA time zone: ${invalidZone}`
    });
  }

  const now = new Date();
  const clocks = zones.map((timeZone) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'medium',
      hourCycle: 'h23'
    });

    return {
      timeZone,
      label: timeZone.replace(/_/g, ' ').split('/').at(-1),
      time: formatter.format(now),
      offset: getOffset(now, timeZone)
    };
  });

  return res.json({ success: true, generatedAt: now.toISOString(), clocks });
}
