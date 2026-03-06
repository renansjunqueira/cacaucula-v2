import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file or Vercel Environment Variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin emails (defined in spec)
export const ADMIN_EMAILS = [
  'adm@cacau-arquitetura.com',
  'renan.junqueira.mendes@gmail.com',
]
