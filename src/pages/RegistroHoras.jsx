import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Trash2, Save, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'
import '../styles/RegistroHoras.css'

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function isWeekend(year, month, day) {
  const d = new Date(year, month, day).getDay()
  return d === 0 || d === 6
}

function getDayLabel(year, month, day) {
  const labels = ['D','S','T','Q','Q','S','S']
  return labels[new Date(year, month, day).getDay()]
}

const emptyRow = () => ({
  tempId: Math.random().toString(36).slice(2),
  collaborator_id: '',
  project_id: '',
  hours: {}, // { day: hours }
  existingIds: {}, // { day: uuid } — for updates
})

export default function RegistroHoras() {
  const { isAdmin, collaborator: currentUser } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [collaborators, setCollaborators] = useState([])
  const [projects, setProjects] = useState([])
  const [rows, setRows] = useState([emptyRow()])
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const { toasts, addToast, removeToast } = useToast()

  const daysInMonth = getDaysInMonth(year, month)
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Load collaborators and projects
  useEffect(() => {
    async function load() {
      if (!isAdmin) {
        setCollaborators([{ id: currentUser.id, name: currentUser.name }])
        const { data: projs } = await supabase.from('projects').select('id, name').eq('is_active', true).order('name')
        setProjects(projs || [])
        return
      }
      const [{ data: cols }, { data: projs }] = await Promise.all([
        supabase.from('collaborators').select('id, name').eq('is_active', true).order('name'),
        supabase.from('projects').select('id, name').eq('is_active', true).order('name'),
      ])
      setCollaborators(cols || [])
      setProjects(projs || [])
    }
    load()
  }, [isAdmin, currentUser])

  // Load time_logs for current month/year
  const loadTimeLogs = useCallback(async () => {
    setLoadingData(true)
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

    let query = supabase
      .from('time_logs')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('created_at')

    if (!isAdmin) query = query.eq('collaborator_id', currentUser.id)

    const { data, error } = await query
    if (error) {
      addToast('Erro ao carregar registros: ' + error.message, 'error')
      setLoadingData(false)
      return
    }

    // Group logs into rows by (collaborator_id, project_id)
    const rowMap = {}
    for (const log of data || []) {
      const key = `${log.collaborator_id}__${log.project_id}`
      if (!rowMap[key]) {
        rowMap[key] = {
          tempId: key,
          collaborator_id: log.collaborator_id,
          project_id: log.project_id,
          hours: {},
          existingIds: {},
        }
      }
      const day = parseInt(log.date.split('-')[2], 10)
      rowMap[key].hours[day] = String(log.logged_hours)
      rowMap[key].existingIds[day] = log.id
    }

    const loadedRows = Object.values(rowMap)
    const fallbackRow = isAdmin ? emptyRow() : { ...emptyRow(), collaborator_id: currentUser.id }
    setRows(loadedRows.length > 0 ? loadedRows : [fallbackRow])
    setLoadingData(false)
  }, [year, month, daysInMonth, isAdmin, currentUser])

  useEffect(() => { loadTimeLogs() }, [loadTimeLogs])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  function addRow() {
    const newRow = isAdmin ? emptyRow() : { ...emptyRow(), collaborator_id: currentUser.id }
    setRows(prev => [...prev, newRow])
  }

  function removeRow(tempId) {
    setRows(prev => prev.filter(r => r.tempId !== tempId))
  }

  function updateRowField(tempId, field, value) {
    setRows(prev => prev.map(r =>
      r.tempId === tempId ? { ...r, [field]: value } : r
    ))
  }

  function updateHours(tempId, day, value) {
    setRows(prev => prev.map(r =>
      r.tempId === tempId
        ? { ...r, hours: { ...r.hours, [day]: value } }
        : r
    ))
  }

  // Validate: check if any collaborator exceeds 8h in a day
  function validateOvertime() {
    const warnings = []
    // Sum hours per collaborator per day
    const dailyTotals = {} // { colId: { day: total } }
    for (const row of rows) {
      if (!row.collaborator_id) continue
      if (!dailyTotals[row.collaborator_id]) dailyTotals[row.collaborator_id] = {}
      for (const [day, val] of Object.entries(row.hours)) {
        const h = parseFloat(val) || 0
        if (h <= 0) continue
        dailyTotals[row.collaborator_id][day] = (dailyTotals[row.collaborator_id][day] || 0) + h
      }
    }
    for (const [colId, days] of Object.entries(dailyTotals)) {
      for (const [day, total] of Object.entries(days)) {
        if (total > 8) {
          const col = collaborators.find(c => c.id === colId)
          warnings.push(`${col?.name || colId}: ${total}h em dia ${day}/${String(month + 1).padStart(2, '0')}`)
        }
      }
    }
    return warnings
  }

  async function handleSave() {
    setSaving(true)

    const warnings = validateOvertime()
    if (warnings.length > 0) {
      addToast(
        `⚠️ ATENÇÃO: Horas acima de 8h/dia detectadas:\n${warnings.join('\n')}\n\nOs dados serão salvos mesmo assim.`,
        'warning',
        8000
      )
    }

    const inserts = []
    const updates = [] // { id, logged_hours }
    const deletes = []

    for (const row of rows) {
      if (!row.collaborator_id || !row.project_id) continue

      for (const day of dayNumbers) {
        const val = row.hours[day]
        const h = parseFloat(val)
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

        if (h > 0) {
          if (row.existingIds[day]) {
            // Update existing record
            updates.push({ id: row.existingIds[day], logged_hours: h })
          } else {
            // New record — no id, let DB generate it
            inserts.push({
              collaborator_id: row.collaborator_id,
              project_id: row.project_id,
              date: dateStr,
              logged_hours: h,
            })
          }
        } else if (row.existingIds[day]) {
          // Cleared an existing entry → delete it
          deletes.push(row.existingIds[day])
        }
      }
    }

    try {
      if (inserts.length > 0) {
        const { error } = await supabase.from('time_logs').insert(inserts)
        if (error) throw error
      }
      // Update each existing record individually
      for (const upd of updates) {
        const { error } = await supabase
          .from('time_logs')
          .update({ logged_hours: upd.logged_hours })
          .eq('id', upd.id)
        if (error) throw error
      }
      if (deletes.length > 0) {
        const { error } = await supabase.from('time_logs').delete().in('id', deletes)
        if (error) throw error
      }
      addToast('Registros salvos com sucesso!', 'success')
      await loadTimeLogs()
    } catch (err) {
      addToast('Erro ao salvar: ' + err.message, 'error')
    }
    setSaving(false)
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Registro de Horas</h1>
          <p className="page-subtitle">Lance as horas trabalhadas por projeto e colaborador</p>
        </div>

        {/* Month selector */}
        <div className="month-selector">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={prevMonth}>
            <ChevronLeft size={16} />
          </button>
          <span className="month-label">
            {MONTH_NAMES[month]} {year}
          </span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={nextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Matrix table */}
      <div className="card registro-card">
        {loadingData ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            <div className="registro-table-wrapper">
              <table className="registro-table">
                <thead>
                  <tr>
                    <th className="col-colaborador">Colaborador</th>
                    <th className="col-projeto">Projeto</th>
                    {dayNumbers.map(day => (
                      <th
                        key={day}
                        className={`col-day ${isWeekend(year, month, day) ? 'weekend' : ''}`}
                      >
                        <div className="day-header-day-num">{day}</div>
                        <div className="day-header-day-label">{getDayLabel(year, month, day)}</div>
                      </th>
                    ))}
                    <th className="col-total">Total</th>
                    <th className="col-action"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const rowTotal = dayNumbers.reduce((sum, d) => sum + (parseFloat(row.hours[d]) || 0), 0)
                    return (
                      <tr key={row.tempId}>
                        <td className="col-colaborador">
                          <select
                            className="form-select cell-select"
                            value={row.collaborator_id}
                            onChange={e => updateRowField(row.tempId, 'collaborator_id', e.target.value)}
                            disabled={!isAdmin}
                          >
                            <option value="">Selecione...</option>
                            {collaborators.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="col-projeto">
                          <select
                            className="form-select cell-select"
                            value={row.project_id}
                            onChange={e => updateRowField(row.tempId, 'project_id', e.target.value)}
                          >
                            <option value="">Selecione...</option>
                            {projects.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        {dayNumbers.map(day => (
                          <td
                            key={day}
                            className={`col-day ${isWeekend(year, month, day) ? 'weekend' : ''}`}
                          >
                            <input
                              type="number"
                              className="hours-input"
                              min="0"
                              max="24"
                              step="0.5"
                              placeholder=""
                              value={row.hours[day] || ''}
                              onChange={e => updateHours(row.tempId, day, e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="col-total">
                          <span className="row-total">
                            {rowTotal > 0 ? rowTotal.toFixed(1) : '—'}
                          </span>
                        </td>
                        <td className="col-action">
                          <button
                            className="btn btn-sm btn-ghost btn-icon"
                            onClick={() => removeRow(row.tempId)}
                            style={{ color: 'var(--color-danger)' }}
                            title="Remover linha"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="registro-footer">
              <button className="btn btn-ghost btn-sm" onClick={addRow}>
                <Plus size={14} />
                Adicionar linha
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={16} />
                {saving ? 'Salvando...' : 'Salvar registros'}
              </button>
            </div>

            <div className="registro-warning-info">
              <AlertTriangle size={13} color="var(--color-secondary)" />
              Valores acima de 8h/dia por colaborador gerarão um aviso ao salvar, mas serão aceitos.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
