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
        <div className="flex flex-col items-center gap-6 w-full max-w-md text-center bg-white border border-neutral-200/85 p-8 rounded-3xl shadow-xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center border border-purple-200">
            <User className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2 text-neutral-900">
              {isSignUp ? 'Create ' : 'Sign In '}
              <span className="font-serif italic font-normal text-purple-600">
                {isSignUp ? 'Account' : 'To Studio'}
              </span>
            </h2>
            <p className="text-neutral-600 font-medium text-sm leading-relaxed">
              {isSignUp ? 'Register your account to get started with Awavox AI Studio.' : 'Sign in to access your profile and created audio.'}
            </p>
          </div>

          {/* Toggle Tabs: Register FIRST, then Sign In */}
          <div className="flex bg-neutral-100 p-1.5 rounded-2xl w-full border border-neutral-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${isSignUp ? 'bg-white text-neutral-900 shadow-sm font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl transition-all ${!isSignUp ? 'bg-white text-neutral-900 shadow-sm font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="w-full space-y-4 text-left">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-neutral-900 transition-all text-sm"
                      placeholder="Your Full Name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 ml-1">WhatsApp / Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-neutral-900 transition-all text-sm"
                      placeholder="+92 300 1234567"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-neutral-900 transition-all text-sm"
                  placeholder="name@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none font-medium text-neutral-900 transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100 italic">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full bg-neutral-900 hover:bg-neutral-800 text-white px-7 py-3.5 rounded-full text-sm font-bold transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
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

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
           <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-900 mb-2">
             Your <span className="font-serif italic font-normal text-purple-600">Profile</span>
           </h2>
           <p className="text-neutral-600 font-medium text-sm">Manage your personal details and account subscription.</p>
         </div>
         <button
            onClick={handleSignOut}
            className="self-start sm:self-auto flex items-center gap-2 bg-white text-red-600 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-50 transition-colors border border-red-200 shadow-xs shrink-0"
         >
            <LogOut className="w-3.5 h-3.5 text-red-500" />
            Sign Out
         </button>
      </div>

      <div className="bg-white border border-neutral-200/85 backdrop-blur-2xl rounded-3xl p-6 md:p-8 flex flex-col gap-8 shadow-xl">
         {/* Top Identity Header */}
         <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-neutral-100">
           {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-2xl bg-neutral-100 border border-neutral-200 object-cover shadow-sm" />
           ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 border border-purple-400/30 flex items-center justify-center text-white shadow-md relative overflow-hidden group shrink-0">
                 <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <span className="font-extrabold text-3xl tracking-tight text-purple-100 drop-shadow-xs">{userInitial}</span>
              </div>
           )}
           <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h3 className="text-2xl font-extrabold text-neutral-900">{displayName}</h3>
                {roleLabel !== 'Free' && (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                    roleLabel === 'Admin' 
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
                      : 'bg-purple-100 text-purple-800 border-purple-200'
                  }`}>
                    {roleLabel} Account
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-500 font-medium mt-1">{displayEmail}</p>
           </div>
         </div>

         {/* Profile Details Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-neutral-50 border border-neutral-200/80 p-4 rounded-2xl">
             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Name</span>
             <p className="text-sm font-bold text-neutral-900">{displayName}</p>
           </div>

           <div className="bg-neutral-50 border border-neutral-200/80 p-4 rounded-2xl">
             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Email Address</span>
             <p className="text-sm font-bold text-neutral-900">{displayEmail}</p>
           </div>

           <div className="bg-neutral-50 border border-neutral-200/80 p-4 rounded-2xl">
             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">WhatsApp / Phone</span>
             <p className="text-sm font-bold text-neutral-900">{displayPhone}</p>
           </div>

           <div className="bg-neutral-50 border border-neutral-200/80 p-4 rounded-2xl">
             <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Account Status</span>
             <div className="flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full ${isPro ? 'bg-emerald-500' : 'bg-amber-500'}`} />
               <p className="text-sm font-bold text-neutral-900">{isPro ? 'Pro Active' : 'Free Status'}</p>
             </div>
           </div>
         </div>

         {/* Upgrade CTA for Free Users */}
         {!isPro && (
           <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
             <div>
               <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/30 border border-purple-400/30 text-purple-200 text-[10px] font-bold uppercase tracking-widest mb-2">
                 <Sparkles className="w-3 h-3 text-purple-300" /> Unlock Pro Voices
               </div>
               <h4 className="text-lg font-bold">Upgrade to Awavox Pro</h4>
               <p className="text-xs text-purple-200 font-medium mt-1">Access high quality voices and premium audio features.</p>
             </div>
             <button
               onClick={() => setShowSubscription(true)}
               className="bg-white text-purple-950 hover:bg-purple-50 px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:scale-105 active:scale-95 shrink-0"
             >
               Upgrade to Pro
             </button>
           </div>
         )}
      </div>
    </motion.div>
  );
}
