import React from 'react';
import { useProjectsStore } from '../store/projects';
import { useSettingsStore } from '../store/settings';
import { useGenerationStore } from '../store/generation';
import { Play, Calendar, Clock, Trash2, RotateCcw, Mic, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

export default function HistoryPage() {
  const { projects, deleteProject, updateProjectTitle, updateProjectVoiceName } = useProjectsStore();
  const navigate = useNavigate();

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingType, setEditingType] = React.useState<'title' | 'voice' | null>(null);
  const [editValue, setEditValue] = React.useState('');

  const handleOpenProject = (project: any) => {
    const { updateVoiceSettings, updateCinematicSettings } = useSettingsStore.getState();
    const { updateDraftScript } = useProjectsStore.getState();
    
    updateVoiceSettings(project.voiceSettings);
    updateCinematicSettings(project.cinematicSettings);
    updateDraftScript(project.script);
    
    useGenerationStore.setState({
      finalAudioUrl: project.audioUrl,
      finalAudioBlob: null,
      error: null,
      isGenerating: false,
    });
    
    navigate('/');
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(new Date(timestamp));
  };

  return (
    <div className="flex flex-col min-h-full bg-transparent relative w-full">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-emerald-100/40 via-teal-100/40 to-blue-100/30 blur-[120px] pointer-events-none -z-10 rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full px-4 md:px-6 py-6"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900 drop-shadow-sm">
                Saved <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]">Voiceovers.</span>
              </h2>
              <p className="text-neutral-500 font-medium text-xs mt-1">
                Manage your project history, download generated narrations, or reopen past scripts.
              </p>
            </div>
            
            <div className="bg-white/50 backdrop-blur-md px-4 py-2 rounded-xl border border-neutral-200/80 shadow-[inset_0_1px_4px_rgba(0,0,0,0.03),0_2px_4px_rgba(255,255,255,1)] flex flex-col items-center justify-center shrink-0 mb-1 min-w-[90px]">
               <span className="text-lg font-black text-neutral-900 leading-tight">{projects.length}</span>
               <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Total Projects</span>
            </div>
          </div>

        {projects.length === 0 ? (
          <div className="bg-white border border-neutral-200/80 backdrop-blur-2xl rounded-[2rem] p-16 text-center shadow-xl flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
              <Clock className="w-8 h-8 text-emerald-500" />
            </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-1">No projects yet</h3>
          <p className="text-sm text-neutral-600 font-medium mt-1">
            Generated voiceovers will automatically save here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project, idx) => (
            <motion.div 
              key={project.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="bg-white border border-neutral-200/80 backdrop-blur-xl rounded-2xl p-5 hover:border-emerald-300 transition-all group shadow-md hover:shadow-xl"
            >
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-start sm:items-center w-full">
                <div className="space-y-1 overflow-hidden w-full">
                  {editingId === project.id && editingType === 'title' ? (
                    <input
                      type="text"
                      autoFocus
                      className="bg-neutral-50 text-neutral-900 px-3 py-1.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-purple-400 w-full mb-1 font-bold"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => {
                        if (editValue.trim() !== '') updateProjectTitle(project.id, editValue.trim());
                        setEditingId(null);
                        setEditingType(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditingType(null);
                        }
                      }}
                    />
                  ) : (
                    <h4 
                      className="font-bold text-neutral-900 truncate pr-4 cursor-pointer hover:text-purple-600 group/title flex items-center gap-2 w-max text-base"
                      onClick={() => {
                        setEditingId(project.id);
                        setEditingType('title');
                        setEditValue(project.title);
                      }}
                    >
                      {project.title}
                      <Edit2 className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 transition-opacity text-neutral-400" />
                    </h4>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 font-mono">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-neutral-400"/> {formatDate(project.createdAt)}</span>
                    {project.voiceName && (
                      editingId === project.id && editingType === 'voice' ? (
                        <input
                          type="text"
                          autoFocus
                          className="bg-neutral-50 text-neutral-900 px-2 py-0.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:border-purple-400 w-36 font-semibold"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => {
                            if (editValue.trim() !== '') updateProjectVoiceName(project.id, editValue.trim());
                            setEditingId(null);
                            setEditingType(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                            if (e.key === 'Escape') {
                              setEditingId(null);
                              setEditingType(null);
                            }
                          }}
                        />
                      ) : (
                        <span 
                          className="flex items-center gap-1.5 cursor-pointer text-neutral-700 hover:text-purple-600 font-sans font-semibold group/voice transition-colors bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/60"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(project.id);
                            setEditingType('voice');
                            setEditValue(project.voiceName || '');
                          }}
                        >
                          <Mic className="w-3 h-3 text-purple-600"/> {project.voiceName}
                          <Edit2 className="w-3 h-3 opacity-0 group-hover/voice:opacity-100 transition-opacity text-neutral-400" />
                        </span>
                      )
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0">
                  {project.audioUrl ? (
                    <audio controls src={project.audioUrl} className="h-9 flex-1 sm:w-48 min-w-0 outline-none rounded-full" />
                  ) : (
                    <span className="text-xs text-neutral-400 font-medium italic px-2">No audio URL</span>
                  )}
                  
                  <button 
                    onClick={() => handleOpenProject(project)}
                    className="p-2 ml-2 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors border border-neutral-200"
                    title="Load Project Settings & Script"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button 
                    onClick={() => deleteProject(project.id)}
                    className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
        </div>
      </motion.div>
    </div>
  );
}
