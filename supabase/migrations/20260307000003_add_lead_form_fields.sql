-- Novos campos para o formulário cadastral público
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS data_nascimento          date,
  ADD COLUMN IF NOT EXISTS form_cadastral_preenchido boolean NOT NULL DEFAULT false;

-- ─── Função pública: retorna apenas os campos necessários para pré-preencher o form
CREATE OR REPLACE FUNCTION public.get_lead_for_form(p_lead_id uuid)
RETURNS TABLE (
  name                text,
  email               text,
  cpf_cnpj            text,
  endereco_cobranca   text,
  endereco_imovel     text,
  form_cadastral_preenchido boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT
      l.name,
      l.email,
      l.cpf_cnpj,
      l.endereco_cobranca,
      l.endereco_imovel,
      l.form_cadastral_preenchido
    FROM public.leads l
    WHERE l.id = p_lead_id;
END;
$$;

-- ─── Função pública: atualiza apenas os campos permitidos e marca o form como preenchido
CREATE OR REPLACE FUNCTION public.submit_lead_form(
  p_lead_id           uuid,
  p_name              text,
  p_email             text,
  p_cpf_cnpj          text,
  p_data_nascimento   date,
  p_endereco_cobranca text,
  p_endereco_imovel   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads
  SET
    name                      = COALESCE(NULLIF(trim(p_name), ''), name),
    email                     = p_email,
    cpf_cnpj                  = p_cpf_cnpj,
    data_nascimento           = p_data_nascimento,
    endereco_cobranca         = p_endereco_cobranca,
    endereco_imovel           = p_endereco_imovel,
    form_cadastral_preenchido = true
  WHERE id = p_lead_id;
END;
$$;

-- Permite que usuários não autenticados (anon) chamem as funções públicas
GRANT EXECUTE ON FUNCTION public.get_lead_for_form(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_lead_form(uuid, text, text, text, date, text, text) TO anon;
