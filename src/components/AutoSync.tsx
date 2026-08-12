import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import { useSettingsStore } from '../store/settings';
import { useProjectsStore } from '../store/projects';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { prepareCloudSyncPayload } from '../utils/cloudSync';

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

        const data = prepareCloudSyncPayload(settingsState, projectsState);

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
