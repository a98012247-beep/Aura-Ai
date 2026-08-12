import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Loader2, Play, Pause, AlertCircle, Volume2, Mic2, Filter, ChevronDown, Globe, User, MapPin, Calendar, Languages, Zap } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { SubscriptionPopup } from '../components/SubscriptionPopup';
import { motion, AnimatePresence } from 'motion/react';
import voicesData from '../data/voices.json';

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

export default function VoiceLibraryPage() {
  const [voices, setVoices] = useState<Voice[]>(voicesData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  const isPro = memberProfile?.status === 'active' || memberProfile?.role === 'admin';

  // Derive unique filter values
  const filterOptions = useMemo(() => {
    const langs = Array.from(new Set(voicesData.map(v => v.language))).sort();
    const genders = Array.from(new Set(voicesData.map(v => v.gender))).sort();
    const countries = Array.from(new Set(voicesData.map(v => v.country))).sort();
    const ages = Array.from(new Set(voicesData.map(v => v.age).filter(Boolean))).sort();
    
    // Extract accent parts
    const accents = Array.from(new Set(voicesData.flatMap(v => 
      v.accents_locales ? v.accents_locales.split(',').map(s => s.trim().split('-')[1]?.replace('*', '') || s.trim()) : []
    ).filter(Boolean))).sort();
    
    return { langs, genders, countries, ages, accents };
  }, []);

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
      const idToken = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken();
      const res = await fetch(`/api/voice/preview/${voiceId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load preview');
      }

      const { url } = await res.json();
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.addEventListener('ended', () => {
        setPlayingVoiceId(null);
      });
      
      await audio.play();
      setPlayingVoiceId(voiceId);
    } catch (err: any) {
      console.error("Preview error:", err);
      setError(err.message);
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const filteredVoices = useMemo(() => {
    return voicesData.filter(v => {
      if (!v.is_public) return false;
      
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
  }, [searchQuery, filters]);

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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold tracking-wide uppercase shadow-sm mb-4 w-fit">
            <Mic2 className="w-3.5 h-3.5 text-purple-600" />
            Voice Explorer
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Voice <span className="font-serif italic font-normal text-purple-600">Library</span>
          </h1>
          <p className="text-slate-500 font-medium mt-3 text-lg max-w-2xl">
            Browse and preview 800+ professional voices from Cartesia. Choose the perfect tone for your project.
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
              <FilterSelect 
                icon={<Zap className="w-4 h-4" />}
                label="Quality"
                value={filters.pro}
                options={['pro', 'free']}
                onChange={(val) => setFilters({...filters, pro: val})}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredVoices.map((voice, idx) => (
              <motion.div 
                key={voice.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: idx * 0.01 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-2xl hover:border-purple-200 transition-all group flex flex-col h-full relative overflow-hidden"
              >
                {voice.is_high_quality && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-purple-600 text-white text-[10px] font-black uppercase tracking-tighter rounded-bl-xl shadow-lg">
                    PRO
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                      {voice.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {voice.id.split('-')[0]}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handlePreview(voice.id)}
                    disabled={previewLoadingId === voice.id}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 shadow-sm ${
                      playingVoiceId === voice.id 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-600'
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
                    <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3 italic">
                      "{voice.description}"
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
                    <Badge icon={<Globe className="w-3 h-3" />} text={voice.language} />
                    {voice.gender && <Badge icon={<User className="w-3 h-3" />} text={voice.gender} />}
                    {voice.age && <Badge icon={<Calendar className="w-3 h-3" />} text={voice.age} />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {filteredVoices.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <Volume2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900">No voices found</h3>
              <p className="text-slate-500">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      </div>
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

function Badge({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-tight whitespace-nowrap">
      {icon}
      {text}
    </span>
  );
}
