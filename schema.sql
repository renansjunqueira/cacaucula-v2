-- ==========================================
-- CACAUCULA v2 — Supabase Database Schema
-- Rode este script no SQL Editor do Supabase
-- ==========================================

-- 1. TABELA: collaborators
-- Vinculada 1:1 ao auth.users via trigger automático
CREATE TABLE IF NOT EXISTS public.collaborators (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'Arquiteta'
               CHECK (role IN ('Admin', 'Arquiteta', 'Designer', 'Estagiária')),
  is_active  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABELA: projects
CREATE TABLE IF NOT EXISTS public.projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA: time_logs
CREATE TABLE IF NOT EXISTS public.time_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborator_id  UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  project_id       UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  date             DATE NOT NULL,
  logged_hours     NUMERIC(5,2) NOT NULL CHECK (logged_hours > 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- TRIGGER: Cria collaborator ao registrar usuário
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.collaborators (id, name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'Arquiteta',
    FALSE  -- Inativo por padrão: admin precisa ativar
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- RLS (Row Level Security)
-- ==========================================

ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- FUNÇÃO auxiliar: verifica se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE id = auth.uid()
      AND role = 'Admin'
      AND is_active = TRUE
  );
$$;

-- FUNÇÃO auxiliar: verifica se colaborador está ativo
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.collaborators
    WHERE id = auth.uid()
      AND is_active = TRUE
  );
$$;

-- Policies: collaborators
-- Users can always read their own profile (needed to check is_active on login)
CREATE POLICY "Users can read own profile"
  ON public.collaborators FOR SELECT
  USING (id = auth.uid());

-- Active users can view all collaborators (for dropdowns)
CREATE POLICY "Active users can view all collaborators"
  ON public.collaborators FOR SELECT
  USING (public.is_active_user());

CREATE POLICY "Admins can update collaborators"
  ON public.collaborators FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete collaborators"
  ON public.collaborators FOR DELETE
  USING (public.is_admin());

-- Policies: projects
CREATE POLICY "Active users can view active projects"
  ON public.projects FOR SELECT
  USING (public.is_active_user());

CREATE POLICY "Admins can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update projects"
  ON public.projects FOR UPDATE
  USING (public.is_admin());

-- Policies: time_logs
CREATE POLICY "Active users can view time_logs"
  ON public.time_logs FOR SELECT
  USING (public.is_active_user());

CREATE POLICY "Active users can insert their own time_logs"
  ON public.time_logs FOR INSERT
  WITH CHECK (
    public.is_active_user()
    AND collaborator_id IN (
      SELECT id FROM public.collaborators WHERE is_active = TRUE
    )
  );

CREATE POLICY "Admins can update any time_log"
  ON public.time_logs FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Users can delete their own time_logs or admins delete any"
  ON public.time_logs FOR DELETE
  USING (
    collaborator_id = auth.uid()
    OR public.is_admin()
  );

-- ==========================================
-- ADMINS: Elevar usuários admin após criação
-- Execute manualmente para promover admins:
-- ==========================================
-- UPDATE public.collaborators
--   SET role = 'Admin', is_active = TRUE
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'adm@cacau-arquitetura.com');

-- UPDATE public.collaborators
--   SET role = 'Admin', is_active = TRUE
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'renan.junqueira.mendes@gmail.com');

-- ==========================================
-- ÍNDICES para performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_time_logs_collaborator ON public.time_logs(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_project ON public.time_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_date ON public.time_logs(date);
