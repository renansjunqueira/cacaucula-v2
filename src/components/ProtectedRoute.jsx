import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children, adminOnly = false }) {
  const { session, collaborator, isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--color-gray-light)'
      }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (collaborator && !collaborator.is_active) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 16,
        background: 'var(--color-gray-light)',
        padding: 24
      }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '40px 32px',
          maxWidth: 420,
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Acesso pendente</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            Sua conta foi criada mas ainda está aguardando ativação pelo administrador. Entre em contato com a equipe.
          </p>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 24, width: '100%', justifyContent: 'center' }}
            onClick={() => window.location.href = '/login'}
          >
            Voltar ao login
          </button>
        </div>
      </div>
    )
  }

  if (adminOnly && !isAdmin) return <Navigate to="/horas" replace />

  return children
}
