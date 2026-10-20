-- Server-only site settings for administrator-managed public landing-page links.
-- Browser roles receive no table privileges; read/write access stays in server API routes.
CREATE TABLE IF NOT EXISTS public.site_settings (
  setting_key text PRIMARY KEY CHECK (setting_key IN ('amazon_affiliate_url')),
  setting_value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.site_settings FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.site_settings TO service_role;

-- Seed the initial affiliate URL without overwriting any later weekly change.
INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('amazon_affiliate_url', 'https://amzn.to/3VTO2he')
ON CONFLICT (setting_key) DO NOTHING;
