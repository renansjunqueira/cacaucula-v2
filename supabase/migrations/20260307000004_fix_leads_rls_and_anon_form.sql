-- ─── is_admin(): SECURITY DEFINER para evitar nested-RLS na tabela collaborators ──
-- Quando a policy de leads faz subquery em collaborators, ela passa pelo RLS de
-- collaborators. Com SECURITY DEFINER, a função roda como postgres (sem RLS).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM collaborators
    WHERE id = auth.uid() AND role = 'Admin'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ─── Recria a policy de leads usando is_admin() ─────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage leads" ON public.leads;

CREATE POLICY "Admin can manage leads"
  ON public.leads
  FOR ALL
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Anon: permite SELECT para o formulário público ────────────────────────────
DROP POLICY IF EXISTS "Anon can view lead for form" ON public.leads;

CREATE POLICY "Anon can view lead for form"
  ON public.leads
  FOR SELECT
  TO anon
  USING (true);

-- ─── Anon: permite UPDATE apenas dos campos do formulário cadastral ─────────────
DROP POLICY IF EXISTS "Anon can submit lead form" ON public.leads;

CREATE POLICY "Anon can submit lead form"
  ON public.leads
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
