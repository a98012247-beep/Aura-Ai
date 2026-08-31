import React, { useState } from 'react';
import { DollarSign, Plus, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import { AdminCard, AdminTable, SectionHeader, StatCard, AdminModal, AdminInput, AdminButton } from './AdminShared';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

interface EarningRecord {
  id: string;
  amount: number;
  description: string;
  timestamp: any;
}

interface AdminEarningsProps {
  earnings: EarningRecord[];
  fetchData: () => void;
}

export const AdminEarnings: React.FC<AdminEarningsProps> = ({ earnings, fetchData }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const totalRevenue = earnings.reduce((s, e) => s + e.amount, 0);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = earnings.filter(e => e.timestamp?.toDate?.() >= thisMonthStart).reduce((s, e) => s + e.amount, 0);
  const lastMonth = earnings.filter(e => {
    const d = e.timestamp?.toDate?.();
    return d >= lastMonthStart && d < thisMonthStart;
  }).reduce((s, e) => s + e.amount, 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || !newDesc) return;
    await addDoc(collection(db, 'earnings'), {
      amount: parseInt(newAmount),
      description: newDesc,
      timestamp: serverTimestamp()
    });
    setNewAmount(''); setNewDesc(''); setShowAdd(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this earning entry?')) return;
    await deleteDoc(doc(db, 'earnings', id));
    fetchData();
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Earnings" subtitle="Revenue tracking and financial history">
        <AdminButton icon={<Plus className="w-4 h-4" />} onClick={() => setShowAdd(true)}>
          Add Entry
        </AdminButton>
      </SectionHeader>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`${totalRevenue.toLocaleString()} PKR`} icon={<DollarSign className="w-5 h-5 text-emerald-400" />} />
        <StatCard label="This Month" value={`${thisMonth.toLocaleString()} PKR`} icon={<Calendar className="w-5 h-5 text-blue-400" />} />
        <StatCard label="Last Month" value={`${lastMonth.toLocaleString()} PKR`} icon={<Calendar className="w-5 h-5 text-slate-600 dark:text-slate-500" />} />
        <StatCard label="Avg Per Entry" value={`${earnings.length > 0 ? Math.round(totalRevenue / earnings.length).toLocaleString() : 0} PKR`} icon={<TrendingUp className="w-5 h-5 text-purple-400" />} />
      </div>

      <AdminCard noPadding>
        <AdminTable
          headers={['Amount', 'Description', 'Date', 'Actions']}
          isEmpty={earnings.length === 0}
          emptyMessage="No earnings recorded yet."
        >
          {earnings.map(e => (
            <tr key={e.id} className="hover:bg-white/50 transition-colors">
              <td className="px-5 py-3.5 text-sm font-black text-emerald-400">{e.amount.toLocaleString()} PKR</td>
              <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-700">{e.description}</td>
              <td className="px-5 py-3.5 text-sm text-slate-500">{e.timestamp?.toDate?.()?.toLocaleDateString() || '-'}</td>
              <td className="px-5 py-3.5 text-right">
                <button onClick={() => handleDelete(e.id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      </AdminCard>

      {showAdd && (
        <AdminModal title="Add Earnings Entry" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <AdminInput label="Amount (PKR)" type="number" required value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="2999" />
            <AdminInput label="Description" type="text" required value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Pro Subscription" />
            <div className="flex gap-3 pt-2">
              <AdminButton variant="secondary" type="button" onClick={() => setShowAdd(false)} className="flex-1">Cancel</AdminButton>
              <AdminButton type="submit" className="flex-1">Add Entry</AdminButton>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
};
