'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ScoreSnapshot } from '@mall/types'
import { getScoreGrade } from '@mall/types'

export function useLatestScore(mallId: string, periodType: 'daily' | 'weekly' | 'monthly' = 'monthly') {
  const supabase = createClient()

  return useQuery<ScoreSnapshot | null>({
    queryKey: ['score', mallId, periodType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('score_snapshots')
        .select('*')
        .eq('mall_id', mallId)
        .eq('period_type', periodType)
        .order('period_end', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data
    },
    staleTime: 15 * 60 * 1000,
  })
}

export function useScoreHistory(
  mallId: string,
  periodType: 'daily' | 'weekly' | 'monthly',
  limit = 12
) {
  const supabase = createClient()

  return useQuery<ScoreSnapshot[]>({
    queryKey: ['score-history', mallId, periodType, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('score_snapshots')
        .select('*')
        .eq('mall_id', mallId)
        .eq('period_type', periodType)
        .order('period_end', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data ?? []
    },
    staleTime: 15 * 60 * 1000,
  })
}

export { getScoreGrade }
