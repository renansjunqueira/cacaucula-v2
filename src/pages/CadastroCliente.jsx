import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../styles/CadastroCliente.css'

export default function CadastroCliente() {
  const { leadId } = useParams()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [leadName, setLeadName] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    cpf_cnpj: '',
    data_nascimento: '',
    endereco_cobranca: '',
    endereco_imovel: '',
  })

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  // ── Load lead data for pre-fill ──────────────────────────────────────────────
  useEffect(() => {
    if (!leadId) { setNotFound(true); setLoading(false); return }

    supabase
      .from('leads')
      .select('name, email, cpf_cnpj, endereco_cobranca, endereco_imovel, form_cadastral_preenchido')
      .eq('id', leadId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true)
        } else {
          setLeadName(data.name || '')
          setForm({
            name:              data.name              || '',
            email:             data.email             || '',
            cpf_cnpj:          data.cpf_cnpj          || '',
            data_nascimento:   '',
            endereco_cobranca: data.endereco_cobranca || '',
            endereco_imovel:   data.endereco_imovel   || '',
          })
          if (data.form_cadastral_preenchido) setSubmitted(true)
        }
        setLoading(false)
      })
  }, [leadId])

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Por favor, informe seu nome.'); return }
    setError('')
    setSaving(true)
    const { error } = await supabase
      .from('leads')
      .update({
        name:                      form.name,
        email:                     form.email,
        cpf_cnpj:                  form.cpf_cnpj,
        data_nascimento:           form.data_nascimento || null,
        endereco_cobranca:         form.endereco_cobranca,
        endereco_imovel:           form.endereco_imovel,
        form_cadastral_preenchido: true,
      })
      .eq('id', leadId)
    setSaving(false)
    if (error) {
      setError('Ocorreu um erro ao enviar. Tente novamente.')
    } else {
      setSubmitted(true)
    }
  }

  // ── States ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="cf-page">
        <div className="cf-loading">
          <div className="cf-spinner" />
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="cf-page">
        <div className="cf-card cf-not-found">
          <img src="/logo-cacau.jpeg" alt="Cacaucula" className="cf-logo" />
          <h1 className="cf-not-found-title">Link inválido</h1>
          <p className="cf-not-found-text">Este link não é válido ou já expirou. Solicite um novo link à equipe.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="cf-page">
        <div className="cf-card cf-success-card">
          <img src="/logo-cacau.jpeg" alt="Cacaucula" className="cf-logo" />
          <div className="cf-success-icon">✅</div>
          <h1 className="cf-success-title">Dados enviados com sucesso!</h1>
          <p className="cf-success-text">Nossa equipe entrará em contato em breve para os próximos passos do seu projeto.</p>
        </div>
      </div>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div className="cf-page">
      <div className="cf-card">
        <img src="/logo-cacau.jpeg" alt="Cacaucula" className="cf-logo" />

        <div className="cf-header">
          <h1 className="cf-title">Cadastro para contrato</h1>
          <p className="cf-greeting">
            Olá, <strong>{leadName || 'cliente'}</strong>! Para prosseguirmos com seu projeto,
            por favor preencha os dados abaixo para a elaboração do contrato.
          </p>
        </div>

        <form className="cf-form" onSubmit={handleSubmit}>

          <div className="cf-section">
            <h2 className="cf-section-title">Dados pessoais</h2>

            <div className="cf-field">
              <label className="cf-label">Nome completo ou Razão social *</label>
              <input
                className="cf-input"
                type="text"
                placeholder="Seu nome completo ou razão social"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
              />
            </div>

            <div className="cf-field">
              <label className="cf-label">E-mail</label>
              <input
                className="cf-input"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
              />
            </div>

            <div className="cf-row">
              <div className="cf-field">
                <label className="cf-label">CPF ou CNPJ</label>
                <input
                  className="cf-input"
                  type="text"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={form.cpf_cnpj}
                  onChange={e => set('cpf_cnpj', e.target.value)}
                />
              </div>
              <div className="cf-field">
                <label className="cf-label">Data de nascimento</label>
                <input
                  className="cf-input"
                  type="date"
                  value={form.data_nascimento}
                  onChange={e => set('data_nascimento', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="cf-section">
            <h2 className="cf-section-title">Endereços</h2>

            <div className="cf-field">
              <label className="cf-label">Seu endereço atual (cobrança)</label>
              <textarea
                className="cf-input cf-textarea"
                rows={3}
                placeholder="Rua, número, bairro, cidade, estado, CEP"
                value={form.endereco_cobranca}
                onChange={e => set('endereco_cobranca', e.target.value)}
              />
            </div>

            <div className="cf-field">
              <label className="cf-label">Endereço do imóvel do projeto + CEP</label>
              <textarea
                className="cf-input cf-textarea"
                rows={3}
                placeholder="Rua, número, bairro, cidade, estado, CEP"
                value={form.endereco_imovel}
                onChange={e => set('endereco_imovel', e.target.value)}
              />
            </div>
          </div>

          {error && <p className="cf-error">{error}</p>}

          <button className="cf-submit" type="submit" disabled={saving}>
            {saving ? 'Enviando...' : 'Enviar Dados'}
          </button>
        </form>
      </div>
    </div>
  )
}
