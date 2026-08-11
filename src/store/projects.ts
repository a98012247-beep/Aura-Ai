import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { get, set, del } from 'idb-keyval';
import { CinematicSettings, VoiceSettings } from './settings';

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

export interface HistoryProject {
  id: string;
  title: string;
  script: string;
  audioUrl: string;
  voiceSettings: VoiceSettings;
  cinematicSettings: CinematicSettings;
  createdAt: number;
  duration?: number;
  voiceName?: string;
}

interface ProjectsState {
  projects: HistoryProject[];
  draftScript: string;
  addProject: (project: Omit<HistoryProject, 'id' | 'createdAt'>) => HistoryProject;
  deleteProject: (id: string) => void;
  updateDraftScript: (script: string) => void;
  getProject: (id: string) => HistoryProject | undefined;
  updateProjectVoiceName: (id: string, voiceName: string) => void;
  updateProjectTitle: (id: string, title: string) => void;
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      draftScript: '',
      addProject: (projectData) => {
        const newProject: HistoryProject = {
          ...projectData,
          id: `project-${uuidv4()}`,
          createdAt: Date.now(),
        };
        set((state) => ({
          projects: [newProject, ...state.projects], // newest first
        }));
        return newProject;
      },
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter(p => p.id !== id),
        })),
      updateDraftScript: (script) =>
        set({ draftScript: script }),
      getProject: (id) => get().projects.find(p => p.id === id),
      updateProjectVoiceName: (id, voiceName) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, voiceName } : p
          ),
        })),
      updateProjectTitle: (id, title) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, title } : p
          ),
        })),
    }),
    {
      name: 'aura-voice-projects',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
