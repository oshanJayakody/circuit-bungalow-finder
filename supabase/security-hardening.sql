-- Core table permissions and row-level security for the browser application.
-- Review any pre-existing broad policies before applying: PostgreSQL policies
-- are permissive by default and matching policies are combined with OR.

-- Trusted admin check. The email allowlist only applies to a Supabase-verified
-- email. Profile role support is enabled after the role column is locked below.
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

-- profiles.role is an admin source, so prevent self-promotion and broad profile
-- reads. Profile owners can read their row and update only their display name.
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
do $$
declare existing_policy record;
begin
  for existing_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', existing_policy.policyname);
  end loop;
end;
$$;
create policy "Users can read own profile and admins can read profiles"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_app_admin());
create policy "Users can create own non-admin profile"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()) and role = 'user');
create policy "Users can update own profile name"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Now that authenticated users cannot change profiles.role, allow the trusted
-- profile role column to grant admin access as well.
create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    u.raw_app_meta_data ->> 'role' = 'admin'
    or p.role = 'admin'
    or (lower(u.email) = 'kusalankaoshan@gmail.com' and u.email_confirmed_at is not null),
    false
  )
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = (select auth.uid())
$$;
revoke all on function public.is_app_admin() from public, anon;
grant execute on function public.is_app_admin() to authenticated;

-- Bungalow listings: public users see approved rows, contributors may create
-- their own pending rows, and admins may review all rows and make edits.
alter table public.bungalows enable row level security;
create index if not exists bungalows_status_created_at_idx
  on public.bungalows (status, created_at desc);
create index if not exists bungalows_submitted_by_created_at_idx
  on public.bungalows (submitted_by, created_at desc);
create index if not exists bungalows_status_department_idx
  on public.bungalows (status, department_id);
revoke all on public.bungalows from anon, authenticated;
grant select on public.bungalows to anon, authenticated;
grant insert, update on public.bungalows to authenticated;

drop policy if exists "Public can read approved bungalows" on public.bungalows;
create policy "Public can read approved bungalows"
  on public.bungalows for select to anon, authenticated
  using (status = 'approved');

drop policy if exists "Contributors can read own bungalows" on public.bungalows;
create policy "Contributors can read own bungalows"
  on public.bungalows for select to authenticated
  using (submitted_by = (select auth.uid()));

drop policy if exists "Admins can read all bungalows" on public.bungalows;
create policy "Admins can read all bungalows"
  on public.bungalows for select to authenticated
  using (public.is_app_admin());

drop policy if exists "Contributors can submit own pending bungalows" on public.bungalows;
create policy "Contributors can submit own pending bungalows"
  on public.bungalows for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and status = 'pending'
    and char_length(trim(name)) between 2 and 160
    and char_length(trim(district)) between 2 and 120
    and char_length(trim(town)) between 2 and 120
  );

drop policy if exists "Admins can update bungalows" on public.bungalows;
create policy "Admins can update bungalows"
  on public.bungalows for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

create or replace function public.set_bungalow_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists set_bungalows_updated_at on public.bungalows;
create trigger set_bungalows_updated_at
  before update on public.bungalows
  for each row execute function public.set_bungalow_updated_at();

-- Keep department and location tables readable, while only signed-in users
-- can add a missing department through the contribution form.
alter table public.departments enable row level security;
grant select on public.departments to anon, authenticated;
grant insert on public.departments to authenticated;
do $$
declare department_sequence text;
begin
  department_sequence := pg_get_serial_sequence('public.departments', 'id');
  if department_sequence is not null then
    execute format('grant usage, select on sequence %s to authenticated', department_sequence);
  end if;
end;
$$;
drop policy if exists "Anyone can read departments" on public.departments;
create policy "Anyone can read departments"
  on public.departments for select to anon, authenticated using (true);
drop policy if exists "Authenticated users can add departments" on public.departments;
create policy "Authenticated users can add departments"
  on public.departments for insert to authenticated
  with check (char_length(trim(name)) between 2 and 120);

alter table public.sri_lanka_districts enable row level security;
alter table public.sri_lanka_towns enable row level security;
grant select on public.sri_lanka_districts, public.sri_lanka_towns to anon, authenticated;
drop policy if exists "Anyone can read Sri Lankan districts" on public.sri_lanka_districts;
create policy "Anyone can read Sri Lankan districts"
  on public.sri_lanka_districts for select to anon, authenticated using (true);
drop policy if exists "Anyone can read Sri Lankan towns" on public.sri_lanka_towns;
create policy "Anyone can read Sri Lankan towns"
  on public.sri_lanka_towns for select to anon, authenticated using (true);

-- Reviews are immediately public, limited to approved bungalows, and can only
-- be inserted by a signed-in user for themselves.
alter table public.reviews enable row level security;
create index if not exists reviews_bungalow_created_at_idx
  on public.reviews (bungalow_id, created_at desc);
grant select on public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;
drop policy if exists "Anyone can read bungalow reviews" on public.reviews;
create policy "Anyone can read bungalow reviews"
  on public.reviews for select to anon, authenticated
  using (exists (
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

-- Suggestions remain private to admins until reviewed. The target listing must
-- already be public so its unpublished details cannot be probed via this table.
alter table public.bungalow_suggestions enable row level security;
create index if not exists bungalow_suggestions_status_created_at_idx
  on public.bungalow_suggestions (status, created_at desc);
grant insert on public.bungalow_suggestions to authenticated;
grant select, update on public.bungalow_suggestions to authenticated;
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

-- Aggregate rankings in PostgreSQL instead of downloading every approved row.
create or replace function public.get_contributor_rankings()
returns table (user_id uuid, listing_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select b.submitted_by, count(*)::bigint
  from public.bungalows b
  where b.status = 'approved' and b.submitted_by is not null
  group by b.submitted_by
  order by count(*) desc, b.submitted_by
  limit 10
$$;
revoke all on function public.get_contributor_rankings() from public, anon;
grant execute on function public.get_contributor_rankings() to authenticated;

-- Exact dashboard counts are computed in the database, while the UI only
-- fetches the latest 100 pending rows for each review queue.
create or replace function public.get_admin_analytics()
returns table (pending bigint, approved bigint, contributors bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.is_app_admin() then
    raise exception 'Admin access required';
  end if;
  return query
    select count(*) filter (where b.status = 'pending'),
           count(*) filter (where b.status = 'approved'),
           count(distinct b.submitted_by) filter (where b.submitted_by is not null)
    from public.bungalows b;
end;
$$;
revoke all on function public.get_admin_analytics() from public, anon;
grant execute on function public.get_admin_analytics() to authenticated;

-- Applying approved edits and changing suggestion status is one transaction.
create or replace function public.admin_review_bungalow_suggestion(
  suggestion_id uuid,
  decision text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  suggestion public.bungalow_suggestions%rowtype;
  changes jsonb;
begin
  if not public.is_app_admin() then
    raise exception 'Admin access required';
  end if;
  if decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected';
  end if;

  select * into suggestion
  from public.bungalow_suggestions s
  where s.id = suggestion_id and s.status = 'pending'
  for update;
  if not found then raise exception 'Pending suggestion not found'; end if;

  changes := suggestion.proposed_changes;
  if decision = 'approved' then
    if jsonb_typeof(changes) is distinct from 'object'
       or exists (
         select 1 from jsonb_each(changes) e
         where e.key not in ('name', 'district', 'town', 'address', 'description', 'contact_phone', 'booking_url', 'facebook_url')
            or (e.value <> 'null'::jsonb and jsonb_typeof(e.value) <> 'string')
            or (jsonb_typeof(e.value) = 'string' and length(e.value #>> '{}') > 2000)
       ) then
      raise exception 'Suggestion contains unsupported or invalid values';
    end if;

    update public.bungalows b set
      name = case when changes ? 'name' then nullif(changes->>'name', '') else b.name end,
      district = case when changes ? 'district' then nullif(changes->>'district', '') else b.district end,
      town = case when changes ? 'town' then nullif(changes->>'town', '') else b.town end,
      address = case when changes ? 'address' then nullif(changes->>'address', '') else b.address end,
      description = case when changes ? 'description' then nullif(changes->>'description', '') else b.description end,
      contact_phone = case when changes ? 'contact_phone' then nullif(changes->>'contact_phone', '') else b.contact_phone end,
      booking_url = case when changes ? 'booking_url' then nullif(changes->>'booking_url', '') else b.booking_url end,
      facebook_url = case when changes ? 'facebook_url' then nullif(changes->>'facebook_url', '') else b.facebook_url end
    where b.id = suggestion.bungalow_id;
    if not found then raise exception 'Bungalow listing not found'; end if;
  end if;

  update public.bungalow_suggestions
  set status = decision
  where id = suggestion.id;
end;
$$;
revoke all on function public.admin_review_bungalow_suggestion(uuid, text) from public, anon;
grant execute on function public.admin_review_bungalow_suggestion(uuid, text) to authenticated;
