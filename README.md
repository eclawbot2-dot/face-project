# Holy Face Parish — Catechism Management

Next.js 16 + React 19 + Prisma parish management app for Holy Face Church:
students, families, classes, attendance, sacrament prep, and announcements.

## Setup

```bash
cp .env.example .env.local
# generate secrets:
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env.local
echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env.local
# fill in DATABASE_URL with an ABSOLUTE path

npm install
npx prisma migrate deploy
npx prisma db seed   # optional — creates anonymized demo data
npm run build
```

## Run

Dev:
```bash
npm run dev
```

Production (PM2):
```bash
# Run from the project root so PM2's cwd resolves correctly:
pm2 start ecosystem.config.js
pm2 logs face-project
```

## Important: data integrity

- `DATABASE_URL` **must** be an absolute path in production. A relative
  `file:./prisma/dev.db` will resolve against the runtime cwd — if PM2 ever
  restarts in the wrong directory you will silently start writing to a
  fresh empty SQLite file and lose all attendance/sacrament history.
- Back up the SQLite file on a schedule (cron + `sqlite3 ... ".backup"`).
- Seed data (`prisma/seed.ts`) generates anonymized fixtures with random
  passwords printed to stdout. Do not commit real parishioner data.

## Env vars

See `.env.example`. Secrets are loaded by Next.js from `.env.local`
(gitignored). They are **not** in `ecosystem.config.js`.

## Roles

- `ADMIN` — full access, manages users + announcements
- `DIRECTOR` — manages classes, catechists, students
- `CATECHIST` — manages assigned classes + attendance
- `PARENT` — views own children's progress + attendance
