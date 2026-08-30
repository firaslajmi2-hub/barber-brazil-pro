-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- first signup becomes admin
CREATE OR REPLACE FUNCTION public.grant_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.grant_first_admin();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- SETTINGS
CREATE TABLE public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  barber_name text NOT NULL DEFAULT 'Braziiilyy',
  logo_url text,
  slogan text NOT NULL DEFAULT '',
  about_text text NOT NULL DEFAULT '',
  hero_image_url text,
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  map_url text NOT NULL DEFAULT '',
  instagram_url text NOT NULL DEFAULT '',
  slot_minutes integer NOT NULL DEFAULT 30,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT SELECT ON public.site_settings TO anon;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings admin write" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_settings_touch BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SERVICES
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  duration_minutes integer NOT NULL DEFAULT 30,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT SELECT ON public.services TO anon;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services public read" ON public.services FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "services admin all" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- GALLERY
CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_images TO authenticated;
GRANT SELECT ON public.gallery_images TO anon;
GRANT ALL ON public.gallery_images TO service_role;
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery public read" ON public.gallery_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "gallery admin all" ON public.gallery_images FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- REVIEWS
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY "reviews admin all" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- WORKING HOURS
CREATE TABLE public.working_hours (
  day_of_week integer PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),
  is_closed boolean NOT NULL DEFAULT false,
  open_time time NOT NULL DEFAULT '09:00',
  close_time time NOT NULL DEFAULT '20:00',
  break_start time,
  break_end time
);
GRANT SELECT, INSERT, UPDATE ON public.working_hours TO authenticated;
GRANT SELECT ON public.working_hours TO anon;
GRANT ALL ON public.working_hours TO service_role;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hours public read" ON public.working_hours FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "hours admin all" ON public.working_hours FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- BLOCKED SLOTS
CREATE TABLE public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_slots TO authenticated;
GRANT ALL ON public.blocked_slots TO service_role;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocked admin all" ON public.blocked_slots FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- RESERVATIONS
CREATE TYPE public.reservation_status AS ENUM ('pending','confirmed','completed','cancelled');

CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  service_name text NOT NULL DEFAULT '',
  reservation_date date NOT NULL,
  reservation_time time NOT NULL,
  notes text NOT NULL DEFAULT '',
  status public.reservation_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX reservations_no_double_booking
  ON public.reservations (reservation_date, reservation_time)
  WHERE status <> 'cancelled';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservations admin all" ON public.reservations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER reservations_touch BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SEED
INSERT INTO public.site_settings (id, barber_name, slogan, about_text, phone, whatsapp, address, map_url, instagram_url)
VALUES (1, 'BRAZIIILYY', 'Cortes de nível brasileiro — precisão, estilo e atitude.',
'Sou barbeiro apaixonado por cortes modernos: mid fade, mullet, curly fade e desenhos livres. Cada cliente sai da cadeira com um corte pensado para o seu rosto e para o seu estilo de rua. Ambiente premium, música alta e resultado impecável.',
'+216 00 000 000', '21600000000', 'Rua Central 244, Barrio Norte', 'https://maps.google.com/?q=barbershop', 'https://www.instagram.com/_braziiilyy___244__/');

INSERT INTO public.services (name, description, price, duration_minutes, sort_order) VALUES
('Haircut', 'Corte personalizado: fade, mid fade, mullet ou curly, finalizado com styling.', 20.00, 30, 1),
('Beard Trim', 'Desenho e alinhamento da barba com navalha, toalha quente e óleo.', 12.00, 30, 2),
('Hair + Beard Combo', 'Pacote completo: corte + barba com acabamento premium.', 28.00, 60, 3),
('Hair Design & Extras', 'Desenhos freestyle, sobrancelha, lavagem e tratamento capilar.', 10.00, 30, 4);

INSERT INTO public.reviews (customer_name, rating, comment, sort_order) VALUES
('Mehdi K.', 5, 'O melhor fade da cidade. Atenção total ao detalhe e ambiente top.', 1),
('Youssef B.', 5, 'Marquei online em 30 segundos e o corte ficou perfeito. Recomendo!', 2),
('Rafael S.', 5, 'Barba desenhada na navalha, resultado limpo. Voltando toda semana.', 3);

INSERT INTO public.working_hours (day_of_week, is_closed, open_time, close_time, break_start, break_end) VALUES
(0, false, '10:00', '18:00', NULL, NULL),
(1, true,  '09:00', '20:00', NULL, NULL),
(2, false, '09:00', '20:00', '13:00', '14:00'),
(3, false, '09:00', '20:00', '13:00', '14:00'),
(4, false, '09:00', '20:00', '13:00', '14:00'),
(5, false, '09:00', '21:00', '13:00', '14:00'),
(6, false, '09:00', '21:00', NULL, NULL);