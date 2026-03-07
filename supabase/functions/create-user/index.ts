import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[create-user] No Authorization header')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    console.log('[create-user] URL present:', !!supabaseUrl, '| serviceKey present:', !!serviceRoleKey, '| anonKey present:', !!anonKey)

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: getUserError } = await callerClient.auth.getUser()
    console.log('[create-user] getUser:', user?.id ?? 'null', 'error:', getUserError?.message ?? 'none')

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: callerProfile, error: profileError } = await adminClient
      .from('collaborators')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    console.log('[create-user] profile:', JSON.stringify(callerProfile), 'error:', profileError?.message ?? 'none')

    if (!callerProfile || callerProfile.role !== 'Admin' || !callerProfile.is_active) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { email, password, name, role, is_active } = await req.json()
    console.log('[create-user] creating user:', email, name, role)

    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })

    console.log('[create-user] createUser result:', newUser?.user?.id ?? 'null', 'error:', createError?.message ?? 'none')

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { error: updateError } = await adminClient
      .from('collaborators')
      .update({ name, email, role: role || 'Usuário', is_active: is_active ?? true })
      .eq('id', newUser.user.id)

    console.log('[create-user] updateCollaborator error:', updateError?.message ?? 'none')

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, userId: newUser.user.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('[create-user] caught error:', err?.message, err?.stack)
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
