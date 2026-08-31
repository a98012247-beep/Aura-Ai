import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, User, Lock, Mail, UserPlus, Phone, ShieldCheck, Zap, Sparkles, MessageCircle, Users, FileText, Info, HelpCircle } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { logIn, signUp, signOut, googleLogin, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { SubscriptionPopup } from '../components/SubscriptionPopup';
import { motion } from 'motion/react';

export default function AccountPage() {
  const { user, memberProfile, setMemberProfile } = useAuthStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSignUp, setIsSignUp] = useState(true); // Register shown first!
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  
  // Inline edit state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');

  // Fetch updated profile when user changes
  useEffect(() => {
    if (user && !memberProfile) {
      getDoc(doc(db, 'members', user.uid)).then(snap => {
        if (snap.exists()) {
          setMemberProfile(snap.data());
        }
      }).catch(console.error);
    }
  }, [user, memberProfile, setMemberProfile]);

  const ALLOWED_DOMAINS = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'proton.me', 'protonmail.com'];

  const validateEmail = (val: string) => {
    if (!val) {
      setEmailError('');
      return false;
    }
    const domain = val.split('@')[1];
    if (!domain) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    if (!ALLOWED_DOMAINS.includes(domain.toLowerCase())) {
      setEmailError('Please use a Gmail, Outlook, Yahoo, iCloud, or Proton email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const calculatePasswordStrength = (val: string) => {
    let score = 0;
    if (val.length >= 8) score += 1;
    if (/[A-Z]/.test(val)) score += 1;
    if (/[0-9]/.test(val)) score += 1;
    if (/[^A-Za-z0-9]/.test(val)) score += 1;
    setPasswordStrength(score);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (isSignUp) calculatePasswordStrength(val);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        if (!validateEmail(email)) {
          setError('Please use an allowed email provider.');
          setLoading(false);
          return;
        }
        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        const generatedName = email.trim().split('@')[0];
        await signUp(generatedName, phone.trim() || 'N/A', email.trim(), password);
      } else {
        await logIn(email.trim(), password);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || 'Authentication failed. Please check your details.';
      if (msg.includes('auth/invalid-credential')) {
        msg = 'Invalid password or account does not exist. Switch to Register if you are new.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await googleLogin();
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNameUpdate = async () => {
    if (!editName.trim() || !user) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateDoc(doc(db, 'members', user.uid), { name: editName.trim() });
      setMemberProfile({ ...memberProfile, name: editName.trim() });
    } catch (err) {
      console.error(err);
    }
    setIsEditingName(false);
  };

  // 1. Unauthenticated View (Register First)
  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto px-4 py-8 md:py-12 w-full flex items-center justify-center min-h-[60vh]"
      >
        <div className="flex flex-col items-center gap-3 w-full max-w-[320px] text-center bg-white/70 border border-white/60 p-5 rounded-[1.5rem] shadow-[0_16px_40px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,1)] backdrop-blur-3xl relative overflow-hidden">
          {/* subtle decorative gradients */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-400/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center border border-purple-200/60 shadow-[0_4px_12px_rgba(168,85,247,0.1),inset_0_2px_4px_rgba(255,255,255,1)] z-10 relative">
            <User className="w-4 h-4 text-purple-600 drop-shadow-sm" />
          </div>
          <div className="z-10 relative">
            <h2 className="text-lg md:text-xl font-extrabold mb-1 text-neutral-900 drop-shadow-sm">
              {isSignUp ? 'Create ' : 'Sign In '}
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                {isSignUp ? 'Account' : 'To Studio'}
              </span>
            </h2>
            <p className="text-neutral-500 font-medium text-[10px] leading-relaxed max-w-[220px] mx-auto">
              {isSignUp ? 'Register your account to get started with Awavox AI Studio.' : 'Sign in to access your profile and created audio.'}
            </p>
          </div>

          {/* Toggle Tabs: Register FIRST, then Sign In */}
          <div className="flex bg-neutral-100/80 p-1 rounded-xl w-full border border-neutral-200/80 text-[9px] font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] z-10 relative">
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${isSignUp ? 'bg-white text-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${!isSignUp ? 'bg-white text-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="w-full space-y-3 text-left z-10 relative mt-2">
            <div>
              <label className="block text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400 group-focus-within:text-purple-500 transition-colors z-10" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={(e) => isSignUp && validateEmail(e.target.value)}
                  className={`w-full pl-7 pr-3 py-2 bg-white/60 backdrop-blur-sm border ${emailError ? 'border-red-400 focus:ring-red-100/50' : 'border-neutral-200/80 focus:ring-purple-100/50 focus:border-purple-300'} rounded-xl focus:ring-4 outline-none font-medium text-neutral-900 transition-all text-[10px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(255,255,255,0.8)]`}
                  placeholder="name@email.com"
                  required
                />
              </div>
              {emailError && (
                <p className="mt-1 text-[9px] font-bold text-red-500 ml-1">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400 group-focus-within:text-purple-500 transition-colors z-10" />
                <input 
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full pl-7 pr-3 py-2 bg-white/60 backdrop-blur-sm border border-neutral-200/80 rounded-xl focus:ring-4 focus:ring-purple-100/50 outline-none font-medium text-neutral-900 transition-all text-[10px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(255,255,255,0.8)] focus:border-purple-300"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>



            {error && (
              <p className="text-xs text-red-600 font-bold bg-red-50/80 backdrop-blur-sm p-3 rounded-xl border border-red-200 shadow-[inset_0_1px_4px_rgba(239,68,68,0.1)]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-900 text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-[0_8px_20px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:hover:translate-y-0 mt-1"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Continue with Email' : 'Sign In with Email')}
            </button>
            
            <div className="relative flex items-center justify-center my-3 w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200/60"></div>
              </div>
              <div className="relative bg-white/70 backdrop-blur-xl px-2 text-[8px] font-black uppercase tracking-widest text-neutral-400">
                Or
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSubmit}
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full bg-white border border-neutral-200/80 hover:bg-neutral-50 text-neutral-900 px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-3.5 h-3.5">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest z-10 relative">
            Awavox AI Studio
          </p>
        </div>
      </motion.div>
    );
  }

  // 2. Authenticated Profile View ("Your Profile")
  const displayName = memberProfile?.name || user.displayName || 'User';
  const displayEmail = memberProfile?.email || user.email || '';
  const isPro = memberProfile?.role === 'pro' || memberProfile?.role === 'admin';
  const roleLabel = memberProfile?.role === 'admin' ? 'Admin' : (isPro ? 'Pro' : 'Free');
  const userInitial = displayName.trim().length > 0 ? displayName.trim()[0].toUpperCase() : 'U';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full px-4 md:px-6 py-6"
    >
      <SubscriptionPopup isOpen={showSubscription} onClose={() => setShowSubscription(false)} />

      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div>
             <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 mb-1 drop-shadow-sm">
               Your <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Account.</span>
             </h2>
             <p className="text-neutral-500 font-medium text-xs mt-1">Manage your personal details and plan.</p>
           </div>
           <button
              onClick={handleSignOut}
              className="self-start sm:self-auto flex items-center gap-1.5 bg-white/80 backdrop-blur-sm text-red-600 px-4 py-2 rounded-xl text-[10px] font-black hover:text-red-700 transition-all border border-red-200/80 shadow-sm hover:-translate-y-0.5 shrink-0"
           >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              Sign Out
           </button>
        </div>
        <div className="w-full">
          <div className="bg-white/70 border border-white/60 backdrop-blur-3xl rounded-[2.5rem] p-6 lg:p-8 flex flex-col md:flex-row gap-6 lg:gap-8 shadow-[0_16px_40px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] relative overflow-hidden">
            
            {/* LEFT COLUMN */}
            <div className="flex-1 flex flex-col gap-6">
               {/* Top Identity Header */}
               <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-5 border-b border-neutral-200/60 relative z-10">
                 {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-16 h-16 rounded-[1.25rem] bg-neutral-100 border border-white object-cover shadow-sm" />
                 ) : (
                    <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 border border-white/40 flex items-center justify-center text-white shadow-sm relative overflow-hidden group shrink-0">
                       <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                       <span className="font-extrabold text-2xl tracking-tight text-white drop-shadow-sm">{userInitial}</span>
                    </div>
                 )}
                 <div className="text-center sm:text-left flex-1 mt-1">
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2">
                      {isEditingName ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={handleNameUpdate}
                          onKeyDown={(e) => e.key === 'Enter' && handleNameUpdate()}
                          className="text-xl font-black text-neutral-900 bg-white/50 border border-purple-200 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-purple-300 w-32 md:w-48 text-center sm:text-left"
                          autoFocus
                        />
                      ) : (
                        <h3 
                          className="text-xl font-black text-neutral-900 drop-shadow-sm cursor-pointer hover:text-purple-600 transition-colors title-edit-tooltip" 
                          onClick={() => {
                            setEditName(displayName);
                            setIsEditingName(true);
                          }}
                          title="Click to edit name"
                        >
                          {displayName}
                        </h3>
                      )}
                      {roleLabel !== 'Free' && (
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                          roleLabel === 'Admin' 
                            ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-800 border-indigo-200' 
                            : 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-800 border-purple-200'
                        }`}>
                          {roleLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500 font-medium mt-1">{displayEmail}</p>
                 </div>
               </div>

               {/* Profile Details Grid */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
                 <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 p-3.5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                   <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest block mb-0.5">Name</span>
                   <p className="text-[10px] font-bold text-neutral-900 line-clamp-1">{displayName}</p>
                 </div>

                 <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 p-3.5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                   <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest block mb-0.5">Email</span>
                   <p className="text-[10px] font-bold text-neutral-900 line-clamp-1">{displayEmail}</p>
                 </div>

                 <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 p-3.5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                   <span className="text-[8px] font-black text-neutral-400 uppercase tracking-widest block mb-0.5">Status</span>
                   <div className="flex items-center gap-1.5 mt-0.5">
                     <span className={`w-2 h-2 rounded-full shadow-sm ${isPro ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-neutral-400'}`} />
                     <p className="text-[10px] font-bold text-neutral-900">{isPro ? 'Pro Active' : 'Free Status'}</p>
                   </div>
                 </div>
               </div>

               {/* Help & Resources Section */}
               <div className="bg-white/50 border border-neutral-200/80 rounded-2xl p-5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02),0_4px_12px_rgba(255,255,255,1)] relative z-10 flex-1">
                 <h3 className="text-[11px] font-black text-neutral-900 flex items-center gap-1.5 drop-shadow-sm mb-4">
                   <HelpCircle className="w-3.5 h-3.5 text-blue-500 drop-shadow-sm" />
                   Help & Resources
                 </h3>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                   <a 
                     href="https://wa.me/1234567890" 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-b from-[#25D366] to-[#128C7E] text-white shadow-[0_4px_0_#075E54,0_8px_16px_rgba(37,211,102,0.4)] hover:shadow-[0_4px_0_#075E54,0_12px_20px_rgba(37,211,102,0.6)] active:translate-y-1 active:shadow-[0_0px_0_#075E54] transition-all group"
                   >
                     <div className="w-8 h-8 flex items-center justify-center shrink-0 drop-shadow-md group-hover:scale-110 transition-transform">
                       <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                         <path d="M12.031 0C5.385 0 0 5.388 0 12.037c0 2.122.553 4.195 1.603 6.01L.226 23.361l5.48-1.439A11.968 11.968 0 0 0 12.03 24c6.643 0 12.036-5.388 12.036-12.037S18.676 0 12.031 0zm0 22.012c-1.782 0-3.535-.48-5.074-1.39l-.364-.216-3.774.99.999-3.676-.237-.377A9.972 9.972 0 0 1 2.013 12.04c0-5.54 4.507-10.05 10.05-10.05 5.54 0 10.048 4.51 10.048 10.05s-4.508 10.048-10.048 10.048zm5.518-7.533c-.302-.15-1.788-.881-2.064-.981-.275-.1-.476-.15-.677.151-.201.302-.781.982-.958 1.183-.176.201-.353.226-.655.075-2.222-1.11-3.69-2.062-5.111-4.484-.201-.341.202-.315.794-1.503.076-.15.038-.285-.018-.387-.058-.1-.677-1.63-.927-2.23-.243-.586-.49-.507-.677-.516-.176-.01-.377-.01-.578-.01-.201 0-.528.075-.804.377-.276.301-1.055 1.03-1.055 2.512s1.08 2.914 1.23 3.115c.15.201 2.122 3.24 5.14 4.542 2.015.867 2.825.922 3.86 1.032 1.01.107 3.238-.27 3.69-.877.452-.608.452-1.13.316-1.24-.136-.111-.512-.186-.814-.337z"/>
                       </svg>
                     </div>
                     <div className="flex-1 text-left">
                       <p className="text-[11px] font-black drop-shadow-sm leading-tight">WhatsApp</p>
                       <p className="text-[9px] font-bold text-white/80 drop-shadow-sm uppercase tracking-widest mt-0.5">Support</p>
                     </div>
                   </a>
                   
                   <a 
                     href="#" 
                     className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 text-white shadow-[0_4px_0_#171717,0_8px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_0_#171717,0_12px_20px_rgba(0,0,0,0.6)] active:translate-y-1 active:shadow-[0_0px_0_#171717] transition-all group border border-neutral-700/80"
                   >
                     <div className="w-8 h-8 flex items-center justify-center shrink-0 drop-shadow-md group-hover:scale-110 transition-transform bg-[#25D366]/10 rounded-lg">
                       <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#25D366]">
                         <path d="M12.031 0C5.385 0 0 5.388 0 12.037c0 2.122.553 4.195 1.603 6.01L.226 23.361l5.48-1.439A11.968 11.968 0 0 0 12.03 24c6.643 0 12.036-5.388 12.036-12.037S18.676 0 12.031 0zm0 22.012c-1.782 0-3.535-.48-5.074-1.39l-.364-.216-3.774.99.999-3.676-.237-.377A9.972 9.972 0 0 1 2.013 12.04c0-5.54 4.507-10.05 10.05-10.05 5.54 0 10.048 4.51 10.048 10.05s-4.508 10.048-10.048 10.048zm5.518-7.533c-.302-.15-1.788-.881-2.064-.981-.275-.1-.476-.15-.677.151-.201.302-.781.982-.958 1.183-.176.201-.353.226-.655.075-2.222-1.11-3.69-2.062-5.111-4.484-.201-.341.202-.315.794-1.503.076-.15.038-.285-.018-.387-.058-.1-.677-1.63-.927-2.23-.243-.586-.49-.507-.677-.516-.176-.01-.377-.01-.578-.01-.201 0-.528.075-.804.377-.276.301-1.055 1.03-1.055 2.512s1.08 2.914 1.23 3.115c.15.201 2.122 3.24 5.14 4.542 2.015.867 2.825.922 3.86 1.032 1.01.107 3.238-.27 3.69-.877.452-.608.452-1.13.316-1.24-.136-.111-.512-.186-.814-.337z"/>
                       </svg>
                     </div>
                     <div className="flex-1 text-left">
                       <p className="text-[11px] font-black drop-shadow-sm leading-tight">WhatsApp</p>
                       <p className="text-[9px] font-bold text-neutral-400 drop-shadow-sm uppercase tracking-widest mt-0.5">Community</p>
                     </div>
                   </a>
                 </div>

                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-neutral-200/60">
                   <a href="/about" className="flex justify-center items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200/80 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                     <Info className="w-3 h-3" /> About
                   </a>
                   <a href="/contact" className="flex justify-center items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200/80 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                     <Mail className="w-3 h-3" /> Contact
                   </a>
                   <a href="/privacy" className="flex justify-center items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200/80 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                     <ShieldCheck className="w-3 h-3" /> Privacy
                   </a>
                   <a href="/terms" className="flex justify-center items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200/80 py-2 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                     <FileText className="w-3 h-3" /> Terms
                   </a>
                 </div>
               </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="w-full md:w-[320px] lg:w-[360px] flex flex-col gap-6 shrink-0">
               {/* Credit Usage Meter */}
               <div className="bg-white/50 border border-neutral-200/80 rounded-2xl p-5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02),0_4px_12px_rgba(255,255,255,1)] relative z-10 flex-1">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[11px] font-black text-neutral-900 flex items-center gap-1.5 drop-shadow-sm">
                     <Zap className="w-3.5 h-3.5 text-amber-500 drop-shadow-sm" />
                     Plan Usage
                   </h3>
                   <span className="px-2.5 py-1 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-800 text-[8px] font-black rounded-lg uppercase tracking-widest border border-amber-200/80 shadow-sm">
                     {isPro ? 'Pro Plan' : 'Free Plan'}
                   </span>
                 </div>
                 
                 <div className="space-y-4">
                   <div className="flex justify-between text-[10px] font-bold">
                     <span className="text-neutral-500">Characters Used</span>
                     <span className="text-neutral-900">45,230 / {isPro ? '500k' : '10k'}</span>
                   </div>
                   <div className="h-2 w-full bg-neutral-200/80 rounded-full overflow-hidden shadow-inner border border-neutral-200/50">
                     <div 
                       className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-500 rounded-full shadow-[0_0_4px_rgba(245,158,11,0.5)]" 
                       style={{ width: `${(45230 / (isPro ? 500000 : 10000)) * 100}%` }}
                     />
                   </div>
                   <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-200/60">
                     <span className="text-[9px] text-neutral-500 font-medium bg-neutral-100/50 px-2.5 py-1 rounded-md">Monthly</span>
                     <button 
                       onClick={() => setShowSubscription(true)}
                       className="text-[9px] font-black text-amber-600 hover:text-amber-700 transition-colors bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-100 shadow-sm hover:shadow"
                     >
                       Upgrade Plan
                     </button>
                   </div>
                 </div>
               </div>

               {/* Upgrade CTA for Free Users */}
               {!isPro && (
                 <div className="bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-2xl p-5 text-white flex flex-col items-center text-center gap-4 shadow-md relative overflow-hidden z-10 border border-neutral-700/80">
                   <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-[length:200%_100%] animate-pulse"></div>
                   <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl pointer-events-none"></div>

                   <div className="z-10">
                     <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800/80 text-amber-400 text-[8px] font-black uppercase tracking-widest mb-2 border border-neutral-700">
                       <Sparkles className="w-3 h-3" /> Unlock Pro
                     </div>
                     <h4 className="text-sm font-black drop-shadow-sm">Upgrade to Pro</h4>
                     <p className="text-[9px] text-neutral-400 font-medium mt-1">Access premium high-quality voices and extend your character limits.</p>
                   </div>
                   <button
                     onClick={() => setShowSubscription(true)}
                     className="bg-gradient-to-b from-amber-400 to-amber-600 text-white px-6 py-2.5 rounded-xl font-black text-[10px] transition-all shadow-sm hover:shadow-md border border-amber-400 w-full"
                   >
                     View Plans
                   </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
