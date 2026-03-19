import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { syncEngine } from '@/lib/sync/SyncEngine'
import { useSyncStore } from '@/store/sync'

export default function RootLayout() {
  const { setSession, setLoading } = useAuthStore()
  const { setStatus } = useSyncStore()

  useEffect(() => {
    // Initialize auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    // Initialize sync engine
    syncEngine.start()
    const unsubscribeSync = syncEngine.addListener((status, progress) => {
      setStatus(status, progress)
    })

    return () => {
      subscription.unsubscribe()
      unsubscribeSync()
      syncEngine.stop()
    }
  }, [setSession, setLoading, setStatus])

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}
