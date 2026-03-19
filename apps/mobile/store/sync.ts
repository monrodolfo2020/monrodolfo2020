import { create } from 'zustand'

type SyncStatus = 'idle' | 'syncing' | 'error'

interface SyncState {
  status: SyncStatus
  progress: string | null
  lastSyncedAt: Date | null
  pendingUploads: number
  setStatus: (status: SyncStatus, progress?: string) => void
  setLastSyncedAt: (date: Date) => void
  setPendingUploads: (count: number) => void
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  progress: null,
  lastSyncedAt: null,
  pendingUploads: 0,
  setStatus: (status, progress = null) => set({ status, progress }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setPendingUploads: (pendingUploads) => set({ pendingUploads }),
}))
