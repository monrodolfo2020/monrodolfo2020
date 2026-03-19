'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Mall, UserProfile } from '@mall/types'

export function useMall(mallId: string) {
  const supabase = createClient()

  return useQuery<Mall>({
    queryKey: ['mall', mallId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('malls')
        .select('*')
        .eq('id', mallId)
        .single()

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCurrentUser() {
  const supabase = createClient()

  return useQuery<UserProfile | null>({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    },
    staleTime: 60 * 1000, // 1 minute
  })
}
