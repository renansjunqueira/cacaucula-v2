import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { User, Mail, Lock, Save } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'

export default function Configuracoes() {
  const { collaborator, refreshCollaborator } = useAuth()

  const [nameForm, setNameForm] = useState({ name: collaborator?.name || '' })
  const [emailForm, setEmailForm] = useState({ email: '' })
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' })
  const [savingName, setSavingName] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const { toasts, addToast, removeToast } = useToast()

  async function handleSaveName(e) {
    e.preventDefault()
    if (!nameForm.name.trim()) return
    setSavingName(true)
    const { error } = await supabase
      .from('collaborators')
      .update({ name: nameForm.name.trim() })
      .eq('id', collaborator.id)
    if (error) {
      addToast('Erro ao salvar nome: ' + error.message, 'error')
    } else {
      await refreshCollaborator()
      addToast('Nome atualizado!', 'success')
    }
    setSavingName(false)
  }

  async function handleSaveEmail(e) {
    e.preventDefault()
    if (!emailForm.email.trim()) return
    setSavingEmail(true)
    const { error } = await supabase.auth.updateUser({ email: emailForm.email.trim() })
    if (error) {
      addToast('Erro ao atualizar e-mail: ' + error.message, 'error')
    } else {
      addToast('E-mail de confirmação enviado para o novo endereço.', 'success')
      setEmailForm({ email: '' })
    }
    setSavingEmail(false)
  }

  async function handleSavePw(e) {
    e.preventDefault()
    if (pwForm.password.length < 6) {
      addToast('A senha deve ter pelo menos 6 caracteres.', 'warning')
      return
    }
    if (pwForm.password !== pwForm.confirm) {
      addToast('As senhas não coincidem.', 'error')
      return
    }
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: pwForm.password })
    if (error) {
      addToast('Erro ao atualizar senha: ' + error.message, 'error')
    } else {
      addToast('Senha atualizada com sucesso!', 'success')
      setPwForm({ password: '', confirm: '' })
    }
    setSavingPw(false)
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Gerencie seus dados pessoais e acesso</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>

        {/* Nome */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 34, height: 34, background: 'rgba(198,83,72,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="var(--color-primary)" />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Nome</h2>
          </div>
          <form onSubmit={handleSaveName} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Nome completo</label>
              <input
                className="form-input"
                type="text"
                value={nameForm.name}
                onChange={e => setNameForm({ name: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingName}>
              <Save size={14} />
              {savingName ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        </div>

        {/* E-mail */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 34, height: 34, background: 'rgba(231,177,91,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={16} color="var(--color-secondary)" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>E-mail</h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                Atual: <strong>{collaborator?.name ? '' : '—'}</strong>
              </p>
            </div>
          </div>
          <form onSubmit={handleSaveEmail} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Novo e-mail</label>
              <input
                className="form-input"
                type="email"
                placeholder="novo@email.com"
                value={emailForm.email}
                onChange={e => setEmailForm({ email: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingEmail}>
              <Save size={14} />
              {savingEmail ? 'Enviando...' : 'Atualizar'}
            </button>
          </form>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 10 }}>
            Um link de confirmação será enviado ao novo endereço.
          </p>
        </div>

        {/* Senha */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 34, height: 34, background: 'rgba(217,179,201,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={16} color="var(--color-primary)" />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Senha</h2>
          </div>
          <form onSubmit={handleSavePw} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Nova senha</label>
              <input
                className="form-input"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={pwForm.password}
                onChange={e => setPwForm(p => ({ ...p, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar nova senha</label>
              <input
                className="form-input"
                type="password"
                placeholder="Repita a senha"
                value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={savingPw}>
                <Save size={14} />
                {savingPw ? 'Salvando...' : 'Alterar senha'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
