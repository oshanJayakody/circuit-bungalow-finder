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

The Supabase project needs `bungalows`, `departments`, and `reviews` tables with row level security policies appropriate to your app. Configure policies so only authorized administrators can approve listings.

## Checks

```sh
npm run lint
npm run build
```
