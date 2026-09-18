import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  OWNER_EMAILS: z.string().default(''),
  CORS_ORIGINS: z.string().default('https://app.localhost:3000'),
  API_PUBLIC_URL: z.string().url().default('https://api.localhost:4000'),
  HTTPS_KEY_PATH: z.string().optional(),
  HTTPS_CERT_PATH: z.string().optional()
});

const env = schema.parse(process.env);

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  ownerEmails: env.OWNER_EMAILS.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean),
  corsOrigins: env.CORS_ORIGINS.split(',').map((x) => x.trim()).filter(Boolean),
  apiPublicUrl: env.API_PUBLIC_URL,
  httpsKeyPath: env.HTTPS_KEY_PATH,
  httpsCertPath: env.HTTPS_CERT_PATH,
  secureCookies: env.NODE_ENV !== 'test'
};
