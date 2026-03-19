import { Tabs, Redirect } from 'expo-router'
import { useAuthStore } from '@/store/auth'
import { View, ActivityIndicator } from 'react-native'

export default function TabsLayout() {
  const { session, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    )
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { borderTopColor: '#e2e8f0' },
        headerStyle: { backgroundColor: '#0284c7' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="maintenance"
        options={{
          title: 'Mantenimiento',
          tabBarLabel: 'Mant.',
          tabBarIcon: ({ color }) => <TabIcon label="🔧" />,
        }}
      />
      <Tabs.Screen
        name="security"
        options={{
          title: 'Seguridad',
          tabBarLabel: 'Rondas',
          tabBarIcon: ({ color }) => <TabIcon label="🛡" />,
        }}
      />
      <Tabs.Screen
        name="findings"
        options={{
          title: 'Hallazgos',
          tabBarLabel: 'Hallazgos',
          tabBarIcon: ({ color }) => <TabIcon label="🔍" />,
        }}
      />
    </Tabs>
  )
}

function TabIcon({ label }: { label: string }) {
  return <View style={{ marginTop: 2 }}><ActivityIndicator style={{ display: 'none' }} /></View>
}
