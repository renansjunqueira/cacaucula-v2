import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [collaborator, setCollaborator] = useState(null)

  async function fetchCollaborator(userId) {
    const { data, error } = await supabase
      .from('collaborators')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching collaborator:', error)
      return null
    }
    return data
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const col = await fetchCollaborator(session.user.id)
        setCollaborator(col)
      } else {
        setCollaborator(null)
      }
    })

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          const col = await fetchCollaborator(session.user.id)
          setCollaborator(col)
        } else {
          setCollaborator(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // Check if collaborator is active
    const col = await fetchCollaborator(data.user.id)
    if (col && !col.is_active) {
      await supabase.auth.signOut()
      throw new Error('Seu acesso está inativo. Entre em contato com o administrador.')
    }

    return data
  }

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })
    if (error) throw error
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isAdmin = collaborator?.role === 'Admin'
  const isLoading = session === undefined

  return (
    <AuthContext.Provider value={{
      session,
      collaborator,
      isAdmin,
      isLoading,
      signIn,
      signUp,
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
