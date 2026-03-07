import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Projetos from './pages/Projetos'
import Equipe from './pages/Equipe'
import RegistroHoras from './pages/RegistroHoras'
import Dashboard from './pages/Dashboard'
import Configuracoes from './pages/Configuracoes'
import Propostas from './pages/Propostas'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Default redirect */}
            <Route index element={<Navigate to="/horas" replace />} />

            {/* Admin only */}
            <Route
              path="projetos"
              element={
                <ProtectedRoute adminOnly>
                  <Projetos />
                </ProtectedRoute>
              }
            />
            <Route
              path="equipe"
              element={
                <ProtectedRoute adminOnly>
                  <Equipe />
                </ProtectedRoute>
              }
            />
            <Route
              path="propostas"
              element={
                <ProtectedRoute adminOnly>
                  <Propostas />
                </ProtectedRoute>
              }
            />

            {/* All active users */}
            <Route path="horas" element={<RegistroHoras />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
