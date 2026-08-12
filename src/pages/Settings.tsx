import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw, Sliders, Copy, Clapperboard, Play, Disc3, Loader2, Mic, UploadCloud, X } from 'lucide-react';
import { useSettingsStore, StorytellingMode, PRESET_PROFILES } from '../store/settings';
import { generateAudioChunk, fetchVoices, verifyVoiceAccess, cloneVoice } from '../services/elevenlabs';
import { useAuthStore } from '../store/auth';
import { SubscriptionPopup } from '../components/SubscriptionPopup';
import { motion } from 'motion/react';

export default function SettingsPage() {
  const { 
    apiKeys, addApiKey, removeApiKey, setActiveApiKey, 
    voiceSettings, updateVoiceSettings,
    cinematicSettings, updateCinematicSettings,
    activeProfileId, voiceProfiles, saveVoiceProfile, deleteVoiceProfile, applyVoiceProfile, resetToDefaultProfile, getActiveKey, updateApiKeyVoice, updateApiKeyResetDate
  } = useSettingsStore();
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyProvider, setNewKeyProvider] = useState<'elevenlabs' | 'cartesia' | 'google'>('elevenlabs');
  
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string|null>(null);
  const [previewError, setPreviewError] = useState<string|null>(null);

  const [editingResetDaysId, setEditingResetDaysId] = useState<string | null>(null);
  const [tempResetDays, setTempResetDays] = useState<string>('');

  const [voicesMap, setVoicesMap] = useState<Record<string, any[]>>({});
  const [loadingVoicesMap, setLoadingVoicesMap] = useState<Record<string, boolean>>({});

  const [creditsMap, setCreditsMap] = useState<Record<string, {used: number, total: number, tier: string} | null>>({});

  const getRemainingDays = (resetDateMs?: number) => {
     if (!resetDateMs) return 30;
     let remainingMs = resetDateMs - Date.now();
     while (remainingMs < 0) {
        remainingMs += 30 * 24 * 60 * 60 * 1000;
     }
     return Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  };
  const [loadingCreditsMap, setLoadingCreditsMap] = useState<Record<string, boolean>>({});

  // Voice Cloning State
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneTargetKey, setCloneTargetKey] = useState<string | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [cloneDesc, setCloneDesc] = useState('');
  const [cloneFiles, setCloneFiles] = useState<File[]>([]);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState('');
  const [cloneSuccess, setCloneSuccess] = useState('');

  const { memberProfile } = useAuthStore();
  const [showSubscription, setShowSubscription] = useState(false);
  const isPro = memberProfile?.status === 'active' || memberProfile?.role === 'admin';

  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneTargetKey || !cloneName || cloneFiles.length === 0) return;
    
    setIsCloning(true);
    setCloneError('');
    setCloneSuccess('');
    
    try {
      const activeKeyObj = apiKeys.find(k => k.id === cloneTargetKey);
      if (!activeKeyObj) throw new Error("API Key not found");
      
      const newVoiceId = await cloneVoice(activeKeyObj.key, cloneName, cloneDesc, cloneFiles);
      setCloneSuccess(`Voice cloned successfully! ID: ${newVoiceId}`);
      
      // Auto refresh voices
      await handleFetchVoices(cloneTargetKey, activeKeyObj.key);
      
      setTimeout(() => {
        setShowCloneModal(false);
        setCloneName('');
        setCloneDesc('');
        setCloneFiles([]);
        setCloneSuccess('');
      }, 2000);
    } catch (err: any) {
      setCloneError(err.message || 'Failed to clone voice');
    } finally {
      setIsCloning(false);
    }
  };

  const handleFetchVoices = async (keyId: string, apiKey: string, provider: 'elevenlabs' | 'cartesia' | 'google' = 'elevenlabs') => {
    setLoadingVoicesMap(prev => ({ ...prev, [keyId]: true }));
    try {
      let voices: any[] = [];
      if (provider === 'elevenlabs') {
        voices = await fetchVoices(apiKey);
      } else if (provider === 'cartesia') {
        const response = await fetch(`/api/cartesia/voices?apiKey=${encodeURIComponent(apiKey)}`);
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        // map cartesia voices to elevenlabs format roughly
        voices = (data || []).map((v: any) => ({ voice_id: v.id, name: v.name }));
      } else if (provider === 'google') {
        const response = await fetch(`/api/google/voices?apiKey=${encodeURIComponent(apiKey)}`);
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        voices = (data.voices || []).map((v: any) => ({ voice_id: v.name, name: v.name }));
      }
      setVoicesMap(prev => ({ ...prev, [keyId]: voices }));
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to fetch voices. Please check the API key.');
    } finally {
      setLoadingVoicesMap(prev => ({ ...prev, [keyId]: false }));
    }
  };

  const handleFetchCredits = async (keyId: string, apiKey: string) => {
    setLoadingCreditsMap(prev => ({...prev, [keyId]: true}));
    try {
      const { fetchSubscription } = await import('../services/elevenlabs');
      const data = await fetchSubscription(apiKey);
      setCreditsMap(prev => ({
        ...prev, 
        [keyId]: {
          used: data.character_count || 0,
          total: data.character_limit || 0,
          tier: data.tier || 'unknown'
        }
      }));
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingCreditsMap(prev => ({...prev, [keyId]: false}));
    }
  };

  useEffect(() => {
    apiKeys.forEach(k => {
      if ((!k.provider || k.provider === 'elevenlabs') && k.isValid) {
        if (!creditsMap[k.id] && !loadingCreditsMap[k.id]) {
          handleFetchCredits(k.id, k.key);
        }
      }
    });
  }, [apiKeys]);

  const handlePreviewVoice = async () => {
    const key = getActiveKey();
    if (!key) {
       setPreviewError('No valid key available to generate preview.');
       return;
    }
    setIsPreviewing(true);
    setPreviewError(null);
    try {
      const hasVoice = await verifyVoiceAccess(key);
      if (!hasVoice) {
         throw new Error('The currently mapped voice ID is not available in this account.');
      }
      
      const script = "Donald Trump became one of the most recognized people on Earth. But long before politics... there was only ambition.";
      const buffer = await generateAudioChunk(script, key);
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to generate preview audio.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKeyName.trim() && newKeyValue.trim()) {
      addApiKey(newKeyName.trim(), newKeyValue.trim(), newKeyProvider);
      setNewKeyName('');
      setNewKeyValue('');
      setNewKeyProvider('elevenlabs');
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    // Could add toast here but keeping it simple
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8"
    >
      <SubscriptionPopup isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
      <div className="space-y-2 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold tracking-wide uppercase shadow-2xs mb-3">
          <Sliders className="w-3.5 h-3.5 text-purple-600" />
          Studio Settings
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-neutral-900">Studio <span className="font-serif italic font-normal text-purple-600">Settings</span></h2>
        <p className="text-neutral-600 font-medium text-sm md:text-base leading-relaxed">
          Configure your voice profiles, cinematic settings, and account preferences for high-quality audio generation.
        </p>
      </div>

      <div className="space-y-8 pb-12">
        
        {isPro && (
          <>
            {/* Add New Configuration */}
            <div className="bg-white border border-neutral-200/80 backdrop-blur-2xl shadow-xl rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-neutral-900">
                <Plus className="w-5 h-5 text-purple-600" />
                Add Profile
              </h3>
              
              <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4">
                 <select
                   value={newKeyProvider}
                   onChange={(e) => setNewKeyProvider(e.target.value as 'elevenlabs' | 'cartesia' | 'google')}
                   className="bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors cursor-pointer text-neutral-900 font-medium"
                 >
                   <option value="elevenlabs">ElevenLabs</option>
                   <option value="cartesia">Cartesia</option>
                   <option value="google">Google</option>
                 </select>
                 <input 
                   type="text" 
                   placeholder="Profile Name (e.g. Personal Pro)"
                   value={newKeyName}
                   onChange={e => setNewKeyName(e.target.value)}
                   className="flex-1 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors placeholder:text-neutral-400 text-neutral-900 font-medium"
                   required
                 />
                 <input 
                   type="password" 
                   placeholder="Access Key..."
                   value={newKeyValue}
                   onChange={e => setNewKeyValue(e.target.value)}
                   className="flex-[2] bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors placeholder:text-neutral-400 placeholder:font-mono text-neutral-900 font-medium"
                   required
                 />
                 <button 
                   type="submit"
                   className="bg-neutral-900 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-neutral-800 transition-all shadow-md hover:scale-105 active:scale-95 shrink-0 whitespace-nowrap sm:w-auto w-full"
                 >
                   Save Profile
                 </button>
              </form>
            </div>
          </>
        )}

        {isPro && (
          <>
            {/* Saved Configurations List */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-neutral-900">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                Active Configurations
              </h3>

              {apiKeys.length === 0 ? (
                <div className="text-center py-12 border border-neutral-200 bg-white/70 backdrop-blur-sm border-dashed rounded-3xl text-neutral-500 font-medium text-sm">
                   No configurations found.
                </div>
              ) : (
                 <div className="grid gap-4">
                   {apiKeys.map(key => (
                     <div 
                       key={key.id} 
                       className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-3xl border transition-all backdrop-blur-xl ${
                         key.isActive 
                           ? 'bg-white border-purple-300 shadow-md ring-2 ring-purple-100' 
                           : 'bg-white/80 border-neutral-200/80 hover:bg-white hover:border-neutral-300 shadow-xs'
                       }`}
                     >
                       <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto overflow-hidden">
                         <button
                           onClick={() => setActiveApiKey(key.id)}
                           title="Set Active"
                           className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 rounded-full border flex items-center justify-center transition-colors mt-0.5 sm:mt-0 ${
                             key.isActive 
                               ? 'border-emerald-500 bg-emerald-50 text-emerald-600' 
                               : 'border-neutral-300 hover:border-neutral-500'
                           }`}
                         >
                           {key.isActive && <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                         </button>
                         
                         <div className="min-w-0 flex-1">
                           <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                             <span className="font-bold text-xs sm:text-sm text-neutral-900">{key.name}</span>
                             <span className="text-[9px] sm:text-[10px] uppercase tracking-wider bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full font-bold border border-neutral-200">
                               {key.provider || 'elevenlabs'}
                             </span>
                             {key.isActive ? (
                               <span className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                                 Active
                               </span>
                             ) : (
                               <span className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase tracking-wider bg-neutral-100 text-neutral-500 border border-neutral-200 px-2 py-0.5 rounded-full font-bold">
                                 Inactive
                               </span>
                             )}
                             {!key.isValid && (
                                <span className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                                   <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Failed
                                </span>
                             )}
                             {creditsMap[key.id] && (
                               <span className="text-[9px] sm:text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                 <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                 {creditsMap[key.id]?.total ? `${Math.max(0, creditsMap[key.id]!.total - creditsMap[key.id]!.used).toLocaleString()} / ${creditsMap[key.id]?.total.toLocaleString()} chars` : 'Unlimited'}
                                 <span className="text-blue-600 ml-1">({creditsMap[key.id]?.tier})</span>
                               </span>
                             )}
                             <div className="text-[9px] sm:text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-200">
                               <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                               {editingResetDaysId === key.id ? (
                                 <form onSubmit={(e) => {
                                   e.preventDefault();
                                   const days = parseInt(tempResetDays, 10);
                                   if (!isNaN(days) && days > 0) {
                                      updateApiKeyResetDate(key.id, Date.now() + days * 24 * 60 * 60 * 1000);
                                   }
                                   setEditingResetDaysId(null);
                                 }} className="flex items-center gap-1">
                                   <input 
                                     type="number" min="1" max="99"
                                     value={tempResetDays}
                                     onChange={e => setTempResetDays(e.target.value)}
                                     className="bg-white border border-amber-300 rounded px-1 w-10 text-center outline-none text-neutral-900"
                                     autoFocus
                                     onBlur={() => setEditingResetDaysId(null)}
                                     title="Warning: Modifying this will change when credits are expected to reset."
                                   />
                                   <span>days</span>
                                 </form>
                               ) : (
                                 <span 
                                   onClick={() => {
                                     setTempResetDays(getRemainingDays(key.resetDate).toString());
                                     setEditingResetDaysId(key.id);
                                   }}
                                   className="cursor-pointer hover:text-amber-900 transition-colors"
                                   title="Click to edit remaining days (resets monthly)"
                                 >
                                   {getRemainingDays(key.resetDate)} days left
                                 </span>
                               )}
                             </div>
                           </div>
                           <div className="text-[11px] sm:text-xs text-neutral-500 font-mono mt-1 w-full truncate">
                             ••••••••{key.key.slice(-6)}
                           </div>
                           {/* Voice Selection */}
                           <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 w-full">
                             <Mic className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600" />
                             {voicesMap[key.id] ? (
                               <select 
                                 className="bg-neutral-50 text-neutral-800 text-[11px] sm:text-xs px-3 py-1.5 rounded-xl border border-neutral-200 w-full sm:w-auto max-w-[180px] sm:max-w-xs focus:outline-none focus:border-purple-400 font-medium"
                                 value={key.voiceId || 'q109vaFit7lX6QNjx3cW'}
                                 onChange={(e) => {
                                   const v = voicesMap[key.id].find(v => v.voice_id === e.target.value);
                                   updateApiKeyVoice(key.id, e.target.value, v ? v.name : 'Unknown Voice');
                                 }}
                               >
                                 <option value="q109vaFit7lX6QNjx3cW">Default Aura Voice</option>
                                 <optgroup label="Your Voices">
                                   {voicesMap[key.id].map(v => (
                                     <option key={v.voice_id} value={v.voice_id}>{v.name} ({v.voice_id})</option>
                                   ))}
                                 </optgroup>
                               </select>
                             ) : (
                               <div className="flex items-center gap-2">
                                 <span className="text-xs text-neutral-700 font-semibold">{key.voiceName || 'Default Aura Voice'}</span>
                                 <button
                                   onClick={() => handleFetchVoices(key.id, key.key, key.provider || 'elevenlabs')}
                                   disabled={loadingVoicesMap[key.id]}
                                   className="text-[10px] text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1 rounded-lg transition-colors border border-neutral-200 font-semibold"
                                 >
                                   {loadingVoicesMap[key.id] ? 'Loading...' : 'Select Voice'}
                                 </button>
                               </div>
                             )}
                             <button
                               onClick={() => { 
                                 if (!isPro) {
                                   setShowSubscription(true);
                                 } else {
                                   setCloneTargetKey(key.id); 
                                   setShowCloneModal(true); 
                                 }
                               }}
                               className="text-[10px] text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-1 flex items-center rounded-lg transition-colors ml-1 border border-neutral-200 font-semibold"
                             >
                               <UploadCloud className="w-3 h-3 mr-1 text-purple-600" /> Clone Voice
                             </button>
                           </div>
                         </div>
                       </div>

                        <div className="flex items-center justify-end sm:justify-start gap-1 w-full sm:w-auto">
                          <button 
                            onClick={() => handleCopy(key.key)}
                            className="p-2 sm:p-2.5 text-neutral-500 hover:text-neutral-900 transition-colors rounded-xl hover:bg-neutral-100"
                            title="Copy Key"
                          >
                            <Copy className="w-4 h-4 sm:w-4 sm:h-4" />
                          </button>
                          <button 
                            onClick={() => removeApiKey(key.id)}
                            className="p-2 sm:p-2.5 text-neutral-500 hover:text-rose-600 transition-colors rounded-xl hover:bg-rose-50"
                            title="Remove Key"
                          >
                            <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                     </div>
                   ))}
                 </div>
              )}
            </div>
          </>
        )}



        {/* Combined Voice & Cinematic Profiles */}
        <div className="space-y-4 pt-4 border-t border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-neutral-900">
              <Clapperboard className="w-5 h-5 text-purple-600" />
              Voice Profile & Settings
            </h3>
            
            <div className="flex items-center gap-2 snap-x overflow-x-auto">
               <button 
                 onClick={() => {
                   const name = prompt('Name your custom Voice Profile:');
                   if (name) saveVoiceProfile(name);
                 }}
                 className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-bold text-white transition-colors shadow-sm"
               >
                 Save Current
               </button>
               <button 
                 onClick={resetToDefaultProfile}
                 className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-colors border border-neutral-200 shadow-xs"
               >
                 <RefreshCw className="w-3 h-3" />
                 Reset Def.
               </button>
            </div>
          </div>
          
          <div className="bg-white border border-neutral-200/85 backdrop-blur-2xl shadow-xl rounded-3xl p-6 md:p-8 space-y-8">
            <div>
              <label className="text-sm font-bold text-neutral-800 block mb-2">Active Voice Preset / Profile</label>
              <div className="flex items-center gap-3">
                <select
                  value={activeProfileId || 'custom'}
                  onChange={(e) => applyVoiceProfile(e.target.value)}
                  className="flex-1 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm text-neutral-900 font-medium focus:outline-none focus:border-purple-400 transition-colors"
                >
                  <option value="custom" disabled className="text-neutral-500">Custom Settings (Unsaved)</option>
                  <optgroup label="Cinematic Presets">
                    {PRESET_PROFILES.map(p => (
                       <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                  {voiceProfiles.length > 0 && (
                    <optgroup label="Your Saved Profiles">
                      {voiceProfiles.map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {activeProfileId && voiceProfiles.find(p => p.id === activeProfileId) && (
                   <button 
                     onClick={() => deleteVoiceProfile(activeProfileId)}
                     className="p-2.5 text-neutral-500 hover:text-rose-600 bg-neutral-50 border border-neutral-200 rounded-xl transition-colors hover:bg-rose-50"
                     title="Delete Custom Profile"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                )}
              </div>
            </div>

            {/* Live Preview Button */}
            <div className="bg-purple-50/70 rounded-2xl border border-purple-200/80 p-5 backdrop-blur-xl">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                       <Play className="w-4 h-4 text-emerald-600" /> Live Voice Preview
                    </h4>
                    <p className="text-xs text-neutral-600 font-medium mt-1">Test current settings with a fixed 10-second cinematic script.</p>
                  </div>
                  <button 
                    onClick={() => handlePreviewVoice()}
                    disabled={isPreviewing}
                    className="flex w-full sm:w-auto justify-center items-center gap-2 bg-neutral-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin text-white"/> : <Disc3 className="w-4 h-4 text-purple-400"/>}
                    {isPreviewing ? 'Generating...' : 'Generate Preview'}
                  </button>
               </div>
               
               {previewUrl && (
                  <div className="mt-5 pt-5 border-t border-purple-200 flex items-center gap-3">
                     <audio controls src={previewUrl} className="flex-1 h-10 outline-none rounded-full" />
                  </div>
               )}
               {previewError && <p className="text-xs text-rose-700 mt-3 bg-rose-50 border border-rose-200 p-3 rounded-xl font-medium">{previewError}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-bold text-neutral-800">Pacing Speed</label>
                      <span className="text-xs font-mono font-bold text-purple-700">{cinematicSettings.speed.toFixed(2)}x</span>
                    </div>
                    <input 
                      type="range" min="0.80" max="1.10" step="0.01"
                      value={cinematicSettings.speed} onChange={(e) => updateCinematicSettings({ speed: parseFloat(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-bold text-neutral-800">Pause Intensity</label>
                      <span className="text-xs font-mono font-bold text-purple-700">{cinematicSettings.pauseIntensity.toFixed(1)}</span>
                    </div>
                    <input 
                      type="range" min="0.0" max="2.0" step="0.1"
                      value={cinematicSettings.pauseIntensity} onChange={(e) => updateCinematicSettings({ pauseIntensity: parseFloat(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-bold text-neutral-800">Emotional Weight</label>
                      <span className="text-xs font-mono font-bold text-purple-700">{cinematicSettings.emotionControl}</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="1"
                      value={cinematicSettings.emotionControl} onChange={(e) => updateCinematicSettings({ emotionControl: parseInt(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-bold text-neutral-800">Cinematic Intensity</label>
                      <span className="text-xs font-mono font-bold text-purple-700">{cinematicSettings.cinematicIntensity}</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="1"
                      value={cinematicSettings.cinematicIntensity} onChange={(e) => updateCinematicSettings({ cinematicIntensity: parseInt(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-bold text-neutral-800">Realism Level</label>
                      <span className="text-xs font-mono font-bold text-purple-700">{cinematicSettings.realism}</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="1"
                      value={cinematicSettings.realism} onChange={(e) => updateCinematicSettings({ realism: parseInt(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                 </div>
              </div>

              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-bold text-neutral-800">Narration Energy</label>
                      <span className="text-xs font-mono font-bold text-purple-700">{cinematicSettings.narrationEnergy}</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="1"
                      value={cinematicSettings.narrationEnergy} onChange={(e) => updateCinematicSettings({ narrationEnergy: parseInt(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-bold text-neutral-800">Diction Clarity</label>
                      <span className="text-xs font-mono font-bold text-purple-700">{cinematicSettings.dictionClarity}</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="1"
                      value={cinematicSettings.dictionClarity} onChange={(e) => updateCinematicSettings({ dictionClarity: parseInt(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm font-bold text-neutral-800">Storytelling Tension</label>
                      <span className="text-xs font-mono font-bold text-purple-700">{cinematicSettings.storytellingTension}</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="1"
                      value={cinematicSettings.storytellingTension} onChange={(e) => updateCinematicSettings({ storytellingTension: parseInt(e.target.value) })}
                      className="w-full accent-purple-600"
                    />
                 </div>
                 
                 <div className="pt-2">
                    <label className="text-sm font-bold text-neutral-800 block mb-2">Style Sub-Genre</label>
                    <select
                      value={cinematicSettings.storytellingMode}
                      onChange={(e) => updateCinematicSettings({ storytellingMode: e.target.value as any })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-neutral-900 font-medium focus:outline-none focus:border-purple-400 transition-colors"
                    >
                      <option value="documentary">Documentary</option>
                      <option value="mystery">Mystery</option>
                      <option value="political">Political</option>
                      <option value="dark cinematic">Dark Cinematic</option>
                      <option value="educational">Educational</option>
                      <option value="historical">Historical</option>
                    </select>
                 </div>
              </div>
            </div>
            
            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-neutral-200 pt-6">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="emphasis-engine" checked={cinematicSettings.emphasisEngine} onChange={(e) => updateCinematicSettings({ emphasisEngine: e.target.checked })} className="w-4 h-4 rounded accent-purple-600 cursor-pointer shrink-0" />
                  <label htmlFor="emphasis-engine" className="text-sm font-bold text-neutral-800 cursor-pointer">Emphasis Engine <span className="block text-[11px] text-neutral-500 font-normal">Auto-emphasize tension words.</span></label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="human-imperfection" checked={cinematicSettings.humanImperfection} onChange={(e) => updateCinematicSettings({ humanImperfection: e.target.checked })} className="w-4 h-4 rounded accent-purple-600 cursor-pointer shrink-0" />
                  <label htmlFor="human-imperfection" className="text-sm font-bold text-neutral-800 cursor-pointer">Human Imperfections <span className="block text-[11px] text-neutral-500 font-normal">Add subtle realism hesitations.</span></label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="clarity-boost" checked={cinematicSettings.clarityBoost} onChange={(e) => updateCinematicSettings({ clarityBoost: e.target.checked })} className="w-4 h-4 rounded accent-purple-600 cursor-pointer shrink-0" />
                  <label htmlFor="clarity-boost" className="text-sm font-bold text-neutral-800 cursor-pointer">Clarity Boost <span className="block text-[11px] text-neutral-500 font-normal">Optimize pronunciation.</span></label>
                </div>
            </div>
          </div>
        </div>

      </div>

      {/* Voice Cloning Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl w-full max-w-md p-6 relative shadow-2xl">
            <button 
              onClick={() => setShowCloneModal(false)}
              className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-neutral-900">
              <UploadCloud className="w-5 h-5 text-purple-600" /> Clone Voice
            </h3>
            
            <form onSubmit={handleCloneSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-bold text-neutral-800 block mb-2">Voice Name</label>
                <input 
                  type="text" 
                  value={cloneName}
                  onChange={e => setCloneName(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-purple-400 transition-colors text-neutral-900 font-medium"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-neutral-800 block mb-2">Description (Optional)</label>
                <textarea 
                  value={cloneDesc}
                  onChange={e => setCloneDesc(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-3 text-sm h-24 resize-none focus:outline-none focus:border-purple-400 transition-colors text-neutral-900 font-medium"
                />
              </div>
              
              <div>
                <label className="text-sm font-bold text-neutral-800 block mb-2">Audio Samples (Max 10MB)</label>
                <input 
                  type="file" 
                  multiple 
                  accept="audio/mp3,audio/wav,audio/mpeg,audio/mp4"
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 25) {
                      setCloneError("Max 25 files allowed");
                    } else {
                      setCloneFiles(files);
                      setCloneError("");
                    }
                  }}
                  className="w-full text-sm text-neutral-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 transition-all cursor-pointer"
                  required
                />
              </div>
              
              {cloneError && <p className="text-sm text-rose-700 mt-2 bg-rose-50 p-3 rounded-xl border border-rose-200 font-medium">{cloneError}</p>}
              {cloneSuccess && <p className="text-sm text-emerald-700 mt-2 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-medium">{cloneSuccess}</p>}
              
              <button 
                type="submit"
                disabled={isCloning || cloneFiles.length === 0}
                className="w-full bg-neutral-900 text-white py-3.5 rounded-2xl text-sm font-bold hover:bg-neutral-800 transition-all mt-6 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100"
              >
                {isCloning ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                {isCloning ? 'Cloning...' : 'Clone Voice'}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
