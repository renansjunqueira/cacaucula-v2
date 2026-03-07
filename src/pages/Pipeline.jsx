import { useEffect, useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'
import {
  Plus, X, ExternalLink, User, Phone, Tag, FileText,
  MessageSquare, Folder, Trophy, AlertTriangle, Star,
  Home, Calendar, BookOpen, PauseCircle
} from 'lucide-react'
import '../styles/Pipeline.css'

// ─── Columns ─────────────────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'Novos Contatos',       label: 'Novos Contatos',       color: '#D9B3C9' },
  { id: 'Em Qualificação',      label: 'Em Qualificação',      color: '#C4D4E8' },
  { id: 'Call Agendada',        label: 'Call Agendada',        color: '#E7D5B3' },
  { id: 'Construindo Proposta', label: 'Construindo Proposta', color: '#E7B15B' },
  { id: 'Proposta Enviada',     label: 'Proposta Enviada',     color: '#B3D9C4' },
  { id: 'Ganho',                label: 'Ganho',                color: '#38a169' },
  { id: 'Perdido / Pausado',    label: 'Perdido / Pausado',    color: '#C1C1C1' },
]
const COLUMN_ORDER = COLUMNS.map(c => c.id)
const SOURCES = ['Instagram', 'WhatsApp', 'Formulário', 'Indicação', 'Outro']

// ─── Transition rules (cumulative) ───────────────────────────────────────────
// Each entry lists ALL required fields to ENTER that stage
const REQUIRED_FOR = {
  'Em Qualificação': [
    { key: 'phone', label: 'Telefone', type: 'text', placeholder: '(11) 99999-9999' },
  ],
  'Call Agendada': [
    { key: 'phone',              label: 'Telefone',                         type: 'text',     placeholder: '(11) 99999-9999' },
    { key: 'endereco_imovel',    label: 'Endereço do Imóvel',               type: 'text',     placeholder: 'Rua, número, bairro, cidade' },
    { key: 'descricao_imovel',   label: 'Descrição do Imóvel',              type: 'textarea', placeholder: 'Tipo, metragem, características...' },
    { key: 'demand_description', label: 'Descrição da Demanda',             type: 'textarea', placeholder: 'O que o cliente deseja fazer...' },
    { key: 'arquivos_imovel',    label: 'Arquivos do Imóvel (mínimo 1 link)', type: 'urls' },
    { key: 'expectativa_inicio', label: 'Expectativa de Início',            type: 'date' },
  ],
  'Construindo Proposta': [
    { key: 'phone',                  label: 'Telefone',                           type: 'text',     placeholder: '(11) 99999-9999' },
    { key: 'endereco_imovel',        label: 'Endereço do Imóvel',                 type: 'text',     placeholder: 'Rua, número, bairro, cidade' },
    { key: 'descricao_imovel',       label: 'Descrição do Imóvel',                type: 'textarea', placeholder: 'Tipo, metragem, características...' },
    { key: 'demand_description',     label: 'Descrição da Demanda',               type: 'textarea', placeholder: 'O que o cliente deseja fazer...' },
    { key: 'arquivos_imovel',        label: 'Arquivos do Imóvel (mínimo 1 link)', type: 'urls' },
    { key: 'expectativa_inicio',     label: 'Expectativa de Início',              type: 'date' },
    { key: 'lead_engagement_score',  label: 'Engajamento na Call (1–5 estrelas)', type: 'score' },
  ],
  'Proposta Enviada': [
    { key: 'phone',                  label: 'Telefone',                           type: 'text',     placeholder: '(11) 99999-9999' },
    { key: 'endereco_imovel',        label: 'Endereço do Imóvel',                 type: 'text',     placeholder: 'Rua, número, bairro, cidade' },
    { key: 'descricao_imovel',       label: 'Descrição do Imóvel',                type: 'textarea', placeholder: 'Tipo, metragem, características...' },
    { key: 'demand_description',     label: 'Descrição da Demanda',               type: 'textarea', placeholder: 'O que o cliente deseja fazer...' },
    { key: 'arquivos_imovel',        label: 'Arquivos do Imóvel (mínimo 1 link)', type: 'urls' },
    { key: 'expectativa_inicio',     label: 'Expectativa de Início',              type: 'date' },
    { key: 'lead_engagement_score',  label: 'Engajamento na Call (1–5 estrelas)', type: 'score' },
  ],
  'Ganho': [
    { key: 'phone',                  label: 'Telefone',                           type: 'text',     placeholder: '(11) 99999-9999' },
    { key: 'endereco_imovel',        label: 'Endereço do Imóvel',                 type: 'text',     placeholder: 'Rua, número, bairro, cidade' },
    { key: 'descricao_imovel',       label: 'Descrição do Imóvel',                type: 'textarea', placeholder: 'Tipo, metragem, características...' },
    { key: 'demand_description',     label: 'Descrição da Demanda',               type: 'textarea', placeholder: 'O que o cliente deseja fazer...' },
    { key: 'arquivos_imovel',        label: 'Arquivos do Imóvel (mínimo 1 link)', type: 'urls' },
    { key: 'expectativa_inicio',     label: 'Expectativa de Início',              type: 'date' },
    { key: 'lead_engagement_score',  label: 'Engajamento na Call (1–5 estrelas)', type: 'score' },
    { key: 'cpf_cnpj',               label: 'CPF / CNPJ',                         type: 'text',     placeholder: '000.000.000-00' },
    { key: 'email',                  label: 'E-mail',                             type: 'email',    placeholder: 'cliente@email.com' },
    { key: 'endereco_cobranca',      label: 'Endereço de Cobrança',               type: 'text',     placeholder: 'Mesmo do imóvel ou diferente...' },
    { key: 'link_pasta_contrato',    label: 'Link da Pasta do Contrato',          type: 'url',      placeholder: 'https://onedrive...' },
  ],
  'Perdido / Pausado': [
    { key: 'motivo_perda_pausa', label: 'Motivo da Perda ou Pausa', type: 'textarea', placeholder: 'Descreva por que este lead não avançou...' },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isFilled(lead, field) {
  const val = lead[field.key]
  if (field.key === 'arquivos_imovel') return Array.isArray(val) && val.length > 0
  if (field.key === 'lead_engagement_score') return val != null && val >= 1 && val <= 5
  return val != null && String(val).trim() !== ''
}

function getMissingFields(lead, targetStatus) {
  return (REQUIRED_FOR[targetStatus] || []).filter(f => !isFilled(lead, f))
}

// Only validate forward moves; Perdido/Pausado is always validated (special exception)
function needsValidation(fromStatus, toStatus) {
  if (toStatus === 'Perdido / Pausado') return true
  const fromIdx = COLUMN_ORDER.indexOf(fromStatus)
  const toIdx = COLUMN_ORDER.indexOf(toStatus)
  return toIdx > fromIdx
}

const emptyLead = {
  name: '', phone: '', source: '', status: 'Novos Contatos',
  demand_description: '', files_link: '', notes: '',
  endereco_imovel: '', descricao_imovel: '', arquivos_imovel: [],
  expectativa_inicio: '', lead_engagement_score: null,
  cpf_cnpj: '', email: '', endereco_cobranca: '',
  link_pasta_contrato: '', motivo_perda_pausa: '',
}

// ─── ScoreInput ───────────────────────────────────────────────────────────────
function ScoreInput({ value, onChange }) {
  return (
    <div className="score-input">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`score-star ${(value || 0) >= n ? 'filled' : ''}`}
          onClick={() => onChange(n === value ? null : n)}
          title={`${n} estrela${n > 1 ? 's' : ''}`}
        >
          <Star size={20} />
        </button>
      ))}
      {value != null && <span className="score-label">{value} / 5</span>}
    </div>
  )
}

// ─── UrlListInput ─────────────────────────────────────────────────────────────
function UrlListInput({ urls, onChange }) {
  const [newUrl, setNewUrl] = useState('')

  function add() {
    const trimmed = newUrl.trim()
    if (!trimmed) return
    onChange([...urls, trimmed])
    setNewUrl('')
  }

  return (
    <div className="url-list-input">
      {urls.length > 0 && (
        <div className="url-list">
          {urls.map((url, idx) => (
            <div key={idx} className="url-item">
              <a href={url} target="_blank" rel="noopener noreferrer" className="url-link">{url}</a>
              <button type="button" className="url-remove" onClick={() => onChange(urls.filter((_, i) => i !== idx))}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="url-add-row">
        <input
          className="form-input"
          type="text"
          placeholder="https://drive.google.com/..."
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button type="button" className="btn btn-ghost btn-sm" onClick={add}>
          <Plus size={13} /> Adicionar
        </button>
      </div>
    </div>
  )
}

// ─── FieldInput (generic renderer for CompletionModal) ───────────────────────
function FieldInput({ field, value, onChange }) {
  if (field.type === 'score') return <ScoreInput value={value} onChange={onChange} />
  if (field.type === 'urls') return <UrlListInput urls={value || []} onChange={onChange} />
  if (field.type === 'textarea') {
    return (
      <textarea
        className="form-input pipeline-textarea"
        rows={3}
        placeholder={field.placeholder || ''}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    )
  }
  return (
    <input
      className="form-input"
      type={field.type === 'url' ? 'text' : (field.type || 'text')}
      placeholder={field.placeholder || ''}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
    />
  )
}

// ─── CompletionModal ──────────────────────────────────────────────────────────
// Opens when a card is dropped on a column that requires unfilled fields.
// Shows ONLY the missing fields; on save, the card visually completes the move.
function CompletionModal({ lead, targetStatus, missingFields, onSave, onCancel }) {
  const [form, setForm] = useState(() =>
    Object.fromEntries(
      missingFields.map(f => [f.key, lead[f.key] ?? (f.type === 'urls' ? [] : f.type === 'score' ? null : '')])
    )
  )
  const [saving, setSaving] = useState(false)

  const allFilled = missingFields.every(f => isFilled({ ...lead, ...form }, f))

  async function handleSave() {
    if (!allFilled) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const targetCol = COLUMNS.find(c => c.id === targetStatus)

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal completion-modal" onClick={e => e.stopPropagation()}>
        <div className="completion-modal-header">
          <span className="completion-modal-badge" style={{ background: targetCol?.color + '33', borderColor: targetCol?.color }}>
            {targetStatus}
          </span>
          <h3 className="completion-modal-title">Dados obrigatórios para avançar</h3>
          <p className="completion-modal-sub">
            Preencha os campos abaixo para mover <strong>"{lead.name}"</strong> para esta fase:
          </p>
        </div>

        <div className="completion-modal-body">
          {missingFields.map(field => (
            <div key={field.key} className="form-group">
              <label className="form-label">{field.label}</label>
              <FieldInput
                field={field}
                value={form[field.key]}
                onChange={v => setForm(p => ({ ...p, [field.key]: v }))}
              />
            </div>
          ))}
        </div>

        <div className="completion-modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!allFilled || saving}>
            {saving ? 'Salvando...' : 'Salvar e Mover'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', icon: Icon, iconColor }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
          {Icon && <Icon size={24} color={iconColor || 'var(--color-primary)'} style={{ flexShrink: 0, marginTop: 2 }} />}
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className="btn btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// ─── LeadModal (full ficha) ───────────────────────────────────────────────────
function LeadModal({ lead, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ ...emptyLead, ...lead, arquivos_imovel: lead.arquivos_imovel || [] })
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))
  const isValidUrl = str => { try { new URL(str); return true } catch { return false } }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="pipeline-modal-overlay" onClick={onClose}>
      <div className="pipeline-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="pipeline-modal-header">
          <div>
            <h2 className="pipeline-modal-title">{lead.id ? form.name || 'Lead' : 'Novo Lead'}</h2>
            <p className="pipeline-modal-sub">{COLUMNS.find(c => c.id === form.status)?.label || form.status}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {lead.id && (
              <button
                className="btn btn-sm"
                style={{ color: 'var(--color-danger)', border: '1px solid rgba(229,62,62,0.2)', background: 'none' }}
                onClick={() => setConfirmDel(true)}
              >
                Excluir
              </button>
            )}
            <button className="pipeline-modal-close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="pipeline-modal-body">

          {/* Dados de Contato */}
          <div className="pipeline-modal-section">
            <h3 className="pipeline-modal-section-title"><User size={14} /> Dados de Contato</h3>
            <div className="pipeline-modal-grid">
              <div className="form-group">
                <label className="form-label">Nome do Lead *</label>
                <input className="form-input" type="text" placeholder="Nome do cliente"
                  value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input className="form-input" type="text" placeholder="(11) 99999-9999"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input className="form-input" type="email" placeholder="cliente@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">CPF / CNPJ</label>
                <input className="form-input" type="text" placeholder="000.000.000-00"
                  value={form.cpf_cnpj} onChange={e => set('cpf_cnpj', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Origem</label>
                <select className="form-select" value={form.source} onChange={e => set('source', e.target.value)}>
                  <option value="">— Selecionar —</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Etapa</label>
                <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                  {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Imóvel */}
          <div className="pipeline-modal-section">
            <h3 className="pipeline-modal-section-title"><Home size={14} /> Imóvel</h3>
            <div className="form-group">
              <label className="form-label">Endereço do Imóvel</label>
              <input className="form-input" type="text" placeholder="Rua, número, bairro, cidade"
                value={form.endereco_imovel} onChange={e => set('endereco_imovel', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Descrição do Imóvel</label>
              <textarea className="form-input pipeline-textarea" rows={3}
                placeholder="Tipo, metragem estimada, características..."
                value={form.descricao_imovel} onChange={e => set('descricao_imovel', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Arquivos (planta, fotos, vídeo)</label>
              <UrlListInput urls={form.arquivos_imovel || []} onChange={v => set('arquivos_imovel', v)} />
            </div>
            <div className="form-group" style={{ maxWidth: 220 }}>
              <label className="form-label">Expectativa de Início</label>
              <input className="form-input" type="date"
                value={form.expectativa_inicio || ''} onChange={e => set('expectativa_inicio', e.target.value)} />
            </div>
          </div>

          {/* Demanda */}
          <div className="pipeline-modal-section">
            <h3 className="pipeline-modal-section-title"><MessageSquare size={14} /> Demanda do Cliente</h3>
            <textarea className="form-input pipeline-textarea" rows={4}
              placeholder="Descreva o briefing, estilo pretendido, programa de necessidades..."
              value={form.demand_description} onChange={e => set('demand_description', e.target.value)} />
          </div>

          {/* Engajamento */}
          <div className="pipeline-modal-section">
            <h3 className="pipeline-modal-section-title"><Star size={14} /> Engajamento na Call</h3>
            <p className="pipeline-modal-hint">Avalie o engajamento do cliente durante a reunião de apresentação.</p>
            <ScoreInput value={form.lead_engagement_score} onChange={v => set('lead_engagement_score', v)} />
          </div>

          {/* Pasta de Arquivos */}
          <div className="pipeline-modal-section">
            <h3 className="pipeline-modal-section-title"><Folder size={14} /> Pasta Geral de Arquivos</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <input className="form-input" type="url" placeholder="https://onedrive.live.com/..."
                value={form.files_link} onChange={e => set('files_link', e.target.value)} style={{ flex: 1 }} />
              {form.files_link && isValidUrl(form.files_link) && (
                <a href={form.files_link} target="_blank" rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm pipeline-files-btn">
                  <ExternalLink size={14} /> Acessar
                </a>
              )}
            </div>
          </div>

          {/* Contrato */}
          <div className="pipeline-modal-section">
            <h3 className="pipeline-modal-section-title"><FileText size={14} /> Dados para Contrato</h3>
            <div className="form-group">
              <label className="form-label">Endereço de Cobrança</label>
              <input className="form-input" type="text" placeholder="Mesmo do imóvel ou diferente..."
                value={form.endereco_cobranca} onChange={e => set('endereco_cobranca', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Link da Pasta do Contrato</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" type="url" placeholder="https://..."
                  value={form.link_pasta_contrato} onChange={e => set('link_pasta_contrato', e.target.value)} style={{ flex: 1 }} />
                {form.link_pasta_contrato && isValidUrl(form.link_pasta_contrato) && (
                  <a href={form.link_pasta_contrato} target="_blank" rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm pipeline-files-btn">
                    <ExternalLink size={14} /> Abrir
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Diário */}
          <div className="pipeline-modal-section">
            <h3 className="pipeline-modal-section-title"><BookOpen size={14} /> Diário / Histórico</h3>
            <textarea className="form-input pipeline-textarea" rows={4}
              placeholder="Anotações de contato: 'Fiz call dia 10, cliente quer 3 quartos...'"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          {/* Perda/Pausa */}
          <div className="pipeline-modal-section">
            <h3 className="pipeline-modal-section-title"><PauseCircle size={14} /> Motivo da Perda ou Pausa</h3>
            <textarea className="form-input pipeline-textarea" rows={3}
              placeholder="Descreva por que este lead não avançou..."
              value={form.motivo_perda_pausa} onChange={e => set('motivo_perda_pausa', e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="pipeline-modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        {confirmDel && (
          <ConfirmModal
            title="Excluir lead"
            message={`Tem certeza que deseja excluir "${form.name}"? Esta ação não pode ser desfeita.`}
            icon={AlertTriangle} iconColor="var(--color-danger)"
            confirmLabel="Excluir"
            onConfirm={() => { setConfirmDel(false); onDelete(lead.id) }}
            onCancel={() => setConfirmDel(false)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Pipeline() {
  const { collaborator: currentUser } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null)
  const [pendingMove, setPendingMove] = useState(null)  // { lead, toStatus, missingFields }
  const [ganhoConfirm, setGanhoConfirm] = useState(null)

  // ── Load ────────────────────────────────────────────────────────────────────
  const loadLeads = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('leads').select('*').order('created_at', { ascending: true })
    if (error) addToast('Erro ao carregar leads: ' + error.message, 'error')
    else setLeads((data || []).map(l => ({ ...l, arquivos_imovel: l.arquivos_imovel || [] })))
    setLoading(false)
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = leads.filter(l => l.status === col.id)
    return acc
  }, {})

  // ── Core move (after validation passes) ─────────────────────────────────────
  async function moveLead(leadId, newStatus, extraFields = {}) {
    const { error } = await supabase
      .from('leads').update({ status: newStatus, ...extraFields }).eq('id', leadId)
    if (error) { addToast('Erro ao mover lead: ' + error.message, 'error'); return false }
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus, ...extraFields } : l))
    return true
  }

  // ── Drag end ─────────────────────────────────────────────────────────────────
  async function onDragEnd(result) {
    const { draggableId, source, destination } = result
    if (!destination || destination.droppableId === source.droppableId) return

    const toStatus = destination.droppableId
    const lead = leads.find(l => l.id === draggableId)
    if (!lead) return

    if (needsValidation(source.droppableId, toStatus)) {
      const missing = getMissingFields(lead, toStatus)
      if (missing.length > 0) {
        // Card stays in original column — open completion modal
        setPendingMove({ lead, toStatus, missingFields: missing })
        return
      }
    }

    const ok = await moveLead(draggableId, toStatus)
    if (ok && toStatus === 'Ganho') setGanhoConfirm({ ...lead, status: 'Ganho' })
  }

  // ── CompletionModal save ─────────────────────────────────────────────────────
  async function handleCompletionSave(formData) {
    if (!pendingMove) return
    const { lead, toStatus } = pendingMove
    const ok = await moveLead(lead.id, toStatus, formData)
    if (ok) {
      setPendingMove(null)
      addToast('Lead movido com sucesso!', 'success')
      if (toStatus === 'Ganho') setGanhoConfirm({ ...lead, ...formData, status: 'Ganho' })
    }
  }

  // ── Quick "mark as lost" button on card ──────────────────────────────────────
  function handleMarkLost(e, lead) {
    e.stopPropagation()
    const missing = getMissingFields(lead, 'Perdido / Pausado')
    if (missing.length === 0) {
      moveLead(lead.id, 'Perdido / Pausado')
      addToast('Lead movido para Perdido/Pausado.', 'success')
    } else {
      setPendingMove({ lead, toStatus: 'Perdido / Pausado', missingFields: missing })
    }
  }

  // ── Save full lead form ──────────────────────────────────────────────────────
  async function handleSaveLead(form) {
    const payload = {
      name: form.name, phone: form.phone, source: form.source,
      status: form.status, demand_description: form.demand_description,
      files_link: form.files_link, notes: form.notes,
      endereco_imovel: form.endereco_imovel,
      descricao_imovel: form.descricao_imovel,
      arquivos_imovel: form.arquivos_imovel || [],
      expectativa_inicio: form.expectativa_inicio || null,
      lead_engagement_score: form.lead_engagement_score || null,
      cpf_cnpj: form.cpf_cnpj, email: form.email,
      endereco_cobranca: form.endereco_cobranca,
      link_pasta_contrato: form.link_pasta_contrato,
      motivo_perda_pausa: form.motivo_perda_pausa,
    }

    if (form.id) {
      const { error } = await supabase.from('leads').update(payload).eq('id', form.id)
      if (error) { addToast('Erro ao salvar: ' + error.message, 'error'); return }
      setLeads(prev => prev.map(l => l.id === form.id ? { ...l, ...form } : l))
      if (form.status === 'Ganho') setGanhoConfirm(form)
    } else {
      const { data, error } = await supabase
        .from('leads').insert({ ...payload, created_by: currentUser.id }).select().single()
      if (error) { addToast('Erro ao criar lead: ' + error.message, 'error'); return }
      setLeads(prev => [...prev, { ...data, arquivos_imovel: data.arquivos_imovel || [] }])
    }
    addToast('Lead salvo!', 'success')
    setSelectedLead(null)
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDeleteLead(id) {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) { addToast('Erro ao excluir: ' + error.message, 'error'); return }
    setLeads(prev => prev.filter(l => l.id !== id))
    addToast('Lead excluído.', 'success')
    setSelectedLead(null)
  }

  // ── Create project ───────────────────────────────────────────────────────────
  async function handleCreateProject() {
    if (!ganhoConfirm) return
    const { error } = await supabase.from('projects').insert({ name: ganhoConfirm.name, is_active: true })
    if (error) addToast('Erro ao criar projeto: ' + error.message, 'error')
    else addToast(`Projeto "${ganhoConfirm.name}" criado com sucesso!`, 'success')
    setGanhoConfirm(null)
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="pipeline-page">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="pipeline-topbar">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Pipeline de Vendas</h1>
          <p className="page-subtitle">Gerencie o funil de leads do escritório</p>
        </div>
        <button className="btn btn-primary" onClick={() => setSelectedLead({ ...emptyLead })}>
          <Plus size={15} /> Novo Lead
        </button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="pipeline-board">
            {COLUMNS.map(col => (
              <div key={col.id} className="pipeline-column">
                <div className="pipeline-column-header" style={{ borderTopColor: col.color }}>
                  <span className="pipeline-column-title">{col.label}</span>
                  <span className="pipeline-column-count">{grouped[col.id]?.length || 0}</span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`pipeline-column-body ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                    >
                      {grouped[col.id]?.map((lead, idx) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={idx}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`pipeline-card ${snapshot.isDragging ? 'dragging' : ''}`}
                              onClick={() => setSelectedLead(lead)}
                            >
                              <p className="pipeline-card-name">{lead.name}</p>
                              <div className="pipeline-card-meta">
                                {lead.source && (
                                  <span className="pipeline-card-tag">
                                    <Tag size={10} /> {lead.source}
                                  </span>
                                )}
                                {lead.lead_engagement_score != null && (
                                  <span className="pipeline-card-score">
                                    {'★'.repeat(lead.lead_engagement_score)}{'☆'.repeat(5 - lead.lead_engagement_score)}
                                  </span>
                                )}
                              </div>
                              {lead.phone && (
                                <div className="pipeline-card-phone">
                                  <Phone size={10} /> {lead.phone}
                                </div>
                              )}

                              {/* Quick "mark as lost" — hidden, shows on hover */}
                              {col.id !== 'Perdido / Pausado' && (
                                <button
                                  className="pipeline-card-lost-btn"
                                  title="Marcar como Perdido / Pausado"
                                  onClick={e => handleMarkLost(e, lead)}
                                >
                                  <PauseCircle size={13} /> Perdido
                                </button>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      <button
                        className="pipeline-add-card"
                        onClick={() => setSelectedLead({ ...emptyLead, status: col.id })}
                      >
                        <Plus size={13} /> Adicionar
                      </button>
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Full lead form */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
        />
      )}

      {/* Missing fields — blocks card move until filled */}
      {pendingMove && (
        <CompletionModal
          lead={pendingMove.lead}
          targetStatus={pendingMove.toStatus}
          missingFields={pendingMove.missingFields}
          onSave={handleCompletionSave}
          onCancel={() => setPendingMove(null)}
        />
      )}

      {/* Ganho → create project? */}
      {ganhoConfirm && (
        <ConfirmModal
          title="Lead ganho! Criar projeto?"
          message={`Deseja criar "${ganhoConfirm.name}" como um Projeto Ativo para registro de horas da equipe?`}
          icon={Trophy} iconColor="var(--color-success)"
          confirmLabel="Criar Projeto" cancelLabel="Não, obrigado"
          onConfirm={handleCreateProject}
          onCancel={() => setGanhoConfirm(null)}
        />
      )}
    </div>
  )
}
