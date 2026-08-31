import React, { useState, useMemo } from 'react';
import { Search, Download, Filter } from 'lucide-react';
import { AdminCard, AdminTable, SectionHeader, StatCard, AdminSelect } from './AdminShared';

interface UsageRecord {
  id: string;
  email: string;
  tool: string;
  model?: string;
  characters?: number;
  duration?: number;
  timestamp: any;
}

interface AdminGenerationsProps {
  usage: UsageRecord[];
}

export const AdminGenerations: React.FC<AdminGenerationsProps> = ({ usage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState('all');
  const [page, setPage] = useState(0);
  const perPage = 50;

  const totalChars = usage.reduce((sum, u) => sum + (u.characters || 0), 0);
  const avgDuration = usage.length > 0 ? (usage.reduce((sum, u) => sum + (u.duration || 0), 0) / usage.length).toFixed(1) : '0';
  const models = [...new Set(usage.map(u => u.model).filter(Boolean))];

  const filtered = useMemo(() => {
    return usage.filter(u => {
      if (searchTerm && !u.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (modelFilter !== 'all' && u.model !== modelFilter) return false;
      return true;
    });
  }, [usage, searchTerm, modelFilter]);

  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const exportCSV = () => {
    const headers = ['Email', 'Tool', 'Model', 'Characters', 'Duration', 'Timestamp'];
    const rows = filtered.map(u => [
      u.email, u.tool, u.model || '', u.characters || '', u.duration || '',
      u.timestamp?.toDate?.()?.toISOString() || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'generations.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Generations" subtitle={`${usage.length} total generation logs`}>
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-white text-slate-700 dark:text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-200 transition-colors">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </SectionHeader>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Generations" value={usage.length} icon={<Filter className="w-5 h-5" />} />
        <StatCard label="Total Characters" value={totalChars.toLocaleString()} icon={<Filter className="w-5 h-5" />} />
        <StatCard label="Avg Duration" value={`${avgDuration}s`} icon={<Filter className="w-5 h-5" />} />
        <StatCard label="Unique Users" value={new Set(usage.map(u => u.email)).size} icon={<Filter className="w-5 h-5" />} />
      </div>

      <AdminCard noPadding>
        <div className="p-4 border-b border-slate-200 dark:border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white border border-slate-300 dark:border-slate-200 rounded-xl text-sm text-slate-900 dark:text-slate-900 placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/40 outline-none"
            />
          </div>
          <AdminSelect value={modelFilter} onChange={e => { setModelFilter(e.target.value); setPage(0); }} className="w-40">
            <option value="all">All Models</option>
            {models.map(m => <option key={m} value={m!}>{m}</option>)}
          </AdminSelect>
        </div>

        <AdminTable
          headers={['User', 'Tool', 'Model', 'Characters', 'Duration', 'Time']}
          isEmpty={paged.length === 0}
          emptyMessage="No generations found."
        >
          {paged.map(u => (
            <tr key={u.id} className="hover:bg-white/50 transition-colors">
              <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-slate-900">{u.email}</td>
              <td className="px-5 py-3.5">
                <span className="px-2 py-1 bg-white dark:bg-white text-slate-700 dark:text-slate-700 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-200">{u.tool}</span>
              </td>
              <td className="px-5 py-3.5">
                <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/20">{u.model || 'unknown'}</span>
              </td>
              <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-500">{u.characters ? `${u.characters}` : '-'}</td>
              <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-500">{u.duration ? `${u.duration.toFixed(1)}s` : '-'}</td>
              <td className="px-5 py-3.5 text-sm text-slate-500 text-right">{u.timestamp?.toDate?.()?.toLocaleString() || '-'}</td>
            </tr>
          ))}
        </AdminTable>

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500">Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 bg-white dark:bg-white text-slate-700 dark:text-slate-700 rounded-lg text-xs font-bold disabled:opacity-30 border border-slate-300 dark:border-slate-200">Prev</button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 bg-white dark:bg-white text-slate-700 dark:text-slate-700 rounded-lg text-xs font-bold disabled:opacity-30 border border-slate-300 dark:border-slate-200">Next</button>
            </div>
          </div>
        )}
      </AdminCard>
    </div>
  );
};
