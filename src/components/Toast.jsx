import { AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react'

const icons = {
  success: <CheckCircle size={18} color="var(--color-success)" />,
  warning: <AlertTriangle size={18} color="var(--color-secondary)" />,
  error: <XCircle size={18} color="var(--color-danger)" />,
}

export function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function Toast({ id, message, type, onRemove }) {
  return (
    <div className={`toast toast-${type}`}>
      <div style={{ marginTop: 2 }}>{icons[type]}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
          {message}
        </p>
      </div>
      <button
        onClick={() => onRemove(id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-gray-medium)',
          padding: 2,
          marginTop: 1,
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}
