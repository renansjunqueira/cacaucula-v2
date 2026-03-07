import { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  FolderOpen, Users, Clock, BarChart2, Settings,
  LogOut, Menu, X, ChevronRight, FileText, Kanban
} from 'lucide-react'
import '../styles/Layout.css'

const navItems = [
  { to: '/projetos',      label: 'Projetos',          icon: FolderOpen, adminOnly: true  },
  { to: '/equipe',        label: 'Equipe',             icon: Users,      adminOnly: true  },
  { to: '/propostas',    label: 'Propostas',          icon: FileText,   adminOnly: true  },
  { to: '/pipeline',     label: 'Pipeline',           icon: Kanban,     adminOnly: true  },
  { to: '/horas',         label: 'Registro de Horas',  icon: Clock,      adminOnly: false },
  { to: '/dashboard',     label: 'Dashboard',          icon: BarChart2,  adminOnly: false },
  { to: '/configuracoes', label: 'Configurações',       icon: Settings,   adminOnly: false },
]

export default function Layout() {
  const { collaborator, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    try {
      await signOut()
    } catch (_) {}
    navigate('/login', { replace: true })
  }

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <img
            src="/logo-cacau.jpeg"
            alt="Cacau Arquitetura"
            className="sidebar-logo"
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextElementSibling.style.display = 'flex'
            }}
          />
          <div className="sidebar-logo-fallback">C</div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={14} className="sidebar-nav-chevron" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {(collaborator?.name || 'U')[0].toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{collaborator?.name || 'Usuário'}</p>
              <p className="sidebar-user-role">{collaborator?.role || ''}</p>
            </div>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <button className="topbar-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <img
            src="/logo-cacau.jpeg"
            alt="Cacau Arquitetura"
            className="topbar-logo"
            onError={e => e.target.style.display = 'none'}
          />
          <div className="topbar-user-avatar">
            {(collaborator?.name || 'U')[0].toUpperCase()}
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
