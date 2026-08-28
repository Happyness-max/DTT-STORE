-- Run after schema.sql. Replaces the starter catalog with DTT's requested product range.
insert into public.categories (name, slug) values
  ('Accessories', 'accessories')
on conflict (slug) do nothing;

-- Remove old products when no order history depends on them. Keep ordered products hidden.
delete from public.product_images
where product_id in (
  select p.id from public.products p
  where not exists (select 1 from public.order_items oi where oi.product_id = p.id)
);
delete from public.products p
where not exists (select 1 from public.order_items oi where oi.product_id = p.id);
update public.products set is_active = false, updated_at = now();

insert into public.products (category_id, name, slug, description, price, stock, is_featured)
select c.id, seed.name, seed.slug, seed.description, seed.price, seed.stock, false
from (values
  ('Food', 'Cakes and pastries', 'cakes-and-pastries', 'Add product description.', 0.00, 0),
  ('Food', 'Food trays or food bowls', 'food-trays-or-food-bowls', 'Add product description.', 0.00, 0),
  ('Jewelry', 'Jewelry', 'jewelry', 'Add product description.', 0.00, 0),
  ('Beauty', 'Lip gloss or lip balm', 'lip-gloss-or-lip-balm', 'Add product description.', 0.00, 0),
  ('Accessories', 'Hair accessories', 'hair-accessories', 'Add product description.', 0.00, 0),
  ('Fashion', 'Dresses and outfits', 'dresses-and-outfits', 'Add product description.', 0.00, 0),
  ('Fashion', 'Tote bags', 'tote-bags', 'Add product description.', 0.00, 0),
  ('Perfumes', 'Perfumes, body spray and body mist', 'perfumes-body-spray-and-body-mist', 'Add product description.', 0.00, 0),
  ('Accessories', 'Wrist watches', 'wrist-watches', 'Add product description.', 0.00, 0),
  ('Decor', 'Room and wall decor', 'room-and-wall-decor', 'Add product description.', 0.00, 0),
  ('Accessories', 'Tattoo stickers', 'tattoo-stickers', 'Add product description.', 0.00, 0),
  ('Gifts', 'Money bouquet', 'money-bouquet', 'Add product description.', 0.00, 0),
  ('Gifts', 'Birthday and gift packages', 'birthday-and-gift-packages', 'Add product description.', 0.00, 0),
  ('Beauty', 'Face, under-eye and lip masks', 'face-under-eye-and-lip-masks', 'Add product description.', 0.00, 0),
  ('Gadgets', 'Mini fan', 'mini-fan', 'Add product description.', 0.00, 0),
  ('Gadgets', 'Water bottles and fancy cups', 'water-bottles-and-fancy-cups', 'Add product description.', 0.00, 0),
  ('Gadgets', 'Tripod', 'tripod', 'Add product description.', 0.00, 0),
  ('Decor', 'Fancy mirrors', 'fancy-mirrors', 'Add product description.', 0.00, 0)
) as seed(category_name, name, slug, description, price, stock)
join public.categories c on c.name = seed.category_name
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  stock = excluded.stock,
  is_active = true,
  updated_at = now();

insert into public.product_images (product_id, image_url, alt_text, sort_order)
select p.id, 'https://placehold.co/900x1100/e8e1d4/1d2522?text=Add+product+image', p.name, 0
from public.products p
where p.slug in (
  'cakes-and-pastries', 'food-trays-or-food-bowls', 'jewelry', 'lip-gloss-or-lip-balm',
  'hair-accessories', 'dresses-and-outfits', 'tote-bags', 'perfumes-body-spray-and-body-mist', 'wrist-watches',
  'room-and-wall-decor', 'tattoo-stickers', 'money-bouquet', 'birthday-and-gift-packages',
  'face-under-eye-and-lip-masks', 'mini-fan', 'water-bottles-and-fancy-cups', 'tripod', 'fancy-mirrors'
)
and not exists (
  select 1 from public.product_images existing where existing.product_id = p.id
);
