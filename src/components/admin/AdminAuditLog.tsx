import React, { useState, useEffect } from 'react';
import { ScrollText, Search } from 'lucide-react';
import { AdminCard, AdminTable, SectionHeader, StatCard, AdminSelect } from './AdminShared';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface AuditEntry {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  details: string;
  timestamp: any;
}

export const AdminAuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(200)));
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditEntry)));
      } catch {
        // Collection may not exist yet
      }
    })();
  }, []);

  const filtered = logs.filter(l => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return l.adminEmail?.toLowerCase().includes(term) || l.action?.toLowerCase().includes(term) || l.target?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <SectionHeader title="Audit Logs" subtitle="Full trail of admin actions" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Log Entries" value={logs.length} icon={<ScrollText className="w-5 h-5 text-indigo-400" />} />
        <StatCard label="Admins Active" value={new Set(logs.map(l => l.adminEmail)).size} icon={<ScrollText className="w-5 h-5 text-purple-400" />} />
        <StatCard label="Today" value={logs.filter(l => {
          if (!l.timestamp) return false;
          const d = l.timestamp.toDate?.();
          if (!d) return false;
          const today = new Date(); today.setHours(0,0,0,0);
          return d >= today;
        }).length} icon={<ScrollText className="w-5 h-5 text-blue-400" />} />
      </div>

      <AdminCard noPadding>
        <div className="p-4 border-b border-slate-200 dark:border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by admin, action, or target..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white border border-slate-300 dark:border-slate-200 rounded-xl text-sm text-slate-900 dark:text-slate-900 placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/40 outline-none"
            />
          </div>
        </div>

        <AdminTable
          headers={['Timestamp', 'Admin', 'Action', 'Target', 'Details']}
          isEmpty={filtered.length === 0}
          emptyMessage="No audit logs found. Actions will appear here as admins use the panel."
        >
          {filtered.map(l => (
            <tr key={l.id} className="hover:bg-white/50 transition-colors">
              <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{l.timestamp?.toDate?.()?.toLocaleString() || '-'}</td>
              <td className="px-5 py-3.5 text-sm text-slate-900 dark:text-slate-900 font-medium">{l.adminEmail}</td>
              <td className="px-5 py-3.5">
                <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/20">{l.action}</span>
              </td>
              <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-700">{l.target}</td>
              <td className="px-5 py-3.5 text-sm text-slate-500 text-right max-w-xs truncate">{l.details}</td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>
    </div>
  );
};
