import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Loader2, Play, Pause, AlertCircle, Volume2, Mic2, ChevronDown, Globe, User, MapPin, Calendar, Languages, Lock } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { useSettingsStore } from '../store/settings';
import { SubscriptionPopup } from '../components/SubscriptionPopup';
import { motion, AnimatePresence } from 'motion/react';
import voicesData from '../data/voices.json';
import { getAuthHeader } from '../services/elevenlabs';
import { getCachedPreview, saveCachedPreview } from '../utils/previewCache';

interface Voice {
  id: string;
  name: string;
  description?: string;
  language: string;
  gender: string;
  country: string;
  is_high_quality: boolean;
  is_public: boolean;
  accents_locales?: string;
  age?: string;
}

function getVoiceTheme(voice: Voice) {
  const seedStr = `${voice.country || ''}-${voice.language || ''}-${voice.gender || ''}-${voice.age || ''}-${voice.accents_locales || ''}-${voice.id}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const themes = [
    {
      bg: 'bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60',
      border: 'border-indigo-100 hover:border-indigo-300',
      accent: 'text-indigo-600',
      hoverText: 'group-hover:text-indigo-600',
      playBg: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white',
      activePlayBg: 'bg-indigo-600 text-white'
    },
    {
      bg: 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/60',
      border: 'border-emerald-100 hover:border-emerald-300',
      accent: 'text-emerald-600',
      hoverText: 'group-hover:text-emerald-600',
      playBg: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white',
      activePlayBg: 'bg-emerald-600 text-white'
    },
    {
      bg: 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50',
      border: 'border-amber-100 hover:border-amber-300',
      accent: 'text-amber-600',
      hoverText: 'group-hover:text-amber-600',
      playBg: 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white',
      activePlayBg: 'bg-amber-600 text-white'
    },
    {
      bg: 'bg-gradient-to-br from-rose-50/70 via-white to-pink-50/50',
      border: 'border-rose-100 hover:border-rose-300',
      accent: 'text-rose-600',
      hoverText: 'group-hover:text-rose-600',
      playBg: 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white',
      activePlayBg: 'bg-rose-600 text-white'
    },
    {
      bg: 'bg-gradient-to-br from-cyan-50/80 via-white to-sky-50/60',
      border: 'border-cyan-100 hover:border-cyan-300',
      accent: 'text-cyan-600',
      hoverText: 'group-hover:text-cyan-600',
      playBg: 'bg-cyan-50 text-cyan-600 hover:bg-cyan-600 hover:text-white',
      activePlayBg: 'bg-cyan-600 text-white'
    },
    {
      bg: 'bg-gradient-to-br from-violet-50/80 via-white to-purple-50/60',
      border: 'border-violet-100 hover:border-violet-300',
      accent: 'text-violet-600',
      hoverText: 'group-hover:text-violet-600',
      playBg: 'bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white',
      activePlayBg: 'bg-violet-600 text-white'
    },
    {
      bg: 'bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60',
      border: 'border-blue-100 hover:border-blue-300',
      accent: 'text-blue-600',
      hoverText: 'group-hover:text-blue-600',
      playBg: 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white',
      activePlayBg: 'bg-blue-600 text-white'
    },
    {
      bg: 'bg-gradient-to-br from-fuchsia-50/70 via-white to-purple-50/50',
      border: 'border-fuchsia-100 hover:border-fuchsia-300',
      accent: 'text-fuchsia-600',
      hoverText: 'group-hover:text-fuchsia-600',
      playBg: 'bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-600 hover:text-white',
      activePlayBg: 'bg-fuchsia-600 text-white'
    }
  ];
  const index = Math.abs(hash) % themes.length;
  return themes[index];
}

export default function VoiceLibraryPage() {
  const [voices, setVoices] = useState<Voice[]>(voicesData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { apiKeys } = useSettingsStore();
  const activeKeyObj = useMemo(() => apiKeys.find(k => k.isActive && k.isValid), [apiKeys]);

  // Fetch API voices if active API key is selected
  useEffect(() => {
    let isMounted = true;
    async function loadApiVoices() {
      if (!activeKeyObj) return;
      setLoading(true);
      try {
        const authHeaders = await getAuthHeader();
        const response = await fetch(`/api/cartesia/voices?apiKey=${encodeURIComponent(activeKeyObj.key)}`, {
          headers: { ...authHeaders }
        });
        if (!response.ok) return;
        const apiVoicesList = await response.json();
        if (Array.isArray(apiVoicesList) && apiVoicesList.length > 0 && isMounted) {
          const mappedApiVoices: Voice[] = apiVoicesList.map((v: any) => ({
            id: v.id || v.voice_id,
            name: v.name,
            description: v.description || (v.is_cloned ? 'User Cloned Voice' : 'Awavox Voice'),
            language: v.language || 'English',
            gender: v.gender || 'neutral',
            country: v.country || 'US',
            is_high_quality: true,
            is_public: v.is_cloned ? false : (v.is_public !== undefined ? v.is_public : true),
            accents_locales: v.accents_locales || 'en-US',
            age: v.age || 'adult'
          }));

          const existingIds = new Set(mappedApiVoices.map(v => v.id));
          const restStatic = voicesData.filter(v => !existingIds.has(v.id));
          setVoices([...mappedApiVoices, ...restStatic]);
        }
      } catch (err) {
        console.warn("Failed to fetch custom API voices:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadApiVoices();
    return () => { isMounted = false; };
  }, [activeKeyObj]);

  // Filters
  const [filters, setFilters] = useState({
    language: 'all',
    gender: 'all',
    country: 'all',
    age: 'all',
    pro: 'all',
    accent: 'all'
  });

  const { memberProfile } = useAuthStore();
  const [showSubscription, setShowSubscription] = useState(false);

  // Derive unique filter values
  const filterOptions = useMemo(() => {
    const langs = Array.from(new Set(voices.map(v => v.language))).filter(Boolean).sort();
    const genders = Array.from(new Set(voices.map(v => v.gender))).filter(Boolean).sort();
    const countries = Array.from(new Set(voices.map(v => v.country))).filter(Boolean).sort();
    const ages = Array.from(new Set(voices.map(v => v.age).filter(Boolean))).sort();
    
    const accents = Array.from(new Set(voices.flatMap(v => 
      v.accents_locales ? v.accents_locales.split(',').map(s => s.trim().split('-')[1]?.replace('*', '') || s.trim()) : []
    ).filter(Boolean))).sort();
    
    return { langs, genders, countries, ages, accents };
  }, [voices]);

  const handlePreview = async (voiceId: string) => {
    if (playingVoiceId === voiceId && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
        setPlayingVoiceId(null);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setPreviewLoadingId(voiceId);
    setError(null);

    try {
      // 1. Check permanent cache
      let audioUrl = await getCachedPreview(voiceId);

      if (!audioUrl) {
        // 2. Fetch preview audio if not cached
        const res = await fetch(`/api/voice/preview/${voiceId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load preview audio');
        }

        const blob = await res.blob();
        await saveCachedPreview(voiceId, blob);
        audioUrl = URL.createObjectURL(blob);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.addEventListener('ended', () => {
        setPlayingVoiceId(null);
      });
      
      await audio.play();
      setPlayingVoiceId(voiceId);
    } catch (err: any) {
      console.error("Preview error:", err);
      setError(err.message || 'Failed to play voice preview');
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const filteredAndOrderedVoices = useMemo(() => {
    const filtered = voices.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           v.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLang = filters.language === 'all' || v.language === filters.language;
      const matchesGender = filters.gender === 'all' || v.gender === filters.gender;
      const matchesCountry = filters.country === 'all' || v.country === filters.country;
      const matchesAge = filters.age === 'all' || v.age === filters.age;
      const matchesPro = filters.pro === 'all' || 
                         (filters.pro === 'pro' && v.is_high_quality) || 
                         (filters.pro === 'free' && !v.is_high_quality);
      
      const matchesAccent = filters.accent === 'all' || (v.accents_locales && v.accents_locales.includes(filters.accent));

      return matchesSearch && matchesLang && matchesGender && matchesCountry && matchesAge && matchesPro && matchesAccent;
    });

    // Voice ordering: Private/Cloned voices FIRST, Public voices AFTER
    return filtered.sort((a, b) => {
      if (!a.is_public && b.is_public) return -1;
      if (a.is_public && !b.is_public) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [voices, searchQuery, filters]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 overflow-y-auto bg-transparent"
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <SubscriptionPopup isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
        
        <div className="flex flex-col mb-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Voice <span className="font-serif italic font-normal text-purple-600">Library</span>
          </h1>
          <p className="text-slate-500 font-medium mt-3 text-lg max-w-2xl">
            Browse and preview professional voices from Awavox AI Studio. Choose the perfect tone for your project.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 mb-8 space-y-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by voice name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              <FilterSelect 
                icon={<Globe className="w-4 h-4" />}
                label="Language"
                value={filters.language}
                options={filterOptions.langs}
                onChange={(val) => setFilters({...filters, language: val})}
              />
              <FilterSelect 
                icon={<User className="w-4 h-4" />}
                label="Gender"
                value={filters.gender}
                options={filterOptions.genders}
                onChange={(val) => setFilters({...filters, gender: val})}
              />
              <FilterSelect 
                icon={<MapPin className="w-4 h-4" />}
                label="Country"
                value={filters.country}
                options={filterOptions.countries}
                onChange={(val) => setFilters({...filters, country: val})}
              />
              <FilterSelect 
                icon={<Calendar className="w-4 h-4" />}
                label="Age"
                value={filters.age}
                options={filterOptions.ages}
                onChange={(val) => setFilters({...filters, age: val})}
              />
              <FilterSelect 
                icon={<Languages className="w-4 h-4" />}
                label="Accent"
                value={filters.accent}
                options={filterOptions.accents}
                onChange={(val) => setFilters({...filters, accent: val})}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-8 bg-red-50 border border-red-100 rounded-2xl text-red-600 flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 py-6 text-purple-600 font-bold text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading API voices...</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAndOrderedVoices.map((voice, idx) => {
              const theme = getVoiceTheme(voice);
              return (
              <motion.div 
                key={voice.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: idx * 0.01 }}
                className={`border rounded-2xl p-6 hover:shadow-2xl transition-all group flex flex-col h-full relative overflow-hidden ${theme.bg} ${theme.border}`}
              >
                {/* Tagging: Private for cloned/private voices, Public tag for default public voices */}
                {!voice.is_public ? (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-purple-900 text-purple-100 text-[10px] font-extrabold uppercase tracking-widest rounded-bl-xl shadow-md flex items-center gap-1">
                    <Lock className="w-3 h-3 text-purple-300" />
                    Private
                  </div>
                ) : (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-widest rounded-bl-xl border-b border-l border-blue-200 shadow-xs flex items-center gap-1">
                    <Globe className="w-3 h-3 text-blue-600" />
                    Public
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-4 pt-2">
                  <div>
                    <h3 className={`font-bold text-lg text-slate-900 ${theme.hoverText} transition-colors line-clamp-1`}>
                      {voice.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {voice.id.split('-')[0]}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handlePreview(voice.id)}
                    disabled={previewLoadingId === voice.id}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-sm ${
                      playingVoiceId === voice.id 
                        ? theme.activePlayBg
                        : theme.playBg
                    }`}
                  >
                    {previewLoadingId === voice.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : playingVoiceId === voice.id ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5 fill-current" />
                    )}
                  </button>
                </div>

                <div className="flex-1 space-y-4">
                  {voice.description && (
                    <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-3 italic">
                      "{voice.description}"
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 pt-4 mt-auto border-t border-slate-200/60">
                    {voice.language && <Badge icon={<Globe className="w-3 h-3" />} text={voice.language.toUpperCase()} accentClass={theme.accent} />}
                    {voice.gender && voice.gender !== 'neutral' && <Badge icon={<User className="w-3 h-3" />} text={voice.gender} accentClass={theme.accent} />}
                    {voice.country && <Badge icon={<MapPin className="w-3 h-3" />} text={voice.country} accentClass={theme.accent} />}
                    {voice.age && <Badge icon={<Calendar className="w-3 h-3" />} text={voice.age} accentClass={theme.accent} />}
                    {voice.accents_locales && <Badge icon={<Languages className="w-3 h-3" />} text={voice.accents_locales.split(',')[0]} title={voice.accents_locales} accentClass={theme.accent} />}
                  </div>
                </div>
              </motion.div>
            );})}
          </AnimatePresence>
          
          {filteredAndOrderedVoices.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Volume2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900">No voices found</h3>
              <p className="text-slate-500">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </div>
      <SubscriptionPopup isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
    </motion.div>
  );
}

function FilterSelect({ icon, label, value, options, onChange }: { 
  icon: React.ReactNode, 
  label: string, 
  value: string, 
  options: string[], 
  onChange: (val: string) => void 
}) {
  return (
    <div className="relative group flex-shrink-0">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:border-purple-200 transition-all cursor-pointer">
        <span className="text-purple-600">{icon}</span>
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-transparent outline-none text-sm font-bold text-slate-700 pr-6 cursor-pointer"
        >
          <option value="all">{label}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-purple-400 transition-colors" />
      </div>
    </div>
  );
}

function Badge({ icon, text, title, accentClass }: { icon: React.ReactNode, text: string, title?: string, accentClass?: string }) {
  return (
    <span title={title} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 text-[11px] font-bold text-slate-700 uppercase tracking-tight whitespace-nowrap border border-slate-200/80 shadow-xs">
      <span className={accentClass || 'text-purple-600'}>{icon}</span>
      {text}
    </span>
  );
}
