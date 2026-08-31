import React, { useState } from 'react';
import { Sliders, Play, Disc3, Loader2, UploadCloud, X } from 'lucide-react';
import { useSettingsStore, StorytellingMode, PRESET_PROFILES } from '../store/settings';
import { generateAudioChunk } from '../services/cartesia';
import { useAuthStore } from '../store/auth';
import { SubscriptionPopup } from '../components/SubscriptionPopup';
import { motion } from 'motion/react';

export default function SettingsPage() {
  const {
    activeVoiceId,
    activeVoiceName,
    voiceSettings, updateVoiceSettings,
    cinematicSettings, updateCinematicSettings,
    activeProfileId, voiceProfiles, saveVoiceProfile, deleteVoiceProfile, applyVoiceProfile, resetToDefaultProfile,
  } = useSettingsStore();

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [cloneDesc, setCloneDesc] = useState('');
  const [cloneFiles, setCloneFiles] = useState<File[]>([]);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState('');
  const [cloneSuccess, setCloneSuccess] = useState('');

  const { memberProfile } = useAuthStore();
  const [showSubscription, setShowSubscription] = useState(false);
  const isPro = memberProfile?.role === 'pro' || memberProfile?.role === 'admin';

  const handleCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneName || cloneFiles.length === 0) return;
    setIsCloning(true);
    setCloneError('');
    setCloneSuccess('');
    try {
      const { cloneVoice } = await import('../services/cartesia');
      const newVoiceId = await cloneVoice(cloneName, cloneDesc, cloneFiles);
      setCloneSuccess(`Voice cloned successfully! ID: ${newVoiceId}`);
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

  const handlePreviewVoice = async () => {
    if (!isPro) {
      setShowSubscription(true);
      return;
    }
    if (!activeVoiceId) {
      setPreviewError('No voice selected. Please select a voice from the Voice Library.');
      return;
    }
    setIsPreviewing(true);
    setPreviewError(null);
    try {
      const script = "Donald Trump became one of the most recognized people on Earth. But long before politics... there was only ambition.";
      const buffer = await generateAudioChunk(script, activeVoiceId, 'preview');
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err: any) {
      if (err.message && (err.message.includes('PRO_REQUIRED') || err.message.toLowerCase().includes('pro subscription'))) {
        setShowSubscription(true);
      } else {
        setPreviewError(err.message || 'Failed to generate preview audio.');
      }
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full px-4 md:px-6 py-6"
    >
      <SubscriptionPopup isOpen={showSubscription} onClose={() => setShowSubscription(false)} />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 drop-shadow-sm">Studio <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 drop-shadow-[0_2px_8px_rgba(168,85,247,0.3)]">Settings</span></h2>
            <p className="text-neutral-500 font-medium text-xs mt-1">
              Configure your voice profiles, cinematic settings, and account preferences for high-quality audio generation.
            </p>
          </div>
        </div>

        {/* Active Voice Info */}
        {activeVoiceId && (
          <div className="flex items-center gap-3 px-4 py-3 bg-purple-50/80 border border-purple-200/60 rounded-2xl">
            <Disc3 className="w-4 h-4 text-purple-500 shrink-0" />
            <div>
              <p className="text-xs font-black text-neutral-800">Active Voice: <span className="text-purple-700">{activeVoiceName || activeVoiceId}</span></p>
              <p className="text-[10px] text-neutral-500 font-medium mt-0.5">Go to Voice Library to change your active voice.</p>
            </div>
          </div>
        )}

        <div className="space-y-8 pb-12">

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-neutral-200/60 pt-6 relative z-10">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors border border-transparent hover:border-neutral-200/50">
              <input type="checkbox" id="emphasis-engine" checked={cinematicSettings.emphasisEngine} onChange={(e) => updateCinematicSettings({ emphasisEngine: e.target.checked })} className="mt-0.5 w-4 h-4 rounded-sm accent-purple-600 cursor-pointer shrink-0 shadow-sm" />
              <label htmlFor="emphasis-engine" className="cursor-pointer">
                <span className="text-xs font-black text-neutral-900 block">Emphasis Engine</span>
                <span className="text-[10px] text-neutral-500 font-bold mt-0.5 block">Auto-emphasize tension words.</span>
              </label>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors border border-transparent hover:border-neutral-200/50">
              <input type="checkbox" id="human-imperfection" checked={cinematicSettings.humanImperfection} onChange={(e) => updateCinematicSettings({ humanImperfection: e.target.checked })} className="mt-0.5 w-4 h-4 rounded-sm accent-purple-600 cursor-pointer shrink-0 shadow-sm" />
              <label htmlFor="human-imperfection" className="cursor-pointer">
                <span className="text-xs font-black text-neutral-900 block">Human Imperfections</span>
                <span className="text-[10px] text-neutral-500 font-bold mt-0.5 block">Add subtle realism hesitations.</span>
              </label>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors border border-transparent hover:border-neutral-200/50 sm:col-span-2 lg:col-span-1">
              <input type="checkbox" id="clarity-boost" checked={cinematicSettings.clarityBoost} onChange={(e) => updateCinematicSettings({ clarityBoost: e.target.checked })} className="mt-0.5 w-4 h-4 rounded-sm accent-purple-600 cursor-pointer shrink-0 shadow-sm" />
              <label htmlFor="clarity-boost" className="cursor-pointer">
                <span className="text-xs font-black text-neutral-900 block">Clarity Boost</span>
                <span className="text-[10px] text-neutral-500 font-bold mt-0.5 block">Optimize pronunciation.</span>
              </label>
            </div>
          </div>

          {/* Live Preview Button */}
          <div className="bg-gradient-to-br from-purple-50/90 to-purple-100/90 rounded-2xl border border-purple-200/80 p-4 md:p-5 backdrop-blur-3xl shadow-[0_8px_24px_rgba(168,85,247,0.1),inset_0_2px_4px_rgba(255,255,255,1)] relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-black text-neutral-900 flex items-center gap-2 drop-shadow-sm">
                  <Play className="w-4 h-4 text-emerald-600 drop-shadow-sm" /> Live Voice Preview
                </h4>
                <p className="text-[11px] text-neutral-600 font-bold mt-1">Test your selected voice with a fixed cinematic script.</p>
              </div>
              <button
                onClick={() => handlePreviewVoice()}
                disabled={isPreviewing}
                className="flex w-full md:w-auto justify-center items-center gap-2 bg-gradient-to-b from-neutral-800 to-neutral-900 text-white px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-[0_8px_20px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:translate-y-0 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none shrink-0"
              >
                {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Disc3 className="w-4 h-4 text-purple-400 drop-shadow-sm" />}
                {isPreviewing ? 'Generating...' : 'Generate Preview'}
              </button>
            </div>

            {previewUrl && (
              <div className="mt-6 pt-6 border-t border-purple-200/60 flex items-center gap-3">
                <audio controls src={previewUrl} className="flex-1 h-12 outline-none rounded-[2rem] shadow-inner" />
              </div>
            )}
            {previewError && <p className="text-xs text-rose-700 mt-4 bg-rose-50/80 backdrop-blur-sm border border-rose-200 p-4 rounded-2xl font-bold shadow-sm">{previewError}</p>}
          </div>
        </div>
      </div>

      {/* Voice Cloning Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-3xl border border-white rounded-[2rem] w-full max-w-md p-8 relative shadow-[0_32px_64px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,1)]">
            <button
              onClick={() => setShowCloneModal(false)}
              className="absolute top-6 right-6 p-2 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-neutral-900 drop-shadow-sm">
              <UploadCloud className="w-6 h-6 text-purple-600 drop-shadow-sm" /> Clone Voice
            </h3>

            <form onSubmit={handleCloneSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Voice Name</label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={e => setCloneName(e.target.value)}
                  className="w-full bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100/50 transition-all text-neutral-900 font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(255,255,255,1)]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Description (Optional)</label>
                <textarea
                  value={cloneDesc}
                  onChange={e => setCloneDesc(e.target.value)}
                  className="w-full bg-white/80 backdrop-blur-sm border border-neutral-200/80 rounded-2xl px-5 py-3.5 text-sm h-28 resize-none focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100/50 transition-all text-neutral-900 font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),0_2px_8px_rgba(255,255,255,1)]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Audio Samples (Max 10MB)</label>
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
                  className="w-full text-sm text-neutral-500 font-medium file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 transition-all cursor-pointer file:shadow-sm"
                  required
                />
              </div>

              {cloneError && <p className="text-xs text-rose-700 mt-2 bg-rose-50/80 backdrop-blur-sm p-4 rounded-xl border border-rose-200 font-bold shadow-sm">{cloneError}</p>}
              {cloneSuccess && <p className="text-xs text-emerald-700 mt-2 bg-emerald-50/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-200 font-bold shadow-sm">{cloneSuccess}</p>}

              <button
                type="submit"
                disabled={isCloning || cloneFiles.length === 0}
                className="w-full bg-gradient-to-b from-neutral-800 to-neutral-900 text-white py-4 rounded-2xl text-sm font-black transition-all mt-8 disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.15),inset_0_2px_4px_rgba(255,255,255,0.2)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:translate-y-0 active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {isCloning ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5 drop-shadow-sm" />}
                {isCloning ? 'Cloning...' : 'Clone Voice'}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
