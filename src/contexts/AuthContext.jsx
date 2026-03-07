import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [collaborator, setCollaborator] = useState(null)
  const [isLoading, setIsLoading] = useState(true) // true until first auth cycle completes
  const initializedRef = useRef(false)

  async function fetchCollaborator(userId) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error) return data

      // Retry on abort (happens during password recovery / magic link sessions)
      if (error.message?.includes('AbortError') || error.name === 'AbortError') {
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)))
        continue
      }

      console.error('Error fetching collaborator:', error)
      return null
    }
    return null
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)

        if (session?.user) {
          // Don't re-fetch on USER_UPDATED/TOKEN_REFRESHED — password change or token
          // refresh doesn't affect the collaborator record, and re-fetching here
          // can cause AbortErrors that set collaborator=null and redirect to login
          if (event !== 'USER_UPDATED' && event !== 'TOKEN_REFRESHED') {
            const col = await fetchCollaborator(session.user.id)
            setCollaborator(col)
          }
        } else {
          setCollaborator(null)
        }

        // Mark initial load as complete after first event
        if (!initializedRef.current) {
          initializedRef.current = true
          setIsLoading(false)
        }

        if (event === 'PASSWORD_RECOVERY') {
          window.location.href = '/configuracoes'
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    const col = await fetchCollaborator(data.user.id)
    if (col && !col.is_active) {
      await supabase.auth.signOut()
      throw new Error('Seu acesso está inativo. Entre em contato com o administrador.')
    }

    // Pre-set state so ProtectedRoute doesn't see null collaborator
    // before onAuthStateChange fires its async fetchCollaborator
    setSession(data.session)
    setCollaborator(col)

    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isAdmin = collaborator?.role === 'Admin'

  return (
    <AuthContext.Provider value={{
      session,
      collaborator,
      isAdmin,
      isLoading,
      signIn,
      signOut,
      refreshCollaborator: async () => {
        if (session?.user) {
          const col = await fetchCollaborator(session.user.id)
          setCollaborator(col)
        }
      }
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
