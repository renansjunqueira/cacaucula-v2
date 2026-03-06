import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import '../styles/Login.css'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  function handleChange(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password)
        navigate('/projetos')
      } else {
        await signUp(form.email, form.password, form.name)
        setSuccessMsg('Conta criada! Verifique seu e-mail para confirmar o cadastro. Após confirmação, um administrador precisará ativar seu acesso.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img
            src="/logo-cacau.jpeg"
            alt="Cacaucula"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextElementSibling.style.display = 'flex'
            }}
          />
          <div className="login-logo-fallback">
            <span>C</span>
          </div>
        </div>

        <h1 className="login-title">
          {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
        </h1>
        <p className="login-subtitle">
          {mode === 'login'
            ? 'Acesse o sistema de registro de horas'
            : 'Preencha seus dados para solicitar acesso'}
        </p>

        {error && (
          <div className="login-alert login-alert-error">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="login-alert login-alert-success">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Nome completo</label>
              <input
                className="form-input"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Seu nome"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">E-mail corporativo</label>
            <input
              className="form-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div className="login-pw-wrapper">
              <input
                className="form-input"
                type={showPw ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPw(p => !p)}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : mode === 'login' ? (
              <><LogIn size={16} /> Entrar</>
            ) : (
              <><UserPlus size={16} /> Criar conta</>
            )}
          </button>
        </form>

        <div className="login-toggle-mode">
          {mode === 'login' ? (
            <>
              Não tem uma conta?{' '}
              <button onClick={() => { setMode('register'); setError(''); setSuccessMsg('') }}>
                Solicitar acesso
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button onClick={() => { setMode('login'); setError(''); setSuccessMsg('') }}>
                Fazer login
              </button>
            </>
          )}
        </div>
      </div>

      <div className="login-bg-art" />
    </div>
  )
}
