import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Location from 'expo-location'
import { format } from 'date-fns'
import { getDatabase } from '@/lib/db/schema'
import { useAuthStore } from '@/store/auth'

interface PatrolRoute {
  id: string
  name: string
  expected_duration_minutes: number | null
}

interface ActiveSession {
  id: string
  route_id: string
  route_name: string
  started_at: string
  completion_percentage: number
}

export default function SecurityScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [routes, setRoutes] = useState<PatrolRoute[]>([])
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null)
  const [loading, setLoading] = useState(true)
  const { profile } = useAuthStore()

  const loadData = useCallback(async () => {
    const db = await getDatabase()

    const routeRows = await db.getAllAsync<PatrolRoute>(
      'SELECT id, name, expected_duration_minutes FROM patrol_routes WHERE is_active = 1 ORDER BY name'
    )
    setRoutes(routeRows)

    const sessionRow = await db.getFirstAsync<{
      id: string
      route_id: string
      route_name: string
      started_at: string
      completion_percentage: number
    }>(
      `SELECT ps.id, ps.route_id, pr.name as route_name, ps.started_at, ps.completion_percentage
       FROM patrol_sessions ps
       LEFT JOIN patrol_routes pr ON ps.route_id = pr.id
       WHERE ps.status = 'in_progress'
       ORDER BY ps.started_at DESC LIMIT 1`
    )
    setActiveSession(sessionRow ?? null)
  }, [])

  useEffect(() => {
    loadData().finally(() => setLoading(false))
  }, [loadData])

  async function startPatrol(route: PatrolRoute) {
    if (!profile?.id) {
      Alert.alert('Error', 'Perfil de usuario no disponible')
      return
    }

    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Se necesita acceso a la ubicación para verificar los checkpoints.'
      )
      return
    }

    const db = await getDatabase()
    const sessionId = crypto.randomUUID()
    const now = new Date().toISOString()

    await db.runAsync(
      `INSERT INTO patrol_sessions (id, mall_id, route_id, guard_id, started_at, status, client_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'in_progress', ?, ?, ?)`,
      [sessionId, profile.mall_id ?? '', route.id, profile.id, now, sessionId, now, now]
    )

    setActiveSession({
      id: sessionId,
      route_id: route.id,
      route_name: route.name,
      started_at: now,
      completion_percentage: 0,
    })

    router.push(`/(tabs)/security/session/${sessionId}`)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {activeSession && (
        <TouchableOpacity
          style={styles.activeSessionBanner}
          onPress={() => router.push(`/(tabs)/security/session/${activeSession.id}`)}
        >
          <View style={styles.activeDot} />
          <View style={styles.activeSessionInfo}>
            <Text style={styles.activeSessionTitle}>Ronda activa: {activeSession.route_name}</Text>
            <Text style={styles.activeSessionTime}>
              Iniciada: {format(new Date(activeSession.started_at), 'HH:mm')} ·{' '}
              {activeSession.completion_percentage.toFixed(0)}% completado
            </Text>
          </View>
          <Text style={styles.continueText}>Continuar →</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Iniciar Nueva Ronda</Text>

      {routes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Sin rutas disponibles. Contacte al administrador.</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.routeCard, !!activeSession && styles.routeCardDisabled]}
              onPress={() => {
                if (activeSession) {
                  Alert.alert(
                    'Ronda activa',
                    'Completa la ronda actual antes de iniciar una nueva.'
                  )
                  return
                }
                Alert.alert(
                  'Iniciar Ronda',
                  `¿Iniciar la ronda "${item.name}"?`,
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Iniciar', onPress: () => startPatrol(item) },
                  ]
                )
              }}
            >
              <Text style={styles.routeName}>{item.name}</Text>
              {item.expected_duration_minutes && (
                <Text style={styles.routeDuration}>
                  ~{item.expected_duration_minutes} minutos
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  activeSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    padding: 14,
    gap: 10,
  },
  activeDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  activeSessionInfo: { flex: 1 },
  activeSessionTitle: { color: 'white', fontWeight: '600', fontSize: 14 },
  activeSessionTime: { color: '#bae6fd', fontSize: 12, marginTop: 2 },
  continueText: { color: 'white', fontSize: 12, fontWeight: '600' },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#64748b',
    paddingHorizontal: 16, paddingVertical: 12,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  listContent: { paddingHorizontal: 16, gap: 8 },
  routeCard: {
    backgroundColor: 'white', borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  routeCardDisabled: { opacity: 0.5 },
  routeName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  routeDuration: { fontSize: 13, color: '#94a3b8', marginTop: 3 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },
  emptyText: { color: '#94a3b8', fontSize: 15, textAlign: 'center' },
})
