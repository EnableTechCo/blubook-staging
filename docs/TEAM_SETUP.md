# Team setup

This guide is for the **staging** repository and its staging services. Do not use it to access the legacy application or any future production environment.

## Access needed

Developers need GitHub access to `EnableTechCo/blubook-staging` and membership of the Enable Tech Vercel project. Database work additionally requires a staging Supabase developer account and access to the company password manager.

QA and UX do not need local environment variables, Supabase access, or Vercel access. They use the staging and pull-request preview URLs shared in GitHub.

## Local developer setup

1. Install Git, Node.js 22 or newer, and pnpm 9.15.9 or newer.
2. Clone the repository:

   ```powershell
   git clone https://github.com/EnableTechCo/blubook-staging.git
   cd blubook-staging
   ```

3. Install the locked dependencies:

   ```powershell
   pnpm install --frozen-lockfile
   ```

4. Sign in to Vercel with the company-approved account, link the local folder to the staging project, and pull the local values:

   ```powershell
   vercel login
   vercel link --project blubook-staging --scope enable-tech
   vercel env pull .env.local --environment=production --scope enable-tech
   ```

   In this project, Vercel's `production` environment is the deployed **staging** app. The command writes only to ignored `.env.local`; never commit, copy into documentation, or paste its contents into chat.

5. Start the application:

   ```powershell
   pnpm dev
   ```

6. Before opening a pull request, run:

   ```powershell
   pnpm check
   pnpm build
   ```

## Environment variables

The committed `.env.example` lists the required names. The staging application currently needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for its Supabase client connection.

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Do not put it in browser code, Vercel preview variables, GitHub, tickets, or team chat. It is not needed for the current skeleton.

If `vercel env pull` fails, request access to the Enable Tech Vercel project; do not ask another team member to send values in a message.
