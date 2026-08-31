import { create } from 'zustand';
import { MASTER_CARTESIA_VOICES } from '../data/cartesiaVoices';

interface VoiceStore {
  voices: any[];
  isLoading: boolean;
  error: string | null;
  fetchCartesiaVoices: () => Promise<void>;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  voices: MASTER_CARTESIA_VOICES,
  isLoading: false,
  error: null,
  fetchCartesiaVoices: async () => {
    // Voices are now hardcoded and statically imported from cartesiaVoices.ts
    // This prevents voices from disappearing if the Cartesia API key is changed or deleted.
    // The Sync Voices button in Admin panel can be used to update the static list in development.
    set({ voices: MASTER_CARTESIA_VOICES, isLoading: false, error: null });
  }
}));
