import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router';
import { Mic2, Settings, History, X, User as UserIcon, Library, ShieldCheck, LayoutDashboard, Users, Activity, DollarSign, Key, MessageSquareWarning, ShieldAlert } from 'lucide-react';
import Home from './pages/Home';
import StudioPage from './pages/Studio';
import SettingsPage from './pages/Settings';
import HistoryPage from './pages/History';
import AccountPage from './pages/Account';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import VoiceLibraryPage from './pages/VoiceLibrary';
import { AdminPage } from './pages/Admin';
import { useSettingsStore } from './store/settings';
import { useAuthStore } from './store/auth';
import { onAuthStateChanged, auth, db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

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
    <div className="h-screen bg-neutral-900 text-neutral-900 font-sans selection:bg-purple-200 flex overflow-hidden relative">
      {/* Ambient background glow mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-purple-900/40 via-indigo-900/20 to-pink-900/30 blur-[130px] pointer-events-none -z-10 rounded-full" />

      {/* Desktop Sidebar Nav */}
      <aside className="hidden md:flex flex-col w-64 bg-neutral-900/80 backdrop-blur-3xl border-r border-neutral-800/60 h-full z-50 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(168,85,247,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)]">
              <Mic2 className="w-5 h-5 drop-shadow-md" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl tracking-tight text-white drop-shadow-md">Awavox <span className="font-serif italic font-normal text-purple-400">AI</span></h1>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden">
           {!location.pathname.startsWith('/admin') ? (
             <>
               <Link 
                to="/" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname === '/' ? 'bg-neutral-800/80 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'}`}
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
             <span>Home</span>
           </Link>
           <Link 
            to="/studio" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname === '/studio' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'}`}
           >
             <Mic2 className="w-5 h-5" />
             <span>Studio</span>
           </Link>
           <Link 
            to="/voices" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname === '/voices' ? 'bg-neutral-800/80 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'}`}
           >
             <Library className="w-5 h-5" />
             <span>Voice Library</span>
           </Link>
           <Link 
            to="/history" 
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname === '/history' ? 'bg-neutral-800/80 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'}`}
           >
             <History className="w-5 h-5" />
             <span>History</span>
           </Link>
           
           <div className="pt-6 pb-2 px-4">
             <div className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-500 mb-2">Configuration</div>
             <Link 
              to="/settings" 
              className={`flex items-center gap-3 px-4 py-3 -mx-4 rounded-2xl font-bold transition-all relative ${location.pathname === '/settings' ? 'bg-neutral-800/80 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'}`}
             >
               <Settings className="w-5 h-5" />
               <span>Settings</span>
               {activeKey ? (
                  <span className="absolute right-4 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
               ) : (
                  <span className="absolute right-4 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
               )}
             </Link>
           </div>
           
           <div className="mt-8 flex justify-between px-5 pb-4">
             <Link to="/about" className="text-[8px] font-extrabold text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider">About</Link>
             <Link to="/contact" className="text-[8px] font-extrabold text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider">Contact</Link>
             <Link to="/terms" className="text-[8px] font-extrabold text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider">Terms</Link>
             <Link to="/privacy" className="text-[8px] font-extrabold text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider">Privacy</Link>
           </div>
           </>
         ) : (
           isAdmin && (
             <div className="mb-2 mt-4 px-4">
               <div className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500/70 mb-2 px-4 flex items-center gap-1">
                 <ShieldCheck className="w-3 h-3" /> Management Portal
               </div>
               <Link 
                to="/admin/dashboard" 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname.includes('/admin/dashboard') ? 'bg-indigo-900/50 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-900/20'}`}
               >
                 <LayoutDashboard className="w-4 h-4" /> <span>Dashboard</span>
               </Link>
               <Link 
                to="/admin/members" 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname.includes('/admin/members') ? 'bg-indigo-900/50 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-900/20'}`}
               >
                 <Users className="w-4 h-4" /> <span>Pro Members</span>
               </Link>
               <Link 
                to="/admin/generations" 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname.includes('/admin/generations') ? 'bg-indigo-900/50 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-900/20'}`}
               >
                 <Activity className="w-4 h-4" /> <span>Generations</span>
               </Link>
               <Link 
                to="/admin/earnings" 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname.includes('/admin/earnings') ? 'bg-indigo-900/50 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-900/20'}`}
               >
                 <DollarSign className="w-4 h-4" /> <span>Earnings</span>
               </Link>
               <Link 
                to="/admin/api-keys" 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname.includes('/admin/api-keys') ? 'bg-indigo-900/50 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-900/20'}`}
               >
                 <Key className="w-4 h-4" /> <span>API Integrations</span>
               </Link>
               <Link 
                to="/admin/settings" 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname.includes('/admin/settings') ? 'bg-indigo-900/50 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-900/20'}`}
               >
                 <Settings className="w-4 h-4" /> <span>Global Settings</span>
               </Link>
               <Link 
                to="/admin/feedback" 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname.includes('/admin/feedback') ? 'bg-indigo-900/50 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-900/20'}`}
               >
                 <MessageSquareWarning className="w-4 h-4" /> <span>Feedback & Bugs</span>
               </Link>
               <Link 
                to="/admin/moderation" 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname.includes('/admin/moderation') ? 'bg-indigo-900/50 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-900/20'}`}
               >
                 <ShieldCheck className="w-4 h-4" /> <span>Moderation</span>
               </Link>
               <Link 
                to="/admin/security" 
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname.includes('/admin/security') ? 'bg-red-900/50 text-red-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-red-400/70 hover:text-red-300 hover:bg-red-900/10'}`}
               >
                 <ShieldAlert className="w-4 h-4" /> <span>Anti-Abuse</span>
               </Link>
             </div>
           )
         )}
        </nav>

        {!location.pathname.startsWith('/admin') ? (
          <div className="p-4 mt-auto border-t border-neutral-800/60">
             <Link
              to="/account"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${location.pathname === '/account' ? 'bg-neutral-800/80 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'}`}
             >
               {user && user.photoURL ? (
                 <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-neutral-700 shadow-sm" />
               ) : (
                 <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                   <UserIcon className="w-4 h-4" />
                 </div>
               )}
               <div className="flex flex-col">
                 <span className="text-sm leading-tight text-white">{user ? (memberProfile?.name || 'Account') : 'Sign In'}</span>
                 {user && (
                   <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{isPro ? 'Pro Member' : 'Free Plan'}</span>
                 )}
               </div>
             </Link>
          </div>
        ) : (
          <div className="p-4 mt-auto border-t border-neutral-800/60">
             <Link
              to="/"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-neutral-400 hover:text-white hover:bg-neutral-800/40 transition-all"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
               <span className="text-sm">Back to Website</span>
             </Link>
          </div>
        )}
      </aside>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-neutral-900/90 backdrop-blur-2xl border border-neutral-800/80 rounded-3xl py-3 px-6 z-[100] flex items-center justify-around gap-0 text-[10px] font-bold shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
         <Link to="/" className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
           <span>Home</span>
         </Link>
         <Link to="/studio" className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/studio' ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'text-neutral-500 hover:text-neutral-300'}`}>
           <Mic2 className="w-5 h-5" />
           <span>Studio</span>
         </Link>
         <Link to="/voices" className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/voices' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
           <Library className="w-5 h-5" />
           <span>Library</span>
         </Link>
         <Link to="/settings" className={`flex flex-col items-center gap-1 transition-colors relative ${location.pathname === '/settings' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
           <Settings className="w-5 h-5" />
           <span>Settings</span>
           {activeKey && <span className="absolute top-0 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>}
         </Link>
         <Link to="/account" className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/account' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}>
           <UserIcon className="w-5 h-5" />
           <span>Account</span>
         </Link>
      </nav>

      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-neutral-50 pb-24 md:pb-0 rounded-l-[40px] shadow-[-10px_0_30px_rgba(0,0,0,0.15)] relative z-10">
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
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/voices" element={<VoiceLibraryPage />} />
          <Route path="/admin/:tab?" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
