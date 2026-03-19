import { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  ActivityIndicator,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'

type ScanState = 'idle' | 'scanning' | 'verifying' | 'success' | 'error'

type VerifyResult = {
  valid: boolean
  checkpoint_name?: string
  message?: string
  scan_id?: string
}

export default function ScanScreen() {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const [permission, requestPermission] = useCameraPermissions()
  const [locationPerm, requestLocationPerm] = Location.useForegroundPermissions()

  const [scanState, setScanState] = useState<ScanState>('idle')
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const cooldownRef = useRef(false)

  useEffect(() => {
    // Auto-request permissions on mount
    if (!permission?.granted) requestPermission()
    if (!locationPerm?.granted) requestLocationPerm()
  }, [])

  // Get or create today's patrol session for this guard
  useEffect(() => {
    async function ensureSession() {
      if (!profile?.mall_id || !user?.id) return

      const { data: existing } = await supabase
        .from('patrol_sessions')
        .select('id')
        .eq('guard_id', user.id)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (existing) {
        setSessionId(existing.id)
        return
      }

      // Get the first active route for this mall
      const { data: route } = await supabase
        .from('patrol_routes')
        .select('id')
        .eq('mall_id', profile.mall_id)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (!route) return

      const { data: newSession } = await supabase
        .from('patrol_sessions')
        .insert({
          mall_id:    profile.mall_id,
          route_id:   route.id,
          guard_id:   user.id,
          started_at: new Date().toISOString(),
          status:     'in_progress',
          client_id:  crypto.randomUUID(),
        })
        .select('id')
        .single()

      if (newSession) setSessionId(newSession.id)
    }

    ensureSession()
  }, [user?.id, profile?.mall_id])

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (cooldownRef.current || scanState === 'verifying') return
    cooldownRef.current = true

    setLastScannedCode(data)
    setScanState('verifying')
    Vibration.vibrate(100)

    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      }).catch(() => null)

      const geolocation = location
        ? { lat: location.coords.latitude, lng: location.coords.longitude, accuracy: location.coords.accuracy }
        : { lat: 0, lng: 0, accuracy: null }

      // Call verify-scan Edge Function
      const { data: verifyData, error } = await supabase.functions.invoke<VerifyResult>(
        'verify-scan',
        {
          body: {
            qr_payload:  data,
            session_id:  sessionId,
            guard_id:    user?.id,
            mall_id:     profile?.mall_id,
            scanned_at:  new Date().toISOString(),
            geolocation,
            device_info: { platform: 'mobile' },
            client_id:   crypto.randomUUID(),
          },
        },
      )

      if (error) throw error

      setResult(verifyData)
      setScanState(verifyData?.valid ? 'success' : 'error')
      Vibration.vibrate(verifyData?.valid ? [0, 100, 50, 100] : [0, 300])
    } catch (err) {
      console.error('[scan] verify error:', err)
      setResult({ valid: false, message: 'Error de conexión. Intente de nuevo.' })
      setScanState('error')
      Vibration.vibrate(500)
    }

    // Allow next scan after 3 seconds
    setTimeout(() => {
      cooldownRef.current = false
      setScanState('scanning')
    }, 3000)
  }

  function resetScan() {
    setScanState('scanning')
    setResult(null)
    setLastScannedCode(null)
    cooldownRef.current = false
  }

  if (!permission) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>Se necesita acceso a la cámara</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Permitir cámara</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanState === 'scanning' ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Escanear Checkpoint</Text>
          <View style={{ width: 80 }} />
        </View>

        {/* Finder frame */}
        <View style={styles.finderContainer}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        {/* Status area */}
        <View style={styles.statusContainer}>
          {scanState === 'idle' && (
            <>
              <Text style={styles.statusText}>Iniciando…</Text>
              <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />
            </>
          )}

          {scanState === 'scanning' && (
            <Text style={styles.statusText}>Apunta la cámara al código QR del checkpoint</Text>
          )}

          {scanState === 'verifying' && (
            <>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.statusText}>Verificando…</Text>
            </>
          )}

          {scanState === 'success' && result && (
            <View style={styles.resultBox}>
              <Text style={styles.resultIcon}>✓</Text>
              <Text style={styles.resultTitle}>{result.checkpoint_name ?? 'Checkpoint'}</Text>
              <Text style={styles.resultMsg}>{result.message ?? 'Scan registrado correctamente'}</Text>
              <TouchableOpacity style={[styles.btn, { marginTop: 12 }]} onPress={resetScan}>
                <Text style={styles.btnText}>Continuar ronda</Text>
              </TouchableOpacity>
            </View>
          )}

          {scanState === 'error' && result && (
            <View style={[styles.resultBox, styles.resultBoxError]}>
              <Text style={styles.resultIconError}>✗</Text>
              <Text style={styles.resultTitle}>{result.message ?? 'QR inválido'}</Text>
              <TouchableOpacity style={[styles.btn, styles.btnSecondary, { marginTop: 12 }]} onPress={resetScan}>
                <Text style={styles.btnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Session indicator */}
        {sessionId && (
          <View style={styles.sessionBadge}>
            <View style={styles.sessionDot} />
            <Text style={styles.sessionText}>Ronda activa</Text>
          </View>
        )}
      </View>
    </View>
  )
}

const CORNER_SIZE  = 24
const CORNER_WIDTH = 4

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  overlay:   { flex: 1, justifyContent: 'space-between' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backBtn:   { width: 80 },
  backText:  { color: '#fff', fontSize: 15 },
  topTitle:  { color: '#fff', fontSize: 16, fontWeight: '600' },

  finderContainer: {
    alignSelf: 'center',
    width: 240,
    height: 240,
    marginVertical: 'auto',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#fff',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },

  statusContainer: {
    alignItems: 'center',
    paddingBottom: 60,
    paddingHorizontal: 24,
    minHeight: 160,
    justifyContent: 'center',
  },
  statusText: { color: '#fff', fontSize: 14, textAlign: 'center', marginTop: 8 },

  resultBox: {
    backgroundColor: 'rgba(22,163,74,0.9)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  resultBoxError: { backgroundColor: 'rgba(220,38,38,0.9)' },
  resultIcon:     { fontSize: 40, color: '#fff' },
  resultIconError:{ fontSize: 40, color: '#fff' },
  resultTitle:    { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 8 },
  resultMsg:      { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 4, textAlign: 'center' },

  btn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 160,
    alignItems: 'center',
  },
  btnSecondary: { backgroundColor: 'rgba(255,255,255,0.2)' },
  btnText:      { color: '#fff', fontWeight: '600', fontSize: 15 },

  permText: { fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 20 },

  sessionBadge: {
    position: 'absolute',
    top: 110,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  sessionDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  sessionText: { color: '#fff', fontSize: 12 },
})
