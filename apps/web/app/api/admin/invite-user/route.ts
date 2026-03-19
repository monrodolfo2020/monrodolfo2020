import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Server-side user invitation using service_role key
// The client SDK cannot call auth.admin.* methods

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verify caller is authenticated and is an admin
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: caller } = await supabase
    .from('user_profiles')
    .select('role, mall_id')
    .eq('id', user.id)
    .single()

  if (!caller || !['super_admin', 'mall_admin'].includes(caller.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, full_name, role, employee_code, mall_id } = body

  if (!email || !full_name || !role || !mall_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Non-super-admins can only invite to their own mall
  if (caller.role !== 'super_admin' && caller.mall_id !== mall_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use the admin API via the service role Supabase client
  // This requires SUPABASE_SERVICE_ROLE_KEY in env
  const adminUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const adminKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const res = await fetch(`${adminUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        adminKey,
      'Authorization': `Bearer ${adminKey}`,
    },
    body: JSON.stringify({
      email,
      email_confirm: false,
      user_metadata: { full_name },
      app_metadata: {
        mall_id,
        role,
        employee_code: employee_code ?? null,
      },
    }),
  })

  const newUser = await res.json()

  if (!res.ok) {
    return NextResponse.json(
      { error: newUser.msg ?? newUser.message ?? 'Failed to create user' },
      { status: res.status },
    )
  }

  // Create the user_profiles row immediately
  const { error: profileError } = await supabase.from('user_profiles').upsert({
    id:            newUser.id,
    mall_id,
    full_name,
    role,
    employee_code: employee_code ?? null,
    is_active:     true,
  })

  if (profileError) {
    console.error('[invite-user] Failed to create profile:', profileError)
  }

  // Send magic link / invite email
  const inviteRes = await fetch(`${adminUrl}/auth/v1/admin/users/${newUser.id}/send-magic-link`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        adminKey,
      'Authorization': `Bearer ${adminKey}`,
    },
    body: JSON.stringify({ email }),
  })

  return NextResponse.json({
    success: true,
    user_id: newUser.id,
    invited: inviteRes.ok,
  })
}
