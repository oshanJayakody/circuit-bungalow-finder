-- Proposed listing edits stay separate from live bungalow records until approved.
create table if not exists public.bungalow_suggestions (
  id uuid primary key default gen_random_uuid(),
  bungalow_id uuid not null references public.bungalows(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  proposed_changes jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.bungalow_suggestions enable row level security;
grant insert on public.bungalow_suggestions to authenticated;
grant select, update on public.bungalow_suggestions to authenticated;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    u.raw_app_meta_data ->> 'role' = 'admin'
    or (lower(u.email) = 'kusalankaoshan@gmail.com' and u.email_confirmed_at is not null),
    false
  )
  from auth.users u
  where u.id = (select auth.uid())
$$;
revoke all on function public.is_app_admin() from public, anon;
grant execute on function public.is_app_admin() to authenticated;

drop policy if exists "Signed-in users can suggest bungalow edits" on public.bungalow_suggestions;
create policy "Signed-in users can suggest bungalow edits"
  on public.bungalow_suggestions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and jsonb_typeof(proposed_changes) = 'object'
    and octet_length(proposed_changes::text) <= 16000
    and exists (
      select 1 from public.bungalows b
      where b.id = bungalow_suggestions.bungalow_id and b.status = 'approved'
    )
  );

drop policy if exists "Admins can read bungalow suggestions" on public.bungalow_suggestions;
create policy "Admins can read bungalow suggestions"
  on public.bungalow_suggestions for select to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins can update bungalow suggestions" on public.bungalow_suggestions;
create policy "Admins can update bungalow suggestions"
  on public.bungalow_suggestions for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- Reviews are visible as soon as they are submitted; there is no moderation status.
alter table public.reviews enable row level security;
grant select on public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;

drop policy if exists "Anyone can read bungalow reviews" on public.reviews;
create policy "Anyone can read bungalow reviews"
  on public.reviews for select to anon, authenticated using (exists (
    select 1 from public.bungalows b
    where b.id = reviews.bungalow_id and b.status = 'approved'
  ));

drop policy if exists "Signed-in users can submit reviews" on public.reviews;
create policy "Signed-in users can submit reviews"
  on public.reviews for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and rating between 1 and 5
    and (comment is null or char_length(comment) <= 2000)
    and exists (
      select 1 from public.bungalows b
      where b.id = reviews.bungalow_id and b.status = 'approved'
    )
  );
