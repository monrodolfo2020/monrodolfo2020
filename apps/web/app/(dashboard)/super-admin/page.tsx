import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Super Admin' }

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/')

  const { data: malls } = await supabase
    .from('malls')
    .select('id, name, city, is_active, subscription_plan, created_at')
    .is('deleted_at', null)
    .order('name')

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Super Admin — Todos los Malls</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(malls ?? []).map((mall) => (
          <Link
            key={mall.id}
            href={`/${mall.id}/overview`}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-brand-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-900">{mall.name}</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  mall.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {mall.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            {mall.city && <p className="text-sm text-gray-500 mt-1">{mall.city}</p>}
            <p className="text-xs text-gray-400 mt-2 capitalize">{mall.subscription_plan}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
