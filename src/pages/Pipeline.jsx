import { useEffect, useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'
import {
  Plus, X, ExternalLink, User, Phone, Tag, FileText,
  MessageSquare, Folder, Trophy, AlertTriangle
} from 'lucide-react'
import '../styles/Pipeline.css'

// ─── Columns config ──────────────────────────────────────────────────────────
const COLUMNS = [
  { id: 'Novos Contatos',       label: 'Novos Contatos',      color: '#D9B3C9' },
  { id: 'Em Qualificação',      label: 'Em Qualificação',     color: '#C4D4E8' },
  { id: 'Call Agendada',        label: 'Call Agendada',       color: '#E7D5B3' },
  { id: 'Construindo Proposta', label: 'Construindo Proposta',color: '#E7B15B' },
  { id: 'Proposta Enviada',     label: 'Proposta Enviada',    color: '#B3D9C4' },
  { id: 'Ganho',                label: 'Ganho',               color: '#38a169' },
  { id: 'Perdido / Pausado',    label: 'Perdido / Pausado',   color: '#C1C1C1' },
]

const SOURCES = ['Instagram', 'WhatsApp', 'Formulário', 'Indicação', 'Outro']

const emptyLead = {
  name: '', phone: '', source: '', status: 'Novos Contatos',
  demand_description: '', files_link: '', notes: '',
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
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

// ─── Lead modal ───────────────────────────────────────────────────────────────
function LeadModal({ lead, onClose, onSave, onDelete, currentUserId }) {
  const [form, setForm] = useState({ ...lead })
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const isValidUrl = (str) => {
    try { new URL(str); return true } catch { return false }
  }

  return (
    <div className="pipeline-modal-overlay" onClick={onClose}>
      <div className="pipeline-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="pipeline-modal-header">
          <div>
            <h2 className="pipeline-modal-title">{lead.id ? form.name || 'Lead' : 'Novo Lead'}</h2>
            <p className="pipeline-modal-sub">
              {COLUMNS.find(c => c.id === form.status)?.label || form.status}
            </p>
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
          {/* Dados básicos */}
          <div className="pipeline-modal-section">
            <h3 className="pipeline-modal-section-title">
              <User size={14} /> Dados Básicos
            </h3>
            <div className="pipeline-modal-grid">
              <div className="form-group">
                <label className="form-label">Nome do Lead *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Nome do cliente"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Origem</label>
                <select
                  className="form-select"
                  value={form.source}
                  onChange={e => set('source', e.target.value)}
                >
                  <option value="">— Selecionar —</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Etapa</label>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={e => set('status', e.target.value)}
                >
                  {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Demanda */}
          <div className="pipeline-modal-section">
            <h3 className="pipeline-modal-section-title">
              <MessageSquare size={14} /> Demanda do Cliente
            </h3>
            <textarea
              className="form-input pipeline-textarea"
              placeholder="Descreva o briefing, tipo de imóvel, metragem, estilo pretendido..."
              value={form.demand_description}
              onChange={e => set('demand_description', e.target.value)}
              rows={4}
            />
          </div>

          {/* Arquivos */}
          <div className="pipeline-modal-section">
            <h3 className="pipeline-modal-section-title">
              <Folder size={14} /> Pasta de Arquivos
            </h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <input
                className="form-input"
                type="url"
                placeholder="https://onedrive.live.com/..."
                value={form.files_link}
                onChange={e => set('files_link', e.target.value)}
                style={{ flex: 1 }}
              />
              {form.files_link && isValidUrl(form.files_link) && (
                <a
                  href={form.files_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm pipeline-files-btn"
                  title="Abrir pasta"
                >
                  <ExternalLink size={14} /> Acessar
                </a>
              )}
            </div>
          </div>

          {/* Notas */}
          <div className="pipeline-modal-section">
            <h3 className="pipeline-modal-section-title">
              <FileText size={14} /> Diário / Histórico
            </h3>
            <textarea
              className="form-input pipeline-textarea"
              placeholder="Anotações de contato: 'Fiz call dia 10, cliente quer 3 quartos...'"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={4}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pipeline-modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>

        {/* Confirm delete */}
        {confirmDel && (
          <ConfirmModal
            title="Excluir lead"
            message={`Tem certeza que deseja excluir "${form.name}"? Esta ação não pode ser desfeita.`}
            icon={AlertTriangle}
            iconColor="var(--color-danger)"
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
  const [selectedLead, setSelectedLead] = useState(null)     // null | lead object | 'new'
  const [ganhoConfirm, setGanhoConfirm] = useState(null)     // lead that just moved to Ganho

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadLeads = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) addToast('Erro ao carregar leads: ' + error.message, 'error')
    else setLeads(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadLeads() }, [loadLeads])

  // ── Group leads by status ─────────────────────────────────────────────────
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = leads.filter(l => l.status === col.id)
    return acc
  }, {})

  // ── Drag end ──────────────────────────────────────────────────────────────
  async function onDragEnd(result) {
    const { draggableId, source, destination } = result
    if (!destination || destination.droppableId === source.droppableId) return

    const newStatus = destination.droppableId
    const lead = leads.find(l => l.id === draggableId)
    if (!lead) return

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === draggableId ? { ...l, status: newStatus } : l))

    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', draggableId)

    if (error) {
      addToast('Erro ao mover lead: ' + error.message, 'error')
      setLeads(prev => prev.map(l => l.id === draggableId ? { ...l, status: source.droppableId } : l))
      return
    }

    if (newStatus === 'Ganho') {
      setGanhoConfirm({ ...lead, status: 'Ganho' })
    }
  }

  // ── Save lead (create or update) ──────────────────────────────────────────
  async function handleSaveLead(form) {
    if (form.id) {
      const { error } = await supabase
        .from('leads')
        .update({
          name: form.name, phone: form.phone, source: form.source,
          status: form.status, demand_description: form.demand_description,
          files_link: form.files_link, notes: form.notes,
        })
        .eq('id', form.id)
      if (error) { addToast('Erro ao salvar: ' + error.message, 'error'); return }
      setLeads(prev => prev.map(l => l.id === form.id ? { ...l, ...form } : l))
      if (form.status === 'Ganho') setGanhoConfirm(form)
    } else {
      const { data, error } = await supabase
        .from('leads')
        .insert({ ...form, created_by: currentUser.id })
        .select()
        .single()
      if (error) { addToast('Erro ao criar lead: ' + error.message, 'error'); return }
      setLeads(prev => [...prev, data])
    }
    addToast('Lead salvo!', 'success')
    setSelectedLead(null)
  }

  // ── Delete lead ───────────────────────────────────────────────────────────
  async function handleDeleteLead(id) {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) { addToast('Erro ao excluir: ' + error.message, 'error'); return }
    setLeads(prev => prev.filter(l => l.id !== id))
    addToast('Lead excluído.', 'success')
    setSelectedLead(null)
  }

  // ── Create project from Ganho ─────────────────────────────────────────────
  async function handleCreateProject() {
    if (!ganhoConfirm) return
    const { error } = await supabase
      .from('projects')
      .insert({ name: ganhoConfirm.name, is_active: true })
    if (error) addToast('Erro ao criar projeto: ' + error.message, 'error')
    else addToast(`Projeto "${ganhoConfirm.name}" criado com sucesso!`, 'success')
    setGanhoConfirm(null)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pipeline-page">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="pipeline-topbar">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Pipeline de Vendas</h1>
          <p className="page-subtitle">Gerencie o funil de leads do escritório</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setSelectedLead({ ...emptyLead })}
        >
          <Plus size={15} /> Novo Lead
        </button>
      </div>

      {/* Board */}
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
                              {lead.source && (
                                <span className="pipeline-card-source">
                                  <Tag size={10} /> {lead.source}
                                </span>
                              )}
                              {lead.phone && (
                                <span className="pipeline-card-phone">
                                  <Phone size={10} /> {lead.phone}
                                </span>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {/* Add button inside column */}
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

      {/* Lead modal */}
      {selectedLead && (
        <LeadModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSave={handleSaveLead}
          onDelete={handleDeleteLead}
          currentUserId={currentUser?.id}
        />
      )}

      {/* Ganho confirm */}
      {ganhoConfirm && (
        <ConfirmModal
          title="Lead ganho! Criar projeto?"
          message={`Deseja criar "${ganhoConfirm.name}" como um Projeto Ativo para registro de horas da equipe?`}
          icon={Trophy}
          iconColor="var(--color-success)"
          confirmLabel="Criar Projeto"
          cancelLabel="Não, obrigado"
          onConfirm={handleCreateProject}
          onCancel={() => setGanhoConfirm(null)}
        />
      )}
    </div>
  )
}
