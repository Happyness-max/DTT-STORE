-- Run after the existing schema and admin migrations.
alter table public.site_settings add column if not exists manual_payment_enabled boolean not null default false;
alter table public.site_settings add column if not exists bank_name text;
alter table public.site_settings add column if not exists bank_account_name text;
alter table public.site_settings add column if not exists bank_account_number text;
alter table public.site_settings add column if not exists bank_instructions text;

alter table public.orders add column if not exists payment_method text not null default 'paystack';
alter table public.orders add column if not exists payment_proof_url text;
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check check (payment_status in ('pending', 'unpaid', 'paid', 'failed', 'refunded'));
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check check (payment_status in ('pending', 'unpaid', 'paid', 'failed', 'refunded'));

drop policy if exists "Users update own orders" on public.orders;
drop policy if exists "Users update own orders" on public.orders;
create policy "Users update own orders" on public.orders for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do update set public = true;
drop policy if exists "Anyone can view payment proofs" on storage.objects;
drop policy if exists "Authenticated users can upload payment proofs" on storage.objects;
create policy "Anyone can view payment proofs" on storage.objects for select using (bucket_id = 'payment-proofs');
create policy "Authenticated users can upload payment proofs" on storage.objects for insert to authenticated with check (bucket_id = 'payment-proofs');
