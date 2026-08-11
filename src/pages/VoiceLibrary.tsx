import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Loader2, Play, Pause, AlertCircle, Volume2, Mic2, UploadCloud } from 'lucide-react';
import { useSettingsStore, ApiKey } from '../store/settings';
import { useAuthStore } from '../store/auth';
import { SubscriptionPopup } from '../components/SubscriptionPopup';
import { motion } from 'motion/react';

interface Voice {
  id: string;
  name: string;
  description?: string;
  previewUrl?: string;
  labels?: Record<string, string>;
  provider: string;
}

export default function VoiceLibraryPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { memberProfile } = useAuthStore();
  const [showSubscription, setShowSubscription] = useState(false);
  const isPro = memberProfile?.status === 'active' || memberProfile?.role === 'admin';

  const apiKeys = useSettingsStore(state => state.apiKeys);
  const activeKeyData = apiKeys.find(k => k.isActive && k.isValid);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchAllVoices() {
      if (!activeKeyData) {
        if (isMounted) {
          setError('No active API key found. Please configure your API key in Settings.');
          setLoading(false);
        }
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        let fetchedVoices: Voice[] = [];
        const provider = activeKeyData.provider || 'elevenlabs';
        
        if (provider === 'elevenlabs') {
          const res = await fetch(`/api/elevenlabs/voices?apiKey=${encodeURIComponent(activeKeyData.key)}`);
          if (!res.ok) throw new Error('Failed to fetch ElevenLabs voices');
          const data = await res.json();
          fetchedVoices = (data.voices || []).map((v: any) => ({
            id: v.voice_id,
            name: v.name,
            description: v.description,
            previewUrl: v.preview_url,
            labels: v.labels,
            provider: 'elevenlabs'
          }));
        } else if (provider === 'cartesia') {
          const res = await fetch(`/api/cartesia/voices?apiKey=${encodeURIComponent(activeKeyData.key)}`);
          if (!res.ok) throw new Error('Failed to fetch Cartesia voices');
          const data = await res.json();
          // Cartesia usually returns an array directly
          const voiceArray = Array.isArray(data) ? data : (data.voices || []);
          fetchedVoices = voiceArray.map((v: any) => ({
            id: v.id,
            name: v.name,
            description: v.description || v.accent || 'Cartesia Voice',
            previewUrl: undefined, // Cartesia might not have preview urls easily accessible without generating
            labels: { language: v.language || 'en' },
            provider: 'cartesia'
          }));
        } else if (provider === 'google') {
          const res = await fetch(`/api/google/voices?apiKey=${encodeURIComponent(activeKeyData.key)}`);
          if (!res.ok) throw new Error('Failed to fetch Google voices');
          const data = await res.json();
          fetchedVoices = (data.voices || []).map((v: any) => ({
            id: v.name,
            name: v.name,
            description: `${v.ssmlGender || 'Unknown'} - ${v.languageCodes?.[0] || 'Unknown'}`,
            provider: 'google'
          }));
        }

        if (isMounted) {
          setVoices(fetchedVoices);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An error occurred while fetching voices.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchAllVoices();

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [activeKeyData]);

  const togglePlay = (voiceId: string, previewUrl?: string) => {
    if (!previewUrl) return;

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

    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    
    audio.addEventListener('ended', () => {
      setPlayingVoiceId(null);
    });
    
    audio.play().catch(e => {
      console.error("Playback failed", e);
      setPlayingVoiceId(null);
    });
    
    setPlayingVoiceId(voiceId);
  };

  const filteredVoices = useMemo(() => {
    if (!searchQuery.trim()) return voices;
    
    const query = searchQuery.toLowerCase();
    return voices.filter(v => {
      if (v.name.toLowerCase().includes(query)) return true;
      if (v.description && v.description.toLowerCase().includes(query)) return true;
      
      if (v.labels) {
        for (const [key, val] of Object.entries(v.labels)) {
          if (key.toLowerCase().includes(query) || (typeof val === 'string' && val.toLowerCase().includes(query))) {
             return true;
          }
        }
      }
      return false;
    });
  }, [voices, searchQuery]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 overflow-y-auto bg-transparent"
    >
      <div className="max-w-6xl mx-auto px-4 py-8">
        <SubscriptionPopup isOpen={showSubscription} onClose={() => setShowSubscription(false)} />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-100 border border-cyan-200 text-cyan-800 text-xs font-bold tracking-wide uppercase shadow-2xs mb-3">
              <Mic2 className="w-3.5 h-3.5 text-cyan-600" />
              Voice Exploration
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-3">
              Voice <span className="font-serif italic font-normal text-cyan-700">Library</span>
            </h1>
            <p className="text-neutral-600 font-medium mt-2 text-base">
              Browse and preview professional voices for your active provider.
            </p>
          </div>
          
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
            <input
              type="text"
              placeholder="Search voices by name or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-neutral-200 rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all shadow-md"
            />
          </div>
        </div>

        {isPro && error && (
          <div className="p-4 mb-8 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-semibold flex items-start gap-3 shadow-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500 font-semibold">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-cyan-600" />
            <p>Loading voices from {activeKeyData?.provider || 'provider'}...</p>
          </div>
        ) : voices.length === 0 && !error ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-neutral-200/80 shadow-xl">
            <Volume2 className="w-12 h-12 text-cyan-600 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-neutral-900 mb-2">No Voices Found</h3>
            <p className="text-neutral-600 font-medium">Your active API key did not return any voices.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredVoices.map((voice, idx) => (
              <motion.div 
                key={voice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.03 }}
                className="bg-white border border-neutral-200/80 rounded-2xl p-6 hover:border-cyan-300 transition-all group flex flex-col h-full shadow-lg hover:shadow-xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-extrabold text-lg text-neutral-900 group-hover:text-cyan-700 transition-colors">
                    {voice.name}
                  </h3>
                  {voice.previewUrl && (
                    <button
                      onClick={() => togglePlay(voice.id, voice.previewUrl)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 font-bold ${
                        playingVoiceId === voice.id 
                          ? 'bg-cyan-600 text-white shadow-md' 
                          : 'bg-neutral-100 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-900'
                      }`}
                    >
                      {playingVoiceId === voice.id ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      )}
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  {voice.description && (
                    <p className="text-sm text-neutral-600 font-medium line-clamp-2 mb-4 leading-relaxed">
                      {voice.description}
                    </p>
                  )}
                  
                  {voice.labels && Object.keys(voice.labels).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {Object.entries(voice.labels).slice(0, 4).map(([key, value]) => (
                        <span 
                          key={key} 
                          className="px-2.5 py-1 rounded-md bg-neutral-100 border border-neutral-200/80 text-[10px] font-bold text-neutral-700 uppercase tracking-wider"
                        >
                          {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {filteredVoices.length === 0 && voices.length > 0 && (
              <div className="col-span-full text-center py-20 text-neutral-500">
                <p>No voices match your search query.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
