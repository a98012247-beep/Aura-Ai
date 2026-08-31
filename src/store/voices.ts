import { create } from 'zustand';
import { MASTER_CARTESIA_VOICES } from '../data/cartesiaVoices';
import { fetchVoices } from '../services/cartesia';

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
    try {
      set({ isLoading: true, error: null });
      const apiVoices = await fetchVoices();
      
      // Map API voices to match our UI format
      const rawData = apiVoices as any;
      const rawList = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData?.voices) ? rawData.voices : []));
      
      if (rawList && rawList.length > 0) {
        const mappedVoices = rawList.map((v: any) => ({
          id: v.id,
          name: v.name,
          description: v.description || "",
          language: v.language || "en",
          gender: v.gender || "neutral",
          country: v.country || "US",
          is_high_quality: true,
          is_public: v.is_public !== false,
          accents_locales: Array.isArray(v.accents) ? v.accents.map((a: any) => a.locale || a.accent || a).join(', ') : (v.language_locales?.join(', ') || v.language || 'en'),
          age: v.age || "Middle-Aged"
        }));
        set({ voices: mappedVoices, isLoading: false, error: null });
      } else {
        set({ voices: MASTER_CARTESIA_VOICES, isLoading: false, error: null });
      }
    } catch (e: any) {
      console.warn("Failed to fetch custom cartesia voices, using defaults:", e.message);
      set({ voices: MASTER_CARTESIA_VOICES, isLoading: false, error: null });
    }
  }
}));
