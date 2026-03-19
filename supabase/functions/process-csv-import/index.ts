/**
 * Edge Function: process-csv-import
 *
 * Triggered by Supabase Storage upload event when a CSV is uploaded to
 * mall-documents/{mall_id}/inventory/imports/{import_job_id}.csv
 *
 * Processes the CSV:
 * 1. Validates each row against InventoryCSVRowSchema
 * 2. Creates inventory_items records
 * 3. Creates initial stock_movements (type: initial_load)
 * 4. Updates inventory_import_jobs with results
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts'

interface CSVRow {
  sku?: string
  name: string
  category: string
  unit_of_measure: string
  unit_cost?: string
  minimum_stock?: string
  current_stock?: string
  maximum_stock?: string
  supplier_name?: string
}

const VALID_CATEGORIES = [
  'lighting', 'electrical', 'plumbing', 'cleaning_supplies',
  'hardware', 'fuel', 'safety', 'paint', 'hvac', 'other',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { import_job_id } = await req.json()
    if (!import_job_id) return errorResponse('import_job_id is required')

    // Fetch job
    const { data: job, error: jobError } = await supabase
      .from('inventory_import_jobs')
      .select('*')
      .eq('id', import_job_id)
      .single()

    if (jobError || !job) return errorResponse('Import job not found', 404)

    // Mark as processing
    await supabase
      .from('inventory_import_jobs')
      .update({ status: 'processing' })
      .eq('id', import_job_id)

    // Download CSV from Storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('mall-documents')
      .download(job.file_url)

    if (fileError || !fileData) {
      await failJob(supabase, import_job_id, 'Could not download CSV file')
      return errorResponse('Failed to download CSV', 500)
    }

    const csvText = await fileData.text()
    const rows = parseCSV(csvText)

    if (rows.length === 0) {
      await failJob(supabase, import_job_id, 'CSV file is empty')
      return errorResponse('CSV is empty')
    }

    let processedRows = 0
    let errorRows = 0
    const errors: Array<{ row: number; error: string }> = []

    // Update total_rows
    await supabase
      .from('inventory_import_jobs')
      .update({ total_rows: rows.length })
      .eq('id', import_job_id)

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as CSVRow
      const rowNum = i + 2 // +2 because row 1 is header

      // Validate
      const validationError = validateRow(row)
      if (validationError) {
        errors.push({ row: rowNum, error: validationError })
        errorRows++
        continue
      }

      const currentStock = parseInt(row.current_stock ?? '0', 10)
      const minimumStock = parseInt(row.minimum_stock ?? '0', 10)
      const unitCost = row.unit_cost ? parseFloat(row.unit_cost) : null

      // Insert inventory item
      const { data: item, error: itemError } = await supabase
        .from('inventory_items')
        .insert({
          mall_id: job.mall_id,
          sku: row.sku ?? null,
          name: row.name,
          category: row.category,
          unit_of_measure: row.unit_of_measure,
          unit_cost: unitCost,
          minimum_stock: minimumStock,
          current_stock: currentStock,
          maximum_stock: row.maximum_stock ? parseInt(row.maximum_stock, 10) : null,
          supplier_name: row.supplier_name ?? null,
        })
        .select('id')
        .single()

      if (itemError) {
        errors.push({ row: rowNum, error: itemError.message })
        errorRows++
        continue
      }

      // Create initial stock movement if there's stock
      if (currentStock > 0 && item) {
        await supabase.from('stock_movements').insert({
          mall_id: job.mall_id,
          item_id: item.id,
          movement_type: 'initial_load',
          quantity: currentStock,
          unit_cost: unitCost,
          stock_before: 0,
          stock_after: currentStock,
          notes: `Carga inicial — Importación ${import_job_id}`,
          performed_by: job.imported_by,
        })
      }

      processedRows++
    }

    // Complete job
    await supabase
      .from('inventory_import_jobs')
      .update({
        status: errors.length === rows.length ? 'failed' : 'completed',
        processed_rows: processedRows,
        error_rows: errorRows,
        errors: errors.length > 0 ? errors : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', import_job_id)

    return jsonResponse({ processed_rows: processedRows, error_rows: errorRows, errors })
  } catch (error) {
    console.error('[process-csv-import]', error)
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
})

function validateRow(row: CSVRow): string | null {
  if (!row.name?.trim()) return 'name is required'
  if (!row.category?.trim()) return 'category is required'
  if (!VALID_CATEGORIES.includes(row.category)) {
    return `Invalid category: ${row.category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`
  }
  if (!row.unit_of_measure?.trim()) return 'unit_of_measure is required'
  if (row.current_stock && isNaN(parseInt(row.current_stock, 10))) return 'current_stock must be a number'
  if (row.minimum_stock && isNaN(parseInt(row.minimum_stock, 10))) return 'minimum_stock must be a number'
  if (row.unit_cost && isNaN(parseFloat(row.unit_cost))) return 'unit_cost must be a number'
  return null
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase())

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

async function failJob(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  message: string
) {
  await supabase
    .from('inventory_import_jobs')
    .update({
      status: 'failed',
      errors: [{ row: 0, error: message }],
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
}
