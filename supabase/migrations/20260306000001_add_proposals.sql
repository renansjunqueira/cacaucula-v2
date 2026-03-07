-- Tabela principal de propostas comerciais
CREATE TABLE IF NOT EXISTS public.proposals (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_name               text NOT NULL DEFAULT '',
  project_name            text NOT NULL DEFAULT '',
  start_date              date,
  delivery_date           date,
  total_hours             numeric(10,2) DEFAULT 0,
  total_cost              numeric(12,2) DEFAULT 0,
  markup_percentage       numeric(10,4) DEFAULT 0,
  final_price             numeric(12,2) DEFAULT 0,
  profit_margin_value     numeric(12,2) DEFAULT 0,
  profit_margin_percentage numeric(10,4) DEFAULT 0,
  created_by              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at              timestamptz DEFAULT now()
);

-- Tabela de tarefas vinculadas à proposta
CREATE TABLE IF NOT EXISTS public.proposal_tasks (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id          uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  collaborator_id      uuid REFERENCES public.collaborators(id) ON DELETE SET NULL,
  description          text DEFAULT '',
  estimated_hours      numeric(10,2) DEFAULT 0,
  allocation_percentage numeric(5,2) DEFAULT 100,
  calculated_cost      numeric(12,2) DEFAULT 0
);

-- Habilita RLS
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas o criador (Admin) pode ler/inserir/atualizar/excluir
CREATE POLICY "Admin owns proposals"
  ON public.proposals
  FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admin owns proposal_tasks"
  ON public.proposal_tasks
  FOR ALL
  USING (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    proposal_id IN (
      SELECT id FROM public.proposals WHERE created_by = auth.uid()
    )
  );
