import React, { useState, useMemo } from 'react';
import { MessageSquareWarning, Filter } from 'lucide-react';
import { AdminCard, SectionHeader, StatCard, AdminSelect } from './AdminShared';
import { db } from '../../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';

interface FeedbackReport {
  id: string;
  userEmail: string;
  type: 'bug' | 'feature' | 'other';
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: any;
}

interface AdminFeedbackProps {
  feedback: FeedbackReport[];
  fetchData: () => void;
}

export const AdminFeedback: React.FC<AdminFeedbackProps> = ({ feedback, fetchData }) => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return feedback.filter(fb => {
      if (typeFilter !== 'all' && fb.type !== typeFilter) return false;
      if (statusFilter !== 'all' && fb.status !== statusFilter) return false;
      return true;
    });
  }, [feedback, typeFilter, statusFilter]);

  const openCount = feedback.filter(f => f.status === 'open').length;
  const resolvedCount = feedback.filter(f => f.status === 'resolved').length;

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'feedback', id), { status });
    fetchData();
  };

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      bug: 'bg-red-500/15 text-red-400 border-red-500/20',
      feature: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
      other: 'bg-slate-700/50 text-slate-600 dark:text-slate-500 border-slate-600/30',
    };
    return (
      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${styles[type] || styles.other}`}>
        {type}
      </span>
    );
  };

  const statusColor: Record<string, string> = {
    open: 'text-amber-400',
    'in-progress': 'text-blue-400',
    resolved: 'text-emerald-400',
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Feedback & Bugs" subtitle="User bug reports and feature requests" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Reports" value={feedback.length} icon={<MessageSquareWarning className="w-5 h-5 text-amber-400" />} />
        <StatCard label="Open" value={openCount} icon={<Filter className="w-5 h-5 text-amber-400" />} />
        <StatCard label="Resolved" value={resolvedCount} icon={<Filter className="w-5 h-5 text-emerald-400" />} />
      </div>

      <div className="flex gap-3">
        <AdminSelect value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-36">
          <option value="all">All Types</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="other">Other</option>
        </AdminSelect>
        <AdminSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-36">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </AdminSelect>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(fb => (
          <AdminCard key={fb.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {typeBadge(fb.type)}
                <span className={`text-[10px] font-bold uppercase tracking-widest ${statusColor[fb.status] || 'text-slate-600 dark:text-slate-500'}`}>
                  ● {fb.status}
                </span>
              </div>
              <select
                value={fb.status}
                onChange={e => updateStatus(fb.id, e.target.value)}
                className="px-2 py-1 bg-white dark:bg-white border border-slate-300 dark:border-slate-200 rounded-lg text-xs text-slate-700 dark:text-slate-700 outline-none"
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-700 mb-3 leading-relaxed">{fb.message}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{fb.userEmail}</p>
              <p className="text-xs text-slate-600">{fb.createdAt?.toDate?.()?.toLocaleDateString() || '-'}</p>
            </div>
          </AdminCard>
        ))}

        {filtered.length === 0 && (
          <AdminCard className="col-span-full text-center py-12">
            <MessageSquareWarning className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No feedback reports found.</p>
          </AdminCard>
        )}
      </div>
    </div>
  );
};
