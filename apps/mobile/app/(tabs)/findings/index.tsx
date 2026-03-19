import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { format } from 'date-fns'
import { getDatabase } from '@/lib/db/schema'
import { syncEngine } from '@/lib/sync/SyncEngine'

interface Finding {
  id: string
  title: string
  description: string
  severity: string
  status: string
  resolution_date: string | null
  created_at: string
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#94a3b8',
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
}

export default function FindingsScreen() {
  const [findings, setFindings] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadFindings = useCallback(async () => {
    const db = await getDatabase()
    const rows = await db.getAllAsync<Finding>(
      `SELECT * FROM findings
       WHERE status IN ('open', 'in_progress')
       ORDER BY
         CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         created_at DESC`
    )
    setFindings(rows)
  }, [])

  useEffect(() => {
    loadFindings().finally(() => setLoading(false))
  }, [loadFindings])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await syncEngine.sync()
    await loadFindings()
    setRefreshing(false)
  }, [loadFindings])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.newButton}
        onPress={() => router.push('/(tabs)/findings/new')}
      >
        <Text style={styles.newButtonText}>+ Reportar Hallazgo</Text>
      </TouchableOpacity>

      <FlatList
        data={findings}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={findings.length === 0 ? styles.emptyContainer : styles.listContent}
        renderItem={({ item }) => {
          const isOverdue =
            item.resolution_date && new Date(item.resolution_date) < new Date()

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(tabs)/findings/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: SEVERITY_COLORS[item.severity] ?? '#94a3b8' },
                  ]}
                >
                  <Text style={styles.severityText}>
                    {SEVERITY_LABELS[item.severity] ?? item.severity}
                  </Text>
                </View>
                {isOverdue && (
                  <View style={styles.overdueBadge}>
                    <Text style={styles.overdueText}>VENCIDO</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.cardDate}>
                {format(new Date(item.created_at), 'dd/MM/yyyy')}
                {item.resolution_date &&
                  ` · Resolución: ${format(new Date(item.resolution_date), 'dd/MM/yyyy')}`}
              </Text>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sin hallazgos abiertos</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  newButton: {
    backgroundColor: '#0284c7', margin: 12, borderRadius: 8,
    paddingVertical: 12, alignItems: 'center',
  },
  newButtonText: { color: 'white', fontWeight: '600', fontSize: 15 },
  listContent: { paddingHorizontal: 12, paddingBottom: 24 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: 'white', borderRadius: 10, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  severityText: { fontSize: 11, color: 'white', fontWeight: '600' },
  overdueBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
    backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5',
  },
  overdueText: { fontSize: 10, color: '#dc2626', fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  cardDate: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  empty: { alignItems: 'center', padding: 48 },
  emptyText: { color: '#94a3b8', fontSize: 15 },
})
