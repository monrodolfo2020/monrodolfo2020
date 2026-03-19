'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

type UserProfile = {
  id: string
  full_name: string
  phone: string | null
  employee_code: string | null
  role: string
  is_active: boolean
  last_seen_at: string | null
  created_at: string
  email?: string
}

const ROLES = [
  { value: 'mall_admin',            label: 'Administrador de Plaza' },
  { value: 'maintenance_chief',     label: 'Jefe de Mantenimiento' },
  { value: 'maintenance_operator',  label: 'Operador de Mantenimiento' },
  { value: 'security_guard',        label: 'Guardia de Seguridad' },
  { value: 'viewer',                label: 'Visualizador' },
]

const ROLE_COLORS: Record<string, string> = {
  super_admin:           'bg-purple-100 text-purple-700',
  mall_admin:            'bg-blue-100 text-blue-700',
  maintenance_chief:     'bg-orange-100 text-orange-700',
  maintenance_operator:  'bg-yellow-100 text-yellow-700',
  security_guard:        'bg-green-100 text-green-700',
  viewer:                'bg-gray-100 text-gray-600',
}

function roleBadge(role: string) {
  const found = ROLES.find(r => r.value === role)
  return found?.label ?? role
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Nunca'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'Ahora mismo'
  if (mins < 60)  return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `Hace ${hrs} h`
  const days = Math.floor(hrs / 24)
  return `Hace ${days} días`
}

export default function UsersPage() {
  const { mallId } = useParams<{ mallId: string }>()
  const supabase = createClient()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [editUser, setEditUser] = useState<UserProfile | null>(null)

  const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'maintenance_operator', employee_code: '' })
  const [inviting, setInviting] = useState(false)
  const [filterRole, setFilterRole] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('user_profiles')
      .select('*')
      .eq('mall_id', mallId)
      .order('full_name')
      .then(({ data }) => {
        setUsers((data as UserProfile[]) ?? [])
        setLoading(false)
      })
  }, [mallId])

  async function inviteUser(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    // In production, call a server action / API route that uses
    // supabase.auth.admin.inviteUserByEmail() with the service role key.
    // Here we use the Supabase client signInWithOtp as a stand-in.
    try {
      const res = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inviteForm, mall_id: mallId }),
      })
      if (!res.ok) throw new Error(await res.text())
      alert(`Invitación enviada a ${inviteForm.email}`)
      setShowInvite(false)
      setInviteForm({ email: '', full_name: '', role: 'maintenance_operator', employee_code: '' })
    } catch (err) {
      alert('Error al invitar: ' + String(err))
    } finally {
      setInviting(false)
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (error) { alert('Error: ' + error.message); return }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    setEditUser(null)
  }

  async function toggleUserActive(user: UserProfile) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: !user.is_active })
      .eq('id', user.id)
    if (error) { alert('Error: ' + error.message); return }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
  }

  const filtered = users.filter(u => {
    const matchRole   = !filterRole || u.role === filterRole
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  const activeCount   = users.filter(u => u.is_active).length
  const inactiveCount = users.filter(u => !u.is_active).length

  if (loading) return <div className="p-8 text-gray-500">Cargando usuarios…</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipo</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de usuarios y permisos del mall</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Invitar Usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',     value: users.length,   color: 'blue' },
          { label: 'Activos',   value: activeCount,    color: 'green' },
          { label: 'Inactivos', value: inactiveCount,  color: 'gray' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="search"
          placeholder="Buscar por nombre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Último acceso</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
            {filtered.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name}</p>
                      {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {roleBadge(user.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                  {user.employee_code ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {timeAgo(user.last_seen_at)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditUser(user)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Editar rol
                    </button>
                    <button
                      onClick={() => toggleUserActive(user)}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      {user.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Invitar Usuario</h2>
            <form onSubmit={inviteUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  required type="email"
                  value={inviteForm.email}
                  onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="empleado@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                <input
                  required
                  value={inviteForm.full_name}
                  onChange={e => setInviteForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={inviteForm.role}
                  onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código de empleado</label>
                <input
                  value={inviteForm.employee_code}
                  onChange={e => setInviteForm(f => ({ ...f, employee_code: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="EMP-001"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowInvite(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={inviting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {inviting ? 'Enviando…' : 'Enviar invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold mb-2">Cambiar Rol</h2>
            <p className="text-sm text-gray-500 mb-4">{editUser.full_name}</p>
            <div className="space-y-2">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => updateUserRole(editUser.id, r.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm border transition-colors ${
                    editUser.role === r.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setEditUser(null)}
              className="w-full mt-4 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
