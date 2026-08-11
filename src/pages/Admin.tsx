import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  DollarSign, 
  Plus, 
  UserPlus, 
  Power, 
  RefreshCw, 
  Search,
  MoreVertical,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock,
  X
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  orderBy, 
  limit, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { cn } from '../lib/utils';

type Tab = 'dashboard' | 'members' | 'usage' | 'earnings';

interface Member {
  id: string;
  email: string;
  status: 'active' | 'suspended' | 'revoked';
  deviceId: string | null;
  role: 'admin' | 'pro';
  createdAt: any;
  lastLoginAt: any;
}

interface UsageRecord {
  id: string;
  email: string;
  tool: string;
  timestamp: any;
}

interface EarningRecord {
  id: string;
  amount: number;
  description: string;
  timestamp: any;
}

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [members, setMembers] = useState<Member[]>([]);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newMember, setNewMember] = useState({ email: '', password: '' });
  const [newEarning, setNewEarning] = useState({ amount: '', description: '' });
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddingEarning, setIsAddingEarning] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard' || activeTab === 'members') {
        const mSnap = await getDocs(query(collection(db, 'members'), orderBy('createdAt', 'desc')));
        setMembers(mSnap.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
      }
      if (activeTab === 'dashboard' || activeTab === 'usage') {
        const uSnap = await getDocs(query(collection(db, 'usage'), orderBy('timestamp', 'desc'), limit(100)));
        setUsage(uSnap.docs.map(d => ({ id: d.id, ...d.data() } as UsageRecord)));
      }
      if (activeTab === 'dashboard' || activeTab === 'earnings') {
        const eSnap = await getDocs(query(collection(db, 'earnings'), orderBy('timestamp', 'desc')));
        setEarnings(eSnap.docs.map(d => ({ id: d.id, ...d.data() } as EarningRecord)));
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.email || !newMember.password) return;
    
    try {
      const { auth } = await import('../lib/firebase');
      const token = await auth.currentUser?.getIdToken();
      
      const res = await fetch('/api/admin/create-member', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newMember.email,
          password: newMember.password,
          role: 'pro'
        })
      });

      if (!res.ok) throw new Error('Failed to create member');

      setNewMember({ email: '', password: '' });
      setIsAddingMember(false);
      fetchData();
    } catch (error) {
      alert("Error adding member: " + (error as Error).message);
    }
  };

  const handleAddEarning = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'earnings'), {
        amount: parseFloat(newEarning.amount),
        description: newEarning.description,
        timestamp: serverTimestamp()
      });
      setNewEarning({ amount: '', description: '' });
      setIsAddingEarning(false);
      fetchData();
    } catch (error) {
      alert("Error adding earning");
    }
  };

  const updateMemberStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'members', id), { status });
      fetchData();
    } catch (error) {
      alert("Error updating status");
    }
  };

  const resetDevice = async (id: string) => {
    try {
      await updateDoc(doc(db, 'members', id), { deviceId: null });
      fetchData();
    } catch (error) {
      alert("Error resetting device");
    }
  };

  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-900">Admin Studio</h1>
          <p className="text-xs text-slate-500 mt-1">Management Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <TabButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<BarChart3 className="w-5 h-5" />}
            label="Dashboard"
          />
          <TabButton 
            active={activeTab === 'members'} 
            onClick={() => setActiveTab('members')}
            icon={<Users className="w-5 h-5" />}
            label="Pro Members"
          />
          <TabButton 
            active={activeTab === 'usage'} 
            onClick={() => setActiveTab('usage')}
            icon={<Activity className="w-5 h-5" />}
            label="Usage"
          />
          <TabButton 
            active={activeTab === 'earnings'} 
            onClick={() => setActiveTab('earnings')}
            icon={<DollarSign className="w-5 h-5" />}
            label="Earnings"
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  label="Total Earnings" 
                  value={`${totalEarnings.toLocaleString()} PKR`}
                  icon={<DollarSign className="text-emerald-600" />}
                  bgColor="bg-emerald-50"
                />
                <StatCard 
                  label="Pro Members" 
                  value={members.filter(m => m.role === 'pro').length}
                  icon={<Users className="text-blue-600" />}
                  bgColor="bg-blue-50"
                />
                <StatCard 
                  label="Total Requests" 
                  value={usage.length}
                  icon={<Activity className="text-indigo-600" />}
                  bgColor="bg-indigo-50"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">Recent Usage</h3>
                    <button onClick={() => setActiveTab('usage')} className="text-sm text-indigo-600 hover:underline">View all</button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {usage.slice(0, 5).map(u => (
                      <div key={u.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{u.email}</p>
                          <p className="text-xs text-slate-500">{u.tool}</p>
                        </div>
                        <span className="text-xs text-slate-400">
                          {u.timestamp?.toDate().toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900">New Members</h3>
                    <button onClick={() => setActiveTab('members')} className="text-sm text-indigo-600 hover:underline">View all</button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {members.slice(0, 5).map(m => (
                      <div key={m.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{m.email}</p>
                          <p className="text-xs text-slate-500">Joined {m.createdAt?.toDate().toLocaleDateString()}</p>
                        </div>
                        <StatusBadge status={m.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Pro Members</h2>
                <button 
                  onClick={() => setIsAddingMember(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Email</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Device Bound</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map(member => (
                      <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{member.email}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={member.status} />
                        </td>
                        <td className="px-6 py-4">
                          {member.deviceId ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                              Bound
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Not registered</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => resetDevice(member.id)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Reset Device"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => updateMemberStatus(member.id, member.status === 'active' ? 'suspended' : 'active')}
                              className={cn(
                                "p-1.5 transition-colors",
                                member.status === 'active' ? "text-slate-400 hover:text-amber-600" : "text-amber-600 hover:text-amber-700"
                              )}
                              title={member.status === 'active' ? "Suspend" : "Activate"}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => updateMemberStatus(member.id, 'revoked')}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                              title="Revoke Access"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">System Usage</h2>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">User</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Tool</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usage.map(u => (
                      <tr key={u.id}>
                        <td className="px-6 py-4 font-medium text-slate-900">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                            {u.tool}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          {u.timestamp?.toDate().toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Financial History</h2>
                <button 
                  onClick={() => setIsAddingEarning(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Manual Entry
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Description</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {earnings.map(e => (
                      <tr key={e.id}>
                        <td className="px-6 py-4 font-bold text-slate-900">{e.amount.toLocaleString()} PKR</td>
                        <td className="px-6 py-4 text-slate-600">{e.description}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          {e.timestamp?.toDate().toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Member Modal */}
      {isAddingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Create Pro Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email"
                  required
                  value={newMember.email}
                  onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password"
                  required
                  value={newMember.password}
                  onChange={e => setNewMember({ ...newMember, password: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Earning Modal */}
      {isAddingEarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Add Earnings Entry</h3>
            <form onSubmit={handleAddEarning} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (PKR)</label>
                <input 
                  type="number"
                  required
                  value={newEarning.amount}
                  onChange={e => setNewEarning({ ...newEarning, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="2999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input 
                  type="text"
                  required
                  value={newEarning.description}
                  onChange={e => setNewEarning({ ...newEarning, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Lifetime Subscription"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddingEarning(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ 
  active, onClick, icon, label 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
      active ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    {icon}
    {label}
  </button>
);

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; bgColor: string }> = ({
  label, value, icon, bgColor
}) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
    <div className={cn("p-4 rounded-xl", bgColor)}>
      {React.cloneElement(icon as React.ReactElement, { className: cn("w-6 h-6", (icon as React.ReactElement).props.className) })}
    </div>
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: Member['status'] }> = ({ status }) => {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-100",
    suspended: "bg-amber-50 text-amber-700 border-amber-100",
    revoked: "bg-red-50 text-red-700 border-red-100"
  };

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-xs font-bold border",
      styles[status]
    )}>
      {status.toUpperCase()}
    </span>
  );
};
