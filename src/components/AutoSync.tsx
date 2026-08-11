import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import { useSettingsStore } from '../store/settings';
import { useProjectsStore } from '../store/projects';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export function AutoSync() {
  const { user, setLastSyncedAt, setSyncing } = useAuthStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;

    const handleSave = async () => {
      setSyncing(true);
      try {
        const settingsState = useSettingsStore.getState();
        const projectsState = useProjectsStore.getState();

        const plainData = JSON.parse(JSON.stringify({
          settings: {
            apiKeys: settingsState.apiKeys,
            voiceSettings: settingsState.voiceSettings,
            cinematicSettings: settingsState.cinematicSettings,
            voiceProfiles: settingsState.voiceProfiles,
            activeProfileId: settingsState.activeProfileId,
          },
          projects: {
            projects: projectsState.projects,
          },
        }));

        const data = {
          ...plainData,
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', user.uid), data);
        setLastSyncedAt(new Date());
      } catch (error) {
        console.error('AutoSave Error:', error);
      } finally {
        setSyncing(false);
      }
    };

    const triggerSave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(handleSave, 2000); // 2 second debounce
    };

    const unsubSettings = useSettingsStore.subscribe((state, prevState) => {
       triggerSave();
    });

    const unsubProjects = useProjectsStore.subscribe((state, prevState) => {
       triggerSave();
    });

    return () => {
      unsubSettings();
      unsubProjects();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user, setLastSyncedAt, setSyncing]);

  return null;
}
