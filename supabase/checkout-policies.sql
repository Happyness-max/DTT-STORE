-- Run this once if schema.sql was already run before checkout was added.
create policy "Users create own order items" on public.order_items
for insert to authenticated
with check (exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
));
