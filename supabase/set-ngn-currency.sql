-- Run once if the existing site_settings row is still using USD.
update public.site_settings
set payment_currency = 'NGN', updated_at = now()
where id = true;
