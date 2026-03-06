import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Trash2, AlertTriangle } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'
import { useAuth } from '../contexts/AuthContext'

const ROLES = ['Admin', 'Arquiteta', 'Designer', 'Estagiária']

export default function Equipe() {
  const { collaborator: currentUser } = useAuth()
  const [collaborators, setCollaborators] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { toasts, addToast, removeToast } = useToast()

  useEffect(() => { loadCollaborators() }, [])

  async function loadCollaborators() {
    setLoading(true)
    const { data, error } = await supabase
      .from('collaborators')
      .select('*')
      .order('name')
    if (error) {
      addToast('Erro ao carregar equipe: ' + error.message, 'error')
    } else {
      setCollaborators(data || [])
    }
    setLoading(false)
  }

  async function updateField(id, field, value) {
    const { error } = await supabase
      .from('collaborators')
      .update({ [field]: value })
      .eq('id', id)
    if (error) {
      addToast('Erro ao atualizar: ' + error.message, 'error')
    } else {
      setCollaborators(prev =>
        prev.map(c => c.id === id ? { ...c, [field]: value } : c)
      )
      if (field === 'is_active') {
        addToast(value ? 'Colaborador ativado.' : 'Colaborador inativado.', 'success')
      }
    }
  }

  async function handleDelete(id) {
    setDeletingId(id)
    // Delete from collaborators table — cascades to time_logs via FK ON DELETE CASCADE
    const { error } = await supabase
      .from('collaborators')
      .delete()
      .eq('id', id)
    if (error) {
      addToast('Erro ao excluir: ' + error.message, 'error')
    } else {
      addToast('Colaborador excluído.', 'success')
      setCollaborators(prev => prev.filter(c => c.id !== id))
    }
    setDeletingId(null)
    setConfirmDelete(null)
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
              <AlertTriangle size={24} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Excluir colaborador</h3>
                <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Tem certeza que deseja excluir <strong>{confirmDelete.name}</strong>?
                  Todos os registros de horas deste colaborador serão removidos permanentemente.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={deletingId === confirmDelete.id}
              >
                {deletingId === confirmDelete.id ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <h1 className="page-title">Equipe</h1>
        <p className="page-subtitle">Gerencie os colaboradores e seus acessos ao sistema</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : collaborators.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <p style={{ marginTop: 8, fontWeight: 500 }}>Nenhum colaborador cadastrado</p>
            <p style={{ fontSize: 13 }}>Os colaboradores aparecerão aqui após se cadastrarem.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Função</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {collaborators.map(col => (
                  <tr key={col.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 34, height: 34, minWidth: 34,
                          background: 'var(--color-tertiary)',
                          borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700,
                          color: 'var(--color-primary)'
                        }}>
                          {col.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 500, fontSize: 14 }}>{col.name}</p>
                          {col.id === currentUser?.id && (
                            <span className="badge badge-primary" style={{ fontSize: 10 }}>você</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={col.role}
                        onChange={e => updateField(col.id, 'role', e.target.value)}
                        style={{ maxWidth: 160, padding: '6px 32px 6px 10px' }}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={col.is_active}
                            onChange={e => updateField(col.id, 'is_active', e.target.checked)}
                          />
                          <span className="toggle-slider" />
                        </label>
                        <span style={{
                          fontSize: 12, fontWeight: 500,
                          color: col.is_active ? 'var(--color-success)' : 'var(--color-gray-medium)'
                        }}>
                          {col.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setConfirmDelete(col)}
                        disabled={col.id === currentUser?.id}
                        title={col.id === currentUser?.id ? 'Você não pode excluir a si mesmo' : 'Excluir colaborador'}
                        style={{
                          color: col.id === currentUser?.id ? 'var(--color-gray-border)' : 'var(--color-danger)',
                          borderColor: col.id === currentUser?.id ? 'var(--color-gray-border)' : 'rgba(229,62,62,0.2)',
                        }}
                      >
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{
        marginTop: 16,
        padding: '12px 16px',
        background: 'rgba(231,177,91,0.1)',
        borderRadius: 'var(--border-radius-sm)',
        border: '1px solid rgba(231,177,91,0.3)',
        fontSize: 13,
        color: 'var(--color-text-secondary)',
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        <AlertTriangle size={14} color="var(--color-secondary)" />
        Colaboradores inativos não conseguem acessar o sistema e não aparecem no seletor de Registro de Horas.
      </div>
    </div>
  )
}
