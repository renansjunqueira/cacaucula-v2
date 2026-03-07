-- Novos campos para suportar as regras de transição de fase do Pipeline
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS endereco_imovel       text DEFAULT '',
  ADD COLUMN IF NOT EXISTS descricao_imovel      text DEFAULT '',
  ADD COLUMN IF NOT EXISTS arquivos_imovel       jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS expectativa_inicio    date,
  ADD COLUMN IF NOT EXISTS lead_engagement_score int
    CONSTRAINT leads_engagement_check CHECK (lead_engagement_score IS NULL OR (lead_engagement_score >= 1 AND lead_engagement_score <= 5)),
  ADD COLUMN IF NOT EXISTS cpf_cnpj              text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email                 text DEFAULT '',
  ADD COLUMN IF NOT EXISTS endereco_cobranca     text DEFAULT '',
  ADD COLUMN IF NOT EXISTS link_pasta_contrato   text DEFAULT '',
  ADD COLUMN IF NOT EXISTS motivo_perda_pausa    text DEFAULT '';
