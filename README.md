# Circuit Bungalow Finder

A Next.js app for finding government circuit bungalows across Sri Lanka. Listing, review, and approval data are stored in Supabase.

## Setup

Use Node.js 20.9 or newer. Install dependencies and create `.env.local` with the public Supabase project URL and publishable key:

```sh
npm install
cp .env.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`, then start the development server:

```sh
npm run dev
```

To enable Google or Facebook sign-in, enable each provider in the Supabase Dashboard under **Authentication → Sign In / Providers** and add its OAuth credentials. Add your app URL (for local development, `http://localhost:3000/`) to the Supabase redirect URL allow list. The auth pages return users to the app homepage after provider sign-in.

The Supabase project needs `bungalows`, `departments`, and `reviews` tables. Apply these scripts in the Supabase SQL Editor, in order:

1. `supabase/locations.sql`
2. `supabase/departments.sql`
3. `supabase/bungalow-suggestions.sql`
4. `supabase/security-hardening.sql`

The hardening script enables row-level security, applies table permissions and policies, and creates the aggregate and atomic review functions used by the profile and admin pages. It replaces existing `profiles` policies with owner/admin access and prevents users from changing `profiles.role`; assign profile admins through the SQL Editor. Review other existing policies before applying it: PostgreSQL combines permissive policies with OR, so older broad policies must be removed after confirming they are no longer needed. The script checks that the allowlisted admin email is verified by Supabase Auth; enable email confirmation in the Supabase Auth settings. Admins can approve or reject suggestions from `/admin`.

## Admin access and contributor profiles

There is no separate admin password. The app authorizes `kusalankaoshan@gmail.com` after Supabase verifies that email. An administrator can also be granted access by setting `profiles.role` to `admin` in the SQL Editor, or by setting the user's **app metadata** in Supabase Dashboard → Authentication → Users to:

```json
{"role":"admin"}
```

Sign out and sign back in after changing app metadata. Your authorized admin account is redirected to `/admin` after signing in, including Google sign-in. Other signed-in users can view their submissions and contributor rankings at `/profile`.

The admin page checks the signed-in identity and profile role in the browser as a usability gate. Supabase Row Level Security enforces the permissions; browser checks are not a security boundary. The hardening script allows public reads of approved rows (including `submitted_by` for rankings), users to insert and read their own submissions, and admins to review all rows and update listings. It also prevents users from changing their own `profiles.role`.

Set additional administrators' `app_metadata.role` to `admin` in Supabase Dashboard → Authentication → Users, or set their `profiles.role` to `admin` in the SQL Editor. The hardening script prevents users from changing their own profile role. Never put a Supabase service role key in the browser app.

## Checks

```sh
npm run lint
npm run build
```
