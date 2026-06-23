
-- Allow public (anon) full management on content tables since admin is now open
DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
DROP POLICY IF EXISTS "Admins view all courses" ON public.courses;
DROP POLICY IF EXISTS "Public can view published courses" ON public.courses;
CREATE POLICY "Public can manage courses" ON public.courses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO anon;

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins view all categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view published categories" ON public.categories;
CREATE POLICY "Public can manage categories" ON public.categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon;

DROP POLICY IF EXISTS "Admins manage site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins view all site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can view public settings" ON public.site_settings;
CREATE POLICY "Public can manage site_settings" ON public.site_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO anon;
