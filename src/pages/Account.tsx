import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, User, Lock, Mail, UserPlus, Phone, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { logIn, signUp, signOut, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
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
        if (!name.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (!phone.trim()) {
          setError('Please enter your WhatsApp or phone number.');
          setLoading(false);
          return;
        }
        if (!validateEmail(email)) {
          setError('Please use an allowed email provider.');
          setLoading(false);
          return;
        }
        if (passwordStrength < 2) {
          setError('Please choose a stronger password.');
          setLoading(false);
          return;
        }
        await signUp(name.trim(), phone.trim(), email.trim(), password);
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

  const handleSignOut = async () => {
    await signOut();
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
        <div className="flex flex-col items-center gap-6 w-full max-w-md text-center bg-white/70 border border-white/60 p-8 rounded-[2rem] shadow-[0_16px_40px_rgba(0,0,0,0.06),inset_0_2px_4px_rgba(255,255,255,1)] backdrop-blur-3xl relative overflow-hidden">
          {/* subtle decorative gradients */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-400/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl flex items-center justify-center border border-purple-200/60 shadow-[0_4px_12px_rgba(168,85,247,0.1),inset_0_2px_4px_rgba(255,255,255,1)] z-10 relative">
            <User className="w-8 h-8 text-purple-600 drop-shadow-sm" />
          </div>
          <div className="z-10 relative">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2 text-neutral-900 drop-shadow-sm">
              {isSignUp ? 'Create ' : 'Sign In '}
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                {isSignUp ? 'Account' : 'To Studio'}
              </span>
            </h2>
            <p className="text-neutral-600 font-medium text-sm leading-relaxed">
              {isSignUp ? 'Register your account to get started with Awavox AI Studio.' : 'Sign in to access your profile and created audio.'}
            </p>
          </div>

          {/* Toggle Tabs: Register FIRST, then Sign In */}
          <div className="flex bg-neutral-100/80 p-1.5 rounded-2xl w-full border border-neutral-200/80 text-xs font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] z-10 relative">
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${isSignUp ? 'bg-white text-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${!isSignUp ? 'bg-white text-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="w-full space-y-4 text-left z-10 relative">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-purple-500 transition-colors z-10" />
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-neutral-200/80 rounded-2xl focus:ring-4 focus:ring-purple-100/50 outline-none font-medium text-neutral-900 transition-all text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(255,255,255,0.8)] focus:border-purple-300"
                      placeholder="Your Full Name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 ml-1">WhatsApp / Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-purple-500 transition-colors z-10" />
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-neutral-200/80 rounded-2xl focus:ring-4 focus:ring-purple-100/50 outline-none font-medium text-neutral-900 transition-all text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(255,255,255,0.8)] focus:border-purple-300"
                      placeholder="+92 300 1234567"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-purple-500 transition-colors z-10" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={(e) => isSignUp && validateEmail(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 bg-white/60 backdrop-blur-sm border ${emailError ? 'border-red-400 focus:ring-red-100/50' : 'border-neutral-200/80 focus:ring-purple-100/50 focus:border-purple-300'} rounded-2xl focus:ring-4 outline-none font-medium text-neutral-900 transition-all text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(255,255,255,0.8)]`}
                  placeholder="name@email.com"
                  required
                />
              </div>
              {emailError && (
                <p className="mt-1.5 text-[11px] font-bold text-red-500 ml-1">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-purple-500 transition-colors z-10" />
                <input 
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full pl-11 pr-4 py-3 bg-white/60 backdrop-blur-sm border border-neutral-200/80 rounded-2xl focus:ring-4 focus:ring-purple-100/50 outline-none font-medium text-neutral-900 transition-all text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(255,255,255,0.8)] focus:border-purple-300"
                  placeholder="••••••••"
                  required
                />
              </div>
              {isSignUp && password.length > 0 && (
                <div className="mt-2 flex gap-1 h-1.5">
                  <div className={`flex-1 rounded-full ${passwordStrength >= 1 ? (passwordStrength >= 3 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]') : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'}`}></div>
                  <div className={`flex-1 rounded-full ${passwordStrength >= 2 ? (passwordStrength >= 3 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]') : 'bg-neutral-200/80 shadow-inner'}`}></div>
                  <div className={`flex-1 rounded-full ${passwordStrength >= 3 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-200/80 shadow-inner'}`}></div>
                  <div className={`flex-1 rounded-full ${passwordStrength >= 4 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-200/80 shadow-inner'}`}></div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-600 font-bold bg-red-50/80 backdrop-blur-sm p-3 rounded-xl border border-red-200 shadow-[inset_0_1px_4px_rgba(239,68,68,0.1)]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-900 text-white px-7 py-3.5 rounded-2xl text-sm font-black transition-all shadow-[0_8px_20px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:translate-y-0 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none mt-2"
            >
              {isSignUp ? <UserPlus className="w-4 h-4 drop-shadow-sm" /> : <LogIn className="w-4 h-4 drop-shadow-sm" />}
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
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
  const displayPhone = memberProfile?.phone || 'Not provided';
  const isPro = memberProfile?.role === 'pro' || memberProfile?.role === 'admin';
  const roleLabel = memberProfile?.role === 'admin' ? 'Admin' : (isPro ? 'Pro' : 'Free');
  const userInitial = displayName.trim().length > 0 ? displayName.trim()[0].toUpperCase() : 'U';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-3xl mx-auto px-4 py-8 md:py-12 w-full"
    >
      <SubscriptionPopup isOpen={showSubscription} onClose={() => setShowSubscription(false)} />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
           <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-900 mb-1 drop-shadow-sm">
             Your <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Account</span>
           </h2>
           <p className="text-neutral-600 font-medium text-xs">Manage your personal details and plan subscription.</p>
         </div>
         <button
            onClick={handleSignOut}
            className="self-start sm:self-auto flex items-center gap-2 bg-white/80 backdrop-blur-sm text-red-600 px-5 py-2.5 rounded-xl text-xs font-black hover:text-red-700 transition-all border border-red-200/80 shadow-[0_4px_12px_rgba(239,68,68,0.1),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(239,68,68,0.15),inset_0_2px_4px_rgba(255,255,255,1)] active:translate-y-0 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] shrink-0"
         >
            <LogOut className="w-4 h-4 text-red-500 drop-shadow-sm" />
            Sign Out
         </button>
      </div>

      <div className="bg-white/70 border border-white/60 backdrop-blur-3xl rounded-[2.5rem] p-6 md:p-8 flex flex-col gap-8 shadow-[0_16px_40px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] relative overflow-hidden">
         {/* Top Identity Header */}
         <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-neutral-200/60 relative z-10">
           {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-[1.5rem] bg-neutral-100 border border-white object-cover shadow-[0_8px_24px_rgba(0,0,0,0.08)]" />
           ) : (
              <div className="w-24 h-24 rounded-[1.5rem] bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 border-2 border-white/40 flex items-center justify-center text-white shadow-[0_8px_24px_rgba(168,85,247,0.3),inset_0_2px_8px_rgba(255,255,255,0.4)] relative overflow-hidden group shrink-0">
                 <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <span className="font-extrabold text-4xl tracking-tight text-white drop-shadow-md">{userInitial}</span>
              </div>
           )}
           <div className="text-center sm:text-left flex-1 mt-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h3 className="text-3xl font-black text-neutral-900 drop-shadow-sm">{displayName}</h3>
                {roleLabel !== 'Free' && (
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] ${
                    roleLabel === 'Admin' 
                      ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-800 border-indigo-200' 
                      : 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-800 border-purple-200'
                  }`}>
                    {roleLabel} Account
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500 font-medium mt-1.5">{displayEmail}</p>
           </div>
         </div>

         {/* Credit Usage Meter (Moved from Settings) */}
         <div className="bg-white/50 border border-neutral-200/80 rounded-[2rem] p-6 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02),0_4px_12px_rgba(255,255,255,1)] relative z-10">
           <div className="flex items-center justify-between mb-5">
             <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2 drop-shadow-sm">
               <Zap className="w-5 h-5 text-amber-500 drop-shadow-sm" />
               Plan Usage
             </h3>
             <span className="px-4 py-1.5 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-800 text-[10px] font-black rounded-xl uppercase tracking-widest border border-amber-200/80 shadow-[0_2px_8px_rgba(245,158,11,0.1),inset_0_2px_4px_rgba(255,255,255,1)]">
               {isPro ? 'Pro Plan' : 'Free Plan'}
             </span>
           </div>
           
           <div className="space-y-4">
             <div className="flex justify-between text-sm font-bold">
               <span className="text-neutral-500">Characters Used</span>
               <span className="text-neutral-900">45,230 / {isPro ? '500,000' : '10,000'}</span>
             </div>
             <div className="h-4 w-full bg-neutral-200/80 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-neutral-200/50">
               <div 
                 className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                 style={{ width: `${(45230 / (isPro ? 500000 : 10000)) * 100}%` }}
               />
             </div>
             <div className="flex justify-between items-center mt-2">
               <span className="text-xs text-neutral-500 font-medium bg-neutral-100/50 px-3 py-1 rounded-lg">Monthly Subscription</span>
               <button 
                 onClick={() => setShowSubscription(true)}
                 className="text-xs font-black text-amber-600 hover:text-amber-700 transition-colors bg-amber-50 hover:bg-amber-100 px-4 py-1.5 rounded-xl"
               >
                 Upgrade Plan
               </button>
             </div>
           </div>
         </div>

         {/* Profile Details Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
           <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 p-5 rounded-[1.5rem] shadow-[0_4px_12px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all duration-300">
             <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Name</span>
             <p className="text-sm font-bold text-neutral-900">{displayName}</p>
           </div>

           <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 p-5 rounded-[1.5rem] shadow-[0_4px_12px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all duration-300">
             <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Email Address</span>
             <p className="text-sm font-bold text-neutral-900">{displayEmail}</p>
           </div>

           <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 p-5 rounded-[1.5rem] shadow-[0_4px_12px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all duration-300">
             <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">WhatsApp / Phone</span>
             <p className="text-sm font-bold text-neutral-900">{displayPhone}</p>
           </div>

           <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/80 p-5 rounded-[1.5rem] shadow-[0_4px_12px_rgba(0,0,0,0.02),inset_0_2px_4px_rgba(255,255,255,1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1 transition-all duration-300">
             <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Account Status</span>
             <div className="flex items-center gap-2">
               <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${isPro ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-400'}`} />
               <p className="text-sm font-bold text-neutral-900">{isPro ? 'Pro Active' : 'Free Status'}</p>
             </div>
           </div>
         </div>

         {/* Upgrade CTA for Free Users */}
         {!isPro && (
           <div className="bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-[2rem] p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_16px_40px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.2)] relative overflow-hidden z-10 border border-neutral-700/80">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-[length:200%_100%] animate-pulse"></div>
             {/* decorative flares */}
             <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

             <div className="z-10">
               <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-neutral-800/80 backdrop-blur-sm text-amber-400 text-[10px] font-black uppercase tracking-widest mb-3 border border-neutral-700 shadow-inner">
                 <Sparkles className="w-3.5 h-3.5 text-amber-400 drop-shadow-sm" /> Unlock Pro Voices
               </div>
               <h4 className="text-xl font-black drop-shadow-sm">Upgrade to Awavox Pro</h4>
               <p className="text-xs text-neutral-400 font-medium mt-1.5">Access high quality voices and premium audio features.</p>
             </div>
             <button
               onClick={() => setShowSubscription(true)}
               className="bg-gradient-to-b from-amber-400 to-amber-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-[0_8px_20px_rgba(245,158,11,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(245,158,11,0.4),inset_0_2px_4px_rgba(255,255,255,0.5)] active:translate-y-0 active:shadow-[inset_0_2px_8px_rgba(0,0,0,0.2)] shrink-0 z-10 border border-amber-400"
             >
               View Plans
             </button>
           </div>
         )}
      </div>
    </motion.div>
  );
}
