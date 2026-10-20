-- Store the public weekly affiliate URL in a server-only setting row.
-- Browser roles receive no table privileges; owner-only API routes use service_role.
CREATE TABLE IF NOT EXISTS public.landing_settings (
  setting_key text PRIMARY KEY CHECK (setting_key = 'amazon_affiliate_url'),
  setting_value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

ALTER TABLE public.landing_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.landing_settings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.landing_settings TO service_role;

INSERT INTO public.landing_settings (setting_key, setting_value)
VALUES ('amazon_affiliate_url', 'https://amzn.to/3VTO2he')
ON CONFLICT (setting_key) DO NOTHING;

COMMENT ON TABLE public.landing_settings IS
  'Private server-managed settings for the public landing page. Browser roles have no table access.';
