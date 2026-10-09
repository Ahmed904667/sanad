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

Set `DATABASE_URL` and a private `SESSION_SECRET` in the production environment. Run `npm run build` to generate the Prisma client, apply the database schema, create initial accounts, and build the app. No account environment variables are required.

The first build creates these accounts if their email addresses are unused:

| Role | Email |
| --- | --- |
| Admin | `admin@sanad.com` |
| Teacher | `teacher@sanad.com` |
| Student | `student@sanad.com` |

Each new account gets its own randomly generated 32-character password. Its email and password appear once in the build logs after the seeding transaction succeeds. Save these credentials from the first build's private logs, including if later compilation fails. Passwords are hashed in the database and cannot be retrieved by subsequent builds. Keep access to build logs restricted because they contain these initial credentials.

Repeat builds preserve existing accounts and passwords. An email belonging to a different role fails seeding without changing any accounts. The teacher is approved and receives a teacher profile; the student receives a student profile. Existing accounts do not get new credentials printed.

You can also run `npm run db:seed` after applying the schema. Start the built app with `npm run start`.

## Teacher profiles and class reviews

Teachers can edit their teaching title, experience, languages, specializations, biography, and ijazah details in their profile page. Approved profiles are visible to students; administrators can see the full profile and account contact information. Teachers can record the Quran scope and feedback when completing a class. Students can review each completed class separately from its class page.

## CI/CD

GitHub Actions runs ESLint, TypeScript, and a production build for pull requests and pushes to `main`. Validation uses an isolated PostgreSQL service, so the build also verifies schema creation on an empty database. Once the repository is connected to Vercel, add these GitHub Actions secrets to enable preview deployments for pull requests and production deployments from `main`:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

The Vercel project must have its production and preview `DATABASE_URL` and `SESSION_SECRET` variables configured, with a separate database for previews. Set the Vercel build command to `npm run build` (the default). Every build applies the Prisma schema to its configured database before compiling Next.js. A database connection or schema update failure stops deployment. The build does not accept destructive schema changes automatically. It creates missing initial accounts with generated passwords as described above. CI validation uses the same automatic seeding against its disposable database.
