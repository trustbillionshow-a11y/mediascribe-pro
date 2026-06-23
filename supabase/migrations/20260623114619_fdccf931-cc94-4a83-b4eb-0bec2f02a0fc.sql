
-- SOFTWARES
CREATE TABLE public.course_softwares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price_ngn bigint NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_softwares TO anon, authenticated;
GRANT ALL ON public.course_softwares TO service_role;
ALTER TABLE public.course_softwares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read softwares" ON public.course_softwares FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public manage softwares" ON public.course_softwares FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tg_course_softwares_updated BEFORE UPDATE ON public.course_softwares FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- REGISTRATIONS
CREATE TABLE public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  device_type text NOT NULL,
  device_other text,
  notes text,
  selected_softwares jsonb NOT NULL DEFAULT '[]'::jsonb,
  course_amount_ngn bigint NOT NULL DEFAULT 0,
  software_amount_ngn bigint NOT NULL DEFAULT 0,
  total_amount_ngn bigint NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text,
  paystack_reference text UNIQUE,
  paystack_response jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registrations TO anon, authenticated;
GRANT ALL ON public.registrations TO service_role;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public manage registrations" ON public.registrations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tg_registrations_updated BEFORE UPDATE ON public.registrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Paystack settings defaults
INSERT INTO public.site_settings (key, value, is_public) VALUES
 ('paystack_mode', '"test"'::jsonb, true),
 ('paystack_public_key_test', '""'::jsonb, true),
 ('paystack_public_key_live', '""'::jsonb, true),
 ('paystack_secret_key_test', '""'::jsonb, false),
 ('paystack_secret_key_live', '""'::jsonb, false)
ON CONFLICT (key) DO NOTHING;
