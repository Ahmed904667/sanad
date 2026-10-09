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

Development includes demo sign-in accounts. They use the demo password `123456` and are disabled in production.

## Production setup

Set `DATABASE_URL` and a private `SESSION_SECRET` in the production environment. Run `npm run build` to generate the Prisma client, apply the database schema, seed configured accounts, and build the app.

To create initial admin, teacher, and student accounts, configure these variables in the Vercel production environment before building:

| Role | Email | Password | Optional display name |
| --- | --- | --- | --- |
| Admin | `INITIAL_ADMIN_EMAIL` | `INITIAL_ADMIN_PASSWORD` | `INITIAL_ADMIN_NAME` |
| Teacher | `INITIAL_TEACHER_EMAIL` | `INITIAL_TEACHER_PASSWORD` | `INITIAL_TEACHER_NAME` |
| Student | `INITIAL_STUDENT_EMAIL` | `INITIAL_STUDENT_PASSWORD` | `INITIAL_STUDENT_NAME` |

Each role requires a distinct email and a password of at least 12 characters. Roles without configuration are skipped; incomplete or invalid configuration fails the build. The teacher is approved and receives a teacher profile; the student receives a student profile. Repeat builds preserve existing accounts and passwords. An email already assigned to another role fails seeding without changing any accounts. Production credentials belong in environment variables and must not be committed. The seed command never prints passwords.

You can also run `npm run db:seed` separately with the same environment variables after applying the schema. Start the built app with `npm run start`.

## Teacher profiles and class reviews

Teachers can edit their teaching title, experience, languages, specializations, biography, and ijazah details in their profile page. Approved profiles are visible to students; administrators can see the full profile and account contact information. Teachers can record the Quran scope and feedback when completing a class. Students can review each completed class separately from its class page.

## CI/CD

GitHub Actions runs ESLint, TypeScript, and a production build for pull requests and pushes to `main`. Validation uses an isolated PostgreSQL service, so the build also verifies schema creation on an empty database. Once the repository is connected to Vercel, add these GitHub Actions secrets to enable preview deployments for pull requests and production deployments from `main`:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

The Vercel project must have its production and preview `DATABASE_URL` and `SESSION_SECRET` variables configured, with a separate database for previews. Set the Vercel build command to `npm run build` (the default). Every build applies the Prisma schema to its configured database before compiling Next.js. A database connection or schema update failure stops deployment. The build does not accept destructive schema changes automatically. It seeds only accounts explicitly configured through the variables above; no default production credentials are created.
