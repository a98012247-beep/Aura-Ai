import React, { useState } from 'react';
import { Plus, Trash2, Key, RefreshCw, Zap, ToggleLeft, ToggleRight } from 'lucide-react';
import { AdminCard, AdminTable, SectionHeader, StatCard, AdminModal, AdminInput, AdminButton } from './AdminShared';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, updateDoc, doc } from 'firebase/firestore';

interface PlatformApiKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  usageCount?: number;
  totalCharactersUsed?: number;
  createdAt: any;
}

interface UsageRecord {
  id: string;
  email: string;
  tool: string;
  model?: string;
  characters?: number;
  duration?: number;
  timestamp: any;
  context?: 'public' | 'free' | 'paid';
}

interface AdminApiKeysProps {
  apiKeys: PlatformApiKey[];
  usage: UsageRecord[];
  fetchData: () => void;
  onSyncVoices: () => void;
}

export const AdminApiKeys: React.FC<AdminApiKeysProps> = ({ apiKeys, usage, fetchData, onSyncVoices }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newKey, setNewKey] = useState({ key: '', name: '' });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.key || !newKey.name) return;
    await addDoc(collection(db, 'platform_api_keys'), {
      ...newKey, isActive: true, usageCount: 0, totalCharactersUsed: 0, createdAt: serverTimestamp()
    });
    setNewKey({ key: '', name: '' });
    setShowAdd(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this API key?')) return;
    await deleteDoc(doc(db, 'platform_api_keys', id));
    fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'platform_api_keys', id), { isActive: !current });
    fetchData();
  };

  // Usage stats by context
  const byContext: Record<string, { calls: number; chars: number }> = {
    public: { calls: 0, chars: 0 },
    free: { calls: 0, chars: 0 },
    paid: { calls: 0, chars: 0 }
  };
  
  usage.forEach(u => {
    const c = u.context || 'unknown';
    if (!byContext[c]) byContext[c] = { calls: 0, chars: 0 };
    byContext[c].calls++;
    byContext[c].chars += u.characters || 0;
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="API Keys" subtitle="Manage Cartesia API keys and track usage contexts">
        <AdminButton variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={onSyncVoices}>
          Sync Voices
        </AdminButton>
        <AdminButton icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>
          Add Key
        </AdminButton>
      </SectionHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Keys" value={apiKeys.length} icon={<Key className="w-5 h-5 text-indigo-400" />} />
        <StatCard label="Active Keys" value={apiKeys.filter(k => k.isActive).length} icon={<Zap className="w-5 h-5 text-emerald-400" />} />
        <StatCard label="Total API Calls" value={usage.length} icon={<Zap className="w-5 h-5 text-purple-400" />} />
      </div>

      {/* API Keys Table */}
      <AdminCard noPadding>
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-900">Cartesia Key Pool</h3>
        </div>
        <AdminTable
          headers={['Label', 'Key', 'Usage (Historical)', 'Status', 'Actions']}
          isEmpty={apiKeys.length === 0}
          emptyMessage="No API keys configured."
        >
          {apiKeys.map(pk => (
            <tr key={pk.id} className="hover:bg-white/50 transition-colors">
              <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-700 font-bold">{pk.name}</td>
              <td className="px-5 py-3.5 font-mono text-xs text-slate-500">sk_...{pk.key.substring(pk.key.length - 4)}</td>
              <td className="px-5 py-3.5 text-xs text-slate-500">{pk.totalCharactersUsed?.toLocaleString() || 0} chars</td>
              <td className="px-5 py-3.5">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${pk.isActive ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-slate-700/50 text-slate-500 border-slate-600/30'}`}>
                  {pk.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-5 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => toggleActive(pk.id, pk.isActive)} className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Toggle Active">
                    {pk.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(pk.id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>

      {/* Usage by Context */}
      <AdminCard>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-900 mb-4">Usage Analytics (Recent)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(byContext).map(([context, stats]) => {
            if (context === 'unknown' && stats.calls === 0) return null;
            return (
              <div key={context} className="p-4 bg-slate-100/50 dark:bg-white/50 rounded-xl border border-slate-200/50">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">{context}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-500">Calls</span>
                  <span className="text-slate-900 dark:text-slate-900 font-bold">{stats.calls}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-600 dark:text-slate-500">Characters</span>
                  <span className="text-slate-900 dark:text-slate-900 font-bold">{stats.chars.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>

      {showAdd && (
        <AdminModal title="Add Cartesia API Key" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <AdminInput label="Label Name" type="text" required value={newKey.name} onChange={e => setNewKey({ ...newKey, name: e.target.value })} placeholder="Main Key" />
            <AdminInput label="API Key" type="password" required value={newKey.key} onChange={e => setNewKey({ ...newKey, key: e.target.value })} placeholder="sk_car_..." />
            <div className="flex gap-3 pt-2">
              <AdminButton variant="secondary" type="button" onClick={() => setShowAdd(false)} className="flex-1">Cancel</AdminButton>
              <AdminButton type="submit" className="flex-1">Save Key</AdminButton>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
};
