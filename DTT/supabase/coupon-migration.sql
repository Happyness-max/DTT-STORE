-- Run this in Supabase SQL Editor if public.coupons does not exist.
create table if not exists public.coupons (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    discount_type text not null check (discount_type in ('percentage', 'fixed')),
    discount_value numeric(10,2) not null check (discount_value > 0),
    minimum_order numeric(10,2) not null default 0 check (minimum_order >= 0),
    usage_limit integer check (usage_limit is null or usage_limit > 0),
    usage_count integer not null default 0 check (usage_count >= 0),
    expires_at timestamptz,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);

alter table public.orders add column if not exists coupon_id uuid references public.coupons(id) on delete set null;
alter table public.orders add column if not exists discount_amount numeric(10,2) not null default 0 check (discount_amount >= 0);
alter table public.coupons enable row level security;

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
    select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

drop policy if exists "Public can read active coupons" on public.coupons;
drop policy if exists "Admins manage coupons" on public.coupons;
create policy "Public can read active coupons" on public.coupons for select using (is_active = true);
create policy "Admins manage coupons" on public.coupons for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Ask Supabase REST to reload its table metadata.
notify pgrst, 'reload schema';
