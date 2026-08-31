import React from 'react';
import { ShieldCheck, Trash2, Ban } from 'lucide-react';
import { AdminCard, AdminTable, SectionHeader, StatCard } from './AdminShared';
import { db } from '../../lib/firebase';
import { updateDoc, deleteDoc, doc } from 'firebase/firestore';

interface VoiceClone {
  id: string;
  userId: string;
  userEmail: string;
  voiceName: string;
  provider: string;
  providerVoiceId: string;
  createdAt: any;
  status: 'active' | 'banned';
}

interface AdminModerationProps {
  voiceClones: VoiceClone[];
  fetchData: () => void;
}

export const AdminModeration: React.FC<AdminModerationProps> = ({ voiceClones, fetchData }) => {
  const banClone = async (id: string) => {
    if (!confirm('Ban this voice clone?')) return;
    await updateDoc(doc(db, 'voice_clones', id), { status: 'banned' });
    fetchData();
  };

  const deleteClone = async (id: string) => {
    if (!confirm('Permanently delete this voice clone?')) return;
    await deleteDoc(doc(db, 'voice_clones', id));
    fetchData();
  };

  const unbanClone = async (id: string) => {
    await updateDoc(doc(db, 'voice_clones', id), { status: 'active' });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Content Moderation" subtitle="Review and manage user-created voice clones" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Clones" value={voiceClones.length} icon={<ShieldCheck className="w-5 h-5 text-indigo-400" />} />
        <StatCard label="Active" value={voiceClones.filter(v => v.status === 'active').length} icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />} />
        <StatCard label="Banned" value={voiceClones.filter(v => v.status === 'banned').length} icon={<Ban className="w-5 h-5 text-red-400" />} />
      </div>

      <AdminCard noPadding>
        <AdminTable
          headers={['User', 'Voice Name', 'Provider', 'Status', 'Created', 'Actions']}
          isEmpty={voiceClones.length === 0}
          emptyMessage="No custom voice clones found."
        >
          {voiceClones.map(vc => (
            <tr key={vc.id} className={`hover:bg-white/50 transition-colors ${vc.status === 'banned' ? 'opacity-50' : ''}`}>
              <td className="px-5 py-3.5 text-sm text-slate-900 dark:text-slate-900">{vc.userEmail}</td>
              <td className="px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-900">{vc.voiceName}</td>
              <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-500 capitalize">{vc.provider}</td>
              <td className="px-5 py-3.5">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${vc.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'}`}>
                  {vc.status}
                </span>
              </td>
              <td className="px-5 py-3.5 text-sm text-slate-500">{vc.createdAt?.toDate?.()?.toLocaleDateString() || '-'}</td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  {vc.status === 'active' ? (
                    <button onClick={() => banClone(vc.id)} className="px-2.5 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold border border-red-500/20 transition-colors">
                      Ban
                    </button>
                  ) : (
                    <button onClick={() => unbanClone(vc.id)} className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-bold border border-emerald-500/20 transition-colors">
                      Unban
                    </button>
                  )}
                  <button onClick={() => deleteClone(vc.id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>
    </div>
  );
};
