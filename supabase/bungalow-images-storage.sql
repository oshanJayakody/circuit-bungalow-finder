-- Image uploads for community bungalow contributions.
-- Run this once in the Supabase SQL editor, then community photos work.
-- Contributors upload into their own folder; everyone can view.

insert into storage.buckets (id, name, public)
values ('bungalow-images', 'bungalow-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view bungalow images" on storage.objects;
create policy "Public can view bungalow images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'bungalow-images');

drop policy if exists "Signed-in users can upload bungalow images" on storage.objects;
create policy "Signed-in users can upload bungalow images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'bungalow-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
