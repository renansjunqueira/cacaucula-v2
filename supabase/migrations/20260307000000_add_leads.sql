-- Tabela de leads do CRM / Pipeline
CREATE TABLE IF NOT EXISTS public.leads (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name               text NOT NULL,
  phone              text DEFAULT '',
  source             text DEFAULT '',
  status             text NOT NULL DEFAULT 'Novos Contatos',
  demand_description text DEFAULT '',
  files_link         text DEFAULT '',
  notes              text DEFAULT '',
  created_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         timestamptz DEFAULT now()
);

-- Habilita RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Apenas Admin (criador) pode ler/inserir/atualizar/excluir
CREATE POLICY "Admin owns leads"
  ON public.leads
  FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);
