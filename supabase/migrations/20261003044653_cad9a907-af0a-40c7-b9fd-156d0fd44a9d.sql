CREATE POLICY media_read_auth ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'media');
CREATE POLICY media_write_admin ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.is_admin_or_super(auth.uid()));
CREATE POLICY media_update_admin ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.is_admin_or_super(auth.uid()));
CREATE POLICY media_delete_admin ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.is_admin_or_super(auth.uid()));
CREATE POLICY screenshots_read_auth ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'screenshots');
CREATE POLICY screenshots_write_admin ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'screenshots' AND public.is_admin_or_super(auth.uid()));