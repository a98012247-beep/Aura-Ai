import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export type StorytellingMode = 'documentary' | 'mystery' | 'political' | 'dark cinematic' | 'educational' | 'historical';

export interface CinematicSettings {
  speed: number;
  pauseIntensity: number;
  emphasisEngine: boolean;
  humanImperfection: boolean;
  clarityBoost: boolean;
  emotionControl: number;
  storytellingMode: StorytellingMode;
  cinematicIntensity: number;
  realism: number;
  narrationEnergy: number;
  dictionClarity: number;
  storytellingTension: number;
}

export interface VoiceProfile {
  id: string;
  name: string;
  isPreset: boolean;
  voiceSettings: VoiceSettings;
  cinematicSettings: CinematicSettings;
}

export const PRESET_PROFILES: VoiceProfile[] = [
  {
    id: 'preset-documentary-classic',
    name: 'Documentary Classic',
    isPreset: true,
    voiceSettings: { stability: 0.78, similarity_boost: 0.90, style: 0.18, use_speaker_boost: true },
    cinematicSettings: {
      speed: 0.92, pauseIntensity: 1.0, emphasisEngine: true, humanImperfection: true, clarityBoost: true,
      emotionControl: 35, storytellingMode: 'documentary', cinematicIntensity: 60, realism: 80,
      narrationEnergy: 40, dictionClarity: 85, storytellingTension: 50
    }
  },
  {
    id: 'preset-dark-cinematic',
    name: 'Dark Cinematic',
    isPreset: true,
    voiceSettings: { stability: 0.85, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true },
    cinematicSettings: {
      speed: 0.85, pauseIntensity: 1.5, emphasisEngine: true, humanImperfection: true, clarityBoost: false,
      emotionControl: 20, storytellingMode: 'dark cinematic', cinematicIntensity: 90, realism: 70,
      narrationEnergy: 20, dictionClarity: 70, storytellingTension: 90
    }
  },
  {
    id: 'preset-political-storytelling',
    name: 'Political Storytelling',
    isPreset: true,
    voiceSettings: { stability: 0.7, similarity_boost: 0.95, style: 0.4, use_speaker_boost: true },
    cinematicSettings: {
      speed: 1.0, pauseIntensity: 0.8, emphasisEngine: true, humanImperfection: false, clarityBoost: true,
      emotionControl: 60, storytellingMode: 'political', cinematicIntensity: 40, realism: 85,
      narrationEnergy: 70, dictionClarity: 100, storytellingTension: 60
    }
  },
  {
    id: 'preset-mystery',
    name: 'Mystery Narration',
    isPreset: true,
    voiceSettings: { stability: 0.82, similarity_boost: 0.88, style: 0.25, use_speaker_boost: true },
    cinematicSettings: {
      speed: 0.88, pauseIntensity: 1.3, emphasisEngine: true, humanImperfection: true, clarityBoost: true,
      emotionControl: 40, storytellingMode: 'mystery', cinematicIntensity: 80, realism: 75,
      narrationEnergy: 30, dictionClarity: 80, storytellingTension: 85
    }
  },
  {
    id: 'preset-historical',
    name: 'Historical Documentary',
    isPreset: true,
    voiceSettings: { stability: 0.75, similarity_boost: 0.92, style: 0.15, use_speaker_boost: true },
    cinematicSettings: {
      speed: 0.90, pauseIntensity: 1.1, emphasisEngine: false, humanImperfection: true, clarityBoost: true,
      emotionControl: 30, storytellingMode: 'historical', cinematicIntensity: 50, realism: 90,
      narrationEnergy: 35, dictionClarity: 90, storytellingTension: 45
    }
  },
  {
    id: 'preset-emotional',
    name: 'Emotional Storytelling',
    isPreset: true,
    voiceSettings: { stability: 0.65, similarity_boost: 0.85, style: 0.5, use_speaker_boost: true },
    cinematicSettings: {
      speed: 0.95, pauseIntensity: 1.2, emphasisEngine: true, humanImperfection: true, clarityBoost: true,
      emotionControl: 85, storytellingMode: 'documentary', cinematicIntensity: 70, realism: 65,
      narrationEnergy: 50, dictionClarity: 80, storytellingTension: 70
    }
  },
  {
    id: 'preset-calm-educational',
    name: 'Calm Educational',
    isPreset: true,
    voiceSettings: { stability: 0.9, similarity_boost: 0.95, style: 0.05, use_speaker_boost: false },
    cinematicSettings: {
      speed: 1.05, pauseIntensity: 0.5, emphasisEngine: false, humanImperfection: false, clarityBoost: true,
      emotionControl: 10, storytellingMode: 'educational', cinematicIntensity: 20, realism: 95,
      narrationEnergy: 45, dictionClarity: 100, storytellingTension: 20
    }
  },
  {
    id: 'preset-youtube',
    name: 'High Retention YouTube',
    isPreset: true,
    voiceSettings: { stability: 0.7, similarity_boost: 0.8, style: 0.6, use_speaker_boost: true },
    cinematicSettings: {
      speed: 1.10, pauseIntensity: 0.3, emphasisEngine: true, humanImperfection: false, clarityBoost: true,
      emotionControl: 70, storytellingMode: 'documentary', cinematicIntensity: 30, realism: 60,
      narrationEnergy: 90, dictionClarity: 85, storytellingTension: 80
    }
  }
];

interface SettingsState {
  // Active voice selection (single source of truth — no API keys on frontend)
  activeVoiceId: string;
  activeVoiceName: string;
  setActiveVoice: (voiceId: string, voiceName: string) => void;
  getActiveVoiceId: () => string;

  // Cinematic & voice settings
  voiceSettings: VoiceSettings;
  cinematicSettings: CinematicSettings;
  voiceProfiles: VoiceProfile[];
  activeProfileId: string | null;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  updateCinematicSettings: (settings: Partial<CinematicSettings>) => void;
  saveVoiceProfile: (name: string) => void;
  deleteVoiceProfile: (id: string) => void;
  applyVoiceProfile: (id: string) => void;
  resetToDefaultProfile: () => void;
}

// Default voice: "Jade - Steady Companion" from Cartesia
const DEFAULT_VOICE_ID = '92579402-6868-412e-b845-3efed0be7a9e';
const DEFAULT_VOICE_NAME = 'Jade - Steady Companion';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      activeVoiceId: DEFAULT_VOICE_ID,
      activeVoiceName: DEFAULT_VOICE_NAME,
      voiceProfiles: [],
      autoSaveEnabled: false,
      activeProfileId: PRESET_PROFILES[0].id,
      voiceSettings: { ...PRESET_PROFILES[0].voiceSettings },
      cinematicSettings: { ...PRESET_PROFILES[0].cinematicSettings },

      setActiveVoice: (voiceId: string, voiceName: string) =>
        set({ activeVoiceId: voiceId, activeVoiceName: voiceName }),

      getActiveVoiceId: () => get().activeVoiceId || DEFAULT_VOICE_ID,

      updateVoiceSettings: (settings) =>
        set((state) => ({
          voiceSettings: { ...state.voiceSettings, ...settings },
          activeProfileId: null,
        })),
      updateCinematicSettings: (settings) =>
        set((state) => ({
          cinematicSettings: { ...state.cinematicSettings, ...settings },
          activeProfileId: null,
        })),
      saveVoiceProfile: (name: string) =>
        set((state) => {
          const newProfile: VoiceProfile = {
            id: `custom-profile-${uuidv4()}`,
            name,
            isPreset: false,
            voiceSettings: { ...state.voiceSettings },
            cinematicSettings: { ...state.cinematicSettings }
          };
          return {
            voiceProfiles: [...state.voiceProfiles, newProfile],
            activeProfileId: newProfile.id
          };
        }),
      deleteVoiceProfile: (id: string) =>
        set((state) => {
          const isDeletingActive = state.activeProfileId === id;
          return {
            voiceProfiles: state.voiceProfiles.filter(p => p.id !== id),
            activeProfileId: isDeletingActive ? null : state.activeProfileId
          };
        }),
      applyVoiceProfile: (id: string) =>
        set((state) => {
          const profile = PRESET_PROFILES.find(p => p.id === id) || state.voiceProfiles.find(p => p.id === id);
          if (profile) {
            return {
              activeProfileId: id,
              voiceSettings: { ...profile.voiceSettings },
              cinematicSettings: { ...profile.cinematicSettings },
            };
          }
          return {};
        }),
      resetToDefaultProfile: () =>
        set(() => ({
          activeProfileId: PRESET_PROFILES[0].id,
          voiceSettings: { ...PRESET_PROFILES[0].voiceSettings },
          cinematicSettings: { ...PRESET_PROFILES[0].cinematicSettings },
        })),
      setAutoSaveEnabled: (enabled: boolean) => set({ autoSaveEnabled: enabled }),
    }),
    {
      name: 'aura-voice-settings',
    }
  )
);
