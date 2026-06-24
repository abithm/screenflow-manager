
-- ROLES
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','viewer');
CREATE TYPE public.media_type AS ENUM ('video','image','pdf','url');
CREATE TYPE public.screen_status AS ENUM ('online','offline','unknown','warning');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_read_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','super_admin'))
$$;

-- Super admins can manage user_roles
CREATE POLICY "user_roles_super_all" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- Trigger: create profile + viewer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- STORES
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stores_read_auth" ON public.stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "stores_write_admin" ON public.stores FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE TRIGGER stores_updated BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PLAYLISTS (created before screens FK)
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlists TO authenticated;
GRANT ALL ON public.playlists TO service_role;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "playlists_read_auth" ON public.playlists FOR SELECT TO authenticated USING (true);
CREATE POLICY "playlists_write_admin" ON public.playlists FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE TRIGGER playlists_updated BEFORE UPDATE ON public.playlists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCREENS
CREATE TABLE public.screens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  screen_name TEXT NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  status public.screen_status NOT NULL DEFAULT 'unknown',
  last_seen TIMESTAMPTZ,
  current_playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL,
  screenshot_url TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.screens TO authenticated;
GRANT ALL ON public.screens TO service_role;
ALTER TABLE public.screens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "screens_read_auth" ON public.screens FOR SELECT TO authenticated USING (true);
CREATE POLICY "screens_write_admin" ON public.screens FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));
CREATE TRIGGER screens_updated BEFORE UPDATE ON public.screens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- MEDIA
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type public.media_type NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_read_auth" ON public.media FOR SELECT TO authenticated USING (true);
CREATE POLICY "media_write_admin" ON public.media FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));

-- PLAYLIST ITEMS
CREATE TABLE public.playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL DEFAULT 0,
  display_duration INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlist_items TO authenticated;
GRANT ALL ON public.playlist_items TO service_role;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pli_read_auth" ON public.playlist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "pli_write_admin" ON public.playlist_items FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));

-- SCHEDULES
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id UUID NOT NULL REFERENCES public.screens(id) ON DELETE CASCADE,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  active_days INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedules TO authenticated;
GRANT ALL ON public.schedules TO service_role;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sch_read_auth" ON public.schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "sch_write_admin" ON public.schedules FOR ALL TO authenticated
  USING (public.is_admin_or_super(auth.uid()))
  WITH CHECK (public.is_admin_or_super(auth.uid()));

-- HEARTBEATS
CREATE TABLE public.heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  app_version TEXT,
  storage_available TEXT,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.heartbeats TO authenticated;
GRANT ALL ON public.heartbeats TO service_role;
ALTER TABLE public.heartbeats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hb_read_auth" ON public.heartbeats FOR SELECT TO authenticated USING (true);
CREATE INDEX heartbeats_device_created_idx ON public.heartbeats (device_id, created_at DESC);

-- SCREENSHOTS
CREATE TABLE public.screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  screenshot_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.screenshots TO authenticated;
GRANT ALL ON public.screenshots TO service_role;
ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ss_read_auth" ON public.screenshots FOR SELECT TO authenticated USING (true);
CREATE INDEX screenshots_device_created_idx ON public.screenshots (device_id, created_at DESC);

-- PROOF OF PLAY
CREATE TABLE public.proof_of_play (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  media_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.proof_of_play TO authenticated;
GRANT ALL ON public.proof_of_play TO service_role;
ALTER TABLE public.proof_of_play ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pop_read_auth" ON public.proof_of_play FOR SELECT TO authenticated USING (true);
CREATE INDEX pop_device_created_idx ON public.proof_of_play (device_id, created_at DESC);
