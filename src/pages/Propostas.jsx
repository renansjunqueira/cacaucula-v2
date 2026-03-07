import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'
import {
  FileText, Plus, Trash2, Calculator, Save, ChevronDown,
  AlertTriangle, Briefcase
} from 'lucide-react'
import '../styles/Propostas.css'

const MAX_TASKS = 15

function emptyTask() {
  return {
    _key: Math.random().toString(36).slice(2),
    collaborator_id: '',
    collaborator_hourly_rate: 0,
    description: '',
    estimated_hours: '',
    allocation_percentage: 100,
    calculated_cost: 0,
  }
}

function addWorkingDays(startDate, days) {
  const result = new Date(startDate)
  let added = 0
  const totalDays = Math.ceil(days)
  while (added < totalDays) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return result
}

function formatDate(dateObj) {
  if (!dateObj) return '—'
  const y = dateObj.getFullYear()
  const m = String(dateObj.getMonth() + 1).padStart(2, '0')
  const d = String(dateObj.getDate()).padStart(2, '0')
  return `${d}/${m}/${y}`
}

function parseDateInput(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function formatPct(value) {
  return `${(value || 0).toFixed(2)}%`
}

export default function Propostas() {
  const { session, collaborator: currentUser } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  // --- Data ---
  const [savedProposals, setSavedProposals] = useState([])
  const [collaborators, setCollaborators] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [saving, setSaving] = useState(false)

  // --- Form state ---
  const [currentId, setCurrentId] = useState(null)
  const [leadName, setLeadName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [tasks, setTasks] = useState([emptyTask()])
  const [startDate, setStartDate] = useState('')

  // --- Calculated (only after "Orçar") ---
  const [calcDone, setCalcDone] = useState(false)
  const [deliveryDate, setDeliveryDate] = useState(null)
  const [totalHours, setTotalHours] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [pricingMode, setPricingMode] = useState('markup') // 'markup' | 'final'
  const [markupPct, setMarkupPct] = useState('')
  const [finalPrice, setFinalPrice] = useState('')
  const [marginValue, setMarginValue] = useState(0)
  const [marginPct, setMarginPct] = useState(0)

  // ─── Load initial data ───────────────────────────────────────────────────────
  useEffect(() => {
    loadProposals()
    loadCollaborators()
  }, [])

  async function loadProposals() {
    setLoadingList(true)
    const { data, error } = await supabase
      .from('proposals')
      .select('id, lead_name, project_name, created_at')
      .order('created_at', { ascending: false })
    if (error) addToast('Erro ao carregar propostas: ' + error.message, 'error')
    else setSavedProposals(data || [])
    setLoadingList(false)
  }

  async function loadCollaborators() {
    const { data } = await supabase
      .from('collaborators')
      .select('id, name, hourly_rate')
      .eq('is_active', true)
      .order('name')
    setCollaborators(data || [])
  }

  // ─── Load a saved proposal ────────────────────────────────────────────────────
  async function loadProposal(id) {
    const { data: prop, error: e1 } = await supabase
      .from('proposals')
      .select('*')
      .eq('id', id)
      .single()
    if (e1) { addToast('Erro ao carregar proposta.', 'error'); return }

    const { data: propTasks, error: e2 } = await supabase
      .from('proposal_tasks')
      .select('*')
      .eq('proposal_id', id)
    if (e2) { addToast('Erro ao carregar tarefas.', 'error'); return }

    setCurrentId(prop.id)
    setLeadName(prop.lead_name || '')
    setProjectName(prop.project_name || '')
    setStartDate(prop.start_date || '')
    setTasks(
      (propTasks || []).map(t => {
        const col = collaborators.find(c => c.id === t.collaborator_id)
        return {
          _key: t.id,
          collaborator_id: t.collaborator_id || '',
          collaborator_hourly_rate: col?.hourly_rate || 0,
          description: t.description || '',
          estimated_hours: t.estimated_hours ?? '',
          allocation_percentage: t.allocation_percentage ?? 100,
          calculated_cost: t.calculated_cost ?? 0,
        }
      })
    )
    setMarkupPct(prop.markup_percentage != null ? String(prop.markup_percentage) : '')
    setFinalPrice(prop.final_price != null ? String(prop.final_price) : '')
    setTotalCost(prop.total_cost || 0)
    setTotalHours(prop.total_hours || 0)
    setDeliveryDate(prop.delivery_date ? parseDateInput(prop.delivery_date) : null)
    setMarginValue(prop.profit_margin_value || 0)
    setMarginPct(prop.profit_margin_percentage || 0)
    setCalcDone(true)
  }

  // ─── New proposal ─────────────────────────────────────────────────────────────
  function newProposal() {
    setCurrentId(null)
    setLeadName('')
    setProjectName('')
    setTasks([emptyTask()])
    setStartDate('')
    setCalcDone(false)
    setDeliveryDate(null)
    setTotalHours(0)
    setTotalCost(0)
    setMarkupPct('')
    setFinalPrice('')
    setMarginValue(0)
    setMarginPct(0)
    setPricingMode('markup')
  }

  // ─── Task helpers ────────────────────────────────────────────────────────────
  function addTask() {
    if (tasks.length >= MAX_TASKS) return
    setTasks(prev => [...prev, emptyTask()])
  }

  function removeTask(key) {
    setTasks(prev => prev.filter(t => t._key !== key))
  }

  function updateTask(key, field, value) {
    setTasks(prev => prev.map(t => {
      if (t._key !== key) return t
      const updated = { ...t, [field]: value }

      if (field === 'collaborator_id') {
        const col = collaborators.find(c => c.id === value)
        updated.collaborator_hourly_rate = col?.hourly_rate || 0
      }

      // Recalculate cost live when hours or collaborator changes
      const hours = parseFloat(field === 'estimated_hours' ? value : updated.estimated_hours) || 0
      const rate = field === 'collaborator_id'
        ? (collaborators.find(c => c.id === value)?.hourly_rate || 0)
        : updated.collaborator_hourly_rate
      updated.calculated_cost = hours * rate

      return updated
    }))
  }

  // Derived totals (always live for display)
  const liveTotalHours = tasks.reduce((s, t) => s + (parseFloat(t.estimated_hours) || 0), 0)
  const liveTotalCost = tasks.reduce((s, t) => s + (t.calculated_cost || 0), 0)

  // ─── ORÇAR ───────────────────────────────────────────────────────────────────
  function handleOrcar() {
    const cost = liveTotalCost
    const hours = liveTotalHours

    // Deadline calc
    let maxDate = null
    if (startDate) {
      const start = parseDateInput(startDate)
      tasks.forEach(t => {
        const h = parseFloat(t.estimated_hours) || 0
        const alloc = parseFloat(t.allocation_percentage) || 100
        if (h <= 0) return
        const days = h / (8 * (alloc / 100))
        const end = addWorkingDays(start, days)
        if (!maxDate || end > maxDate) maxDate = end
      })
    }

    // Budget calc
    let newFinalPrice = parseFloat(finalPrice) || 0
    let newMarkup = parseFloat(markupPct) || 0

    if (pricingMode === 'markup') {
      newFinalPrice = cost * (1 + newMarkup / 100)
    } else {
      // mode === 'final'
      newMarkup = cost > 0 ? ((newFinalPrice - cost) / cost) * 100 : 0
    }

    const newMarginValue = newFinalPrice - cost
    const newMarginPct = newFinalPrice > 0 ? (newMarginValue / newFinalPrice) * 100 : 0

    setTotalHours(hours)
    setTotalCost(cost)
    setDeliveryDate(maxDate)
    setFinalPrice(newFinalPrice.toFixed(2))
    setMarkupPct(newMarkup.toFixed(4))
    setMarginValue(newMarginValue)
    setMarginPct(newMarginPct)
    setCalcDone(true)
  }

  // ─── SALVAR ───────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!leadName.trim()) { addToast('Informe o nome do lead.', 'error'); return }
    if (!projectName.trim()) { addToast('Informe o nome do projeto.', 'error'); return }

    setSaving(true)

    const proposalPayload = {
      lead_name: leadName.trim(),
      project_name: projectName.trim(),
      start_date: startDate || null,
      delivery_date: deliveryDate
        ? `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, '0')}-${String(deliveryDate.getDate()).padStart(2, '0')}`
        : null,
      total_hours: totalHours,
      total_cost: totalCost,
      markup_percentage: parseFloat(markupPct) || 0,
      final_price: parseFloat(finalPrice) || 0,
      profit_margin_value: marginValue,
      profit_margin_percentage: marginPct,
      created_by: currentUser.id,
    }

    let propId = currentId
    let saveError = null

    if (currentId) {
      const { error } = await supabase
        .from('proposals')
        .update(proposalPayload)
        .eq('id', currentId)
      saveError = error
    } else {
      const { data, error } = await supabase
        .from('proposals')
        .insert(proposalPayload)
        .select('id')
        .single()
      saveError = error
      if (!error) propId = data.id
    }

    if (saveError) {
      addToast('Erro ao salvar proposta: ' + saveError.message, 'error')
      setSaving(false)
      return
    }

    // Delete existing tasks and reinsert
    await supabase.from('proposal_tasks').delete().eq('proposal_id', propId)

    const taskRows = tasks.map(t => ({
      proposal_id: propId,
      collaborator_id: t.collaborator_id || null,
      description: t.description,
      estimated_hours: parseFloat(t.estimated_hours) || 0,
      allocation_percentage: parseFloat(t.allocation_percentage) || 100,
      calculated_cost: t.calculated_cost || 0,
    }))

    if (taskRows.length > 0) {
      const { error: taskError } = await supabase.from('proposal_tasks').insert(taskRows)
      if (taskError) {
        addToast('Erro ao salvar tarefas: ' + taskError.message, 'error')
        setSaving(false)
        return
      }
    }

    setCurrentId(propId)
    addToast('Proposta salva com sucesso!', 'success')
    loadProposals()
    setSaving(false)
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="propostas-page">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <h1 className="page-title">Propostas Comerciais</h1>
        <p className="page-subtitle">Elabore e salve orçamentos para novos projetos</p>
      </div>

      {/* ── Selector bar ── */}
      <div className="propostas-selector card">
        <div className="propostas-selector-left">
          <FileText size={16} color="var(--color-primary)" />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Proposta:</span>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <select
              className="form-select propostas-select"
              value={currentId || ''}
              onChange={e => {
                const val = e.target.value
                if (val) loadProposal(val)
                else newProposal()
              }}
            >
              <option value="">— Nova Proposta —</option>
              {savedProposals.map(p => (
                <option key={p.id} value={p.id}>
                  {p.lead_name} — {p.project_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={newProposal}>
          <Plus size={14} /> Nova Proposta
        </button>
      </div>

      {/* ── A) Identificação ── */}
      <div className="card propostas-section">
        <h2 className="propostas-section-title">
          <Briefcase size={15} /> Identificação
        </h2>
        <div className="propostas-ident-grid">
          <div className="form-group">
            <label className="form-label">Nome do Lead</label>
            <input
              className="form-input"
              type="text"
              placeholder="Ex: João Silva"
              value={leadName}
              onChange={e => setLeadName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Nome do Projeto</label>
            <input
              className="form-input"
              type="text"
              placeholder="Ex: Residência Alto da Boa Vista"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── B) Tarefas ── */}
      <div className="card propostas-section">
        <div className="propostas-section-header">
          <h2 className="propostas-section-title">
            <Calculator size={15} /> Tarefas
          </h2>
          <span className="propostas-task-count">{tasks.length}/{MAX_TASKS}</span>
        </div>

        <div className="propostas-tasks-wrapper">
          <div className="propostas-tasks-header">
            <span>Colaborador</span>
            <span>Descrição</span>
            <span style={{ textAlign: 'right' }}>Horas Est.</span>
            <span style={{ textAlign: 'right' }}>Alocação (%)</span>
            <span style={{ textAlign: 'right' }}>Custo</span>
            <span />
          </div>

          {tasks.map((task, idx) => (
            <div key={task._key} className="propostas-task-row">
              <select
                className="form-select"
                value={task.collaborator_id}
                onChange={e => updateTask(task._key, 'collaborator_id', e.target.value)}
              >
                <option value="">— Selecionar —</option>
                {collaborators.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <input
                className="form-input"
                type="text"
                placeholder="Descrição da tarefa"
                value={task.description}
                onChange={e => updateTask(task._key, 'description', e.target.value)}
              />

              <input
                className="form-input"
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={task.estimated_hours}
                onChange={e => updateTask(task._key, 'estimated_hours', e.target.value)}
                style={{ textAlign: 'right' }}
              />

              <input
                className="form-input"
                type="number"
                min="1"
                max="100"
                step="1"
                placeholder="100"
                value={task.allocation_percentage}
                onChange={e => updateTask(task._key, 'allocation_percentage', e.target.value)}
                style={{ textAlign: 'right' }}
              />

              <div className="propostas-cost-cell">
                {formatCurrency(task.calculated_cost)}
              </div>

              <button
                className="propostas-task-delete"
                onClick={() => removeTask(task._key)}
                title="Remover tarefa"
                disabled={tasks.length === 1}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Footer totals */}
          <div className="propostas-task-footer">
            <span className="propostas-footer-label">Totais</span>
            <span />
            <span className="propostas-footer-total">{liveTotalHours.toFixed(1)}h</span>
            <span />
            <span className="propostas-footer-total propostas-footer-cost">
              {formatCurrency(liveTotalCost)}
            </span>
            <span />
          </div>
        </div>

        {tasks.length < MAX_TASKS && (
          <button className="btn btn-ghost btn-sm propostas-add-task" onClick={addTask}>
            <Plus size={14} /> Adicionar Tarefa
          </button>
        )}
      </div>

      {/* ── C) Prazo ── */}
      <div className="card propostas-section">
        <h2 className="propostas-section-title">
          <FileText size={15} /> Prazo
        </h2>
        <div className="propostas-prazo-grid">
          <div className="form-group">
            <label className="form-label">Data Estimada de Início</label>
            <input
              className="form-input"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Data Prevista de Entrega</label>
            <div className="propostas-readonly-field">
              {calcDone
                ? (deliveryDate ? formatDate(deliveryDate) : 'Sem data calculada')
                : <span className="propostas-placeholder">Clique em "Orçar" para calcular</span>
              }
            </div>
            {calcDone && deliveryDate && (
              <span className="propostas-field-hint">Dias úteis (seg–sex), sem feriados.</span>
            )}
          </div>
        </div>
      </div>

      {/* ── D) Orçamento ── */}
      <div className="card propostas-section">
        <div className="propostas-section-header">
          <h2 className="propostas-section-title">
            <Calculator size={15} /> Orçamento
          </h2>
        </div>

        {/* Custo base display */}
        <div className="propostas-cost-summary">
          <span className="propostas-cost-label">Custo Total das Tarefas</span>
          <span className="propostas-cost-value">{formatCurrency(liveTotalCost)}</span>
        </div>

        {/* Mode toggle */}
        <div className="propostas-mode-toggle">
          <label className={`propostas-mode-option ${pricingMode === 'markup' ? 'active' : ''}`}>
            <input
              type="radio"
              name="pricingMode"
              value="markup"
              checked={pricingMode === 'markup'}
              onChange={() => setPricingMode('markup')}
            />
            Orçar por Markup
          </label>
          <label className={`propostas-mode-option ${pricingMode === 'final' ? 'active' : ''}`}>
            <input
              type="radio"
              name="pricingMode"
              value="final"
              checked={pricingMode === 'final'}
              onChange={() => setPricingMode('final')}
            />
            Orçar por Preço Final
          </label>
        </div>

        <div className="propostas-budget-grid">
          <div className="form-group">
            <label className="form-label">
              Markup (%)
              {pricingMode === 'final' && calcDone && (
                <span className="propostas-calc-badge">calculado</span>
              )}
            </label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={markupPct}
              onChange={e => setMarkupPct(e.target.value)}
              readOnly={pricingMode === 'final' && calcDone}
              style={{ background: pricingMode === 'final' && calcDone ? 'var(--color-gray-light)' : undefined }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Preço Final (R$)
              {pricingMode === 'markup' && calcDone && (
                <span className="propostas-calc-badge">calculado</span>
              )}
            </label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={finalPrice}
              onChange={e => setFinalPrice(e.target.value)}
              readOnly={pricingMode === 'markup' && calcDone}
              style={{ background: pricingMode === 'markup' && calcDone ? 'var(--color-gray-light)' : undefined }}
            />
          </div>
        </div>

        {/* Margin highlight */}
        {calcDone && (
          <div className="propostas-margin-box">
            <div className="propostas-margin-item">
              <span className="propostas-margin-label">Margem (R$)</span>
              <span className={`propostas-margin-value ${marginValue >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(marginValue)}
              </span>
            </div>
            <div className="propostas-margin-divider" />
            <div className="propostas-margin-item">
              <span className="propostas-margin-label">Margem (%)</span>
              <span className={`propostas-margin-value ${marginPct >= 0 ? 'positive' : 'negative'}`}>
                {formatPct(marginPct)}
              </span>
            </div>
          </div>
        )}

        {/* Orçar button */}
        <div className="propostas-orcar-wrapper">
          <button className="btn btn-secondary propostas-orcar-btn" onClick={handleOrcar}>
            <Calculator size={16} />
            Orçar
          </button>
        </div>
      </div>

      {/* ── Salvar ── */}
      <div className="propostas-save-bar">
        <button
          className="btn btn-primary propostas-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={16} />
          {saving ? 'Salvando...' : currentId ? 'Atualizar Proposta' : 'Salvar Proposta'}
        </button>
      </div>
    </div>
  )
}
