-- Run this if admin image uploads return a Storage policy or bucket error.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can view product images" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
create policy "Anyone can view product images" on storage.objects
for select using (bucket_id = 'product-images');
create policy "Authenticated users can upload product images" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images');
