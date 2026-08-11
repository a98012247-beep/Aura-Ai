import React, { useEffect, useState } from 'react';
import { LogIn, LogOut, Cloud, CloudUpload, CloudDownload, User } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { signInWithGoogle, signOut, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useSettingsStore } from '../store/settings';
import { useProjectsStore } from '../store/projects';
import { motion } from 'motion/react';

export default function AccountPage() {
  const { user, lastSyncedAt, syncing: isAutoSyncing } = useAuthStore();
  const { autoSaveEnabled, setAutoSaveEnabled } = useSettingsStore();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSaveToCloud = async () => {
    if (!user) return;
    setSyncing(true);
    setSyncMessage('Saving to cloud...');
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
      
      setSyncMessage('Successfully saved to cloud!');
    } catch (error: any) {
      console.error("Firestore Save Error:", error);
      setSyncMessage(`Failed: ${error.message || error}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  const handleLoadFromCloud = async () => {
    if (!user) return;
    setSyncing(true);
    setSyncMessage('Loading from cloud...');
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      
      if (snap.exists()) {
        const data = snap.data();
        if (data.settings) {
          useSettingsStore.setState(data.settings);
        }
        if (data.projects) {
          useProjectsStore.setState(data.projects);
        }
        setSyncMessage('Successfully loaded from cloud!');
      } else {
        setSyncMessage('No cloud data found.');
      }
    } catch (error) {
      console.error(error);
      setSyncMessage('Failed to load data.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto px-4 py-8 md:py-12 w-full flex items-center justify-center min-h-[50vh]"
      >
        <div className="flex flex-col items-center gap-6 max-w-md text-center bg-white border border-neutral-200/85 p-8 rounded-3xl shadow-xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border border-blue-200">
            <Cloud className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2 text-neutral-900">Cloud <span className="font-serif italic font-normal text-blue-600">Sync</span></h2>
            <p className="text-neutral-600 font-medium text-sm leading-relaxed">
              Sign in with Google to backup your API keys, voice settings, and project history to the cloud, and sync across all your devices.
            </p>
          </div>
          <button
            onClick={handleSignIn}
            className="flex items-center gap-3 bg-neutral-900 hover:bg-neutral-800 text-white px-7 py-3.5 rounded-full text-sm font-bold transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            Sign In with Google
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-4xl mx-auto px-4 py-8 md:py-12 w-full"
    >
      <div className="mb-8 flex items-center justify-between">
         <div>
           <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold tracking-wide uppercase shadow-2xs mb-3">
             <User className="w-3.5 h-3.5 text-blue-600" />
             User Account
           </div>
           <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-neutral-900 mb-2">Account & <span className="font-serif italic font-normal text-blue-600">Sync</span></h2>
           <p className="text-neutral-600 font-medium text-sm">Manage your cloud backups and sync across devices securely.</p>
         </div>
         <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-white text-red-600 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors border border-red-200 shadow-xs"
         >
            <LogOut className="w-3.5 h-3.5 text-red-500" />
            Sign Out
         </button>
      </div>

      <div className="bg-white border border-neutral-200/85 backdrop-blur-2xl rounded-3xl p-6 md:p-8 flex flex-col items-center text-center gap-6 mb-8 shadow-xl">
         <img src={user.photoURL || ''} alt="Profile" className="w-20 h-20 rounded-full bg-neutral-100 border border-neutral-200" />
         <div>
            <h3 className="text-lg font-bold text-neutral-900">{user.displayName}</h3>
            <p className="text-sm text-neutral-600 font-medium">{user.email}</p>
         </div>

         <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-4">
            <button
               onClick={handleSaveToCloud}
               disabled={syncing || isAutoSyncing}
               className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-md hover:scale-105 active:scale-95"
            >
               <CloudUpload className="w-4 h-4 text-purple-400" />
               Save to Cloud
            </button>
            <button
               onClick={handleLoadFromCloud}
               disabled={syncing || isAutoSyncing}
               className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-neutral-50 disabled:opacity-50 text-neutral-800 px-6 py-3 rounded-2xl font-bold text-sm transition-all border border-neutral-200 shadow-xs hover:scale-105 active:scale-95"
            >
               <CloudDownload className="w-4 h-4 text-blue-600" />
               Load from Cloud
            </button>
         </div>

         <div className="flex items-center justify-between w-full max-w-md bg-neutral-50 border border-neutral-200/80 p-4 rounded-2xl mt-2 backdrop-blur-xl">
           <div className="text-left flex flex-col justify-center">
             <h4 className="text-sm font-bold text-neutral-900 mb-0.5 max-h-min py-0">Auto-Save Options</h4>
             <p className="text-xs text-neutral-500 font-medium">Silently backup settings and API keys upon change</p>
           </div>
           <button
             onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
             className={`w-11 h-6 rounded-full transition-colors relative ${autoSaveEnabled ? 'bg-blue-600' : 'bg-neutral-300'}`}
           >
             <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${autoSaveEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
           </button>
         </div>

         {syncMessage && (
            <p className="text-sm text-blue-600 font-bold animate-in fade-in">{syncMessage}</p>
         )}

         {(lastSyncedAt || isAutoSyncing) && (
            <p className="text-xs text-neutral-500 font-medium flex items-center gap-2 animate-in fade-in">
              {isAutoSyncing ? (
                 <>
                   <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                   Auto-saving to cloud...
                 </>
              ) : (
                 <>
                   <span className="w-4 h-4 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">✓</span>
                   Last synced: {lastSyncedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                 </>
              )}
            </p>
         )}
      </div>
    </motion.div>
  );
}
