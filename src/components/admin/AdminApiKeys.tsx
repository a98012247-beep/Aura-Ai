import React, { useState } from 'react';
import { Plus, Trash2, Key, RefreshCw, Zap, ToggleLeft, ToggleRight, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AdminCard, AdminTable, SectionHeader, StatCard, AdminModal, AdminInput, AdminButton } from './AdminShared';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { getAuthHeader } from '../../services/cartesia';

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
  const [isTestingNew, setIsTestingNew] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [keyStatuses, setKeyStatuses] = useState<Record<string, { valid: boolean; message: string }>>({});

  const testKey = async (rawKey: string): Promise<{ valid: boolean; message: string }> => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch('/api/admin/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ key: rawKey.trim() })
      });
      const data = await res.json();
      if (data.valid) {
        return { valid: true, message: `Active (${data.voiceCount} voices available)` };
      } else {
        return { valid: false, message: data.error || 'Invalid credentials' };
      }
    } catch (err: any) {
      return { valid: false, message: err.message || 'Connection test failed' };
    }
  };

  const handleTestInTable = async (id: string, keyVal: string) => {
    setTestingId(id);
    const result = await testKey(keyVal);
    setKeyStatuses(prev => ({ ...prev, [id]: result }));
    setTestingId(null);
  };

  const handleTestNewKey = async () => {
    if (!newKey.key.trim()) return;
    setIsTestingNew(true);
    setTestResult(null);
    const res = await testKey(newKey.key);
    setTestResult(res);
    setIsTestingNew(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.key.trim() || !newKey.name.trim()) return;
    
    const keyVal = newKey.key.trim();
    const nameVal = newKey.name.trim();

    try {
      // 1. Persist directly to backend server pool
      const headers = await getAuthHeader();
      await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          key: keyVal,
          name: nameVal,
          isActive: true
        })
      });
    } catch (apiErr) {
      console.warn("Server API key registration notice:", apiErr);
    }

    // 2. Also save to Firestore collection for durability
    try {
      await addDoc(collection(db, 'platform_api_keys'), {
        name: nameVal,
        key: keyVal,
        isActive: true,
        usageCount: 0,
        totalCharactersUsed: 0,
        createdAt: serverTimestamp()
      });
    } catch (fsErr) {
      console.warn("Firestore save notice:", fsErr);
    }

    setNewKey({ key: '', name: '' });
    setTestResult(null);
    setShowAdd(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this API key from the active pool?')) return;
    try {
      const headers = await getAuthHeader();
      await fetch(`/api/admin/api-keys/${id}`, {
        method: 'DELETE',
        headers
      });
    } catch (e) {}

    try {
      await deleteDoc(doc(db, 'platform_api_keys', id));
    } catch (e) {}

    fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const headers = await getAuthHeader();
      await fetch(`/api/admin/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ isActive: !current })
      });
    } catch (e) {}

    try {
      await updateDoc(doc(db, 'platform_api_keys', id), { isActive: !current });
    } catch (e) {}

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
      <SectionHeader title="API Keys" subtitle="Manage Cartesia AI platform keys and test live connection validity">
        <AdminButton variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={onSyncVoices}>
          Sync Voices
        </AdminButton>
        <AdminButton icon={<Plus className="w-4 h-4" />} onClick={() => { setTestResult(null); setShowAdd(true); }}>
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
          headers={['Label', 'Key', 'Live Validation', 'Status', 'Actions']}
          isEmpty={apiKeys.length === 0}
          emptyMessage="No API keys configured. Click 'Add Key' to add your Cartesia API key."
        >
          {apiKeys.map(pk => {
            const status = keyStatuses[pk.id];
            return (
              <tr key={pk.id} className="hover:bg-white/50 transition-colors">
                <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-700 font-bold">{pk.name}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">sk_...{pk.key.substring(pk.key.length - 4)}</td>
                <td className="px-5 py-3.5 text-xs">
                  {status ? (
                    <div className="flex items-center gap-1.5">
                      {status.valid ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold" title={status.message}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 font-bold max-w-[180px] truncate" title={status.message}>
                          <XCircle className="w-3.5 h-3.5 shrink-0" /> {status.message || 'Invalid Key'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleTestInTable(pk.id, pk.key)}
                      disabled={testingId === pk.id}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {testingId === pk.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test Key'
                      )}
                    </button>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${pk.isActive ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                    {pk.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => toggleActive(pk.id, pk.isActive)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Toggle Active">
                      {pk.isActive ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(pk.id)} className="p-1.5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
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
            <AdminInput label="Label Name" type="text" required value={newKey.name} onChange={e => setNewKey({ ...newKey, name: e.target.value })} placeholder="Production Key" />
            <AdminInput label="API Key" type="password" required value={newKey.key} onChange={e => { setNewKey({ ...newKey, key: e.target.value }); setTestResult(null); }} placeholder="sk_car_..." />
            
            {testResult && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${testResult.valid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {testResult.valid ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestNewKey}
                disabled={!newKey.key.trim() || isTestingNew}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isTestingNew ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Test Connection
              </button>
              <AdminButton variant="secondary" type="button" onClick={() => setShowAdd(false)} className="flex-1">Cancel</AdminButton>
              <AdminButton type="submit" className="flex-1">Save Key</AdminButton>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
};
