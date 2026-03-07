-- ─── Vínculo entre leads e propostas ────────────────────────────────────────

-- proposals: referência ao lead que originou a proposta
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL;

-- leads: referência à proposta ativa (proposta "vencedora" em andamento)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS active_proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL;

-- ─── Fix proposals RLS — usa is_admin() para evitar nested-RLS ──────────────
DROP POLICY IF EXISTS "Admin owns proposals" ON public.proposals;

CREATE POLICY "Admin can manage proposals"
  ON public.proposals
  FOR ALL
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── Fix proposal_tasks RLS — subquery em proposals tinha nested-RLS ─────────
DROP POLICY IF EXISTS "Admin owns proposal_tasks" ON public.proposal_tasks;

CREATE POLICY "Admin can manage proposal_tasks"
  ON public.proposal_tasks
  FOR ALL
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());
