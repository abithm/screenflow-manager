CREATE TABLE public.pairing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id uuid REFERENCES public.screens(id) ON DELETE SET NULL,
  device_id text NOT NULL,
  screen_name text,
  action text NOT NULL,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pairing_events TO authenticated;
GRANT ALL ON public.pairing_events TO service_role;
ALTER TABLE public.pairing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY pe_read_auth ON public.pairing_events FOR SELECT TO authenticated USING (true);
CREATE INDEX pairing_events_created_idx ON public.pairing_events (created_at DESC);

CREATE OR REPLACE FUNCTION public.log_pairing_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_paired IS DISTINCT FROM OLD.is_paired THEN
    INSERT INTO public.pairing_events (screen_id, device_id, screen_name, action, actor_id)
    VALUES (NEW.id, NEW.device_id, NEW.screen_name,
            CASE WHEN NEW.is_paired THEN 'paired' ELSE 'unpaired' END, auth.uid());
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.log_pairing_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER screens_pairing_log AFTER UPDATE OF is_paired ON public.screens
FOR EACH ROW EXECUTE FUNCTION public.log_pairing_change();