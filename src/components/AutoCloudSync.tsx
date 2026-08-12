import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import { useSettingsStore } from '../store/settings';
import { useProjectsStore } from '../store/projects';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { prepareCloudSyncPayload } from '../utils/cloudSync';
import { Cloud, CheckCircle2, Loader2 } from 'lucide-react';

export function AutoCloudSync() {
  const { user, syncing, setSyncing, lastSyncedAt, setLastSyncedAt } = useAuthStore();
  const autoSaveEnabled = useSettingsStore(state => state.autoSaveEnabled);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to changes in settings and projects to trigger autosave
  useEffect(() => {
    if (!user || !autoSaveEnabled) return;

    const saveToCloud = async () => {
      setSyncing(true);
      try {
        const settingsState = useSettingsStore.getState();
        const projectsState = useProjectsStore.getState();

        const data = prepareCloudSyncPayload(settingsState, projectsState);

        await setDoc(doc(db, 'users', user.uid), data);
        
        setLastSyncedAt(new Date());
      } catch (error) {
        console.error("Auto save failed", error);
      } finally {
        setSyncing(false);
      }
    };

    const unsubSettings = useSettingsStore.subscribe((state, prevState) => {
      // Avoid saving just because auto save was turned on, etc.
      // But for simplicity, we can debounce on any change.
      triggerSave();
    });

    const unsubProjects = useProjectsStore.subscribe(() => {
      triggerSave();
    });

    const triggerSave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        saveToCloud();
      }, 3000); // 3 second debounce
    };

    return () => {
      unsubSettings();
      unsubProjects();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user, autoSaveEnabled, setSyncing, setLastSyncedAt]);

  if (!user || !autoSaveEnabled) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
      {syncing ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
          <span>Syncing...</span>
        </>
      ) : lastSyncedAt ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          <span>Saved {lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </>
      ) : (
         <>
          <Cloud className="w-3.5 h-3.5" />
          <span>Auto-save ON</span>
         </>
      )}
    </div>
  );
}
