import { create } from 'zustand';
import { chunkScript } from '../services/textProcessing';
import { generateAudioChunk, mergeAudioChunks, CartesiaError } from '../services/cartesia';
import { useSettingsStore } from './settings';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

interface GenerationState {
  isGenerating: boolean;
  progress: number;
  totalChunks: number;
  currentChunk: number;
  error: string | null;
  statusText: string | null;
  finalAudioBlob: Blob | null;
  finalAudioUrl: string | null;
  generate: (text: string) => Promise<void>;
  reset: () => void;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useGenerationStore = create<GenerationState>()(
  persist(
    (set, get) => ({
      isGenerating: false,
      progress: 0,
      totalChunks: 0,
      currentChunk: 0,
      error: null,
      statusText: null,
      finalAudioBlob: null,
      finalAudioUrl: null,

      reset: () => set({
        isGenerating: false,
        progress: 0,
        totalChunks: 0,
        currentChunk: 0,
        error: null,
        statusText: null,
        finalAudioBlob: null,
        finalAudioUrl: null
      }),

      generate: async (text: string) => {
        if (!text.trim()) {
          set({ error: 'Script is empty.' });
          return;
        }

        const settingsState = useSettingsStore.getState();
        const voiceId = settingsState.getActiveVoiceId();
        const voiceName = settingsState.activeVoiceName;

        if (!voiceId) {
          set({ error: 'No voice selected. Please select a voice from the Voice Library.' });
          return;
        }

        set({
          isGenerating: true,
          error: null,
          statusText: 'Initializing...',
          finalAudioBlob: null,
          finalAudioUrl: null,
          progress: 0,
          currentChunk: 0
        });

        try {
          const { optimizeScript } = await import('../services/textProcessing');

          set({ statusText: 'Optimizing script for speech...' });
          const optimizedText = await optimizeScript(text);

          set({ statusText: 'Chunking script...' });
          const chunks = chunkScript(optimizedText);
          set({ totalChunks: chunks.length });

          const audioBuffers: ArrayBuffer[] = [];

          for (let i = 0; i < chunks.length; i++) {
            set({
              currentChunk: i + 1,
              progress: Math.round((i / chunks.length) * 100),
              statusText: `Generating chunk ${i + 1} of ${chunks.length}...`
            });

            let success = false;
            let attempts = 0;
            const maxAttempts = 3;

            while (!success && attempts < maxAttempts) {
              try {
                const buffer = await generateAudioChunk(chunks[i], voiceId, 'generation');
                audioBuffers.push(buffer);
                success = true;
              } catch (error: any) {
                attempts++;
                console.error(`Chunk ${i + 1} attempt ${attempts} failed:`, error.message);

                const isRateLimit =
                  (error instanceof CartesiaError && error.status === 429) ||
                  (error.message && error.message.toLowerCase().includes('rate limit'));

                if (isRateLimit && attempts < maxAttempts) {
                  const waitTime = Math.pow(2, attempts) * 1000 + (Math.random() * 500);
                  set({ statusText: `Rate limited. Retrying in ${Math.round(waitTime / 1000)}s...` });
                  await sleep(waitTime);
                } else {
                  throw new Error(error.message || 'Error generating audio chunk.');
                }
              }
            }
          }

          set({ progress: 100, statusText: 'Finalizing audio...' });

          const mergedBlob = mergeAudioChunks(audioBuffers);

          const reader = new FileReader();
          reader.onloadend = async () => {
            const url = reader.result as string;

            const title = text.split('\n').filter(l => l.trim() !== '')[0] || 'Untitled Project';
            const { useProjectsStore } = await import('./projects');
            useProjectsStore.getState().addProject({
              title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
              script: text,
              audioUrl: url,
              voiceSettings: useSettingsStore.getState().voiceSettings,
              cinematicSettings: useSettingsStore.getState().cinematicSettings,
              voiceName: voiceName || 'Cartesia Voice',
            });

            set({
              finalAudioBlob: mergedBlob,
              finalAudioUrl: url,
              isGenerating: false,
              statusText: null
            });
          };
          reader.readAsDataURL(mergedBlob);

        } catch (e: any) {
          set({ error: e.message || 'An unexpected error occurred.', isGenerating: false, statusText: null });
        }
      }
    }), {
      name: 'aura-generation-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ finalAudioUrl: state.finalAudioUrl }),
    })
);
