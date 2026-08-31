import React from 'react';
import { ShieldAlert, AlertTriangle, Ban } from 'lucide-react';
import { AdminCard, SectionHeader, StatCard, SeverityBadge } from './AdminShared';
import { db } from '../../lib/firebase';
import { updateDoc, doc } from 'firebase/firestore';

interface SecurityFlag {
  id: string;
  userId: string;
  userEmail: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: any;
  resolved: boolean;
}

interface AdminSecurityProps {
  securityFlags: SecurityFlag[];
  fetchData: () => void;
}

export const AdminSecurity: React.FC<AdminSecurityProps> = ({ securityFlags, fetchData }) => {
  const activeAlerts = securityFlags.filter(s => !s.resolved);
  const resolvedAlerts = securityFlags.filter(s => s.resolved);
  const highSeverity = activeAlerts.filter(s => s.severity === 'high').length;

  const suspendUser = async (flag: SecurityFlag) => {
    if (!confirm(`Suspend user ${flag.userEmail}?`)) return;
    await updateDoc(doc(db, 'members', flag.userId), { status: 'suspended' });
    await updateDoc(doc(db, 'security_flags', flag.id), { resolved: true });
    fetchData();
  };

  const dismissFlag = async (id: string) => {
    await updateDoc(doc(db, 'security_flags', id), { resolved: true });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Anti-Abuse System" subtitle="Security alerts and flagged accounts" />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Active Alerts" value={activeAlerts.length} icon={<ShieldAlert className="w-5 h-5 text-red-400" />} />
        <StatCard label="High Severity" value={highSeverity} icon={<AlertTriangle className="w-5 h-5 text-red-400" />} />
        <StatCard label="Total Flags" value={securityFlags.length} icon={<Ban className="w-5 h-5 text-amber-400" />} />
        <StatCard label="Resolved" value={resolvedAlerts.length} icon={<ShieldAlert className="w-5 h-5 text-emerald-400" />} />
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-900 uppercase tracking-widest">Active Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.map(sf => (
              <AdminCard key={sf.id} className={`border-l-4 ${sf.severity === 'high' ? 'border-l-red-500' : sf.severity === 'medium' ? 'border-l-orange-500' : 'border-l-amber-500'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-slate-900 dark:text-slate-900 font-bold text-sm">{sf.userEmail}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{sf.createdAt?.toDate?.()?.toLocaleString() || '-'}</p>
                  </div>
                  <SeverityBadge severity={sf.severity} />
                </div>
                <p className="text-sm text-red-400 font-semibold mb-4">{sf.reason}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => suspendUser(sf)}
                    className="px-3 py-1.5 bg-red-600 text-slate-900 dark:text-slate-900 hover:bg-red-700 font-bold text-xs rounded-lg transition-colors"
                  >
                    Suspend User
                  </button>
                  <button
                    onClick={() => dismissFlag(sf.id)}
                    className="px-3 py-1.5 bg-white dark:bg-white text-slate-700 dark:text-slate-700 hover:bg-slate-700 font-bold text-xs rounded-lg transition-colors border border-slate-300 dark:border-slate-200"
                  >
                    Dismiss
                  </button>
                </div>
              </AdminCard>
            ))}
          </div>
        </>
      )}

      {activeAlerts.length === 0 && (
        <AdminCard className="text-center py-12">
          <ShieldAlert className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <p className="text-emerald-400 font-bold">No active security alerts.</p>
          <p className="text-sm text-slate-500 mt-1">The platform is safe.</p>
        </AdminCard>
      )}

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-8">Resolved ({resolvedAlerts.length})</h3>
          <AdminCard noPadding className="opacity-60">
            <div className="divide-y divide-slate-200/60">
              {resolvedAlerts.slice(0, 10).map(sf => (
                <div key={sf.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-500">{sf.userEmail}</p>
                    <p className="text-xs text-slate-600">{sf.reason}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Resolved</span>
                </div>
              ))}
            </div>
          </AdminCard>
        </>
      )}
    </div>
  );
};
