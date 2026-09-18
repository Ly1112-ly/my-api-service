# My API Service

Greenfield standard API foundation for local development.

## Setup

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

## Endpoints

- `GET /api/health`
- `GET /api/auth/csrf`
- `POST /api/auth/protected-check`

The owner foundation accounts are configured through `OWNER_EMAILS`:

- `iemengly1112@gmail.com`
- `iemengly1111@gmail.com`

The seed password is a development placeholder and must be changed before use.
