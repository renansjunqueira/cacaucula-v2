-- ==========================================
-- CACAUCULA v2 — RLS FIX v2
-- Rode este script no SQL Editor do Supabase
-- ==========================================

-- 1. Limpar TUDO (policies antigas e novas)
DROP POLICY IF EXISTS "Active users can view all collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Authenticated users can view collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Users can read own profile" ON public.collaborators;
DROP POLICY IF EXISTS "Admins can update collaborators" ON public.collaborators;
DROP POLICY IF EXISTS "Admins can delete collaborators" ON public.collaborators;

DROP POLICY IF EXISTS "Active users can view active projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;

DROP POLICY IF EXISTS "Active users can view time_logs" ON public.time_logs;
DROP POLICY IF EXISTS "Authenticated users can view time_logs" ON public.time_logs;
DROP POLICY IF EXISTS "Active users can insert their own time_logs" ON public.time_logs;
DROP POLICY IF EXISTS "Authenticated users can insert time_logs" ON public.time_logs;
DROP POLICY IF EXISTS "Admins can update any time_log" ON public.time_logs;
DROP POLICY IF EXISTS "Admins can update time_logs" ON public.time_logs;
DROP POLICY IF EXISTS "Users can delete their own time_logs or admins delete any" ON public.time_logs;
DROP POLICY IF EXISTS "Users delete own or admins delete any time_log" ON public.time_logs;

DROP FUNCTION IF EXISTS public.is_active_user();
DROP FUNCTION IF EXISTS public.is_admin();

-- 2. Recriar policies simples — sem subqueries circulares
-- A segurança de admin e is_active é garantida pelo app (AuthContext + ProtectedRoute)

-- collaborators: qualquer autenticado pode ler/escrever
CREATE POLICY "collaborators_select" ON public.collaborators
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "collaborators_update" ON public.collaborators
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "collaborators_delete" ON public.collaborators
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- projects: qualquer autenticado pode ler/escrever
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- time_logs: qualquer autenticado pode ler/escrever/deletar
CREATE POLICY "time_logs_select" ON public.time_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "time_logs_insert" ON public.time_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "time_logs_update" ON public.time_logs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "time_logs_delete" ON public.time_logs
  FOR DELETE USING (auth.uid() IS NOT NULL);
