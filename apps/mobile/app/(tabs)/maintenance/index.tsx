import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getDatabase } from '@/lib/db/schema'
import { syncEngine } from '@/lib/sync/SyncEngine'
import { useAuthStore } from '@/store/auth'

interface Task {
  id: string
  title: string
  status: string
  scheduled_date: string
  scheduled_time: string | null
  description: string | null
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#94a3b8',
  in_progress: '#3b82f6',
  completed: '#f59e0b',
  validated: '#10b981',
  rejected: '#ef4444',
  missed: '#dc2626',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programada',
  in_progress: 'En Progreso',
  completed: 'Completada',
  validated: 'Validada',
  rejected: 'Rechazada',
  missed: 'Perdida',
}

export default function MaintenanceScreen() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')

  const loadTasks = useCallback(async () => {
    const db = await getDatabase()
    const rows = await db.getAllAsync<Task>(
      'SELECT * FROM maintenance_tasks WHERE scheduled_date = ? ORDER BY scheduled_time',
      [today]
    )
    setTasks(rows)
  }, [today])

  useEffect(() => {
    loadTasks().finally(() => setLoading(false))
  }, [loadTasks])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await syncEngine.sync()
    await loadTasks()
    setRefreshing(false)
  }, [loadTasks])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateText}>
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </Text>
        <Text style={styles.taskCount}>{tasks.length} tarea(s)</Text>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={tasks.length === 0 ? styles.emptyContainer : styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.taskCard}
            onPress={() => router.push(`/(tabs)/maintenance/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] ?? '#94a3b8' }]}>
                <Text style={styles.badgeText}>{STATUS_LABELS[item.status] ?? item.status}</Text>
              </View>
            </View>
            {item.scheduled_time && (
              <Text style={styles.taskTime}>{item.scheduled_time.slice(0, 5)}</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sin tareas programadas para hoy</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dateText: { fontSize: 14, color: '#64748b', textTransform: 'capitalize' },
  taskCount: { fontSize: 13, fontWeight: '600', color: '#0284c7' },
  listContent: { padding: 12, gap: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  taskTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  taskTime: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, color: 'white', fontWeight: '600' },
  empty: { alignItems: 'center', padding: 48 },
  emptyText: { color: '#94a3b8', fontSize: 15 },
})
