/**
 * Edge Function: verify-scan
 *
 * Verifies a QR scan:
 * 1. Validates HMAC-SHA256 signature
 * 2. Checks geolocation is within checkpoint geofence
 * 3. Updates checkpoint_scans record with verification results
 *
 * Called after scan is synced from mobile app.
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

    const { scan_id, qr_payload, geolocation } = await req.json()

    if (!scan_id || !qr_payload || !geolocation) {
      return errorResponse('scan_id, qr_payload, and geolocation are required')
    }

    // Parse QR payload
    let qrData: {
      checkpoint_id: string
      mall_id: string
      nonce: string
      issued_at: number
      signature: string
    }

    try {
      qrData = JSON.parse(qr_payload)
    } catch {
      await updateScan(supabase, scan_id, false, false, 0)
      return jsonResponse({ qr_verified: false, geolocation_valid: false, distance_meters: 0 })
    }

    // Fetch checkpoint
    const { data: checkpoint } = await supabase
      .from('security_checkpoints')
      .select('id, qr_secret, geolocation, geofence_radius_meters')
      .eq('id', qrData.checkpoint_id)
      .single()

    if (!checkpoint) {
      await updateScan(supabase, scan_id, false, false, 0)
      return jsonResponse({ qr_verified: false, geolocation_valid: false, distance_meters: 0 })
    }

    // Verify HMAC
    const payloadToVerify = `${qrData.checkpoint_id}:${qrData.mall_id}:${qrData.nonce}:${qrData.issued_at}`
    const qrVerified = await hmacVerify(payloadToVerify, checkpoint.qr_secret, qrData.signature)

    // Verify geolocation
    let geoValid = false
    let distanceMeters = 0

    if (checkpoint.geolocation) {
      const expected = checkpoint.geolocation as { lat: number; lng: number }
      distanceMeters = haversineDistance(
        geolocation.lat, geolocation.lng,
        expected.lat, expected.lng
      )
      geoValid = distanceMeters <= checkpoint.geofence_radius_meters
    } else {
      // No expected location configured — accept any geolocation
      geoValid = true
    }

    await updateScan(supabase, scan_id, qrVerified, geoValid, distanceMeters)

    return jsonResponse({
      qr_verified: qrVerified,
      geolocation_valid: geoValid,
      distance_meters: Math.round(distanceMeters),
    })
  } catch (error) {
    console.error('[verify-scan]', error)
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
})

async function updateScan(
  supabase: ReturnType<typeof createClient>,
  scanId: string,
  qrVerified: boolean,
  geoValid: boolean,
  _distance: number
) {
  await supabase
    .from('checkpoint_scans')
    .update({ qr_verified: qrVerified, geolocation_valid: geoValid })
    .eq('id', scanId)
}

async function hmacVerify(message: string, secret: string, signature: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const sigBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0))
    return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(message))
  } catch {
    return false
  }
}

/**
 * Calculate distance in meters between two coordinates using Haversine formula.
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
