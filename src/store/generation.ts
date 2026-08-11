import { create } from 'zustand';
import { chunkScript } from '../services/textProcessing';
import { generateAudioChunk, mergeAudioChunks, verifyVoiceAccess, ElevenLabsError } from '../services/elevenlabs';
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

    const { getActiveKey, autoSwitchKey } = useSettingsStore.getState();
    let currentApiKey = getActiveKey();

    if (!currentApiKey) {
      set({ error: 'No active API key found. Please add one in Settings.' });
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
      set({ statusText: 'Verifying voice access...' });
      const hasVoice = await verifyVoiceAccess(currentApiKey);
      if (!hasVoice) {
         set({ error: 'The currently mapped voice ID is not available in this API key account. Please go to Settings to map a valid voice.', isGenerating: false, statusText: null });
         return;
      }
      
      const { optimizeScript } = await import('../services/textProcessing');
      const optimizedText = optimizeScript(text);
      
      set({ totalChunks: 1 });
      
      const audioBuffers: ArrayBuffer[] = [];

      set({ 
        currentChunk: 1, 
        progress: 50,
        statusText: `Generating audio...`
      });
      
      let success = false;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (!success && attempts < maxAttempts) {
        try {
           const buffer = await generateAudioChunk(optimizedText, currentApiKey!);
           audioBuffers.push(buffer);
           success = true;
        } catch (error: any) {
           console.error(`Generation attempt ${attempts+1} failed`, error);
           
           const isRateLimit = 
             (error instanceof ElevenLabsError && error.status === 429) || 
             (error.message && error.message.toLowerCase().includes('rate limit'));

           const isUnusualActivity = error.message && error.message.toLowerCase().includes('unusual activity');

           if (isRateLimit && !isUnusualActivity) {
             attempts++;
             if (attempts >= maxAttempts) {
               throw new Error('API Rate Limit exceeded after multiple retries.');
             }
             
             const waitTime = Math.pow(2, attempts) * 1000 + (Math.random() * 500);
             set({ statusText: `Temporary API cooldown. Retrying in ${Math.round(waitTime/1000)}s...` });
             await sleep(waitTime);
           } else if ((error instanceof ElevenLabsError && error.status === 401) || isUnusualActivity) {
               const switched = autoSwitchKey();
               if (switched) {
                 currentApiKey = getActiveKey();
                 console.log('Switched to next API key', currentApiKey);
                 set({ statusText: 'Key exhausted. Switched to new API key. Retrying...' });
                 // continue loop to retry immediately with new key
               } else {
                 throw new Error('All API keys exhausted or invalid.');
               }
           } else {
               throw new Error(error.message || 'Error generating audio.');
           }
        }
      }

      set({ progress: 100, statusText: 'Finalizing audio...' });
      
      const mergedBlob = mergeAudioChunks(audioBuffers);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const url = reader.result as string;
        
        // Auto-save to projects store
        const title = text.split('\n').filter(l => l.trim() !== '')[0] || 'Untitled Project';
        
        // Wait to import here to avoid circular dep if needed, but it's safe at top
        const { useProjectsStore } = await import('./projects');
        const activeKeyStr = useSettingsStore.getState().getActiveKey();
        const activeKeyData = useSettingsStore.getState().apiKeys.find(k => k.key === activeKeyStr);
        useProjectsStore.getState().addProject({
          title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
          script: text,
          audioUrl: url,
          voiceSettings: useSettingsStore.getState().voiceSettings,
          cinematicSettings: useSettingsStore.getState().cinematicSettings,
          voiceName: activeKeyData?.voiceName || 'Default Aura Voice',
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
  partialize: (state) => ({ finalAudioUrl: state.finalAudioUrl }), // Only persist audio URL
}));
