'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

type Checkpoint = {
  id: string
  name: string
  location_notes: string | null
  qr_code: string
  is_active: boolean
  geolocation: { lat: number; lng: number } | null
  geofence_radius_meters: number
  zone_id: string | null
  zone?: { name: string }
}

type Zone = { id: string; name: string }

export default function CheckpointsPage() {
  const { mallId } = useParams<{ mallId: string }>()
  const supabase = createClient()

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, startGenerate] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [selectedQr, setSelectedQr] = useState<Checkpoint | null>(null)

  const [form, setForm] = useState({
    name: '',
    location_notes: '',
    zone_id: '',
    geofence_radius_meters: 50,
  })

  useEffect(() => {
    Promise.all([
      supabase
        .from('security_checkpoints')
        .select('*, zone:mall_zones(name)')
        .eq('mall_id', mallId)
        .order('name'),
      supabase
        .from('mall_zones')
        .select('id, name')
        .eq('mall_id', mallId)
        .order('name'),
    ]).then(([{ data: cps }, { data: zns }]) => {
      setCheckpoints((cps as Checkpoint[]) ?? [])
      setZones((zns as Zone[]) ?? [])
      setLoading(false)
    })
  }, [mallId])

  async function generateQr(checkpointId: string) {
    startGenerate(async () => {
      const { data, error } = await supabase.functions.invoke('generate-qr', {
        body: { checkpoint_id: checkpointId, mall_id: mallId },
      })
      if (error) {
        alert('Error generating QR: ' + error.message)
        return
      }
      // Refresh checkpoint list
      const { data: updated } = await supabase
        .from('security_checkpoints')
        .select('*, zone:mall_zones(name)')
        .eq('mall_id', mallId)
        .order('name')
      setCheckpoints((updated as Checkpoint[]) ?? [])
      alert(`QR generado. URL: ${data?.qr_url ?? 'ver Supabase Storage'}`)
    })
  }

  async function createCheckpoint(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.from('security_checkpoints').insert({
      mall_id: mallId,
      name: form.name,
      location_notes: form.location_notes || null,
      zone_id: form.zone_id || null,
      geofence_radius_meters: form.geofence_radius_meters,
      qr_code: crypto.randomUUID(),   // temporary, replaced by generate-qr
      qr_secret: crypto.randomUUID(), // temporary, replaced by generate-qr
    })
    if (error) { alert('Error: ' + error.message); return }
    setShowForm(false)
    setForm({ name: '', location_notes: '', zone_id: '', geofence_radius_meters: 50 })
    const { data } = await supabase
      .from('security_checkpoints')
      .select('*, zone:mall_zones(name)')
      .eq('mall_id', mallId)
      .order('name')
    setCheckpoints((data as Checkpoint[]) ?? [])
  }

  async function toggleActive(cp: Checkpoint) {
    await supabase
      .from('security_checkpoints')
      .update({ is_active: !cp.is_active })
      .eq('id', cp.id)
    setCheckpoints(prev =>
      prev.map(c => c.id === cp.id ? { ...c, is_active: !c.is_active } : c),
    )
  }

  if (loading) return <div className="p-8 text-gray-500">Cargando puntos de control…</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Puntos de Control</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de checkpoints y códigos QR para rondas de seguridad
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Nuevo Checkpoint
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: checkpoints.length, color: 'blue' },
          { label: 'Activos', value: checkpoints.filter(c => c.is_active).length, color: 'green' },
          { label: 'Inactivos', value: checkpoints.filter(c => !c.is_active).length, color: 'gray' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Checkpoint List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Zona</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Geofence</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {checkpoints.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  No hay checkpoints. Crea el primero.
                </td>
              </tr>
            )}
            {checkpoints.map(cp => (
              <tr key={cp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{cp.name}</p>
                  {cp.location_notes && (
                    <p className="text-xs text-gray-400">{cp.location_notes}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {cp.zone?.name ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {cp.geofence_radius_meters} m
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      cp.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {cp.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedQr(cp)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Ver QR
                    </button>
                    <button
                      onClick={() => generateQr(cp.id)}
                      disabled={generating}
                      className="text-xs text-indigo-600 hover:underline disabled:opacity-40"
                    >
                      Regenerar
                    </button>
                    <button
                      onClick={() => toggleActive(cp)}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      {cp.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Checkpoint Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Nuevo Punto de Control</h2>
            <form onSubmit={createCheckpoint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Entrada Principal Norte"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona</label>
                <select
                  value={form.zone_id}
                  onChange={e => setForm(f => ({ ...f, zone_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin zona</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas de ubicación</label>
                <textarea
                  rows={2}
                  value={form.location_notes}
                  onChange={e => setForm(f => ({ ...f, location_notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Junto al acceso de estacionamiento 3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Radio de geofence (metros)
                </label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={form.geofence_radius_meters}
                  onChange={e => setForm(f => ({ ...f, geofence_radius_meters: +e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Preview Modal */}
      {selectedQr && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <h2 className="text-lg font-semibold mb-2">{selectedQr.name}</h2>
            <p className="text-sm text-gray-500 mb-4">Código QR de identificación</p>
            {/* QR image served from Supabase Storage */}
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/qr-codes/${mallId}/checkpoints/${selectedQr.id}.png`}
              alt={`QR ${selectedQr.name}`}
              className="mx-auto w-48 h-48 object-contain border border-gray-200 rounded-xl"
              onError={e => {
                ;(e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(selectedQr.qr_code)}`
              }}
            />
            <p className="text-xs text-gray-400 mt-3 break-all font-mono">{selectedQr.qr_code}</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setSelectedQr(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cerrar
              </button>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(selectedQr.qr_code)}`}
                download={`qr-${selectedQr.name}.png`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center justify-center"
              >
                Descargar
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
