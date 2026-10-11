-- Saved / favorite bungalows per user.
-- Run once in the Supabase SQL editor. Safe to re-run: table creation is
-- idempotent and the policy is dropped before re-creating.
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bungalow_id uuid not null references public.bungalows(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, bungalow_id)
);

alter table public.bookmarks enable row level security;

drop policy if exists "Users manage their own bookmarks" on public.bookmarks;
create policy "Users manage their own bookmarks"
  on public.bookmarks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RLS policies alone are not enough: the app queries as the `authenticated`
-- role, which needs table-level privileges or every query fails with
-- "permission denied for table bookmarks".
grant select, insert, update, delete on public.bookmarks to authenticated;
