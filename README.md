# Sanad

Sanad is a Next.js application backed by PostgreSQL and Prisma.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`. Set `DATABASE_URL` to your PostgreSQL database and replace `SESSION_SECRET` with a random secret of at least 32 characters.
3. Start the local database with `docker compose up -d postgres`.
4. Generate the Prisma client and apply the schema:

   ```bash
   npm run db:generate
   npm run db:push
   ```

5. Start the app with `npm run dev`, then open <http://localhost:3000>.

Development includes demo sign-in accounts shown on the login page. They use the demo password `123456` and are disabled in production.

## Production setup

Set `DATABASE_URL` and a private `SESSION_SECRET` in the production environment, apply the schema with `npm run db:push`, then create the first administrator account using environment variables:

```bash
INITIAL_ADMIN_EMAIL=admin@example.com \
INITIAL_ADMIN_PASSWORD='use-a-unique-password-of-at-least-12-characters' \
INITIAL_ADMIN_NAME='Platform Administrator' \
npm run db:seed
```

The seed command creates the admin only when that email is unused. It never prints or replaces the password. Then run `npm run build` and `npm run start`.

## Teacher profiles and class reviews

Teachers can edit their teaching title, experience, languages, specializations, biography, and ijazah details in their profile page. Approved profiles are visible to students; administrators can see the full profile and account contact information. Teachers can record the Quran scope and feedback when completing a class. Students can review each completed class separately from its class page.

## CI/CD

GitHub Actions runs ESLint, TypeScript, and a production build for pull requests and pushes to `main`. Once the repository is connected to Vercel, add these GitHub Actions secrets to enable preview deployments for pull requests and production deployments from `main`:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

The Vercel project must have its production and preview `DATABASE_URL` and `SESSION_SECRET` variables configured. Database schema changes remain an explicit release step: run `npm run db:push` against the target database before deploying code that requires a new schema.
