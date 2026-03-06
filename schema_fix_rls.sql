-- ==========================================
-- CACAUCULA v2 — RLS FIX
-- Rode este script no SQL Editor do Supabase
-- Resolve o problema de usuários ativos não conseguindo ver dados
-- ==========================================

-- 1. Remover policies antigas problemáticas
DROP POLICY IF EXISTS "Active users can view all collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Users can read own profile" ON public.collaborators;
DROP POLICY IF EXISTS "Admins can update collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Admins can delete collaborators" ON public.collaborators;

DROP POLICY IF EXISTS "Active users can view active projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;

DROP POLICY IF EXISTS "Active users can view time_logs" ON public.time_logs;
DROP POLICY IF EXISTS "Active users can insert their own time_logs" ON public.time_logs;
DROP POLICY IF EXISTS "Admins can update any time_log" ON public.time_logs;
DROP POLICY IF EXISTS "Users can delete their own time_logs or admins delete any" ON public.time_logs;

-- 2. Remover funções auxiliares problemáticas
DROP FUNCTION IF EXISTS public.is_active_user();
DROP FUNCTION IF EXISTS public.is_admin();

-- 3. Recriar policies simplificadas e confiáveis
-- SELECT simples: qualquer usuário autenticado pode ler
-- (a segurança de is_active é tratada no nível da aplicação no AuthContext)

-- collaborators
CREATE POLICY "Authenticated users can view collaborators"
  ON public.collaborators FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update collaborators"
  ON public.collaborators FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.collaborators c
      WHERE c.id = auth.uid()
        AND c.role = 'Admin'
        AND c.is_active = TRUE
    )
  );

CREATE POLICY "Admins can delete collaborators"
  ON public.collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.collaborators c
      WHERE c.id = auth.uid()
        AND c.role = 'Admin'
        AND c.is_active = TRUE
    )
  );

-- projects
CREATE POLICY "Authenticated users can view projects"
  ON public.projects FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert projects"
  ON public.projects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collaborators c
      WHERE c.id = auth.uid()
        AND c.role = 'Admin'
        AND c.is_active = TRUE
    )
  );

CREATE POLICY "Admins can update projects"
  ON public.projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.collaborators c
      WHERE c.id = auth.uid()
        AND c.role = 'Admin'
        AND c.is_active = TRUE
    )
  );

-- time_logs
CREATE POLICY "Authenticated users can view time_logs"
  ON public.time_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert time_logs"
  ON public.time_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update time_logs"
  ON public.time_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.collaborators c
      WHERE c.id = auth.uid()
        AND c.role = 'Admin'
        AND c.is_active = TRUE
    )
  );

CREATE POLICY "Users delete own or admins delete any time_log"
  ON public.time_logs FOR DELETE
  USING (
    collaborator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.collaborators c
      WHERE c.id = auth.uid()
        AND c.role = 'Admin'
        AND c.is_active = TRUE
    )
  );
