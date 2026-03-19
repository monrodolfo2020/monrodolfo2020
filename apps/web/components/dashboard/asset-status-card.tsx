import { cn } from '@/lib/utils/cn'

const ASSET_TYPE_LABELS: Record<string, string> = {
  luminaire: 'Luminarias',
  cctv_camera: 'Cámaras CCTV',
  generator: 'Generadores',
  electrical_substation: 'Subestación Eléctrica',
  elevator: 'Elevadores',
  escalator: 'Escaleras Eléctricas',
  hvac: 'HVAC / Climatización',
  water_treatment: 'Tratamiento de Agua',
  drinking_water_plant: 'Planta de Agua Potable',
  fire_suppression: 'Sistema Contra Incendios',
  access_control: 'Control de Acceso',
  wifi_access_point: 'Puntos WiFi',
}

interface AssetRecord {
  asset_type: string
  total_count: number
  operational_count: number
  score_percentage: number
  recorded_date: string
}

function deduplicateByType(records: AssetRecord[]): AssetRecord[] {
  const seen = new Map<string, AssetRecord>()
  for (const r of records) {
    if (!seen.has(r.asset_type)) {
      seen.set(r.asset_type, r)
    }
  }
  return Array.from(seen.values())
}

export function AssetStatusCard({ records }: { records: AssetRecord[] }) {
  const latestByType = deduplicateByType(records)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Estado de Activos</h3>

      {latestByType.length === 0 ? (
        <p className="text-sm text-gray-400">
          Sin registros de activos. Los administradores pueden ingresar el conteo desde Configuración.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {latestByType.map((record) => {
            const pct = record.score_percentage
            const color =
              pct >= 90 ? 'text-green-700' : pct >= 75 ? 'text-yellow-700' : 'text-red-700'
            const barColor =
              pct >= 90 ? 'bg-green-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-red-500'

            return (
              <div key={record.asset_type} className="border border-gray-100 rounded-md p-3">
                <p className="text-xs font-medium text-gray-700 truncate">
                  {ASSET_TYPE_LABELS[record.asset_type] ?? record.asset_type}
                </p>
                <div className="mt-2 flex items-end gap-1">
                  <span className={cn('text-2xl font-bold', color)}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', barColor)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {record.operational_count}/{record.total_count} operacionales
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
