'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const REQUIRED_COLUMNS = ['name', 'category', 'unit_of_measure']
const VALID_CATEGORIES = [
  'lighting', 'electrical', 'plumbing', 'cleaning_supplies',
  'hardware', 'fuel', 'safety', 'paint', 'hvac', 'other',
]
type UploadStatus = 'idle' | 'validating' | 'uploading' | 'processing' | 'done' | 'error'

interface ValidationResult {
  valid: boolean
  rowCount: number
  errors: string[]
}

function parseAndValidateCSV(text: string): ValidationResult {
  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return { valid: false, rowCount: 0, errors: ['El archivo está vacío o solo tiene encabezados.'] }

  const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const missingCols = REQUIRED_COLUMNS.filter((c) => !headers.includes(c))
  if (missingCols.length > 0) {
    return { valid: false, rowCount: 0, errors: [`Columnas requeridas faltantes: ${missingCols.join(', ')}`] }
  }

  const errors: string[] = []
  const dataRows = lines.slice(1)

  dataRows.forEach((line, i) => {
    const rowNum = i + 2
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row = Object.fromEntries(headers.map((h, idx) => [h, values[idx] ?? '']))

    if (!row['name']?.trim()) errors.push(`Fila ${rowNum}: "name" es requerido`)
    if (!row['category']?.trim()) {
      errors.push(`Fila ${rowNum}: "category" es requerido`)
    } else if (!VALID_CATEGORIES.includes(row['category'])) {
      errors.push(`Fila ${rowNum}: categoría inválida "${row['category']}"`)
    }
    if (!row['unit_of_measure']?.trim()) errors.push(`Fila ${rowNum}: "unit_of_measure" es requerido`)
    if (row['current_stock'] && isNaN(parseInt(row['current_stock'], 10)))
      errors.push(`Fila ${rowNum}: "current_stock" debe ser un número`)
    if (row['minimum_stock'] && isNaN(parseInt(row['minimum_stock'], 10)))
      errors.push(`Fila ${rowNum}: "minimum_stock" debe ser un número`)
    if (row['unit_cost'] && isNaN(parseFloat(row['unit_cost'])))
      errors.push(`Fila ${rowNum}: "unit_cost" debe ser un número`)
  })

  return {
    valid: errors.length === 0,
    rowCount: dataRows.length,
    errors: errors.slice(0, 20), // show at most 20 errors
  }
}

export default function InventoryImportPage() {
  const params = useParams()
  const router = useRouter()
  const mallId = params['mallId'] as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setValidation(null)
    setStatus('idle')
    setErrorMsg(null)
    setJobId(null)

    if (!selected) return

    setStatus('validating')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const result = parseAndValidateCSV(text)
      setValidation(result)
      setStatus('idle')
    }
    reader.readAsText(selected)
  }

  async function handleUpload() {
    if (!file || !validation?.valid) return
    setStatus('uploading')
    setErrorMsg(null)

    try {
      const supabase = createClient()

      // Create import job record
      const { data: job, error: jobError } = await supabase
        .from('inventory_import_jobs')
        .insert({
          mall_id: mallId,
          original_filename: file.name,
          status: 'pending',
          total_rows: validation.rowCount,
        })
        .select('id')
        .single()

      if (jobError || !job) throw new Error(jobError?.message ?? 'No se pudo crear el trabajo de importación')

      const filePath = `${mallId}/inventory/imports/${job.id}.csv`
      const { error: uploadError } = await supabase.storage
        .from('mall-documents')
        .upload(filePath, file, { contentType: 'text/csv', upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      // Update job with file_url
      await supabase
        .from('inventory_import_jobs')
        .update({ file_url: filePath })
        .eq('id', job.id)

      setJobId(job.id)
      setStatus('processing')

      // Trigger edge function
      const { error: fnError } = await supabase.functions.invoke('process-csv-import', {
        body: { import_job_id: job.id },
      })

      if (fnError) throw new Error(fnError.message)

      setStatus('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('error')
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <button
          onClick={() => router.push(`/dashboard/${mallId}/inventory`)}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
        >
          ← Volver al inventario
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Importar inventario desde CSV</h1>
        <p className="text-sm text-gray-500 mt-1">
          Carga masiva de ítems. Los ítems existentes con el mismo SKU no serán duplicados.
        </p>
      </div>

      {/* Format reference */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">Columnas del CSV</p>
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-1 pr-4">Columna</th>
                <th className="pb-1 pr-4">Requerido</th>
                <th className="pb-1">Descripción</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {[
                ['name', 'Sí', 'Nombre del ítem'],
                ['category', 'Sí', VALID_CATEGORIES.join(', ')],
                ['unit_of_measure', 'Sí', 'piece, gallon, box, roll, etc.'],
                ['sku', 'No', 'Código único del proveedor'],
                ['unit_cost', 'No', 'Costo unitario (número decimal)'],
                ['minimum_stock', 'No', 'Stock mínimo de alerta'],
                ['current_stock', 'No', 'Stock inicial al importar'],
                ['maximum_stock', 'No', 'Stock máximo permitido'],
                ['supplier_name', 'No', 'Nombre del proveedor'],
              ].map(([col, req, desc]) => (
                <tr key={col} className="border-b border-gray-100 last:border-0">
                  <td className="py-1 pr-4 font-mono text-blue-700">{col}</td>
                  <td className="py-1 pr-4">{req === 'Sí' ? <span className="text-red-600 font-medium">Sí</span> : 'No'}</td>
                  <td className="py-1 text-gray-500">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <a
          href="/docs/inventory_import_sample.csv"
          download
          className="inline-block mt-3 text-xs text-blue-600 hover:underline"
        >
          Descargar CSV de ejemplo
        </a>
      </div>

      {/* File input */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />
        {file ? (
          <div>
            <p className="font-medium text-gray-800">{file.name}</p>
            <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-500">Haz clic para seleccionar un archivo CSV</p>
            <p className="text-xs text-gray-400 mt-1">Solo archivos .csv</p>
          </div>
        )}
      </div>

      {/* Validation result */}
      {validation && (
        <div className={`mt-4 rounded-lg p-4 ${validation.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {validation.valid ? (
            <p className="text-sm text-green-700 font-medium">
              Archivo válido — {validation.rowCount} filas listas para importar
            </p>
          ) : (
            <div>
              <p className="text-sm text-red-700 font-medium mb-2">
                Se encontraron {validation.errors.length} error(es):
              </p>
              <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                {validation.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Status messages */}
      {status === 'processing' && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Procesando importación... (ID: {jobId})</p>
          <p className="text-xs text-blue-500 mt-1">Esto puede tardar unos segundos.</p>
        </div>
      )}
      {status === 'done' && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium">Importación completada exitosamente.</p>
          <button
            onClick={() => router.push(`/dashboard/${mallId}/inventory`)}
            className="mt-2 text-sm text-green-600 underline"
          >
            Ver inventario
          </button>
        </div>
      )}
      {status === 'error' && errorMsg && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700 font-medium">Error: {errorMsg}</p>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!validation?.valid || status === 'uploading' || status === 'processing' || status === 'done'}
        className="mt-6 w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
      >
        {status === 'uploading' ? 'Subiendo archivo...' :
         status === 'processing' ? 'Procesando...' :
         status === 'done' ? 'Completado' :
         'Importar inventario'}
      </button>
    </div>
  )
}
