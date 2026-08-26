-- Run after schema.sql. Create the first user through Supabase Auth, then promote that user with the final query below.
alter table public.profiles add column if not exists role text not null default 'customer' check (role in ('customer', 'admin'));

alter table public.orders drop constraint if exists orders_status_check;
update public.orders set status = case status when 'paid' then 'confirmed' when 'processing' then 'confirmed' when 'shipped' then 'on the way' when 'cancelled' then 'declined' else status end;
alter table public.orders add constraint orders_status_check check (status in ('pending', 'confirmed', 'declined', 'on the way', 'delivered'));

create table if not exists public.site_settings (
    id boolean primary key default true check (id),
    store_name text not null default 'DTT',
    seo_title text not null default 'DTT | Thoughtful finds for every day',
    seo_description text not null default 'Discover considered products across fashion, beauty, food, gifts and more.',
    logo_url text,
    favicon_url text,
    paystack_public_key text,
    payment_currency text not null default 'NGN',
    payments_enabled boolean not null default false,
    updated_at timestamptz not null default now()
);
alter table public.site_settings add column if not exists logo_width integer not null default 96;
alter table public.site_settings add column if not exists hero_eyebrow text not null default 'WELCOME TO DTT';
alter table public.site_settings add column if not exists hero_title text not null default 'Everything You Love, All In One Place.';
alter table public.site_settings add column if not exists hero_description text not null default 'Cakes, fashion, beauty, gifts, accessories and more.';
alter table public.site_settings add column if not exists hero_button_text text not null default 'SHOP NOW';
alter table public.site_settings add column if not exists hero_button_link text not null default 'products.html';
alter table public.site_settings add column if not exists hero_image_url text;
alter table public.site_settings add column if not exists contact_email text not null default 'hello@dtt.store';
alter table public.site_settings add column if not exists contact_phone text not null default '+234 000 000 0000';
alter table public.site_settings add column if not exists contact_address text not null default 'Add your store address';
alter table public.site_settings add column if not exists contact_hours text not null default 'Monday - Saturday, 9:00 AM - 6:00 PM';
alter table public.site_settings add column if not exists contact_instagram text;
alter table public.site_settings drop constraint if exists site_settings_logo_width_check;
alter table public.site_settings add constraint site_settings_logo_width_check check (logo_width between 24 and 320);
insert into public.site_settings (id) values (true) on conflict (id) do nothing;

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
alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists payment_status text not null default 'unpaid';
alter table public.coupons enable row level security;

create or replace function public.is_admin() returns boolean language sql security definer set search_path = public stable as $$
    select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.site_settings enable row level security;
drop policy if exists "Public can read site settings" on public.site_settings;
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings for select using (true);
create policy "Admins manage site settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage profiles" on public.profiles;
drop policy if exists "Admins manage categories" on public.categories;
drop policy if exists "Admins manage products" on public.products;
drop policy if exists "Admins manage product images" on public.product_images;
drop policy if exists "Admins manage orders" on public.orders;
drop policy if exists "Admins manage order items" on public.order_items;
create policy "Admins manage profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage product images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage orders" on public.orders for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage order items" on public.order_items for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Public can read active coupons" on public.coupons;
drop policy if exists "Admins manage coupons" on public.coupons;
create policy "Public can read active coupons" on public.coupons for select using (is_active = true);
create policy "Admins manage coupons" on public.coupons for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;
drop policy if exists "Anyone can view product images" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
create policy "Anyone can view product images" on storage.objects for select using (bucket_id = 'product-images');
create policy "Authenticated users can upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images');

-- After creating an account with the email you choose, run this separately:
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'admin@example.com');
