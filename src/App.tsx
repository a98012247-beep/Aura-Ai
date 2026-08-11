import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router';
import { Mic2, Settings, History, X, User as UserIcon, Library, ShieldCheck } from 'lucide-react';
import StudioPage from './pages/Studio';
import SettingsPage from './pages/Settings';
import HistoryPage from './pages/History';
import AccountPage from './pages/Account';
import VoiceLibraryPage from './pages/VoiceLibrary';
import { AdminPage } from './pages/Admin';
import { useSettingsStore } from './store/settings';
import { useAuthStore } from './store/auth';
import { onAuthStateChanged, auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AutoCloudSync } from './components/AutoCloudSync';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const apiKeys = useSettingsStore(state => state.apiKeys);
  const activeKey = apiKeys.find(k => k.isActive);
  const { user, setUser, setLoading, memberProfile, setMemberProfile } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const mDoc = await getDoc(doc(db, 'members', u.uid));
        if (mDoc.exists()) {
          setMemberProfile(mDoc.data());
        } else {
          setMemberProfile(null);
        }
      } else {
        setMemberProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setLoading, setMemberProfile]);

  const isPro = memberProfile?.status === 'active' || memberProfile?.role === 'admin';
  const isAdmin = memberProfile?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 font-sans selection:bg-purple-200 flex flex-col pb-16 md:pb-0 relative overflow-x-hidden">
      {/* Ambient background glow mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[480px] bg-gradient-to-tr from-amber-200/50 via-pink-300/40 to-purple-400/30 blur-[130px] pointer-events-none -z-10 rounded-full" />

      <header className="border-b border-neutral-200/60 bg-white/70 backdrop-blur-2xl sticky top-0 z-50 transition-all shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Mic2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl md:text-lg tracking-tight text-neutral-900">Awavox <span className="font-serif italic font-normal text-purple-600">AI</span></h1>
            </div>
            <span className="ml-1 md:ml-3 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-[10px] font-bold tracking-widest text-purple-700 uppercase hidden sm:inline-block shadow-2xs">
              TTS Pro
            </span>
            <div className="ml-3 hidden sm:flex">
              <AutoCloudSync />
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold">
             <Link 
              to="/" 
              className={`flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-full ${location.pathname === '/' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
             >
               <span>Studio</span>
             </Link>
             <Link 
              to="/history" 
              className={`flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-full whitespace-nowrap ${location.pathname === '/history' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
             >
               <History className="w-4 h-4" />
               History
             </Link>
             <Link 
              to="/voices" 
              className={`flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-full whitespace-nowrap ${location.pathname === '/voices' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
             >
               <Library className="w-4 h-4" />
               Voices
             </Link>
             <Link 
              to="/settings" 
              className={`flex items-center gap-2 transition-all px-3 py-1.5 rounded-full whitespace-nowrap relative ${location.pathname === '/settings' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
             >
               <Settings className="w-4 h-4" />
               Settings 
               {activeKey ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
               ) : (
                  <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
               )}
             </Link>
             {isAdmin && (
               <Link 
                to="/admin" 
                className={`flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-full whitespace-nowrap ${location.pathname === '/admin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-600 hover:bg-indigo-50 font-bold'}`}
               >
                 <ShieldCheck className="w-4 h-4" />
                 Admin
               </Link>
             )}
             <Link
              to="/account"
              className={`flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-full whitespace-nowrap ${location.pathname === '/account' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'}`}
             >
               {user && user.photoURL ? (
                 <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded-full ring-1 ring-neutral-300" />
               ) : (
                 <UserIcon className="w-4 h-4" />
               )}
               {user ? 'Account' : 'Sign In'}
             </Link>
          </nav>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-neutral-200/80 py-2.5 px-6 z-[100] flex items-center justify-around gap-0 text-[10px] font-bold w-full shadow-lg">
         <Link 
          to="/" 
          className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/' ? 'text-purple-600' : 'text-neutral-500 hover:text-neutral-900'}`}
         >
           <Mic2 className="w-5 h-5" />
           <span>Studio</span>
         </Link>
         <Link 
          to="/history" 
          className={`flex flex-col items-center gap-1 transition-colors whitespace-nowrap ${location.pathname === '/history' ? 'text-purple-600' : 'text-neutral-500 hover:text-neutral-900'}`}
         >
           <History className="w-5 h-5" />
           History
         </Link>
         <Link 
          to="/voices" 
          className={`flex flex-col items-center gap-1 transition-colors whitespace-nowrap ${location.pathname === '/voices' ? 'text-purple-600' : 'text-neutral-500 hover:text-neutral-900'}`}
         >
           <Library className="w-5 h-5" />
           Voices
         </Link>
         <Link 
          to="/settings" 
          className={`flex flex-col items-center gap-1 transition-colors whitespace-nowrap relative ${location.pathname === '/settings' ? 'text-purple-600' : 'text-neutral-500 hover:text-neutral-900'}`}
         >
           <Settings className="w-5 h-5" />
           Settings 
           {activeKey ? (
              <span className="absolute top-0 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
           ) : (
              <span className="absolute top-0 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span>
           )}
         </Link>
         {isAdmin && (
           <Link 
            to="/admin" 
            className={`flex flex-col items-center gap-1 transition-colors whitespace-nowrap ${location.pathname === '/admin' ? 'text-indigo-600' : 'text-neutral-500'}`}
           >
             <ShieldCheck className="w-5 h-5" />
             Admin
           </Link>
         )}
         <Link 
          to="/account" 
          className={`flex flex-col items-center gap-1 transition-colors whitespace-nowrap relative ${location.pathname === '/account' ? 'text-purple-600' : 'text-neutral-500 hover:text-neutral-900'}`}
         >
           {user && user.photoURL ? (
             <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded-full" />
           ) : (
             <UserIcon className="w-5 h-5" />
           )}
           {user ? 'Account' : 'Sign In'}
         </Link>
      </nav>

      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<StudioPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/voices" element={<VoiceLibraryPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
