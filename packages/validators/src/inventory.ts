import { z } from 'zod'

export const CreateInventoryItemSchema = z.object({
  mall_id: z.string().uuid(),
  sku: z.string().max(100).nullable().optional(),
  name: z.string().min(2).max(200),
  category: z.enum([
    'lighting', 'electrical', 'plumbing', 'cleaning_supplies',
    'hardware', 'fuel', 'safety', 'paint', 'hvac', 'other',
  ]),
  unit_of_measure: z.string().min(1).max(50).default('piece'),
  unit_cost: z.number().min(0).nullable().optional(),
  minimum_stock: z.number().int().min(0).default(0),
  current_stock: z.number().int().min(0).default(0),
  maximum_stock: z.number().int().min(0).nullable().optional(),
  location_notes: z.string().max(500).nullable().optional(),
  supplier_name: z.string().max(200).nullable().optional(),
  supplier_contact: z.string().max(200).nullable().optional(),
})

export const CreateStockMovementSchema = z.object({
  mall_id: z.string().uuid(),
  item_id: z.string().uuid(),
  movement_type: z.enum([
    'initial_load', 'purchase', 'consumption', 'adjustment', 'return', 'waste',
  ]),
  quantity: z.number().int().refine((n) => n !== 0, 'Quantity cannot be zero'),
  unit_cost: z.number().min(0).nullable().optional(),
  task_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  reference_doc: z.string().max(200).nullable().optional(),
  movement_date: z.string().datetime().optional(),
  client_id: z.string().uuid().optional(),
})

// CSV row schema for bulk import validation
export const InventoryCSVRowSchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1),
  category: z.enum([
    'lighting', 'electrical', 'plumbing', 'cleaning_supplies',
    'hardware', 'fuel', 'safety', 'paint', 'hvac', 'other',
  ]),
  unit_of_measure: z.string().min(1),
  unit_cost: z.coerce.number().min(0).optional(),
  minimum_stock: z.coerce.number().int().min(0).default(0),
  current_stock: z.coerce.number().int().min(0).default(0),
  maximum_stock: z.coerce.number().int().min(0).optional(),
  supplier_name: z.string().optional(),
})

export type CreateInventoryItemInput = z.infer<typeof CreateInventoryItemSchema>
export type CreateStockMovementInput = z.infer<typeof CreateStockMovementSchema>
export type InventoryCSVRowInput = z.infer<typeof InventoryCSVRowSchema>
