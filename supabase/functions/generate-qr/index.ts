/**
 * Edge Function: generate-qr
 *
 * Generates a signed QR payload for a security checkpoint.
 * Signs with HMAC-SHA256 using the checkpoint's secret.
 * Returns the QR payload string to be encoded into a QR image.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, corsResponse, jsonResponse, errorResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify auth
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return errorResponse('Unauthorized', 401)

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) return errorResponse('Unauthorized', 401)

    const { checkpoint_id } = await req.json()
    if (!checkpoint_id) return errorResponse('checkpoint_id is required')

    // Fetch checkpoint
    const { data: checkpoint, error } = await supabase
      .from('security_checkpoints')
      .select('id, mall_id, qr_secret')
      .eq('id', checkpoint_id)
      .single()

    if (error || !checkpoint) return errorResponse('Checkpoint not found', 404)

    // Build signed payload
    const nonce = crypto.randomUUID()
    const issuedAt = Math.floor(Date.now() / 1000)
    const payloadToSign = `${checkpoint.id}:${checkpoint.mall_id}:${nonce}:${issuedAt}`

    const signature = await hmacSign(payloadToSign, checkpoint.qr_secret)

    const qrPayload = JSON.stringify({
      checkpoint_id: checkpoint.id,
      mall_id: checkpoint.mall_id,
      nonce,
      issued_at: issuedAt,
      signature,
    })

    // Update the stored qr_code for this checkpoint
    await supabase
      .from('security_checkpoints')
      .update({ qr_code: qrPayload })
      .eq('id', checkpoint_id)

    return jsonResponse({ qr_payload: qrPayload })
  } catch (error) {
    console.error('[generate-qr]', error)
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
})

async function hmacSign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}
