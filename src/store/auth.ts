import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  memberProfile: any | null;
  loading: boolean;
  lastSyncedAt: Date | null;
  syncing: boolean;
  setUser: (user: User | null) => void;
  setMemberProfile: (profile: any | null) => void;
  setLoading: (loading: boolean) => void;
  setLastSyncedAt: (date: Date | null) => void;
  setSyncing: (syncing: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  memberProfile: null,
  loading: true,
  lastSyncedAt: null,
  syncing: false,
  setUser: (user) => set({ user }),
  setMemberProfile: (memberProfile) => set({ memberProfile }),
  setLoading: (loading) => set({ loading }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setSyncing: (syncing) => set({ syncing }),
}));
