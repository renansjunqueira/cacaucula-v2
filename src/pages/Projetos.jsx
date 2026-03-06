import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, FolderOpen, Pencil, Check, X } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'

export default function Projetos() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '' })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const { toasts, addToast, removeToast } = useToast()

  useEffect(() => { loadProjects() }, [])

  async function loadProjects() {
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      addToast('Erro ao carregar projetos: ' + error.message, 'error')
    } else {
      setProjects(data || [])
    }
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('projects')
      .insert({ name: form.name.trim(), is_active: true })
    if (error) {
      addToast('Erro ao criar projeto: ' + error.message, 'error')
    } else {
      addToast('Projeto criado com sucesso!', 'success')
      setForm({ name: '' })
      loadProjects()
    }
    setSaving(false)
  }

  async function toggleActive(id, currentValue) {
    const { error } = await supabase
      .from('projects')
      .update({ is_active: !currentValue })
      .eq('id', id)
    if (error) {
      addToast('Erro ao atualizar status: ' + error.message, 'error')
    } else {
      setProjects(prev =>
        prev.map(p => p.id === id ? { ...p, is_active: !currentValue } : p)
      )
    }
  }

  function startEdit(project) {
    setEditingId(project.id)
    setEditForm({ name: project.name, is_active: project.is_active })
  }

  async function saveEdit(id) {
    const { error } = await supabase
      .from('projects')
      .update({ name: editForm.name })
      .eq('id', id)
    if (error) {
      addToast('Erro ao salvar: ' + error.message, 'error')
    } else {
      addToast('Projeto atualizado!', 'success')
      setEditingId(null)
      loadProjects()
    }
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <h1 className="page-title">Projetos</h1>
        <p className="page-subtitle">Gerencie os projetos disponíveis para registro de horas</p>
      </div>

      {/* Form */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, color: 'var(--color-text-primary)' }}>
          Novo projeto
        </h2>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label">Nome do projeto</label>
              <input
                className="form-input"
                type="text"
                placeholder="Ex: Residência Silva"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              <Plus size={16} />
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={40} />
            <p style={{ marginTop: 8, fontWeight: 500 }}>Nenhum projeto cadastrado</p>
            <p style={{ fontSize: 13 }}>Adicione o primeiro projeto acima.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome do Projeto</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id}>
                    <td>
                      {editingId === project.id ? (
                        <input
                          className="form-input"
                          value={editForm.name}
                          onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                          style={{ maxWidth: 300 }}
                        />
                      ) : (
                        <span style={{ fontWeight: 500 }}>{project.name}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={project.is_active}
                            onChange={() => toggleActive(project.id, project.is_active)}
                          />
                          <span className="toggle-slider" />
                        </label>
                        <span style={{
                          fontSize: 12, fontWeight: 500,
                          color: project.is_active ? 'var(--color-success)' : 'var(--color-gray-medium)'
                        }}>
                          {project.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {editingId === project.id ? (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => saveEdit(project.id)}
                          >
                            <Check size={14} /> Salvar
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => startEdit(project)}
                        >
                          <Pencil size={14} /> Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
