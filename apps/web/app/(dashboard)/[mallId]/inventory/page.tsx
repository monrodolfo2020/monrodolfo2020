import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export const metadata: Metadata = { title: 'Inventario' }

interface PageProps {
  params: Promise<{ mallId: string }>
  searchParams: Promise<{ category?: string; low_stock?: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  lighting: 'Iluminación',
  electrical: 'Eléctrico',
  plumbing: 'Plomería',
  cleaning_supplies: 'Limpieza',
  hardware: 'Ferretería',
  fuel: 'Combustible',
  safety: 'Seguridad',
  paint: 'Pintura',
  hvac: 'HVAC',
  other: 'Otros',
}

export default async function InventoryPage({ params, searchParams }: PageProps) {
  const { mallId } = await params
  const { category, low_stock } = await searchParams
  const supabase = await createClient()

  const { data: mall } = await supabase
    .from('malls')
    .select('id, name')
    .eq('id', mallId)
    .single()

  if (!mall) notFound()

  let query = supabase
    .from('inventory_items')
    .select('*')
    .eq('mall_id', mallId)
    .eq('is_active', true)
    .order('category')
    .order('name')

  if (category) query = query.eq('category', category)
  if (low_stock === '1') query = query.lte('current_stock', supabase.rpc)

  const { data: items } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('mall_id', mallId)
    .eq('is_active', true)
    .order('category')
    .order('name')

  const lowStockItems = (items ?? []).filter((item) => item.current_stock <= item.minimum_stock)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventario / Almacén</h1>
        {lowStockItems.length > 0 && (
          <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full">
            {lowStockItems.length} artículo(s) con stock bajo
          </span>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Artículo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Categoría</th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">Stock Actual</th>
              <th className="text-center px-4 py-3 font-medium text-gray-700">Mínimo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Unidad</th>
              <th className="text-right px-4 py-3 font-medium text-gray-700">Costo Unit.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!items || items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Sin artículos en inventario. Importa desde un archivo CSV.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isLow = item.current_stock <= item.minimum_stock
                return (
                  <tr key={item.id} className={isLow ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.sku && <p className="text-xs text-gray-400">{item.sku}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </td>
                    <td className={`px-4 py-3 text-center font-bold ${isLow ? 'text-red-700' : 'text-gray-900'}`}>
                      {item.current_stock}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{item.minimum_stock}</td>
                    <td className="px-4 py-3 text-gray-600">{item.unit_of_measure}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {item.unit_cost
                        ? `$${item.unit_cost.toFixed(2)}`
                        : '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
