-- Run this after schema.sql to add the starter DTT catalog.
insert into public.products (category_id, name, slug, description, price, stock, is_featured)
select c.id, seed.name, seed.slug, seed.description, seed.price, seed.stock, seed.is_featured
from (values
  ('Fashion', 'Essential cotton shirt', 'essential-cotton-shirt', 'A relaxed everyday layer made from soft, breathable cotton. Easy to wear, easy to keep.', 29.00, 24, true),
  ('Decor', 'Sculptural everyday vase', 'sculptural-everyday-vase', 'A tactile ceramic vase with a quiet silhouette, made to bring shape and warmth to your space.', 42.00, 12, true),
  ('Beauty', 'Daily glow beauty set', 'daily-glow-beauty-set', 'A simple three-piece routine for fresh, comfortable skin from morning through evening.', 36.00, 18, false),
  ('Jewelry', 'Minimal gold hoops', 'minimal-gold-hoops', 'Lightweight hoops with a clean polished finish that works from weekday plans to late dinners.', 24.00, 30, false),
  ('Perfumes', 'Cedar and fig fragrance', 'cedar-and-fig-fragrance', 'A warm, balanced scent with crisp fig, cedarwood and a softly grounded finish.', 48.00, 15, true),
  ('Fashion', 'Soft leather crossbody bag', 'soft-leather-crossbody-bag', 'A compact leather companion with enough room for the things you reach for every day.', 64.00, 9, false),
  ('Food', 'Hand-finished chocolate box', 'hand-finished-chocolate-box', 'A small box of beautifully finished chocolates for gifting, sharing or keeping to yourself.', 18.00, 40, false),
  ('Beauty', 'Calm skin care trio', 'calm-skin-care-trio', 'A gentle trio designed to leave your daily routine feeling clear, calm and uncomplicated.', 39.00, 20, false)
) as seed(category_name, name, slug, description, price, stock, is_featured)
join public.categories c on c.name = seed.category_name
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  stock = excluded.stock,
  is_featured = excluded.is_featured,
  updated_at = now();

insert into public.product_images (product_id, image_url, alt_text, sort_order)
select p.id, image.image_url, image.alt_text, 0
from (values
  ('essential-cotton-shirt', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', 'Essential cotton shirt'),
  ('sculptural-everyday-vase', 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=900&q=85', 'Sculptural everyday vase'),
  ('daily-glow-beauty-set', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85', 'Daily glow beauty set'),
  ('minimal-gold-hoops', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85', 'Minimal gold hoops'),
  ('cedar-and-fig-fragrance', 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=85', 'Cedar and fig fragrance'),
  ('soft-leather-crossbody-bag', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=85', 'Soft leather crossbody bag'),
  ('hand-finished-chocolate-box', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85', 'Hand-finished chocolate box'),
  ('calm-skin-care-trio', 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=85', 'Calm skin care trio')
) as image(slug, image_url, alt_text)
join public.products p on p.slug = image.slug
where not exists (
  select 1 from public.product_images existing
  where existing.product_id = p.id and existing.image_url = image.image_url
);
