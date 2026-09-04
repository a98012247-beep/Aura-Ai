import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Loader2, Play, Pause, AlertCircle, Volume2, Mic2, ChevronDown, Globe, User, MapPin, Calendar, Languages, Lock, Heart, LayoutGrid, List, Sparkles, X, Filter, Activity, Radio, Music } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/auth';
import { useSettingsStore } from '../store/settings';
import { SubscriptionPopup } from '../components/SubscriptionPopup';
import { motion, AnimatePresence } from 'motion/react';
import { MASTER_CARTESIA_VOICES } from '../data/cartesiaVoices';
import { getAuthHeader } from '../services/cartesia';
import { useVoiceStore } from '../store/voices';
import { getCachedPreview, saveCachedPreview, clearCachedPreview } from '../utils/previewCache';

interface Voice {
  id: string;
  name: string;
  description?: string;
  language: string;
  gender: string;
  country: string;
  is_public?: boolean;
  accents?: { locale: string }[];
  age?: string;
}

export default function VoiceLibraryPage() {
  const { voices, isLoading: loading, error: storeError, fetchCartesiaVoices } = useVoiceStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCartesiaVoices();
  }, [fetchCartesiaVoices]);

  useEffect(() => {
    if (storeError) setError(storeError);
  }, [storeError]);

  const [searchQuery, setSearchQuery] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleFavorite = (id: string) => {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavorites(next);
  };

  const { setActiveVoice } = useSettingsStore();
  const navigate = useNavigate();

  const handleSelectVoice = (voice: any) => {
    setActiveVoice(voice.id, voice.name);
    navigate('/studio');
  };


  const [filters, setFilters] = useState({
    language: 'all',
    gender: 'all',
    country: 'all',
    age: 'all',
    accent: 'all'
  });

  const removeFilter = (key: keyof typeof filters) => {
    setFilters(prev => ({ ...prev, [key]: 'all' }));
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== 'all');

  const { memberProfile } = useAuthStore();
  const [showSubscription, setShowSubscription] = useState(false);

  const filterOptions = useMemo(() => {
    const langs = Array.from(new Set(voices.map(v => v.language))).filter(Boolean).sort();
    const genders = Array.from(new Set(voices.map(v => v.gender))).filter(Boolean).sort();
    const countries = Array.from(new Set(voices.map(v => v.country))).filter(Boolean).sort();
    const ages = Array.from(new Set(voices.map(v => v.age).filter(Boolean))).sort();
    const accents = Array.from(new Set(voices.flatMap(v => 
      v.accents ? v.accents.map((a: any) => a.locale) : []
    ).filter(Boolean))).sort();
    
    return { langs, genders, countries, ages, accents };
  }, [voices]);

  const handlePreview = async (voice: Voice) => {
    const voiceId = voice.id;
    if (playingVoiceId === voiceId) {
      if (audioRef.current) {
        if (audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        } else {
          audioRef.current.pause();
          setPlayingVoiceId(null);
        }
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setPreviewLoadingId(voiceId);
    setError(null);

    const previewText = "Welcome to Awavox AI, where your words come to life with incredibly realistic voice.";

    try {
      let audioUrl = await getCachedPreview(voiceId);
      if (!audioUrl) {
        const authHeaders = await getAuthHeader();
        const res = await fetch('/api/cartesia/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ text: previewText, voiceId, type: 'preview', language: voice.language })
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || data.message || 'Cartesia voice preview generation failed');
        }

        const arrayBuffer = await res.arrayBuffer();
        if (arrayBuffer && arrayBuffer.byteLength > 0) {
          const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
          await saveCachedPreview(voiceId, blob);
          audioUrl = URL.createObjectURL(blob);
        }
      }

      if (audioUrl) {
        const audio = new Audio();
        audioRef.current = audio;

        audio.addEventListener('ended', () => setPlayingVoiceId(null));
        audio.addEventListener('error', () => {
          setPlayingVoiceId(null);
          setError('Failed to play audio stream');
          clearCachedPreview(voiceId);
        });

        audio.src = audioUrl;
        await audio.play();
        setPlayingVoiceId(voiceId);
      }
    } catch (err: any) {
      console.warn("Cartesia preview notice:", err.message || err);
      setError(err.message || 'Failed to play voice preview. Please check Admin API key configuration.');
      setPlayingVoiceId(null);
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const filteredAndOrderedVoices = useMemo(() => {
    const filtered = voices.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLang = filters.language === 'all' || v.language === filters.language;
      const matchesGender = filters.gender === 'all' || v.gender === filters.gender;
      const matchesCountry = filters.country === 'all' || v.country === filters.country;
      const matchesAge = filters.age === 'all' || v.age === filters.age;
      const matchesAccent = filters.accent === 'all' || (v.accents && v.accents.some((a: any) => a.locale === filters.accent));

      let matchesCategory = true;
      if (activeCategory === 'Favorites') matchesCategory = favorites.has(v.id);
      
      return matchesSearch && matchesLang && matchesGender && matchesCountry && matchesAge && matchesAccent && matchesCategory;
    });

    return filtered.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }, [voices, searchQuery, filters, activeCategory, favorites]);

  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    setVisibleCount(24);
  }, [searchQuery, filters, activeCategory]);

  const displayedVoices = useMemo(() => {
    return filteredAndOrderedVoices.slice(0, visibleCount);
  }, [filteredAndOrderedVoices, visibleCount]);

  const categories = ['All', 'Popular', 'Narration', 'Conversational', 'Favorites'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col min-h-full bg-transparent"
    >
      <div className="w-full px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 drop-shadow-sm">Voice <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 drop-shadow-[0_2px_8px_rgba(168,85,247,0.3)]">Library</span></h2>
              <p className="text-neutral-500 font-medium text-xs mt-1">
                Discover and explore our diverse collection of high-quality AI voices.
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 bg-white/50 backdrop-blur-xl rounded-[1rem] border border-white p-1 shadow-[0_8px_16px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] shrink-0">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-center relative">
            {/* Search Bar - Lifted 3D Input */}
            <div className="relative group flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400 group-focus-within:text-purple-600 transition-colors drop-shadow-sm" />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-3.5 bg-white/70 backdrop-blur-xl border border-white rounded-[1.5rem] leading-5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-200/50 transition-all font-medium text-base shadow-[0_8px_24px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] group-focus-within:shadow-[0_12px_32px_rgba(168,85,247,0.1),inset_0_2px_4px_rgba(255,255,255,1)] group-focus-within:-translate-y-0.5"
                placeholder="Search voices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Consolidated Filter Dropdown */}
            <div className="relative w-full lg:w-auto shrink-0 z-30">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`w-full lg:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 backdrop-blur-xl border rounded-xl transition-all font-bold text-sm shadow-[0_4px_12px_rgba(0,0,0,0.03),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-0.5 whitespace-nowrap ${isFilterOpen ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-[0_8px_24px_rgba(168,85,247,0.15),inset_0_2px_4px_rgba(255,255,255,1)]' : 'bg-white/70 border-white text-neutral-700 hover:shadow-[0_8px_24px_rgba(168,85,247,0.1),inset_0_2px_4px_rgba(255,255,255,1)] hover:text-neutral-900'}`}
              >
                <Filter className={`w-4 h-4 ${isFilterOpen ? 'text-purple-600' : 'text-neutral-400'}`} />
                <span>Filters</span>
                {hasActiveFilters && (
                   <span className="flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white text-[9px] font-black ml-1 shadow-sm">
                     {Object.values(filters).filter(v => v !== 'all').length}
                   </span>
                )}
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isFilterOpen ? 'rotate-180 text-purple-600' : 'text-neutral-400'}`} />
              </button>
              
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-3 w-full lg:w-80 bg-white/95 backdrop-blur-2xl border border-white/80 p-5 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,1)] z-50 flex flex-col gap-3 origin-top-right"
                  >
                     <FilterSelect 
                       icon={<Globe className="w-4 h-4" />} label="Language" value={filters.language} options={filterOptions.langs}
                       onChange={(val) => setFilters({...filters, language: val})}
                     />
                     <FilterSelect 
                       icon={<User className="w-4 h-4" />} label="Gender" value={filters.gender} options={filterOptions.genders}
                       onChange={(val) => setFilters({...filters, gender: val})}
                     />
                     <FilterSelect 
                       icon={<MapPin className="w-4 h-4" />} label="Country" value={filters.country} options={filterOptions.countries}
                       onChange={(val) => setFilters({...filters, country: val})}
                     />
                     <FilterSelect 
                       icon={<Calendar className="w-4 h-4" />} label="Age" value={filters.age} options={filterOptions.ages}
                       onChange={(val) => setFilters({...filters, age: val})}
                     />
                     <FilterSelect 
                       icon={<Languages className="w-4 h-4" />} label="Accent" value={filters.accent} options={filterOptions.accents}
                       onChange={(val) => setFilters({...filters, accent: val})}
                     />
                     
                     <div className="pt-2 mt-1 border-t border-neutral-100/80 flex items-center justify-between">
                       {hasActiveFilters ? (
                         <button 
                           onClick={() => setFilters({ language: 'all', gender: 'all', country: 'all', age: 'all', accent: 'all' })}
                           className="px-3 py-1.5 text-xs font-bold text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                         >
                           Clear All
                         </button>
                       ) : (
                         <span className="text-xs font-medium text-neutral-400 px-2">No filters active</span>
                       )}
                       <button 
                         onClick={() => setIsFilterOpen(false)}
                         className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-black rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                       >
                         Apply Filters
                       </button>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active Filter Chips */}
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap shadow-sm border ${activeCategory === cat ? 'bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-900 text-white border-neutral-700 shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.2)]' : 'bg-white/80 backdrop-blur-sm text-neutral-600 border-neutral-200/80 hover:border-neutral-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {hasActiveFilters && (
               <div className="h-6 w-px bg-neutral-300 mx-2 shrink-0"></div>
            )}
            <AnimatePresence>
              {Object.entries(filters).map(([k, v]) => v !== 'all' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={k} 
                  className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border border-purple-200 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 shadow-[0_2px_8px_rgba(168,85,247,0.1),inset_0_2px_4px_rgba(255,255,255,1)]"
                >
                  {v}
                  <button onClick={() => removeFilter(k as keyof typeof filters)} className="hover:text-purple-900 bg-white/50 rounded-full p-0.5 ml-1 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
          </div>
          
          <SubscriptionPopup isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
          
          <div className="py-8 relative w-full px-4 md:px-6 max-w-7xl mx-auto">
        {error && (
          <div className="p-4 mb-8 bg-red-50/90 backdrop-blur-md border border-red-200/80 rounded-2xl text-red-700 font-bold flex items-start gap-3 shadow-[0_4px_12px_rgba(239,68,68,0.1),inset_0_2px_4px_rgba(255,255,255,0.5)]">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-bold">
                {error.toLowerCase().includes('cartesia') || error.toLowerCase().includes('api') ? 'An error occurred during generation.' : error}
              </p>
              <p className="text-xs mt-2">
                Need help? <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-red-900">Contact support on WhatsApp</a>
              </p>
            </div>
          </div>
        )}

        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-4"}>
          
          {/* Voice Cloning Coming Soon Card (3D) */}
          {(activeCategory === 'All' || activeCategory === 'Popular') && !hasActiveFilters && searchQuery === '' && (
            <div className={`relative bg-white/80 backdrop-blur-xl border-2 border-dashed border-purple-300 rounded-2xl p-4 flex ${viewMode === 'grid' ? 'flex-col h-full' : 'items-center gap-4'} group opacity-90 hover:opacity-100 transition-all hover:shadow-[0_12px_32px_rgba(168,85,247,0.1),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1`}>
              <div className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-[0_4px_12px_rgba(168,85,247,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] border border-purple-400">
                Coming Soon
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center text-purple-600 border border-purple-200 shadow-[0_4px_12px_rgba(168,85,247,0.1),inset_0_2px_4px_rgba(255,255,255,1)] shrink-0 ${viewMode === 'grid' ? 'mb-3 mt-1' : ''}`}>
                <Sparkles className="w-5 h-5 drop-shadow-sm" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-base text-neutral-900 mb-1 drop-shadow-sm">Voice Cloning</h3>
                <p className="text-[10px] text-neutral-500 font-medium leading-relaxed">
                  Create a custom digital twin of your own voice using just a few minutes of audio.
                </p>
              </div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {displayedVoices.map((voice, idx) => {
              const isPlaying = playingVoiceId === voice.id;
              const isLoading = previewLoadingId === voice.id;
              const isFav = favorites.has(voice.id);
              
              return (
              <motion.div 
                key={voice.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`group bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] hover:shadow-[0_12px_24px_rgba(168,85,247,0.1),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1 hover:border-purple-200/50 transition-all duration-300 relative overflow-hidden ${viewMode === 'grid' ? 'flex flex-col h-full' : 'flex items-center gap-3'}`}
              >
                {/* Highlight line on top */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400/0 via-purple-400/50 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className={`flex justify-between items-start w-full ${viewMode === 'list' ? 'hidden' : ''}`}>
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-50/50 to-pink-50/50 border border-neutral-200/60 flex items-center justify-center overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] shrink-0 group-hover:border-purple-200 transition-colors">
                    <img 
                      src={`https://api.dicebear.com/9.x/micah/svg?seed=${voice.name}&backgroundColor=transparent&mouth=smile,laughing`} 
                      alt={voice.name} 
                      className="w-full h-full object-cover scale-110 opacity-85 group-hover:opacity-100 transition-opacity" 
                    />
                  </div>
                  <button onClick={() => toggleFavorite(voice.id)} className="p-2 text-neutral-300 hover:text-rose-500 transition-colors bg-white/50 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <Heart className={`w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500 drop-shadow-sm' : ''}`} />
                  </button>
                </div>

                {viewMode === 'list' && (
                  <button
                    onClick={() => handlePreview(voice)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0 border ${isPlaying ? 'bg-gradient-to-b from-purple-500 to-purple-700 text-white border-purple-600 shadow-[0_8px_16px_rgba(168,85,247,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)]' : 'bg-gradient-to-b from-neutral-50 to-neutral-100 text-neutral-900 border-neutral-200 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,1)] active:translate-y-0 active:shadow-inner'}`}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin drop-shadow-sm" /> : isPlaying ? <Pause className="w-4 h-4 fill-current drop-shadow-md" /> : <Play className="w-4 h-4 ml-1 fill-current drop-shadow-md" />}
                  </button>
                )}

                <div className={`flex-1 ${viewMode === 'grid' ? 'mt-3' : 'flex items-center gap-3 w-full'}`}>
                  <div className={`flex-1 ${viewMode === 'list' ? 'min-w-0' : ''}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="font-extrabold text-base text-neutral-900 truncate drop-shadow-sm">
                        {voice.name}
                      </h3>
                      {!voice.is_public && <Lock className="w-3 h-3 text-neutral-400 drop-shadow-sm" />}
                    </div>
                    {voice.description && (
                      <p className="text-[10px] text-neutral-500 font-medium line-clamp-2 leading-relaxed">
                        {voice.description}
                      </p>
                    )}
                  </div>
                  
                  <div className={`flex flex-wrap gap-2 ${viewMode === 'grid' ? 'mt-5' : 'w-1/3 justify-end'}`}>
                    {voice.language && <Badge text={voice.language.toUpperCase()} />}
                    {voice.gender && voice.gender !== 'neutral' && <Badge text={voice.gender} />}
                    {voice.country && <Badge text={voice.country} />}
                  </div>
                </div>

                {viewMode === 'list' && (
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={() => handleSelectVoice(voice)}
                      className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-black rounded-xl shadow-[0_4px_12px_rgba(168,85,247,0.3)] hover:shadow-[0_8px_24px_rgba(168,85,247,0.4)] transition-all active:scale-95"
                    >
                      Select Voice
                    </button>
                    <button onClick={() => toggleFavorite(voice.id)} className="p-3 bg-white/60 border border-neutral-200/80 rounded-full text-neutral-300 hover:text-rose-500 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                      <Heart className={`w-6 h-6 ${isFav ? 'fill-rose-500 text-rose-500 drop-shadow-sm' : ''}`} />
                    </button>
                  </div>
                )}

                {viewMode === 'grid' && (
                  <div className="mt-3 pt-3 border-t border-neutral-100/80 flex items-center justify-between">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-1 rounded-full ${isPlaying ? 'bg-gradient-to-t from-purple-400 to-pink-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-neutral-200'}`} style={{ height: `${Math.random() * 10 + 6}px`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectVoice(voice)}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-black rounded-lg shadow-[0_4px_12px_rgba(168,85,247,0.3)] hover:shadow-[0_8px_20px_rgba(168,85,247,0.4)] transition-all active:scale-95"
                      >
                        Select
                      </button>
                      <button
                        onClick={() => handlePreview(voice)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${isPlaying ? 'bg-gradient-to-b from-purple-500 to-purple-700 text-white border-purple-600 shadow-[0_4px_12px_rgba(168,85,247,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)]' : 'bg-gradient-to-b from-neutral-50 to-neutral-100 text-neutral-900 border-neutral-200 shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,1)] active:translate-y-0 active:shadow-inner'}`}
                      >
                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin drop-shadow-sm" /> : isPlaying ? <Pause className="w-3.5 h-3.5 fill-current drop-shadow-md" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-current drop-shadow-md" />}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );})}
          </AnimatePresence>
        </div>

        {visibleCount < filteredAndOrderedVoices.length && (
          <div className="mt-16 mb-8 text-center">
            <button
              onClick={() => setVisibleCount(prev => prev + 24)}
              className="px-8 py-4 bg-white/80 backdrop-blur-md border border-neutral-200/80 hover:border-purple-200 hover:bg-white text-neutral-900 font-black text-sm rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,1)] active:translate-y-0 active:shadow-inner transition-all"
            >
              Load More ({filteredAndOrderedVoices.length - visibleCount} remaining)
            </button>
          </div>
        )}
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
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-xl hover:border-purple-300 transition-colors cursor-pointer shadow-[inset_0_1px_4px_rgba(0,0,0,0.02),0_2px_4px_rgba(255,255,255,1)]">
        <span className="text-neutral-400 group-hover:text-purple-500 transition-colors drop-shadow-sm">{icon}</span>
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none bg-transparent outline-none text-xs font-black text-neutral-700 pr-6 cursor-pointer min-w-[90px]"
        >
          <option value="all">{label}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none group-hover:text-purple-500 transition-colors drop-shadow-sm" />
      </div>
    </div>
  );
}

function Badge({ text, title }: { text: string, title?: string }) {
  return (
    <span title={title} className="inline-flex items-center px-2 py-1 rounded-lg bg-white/60 backdrop-blur-sm border border-neutral-200/60 shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-[9px] font-black text-neutral-600 uppercase tracking-tight whitespace-nowrap">
      {text}
    </span>
  );
}

