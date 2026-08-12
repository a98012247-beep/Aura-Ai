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
  X,
  Key,
  Trash2,
  Edit,
  Shield,
  Crown,
  Phone
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc, 
  doc, 
  serverTimestamp, 
  orderBy, 
  limit, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { cn } from '../lib/utils';

import { useAuthStore } from '../store/auth';

type Tab = 'dashboard' | 'members' | 'usage' | 'earnings' | 'previews';

interface Member {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  status: 'active' | 'suspended' | 'revoked';
  deviceId: string | null;
  role: 'admin' | 'pro' | 'free' | string;
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

interface PreviewApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: any;
}

export const AdminPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [members, setMembers] = useState<Member[]>([]);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [previewKeys, setPreviewKeys] = useState<PreviewApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newMember, setNewMember] = useState({ email: '', password: '' });
  const [newEarning, setNewEarning] = useState({ amount: '', description: '' });
  const [newPreviewKey, setNewPreviewKey] = useState({ key: '', name: '' });
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddingEarning, setIsAddingEarning] = useState(false);
  const [isAddingPreviewKey, setIsAddingPreviewKey] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    console.log("Fetching data for tab:", activeTab);
    try {
      if (activeTab === 'dashboard' || activeTab === 'members') {
        const mSnap = await getDocs(query(collection(db, 'members'), orderBy('createdAt', 'desc')));
        console.log("Fetched members:", mSnap.size);
        setMembers(mSnap.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
      }
      if (activeTab === 'dashboard' || activeTab === 'usage') {
        const uSnap = await getDocs(query(collection(db, 'usage'), orderBy('timestamp', 'desc'), limit(100)));
        console.log("Fetched usage:", uSnap.size);
        setUsage(uSnap.docs.map(d => ({ id: d.id, ...d.data() } as UsageRecord)));
      }
      if (activeTab === 'dashboard' || activeTab === 'earnings') {
        const eSnap = await getDocs(query(collection(db, 'earnings'), orderBy('timestamp', 'desc')));
        console.log("Fetched earnings:", eSnap.size);
        setEarnings(eSnap.docs.map(d => ({ id: d.id, ...d.data() } as EarningRecord)));
      }
      if (activeTab === 'previews') {
        const pSnap = await getDocs(query(collection(db, 'preview_api_keys'), orderBy('createdAt', 'desc')));
        console.log("Fetched preview keys:", pSnap.size);
        setPreviewKeys(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as PreviewApiKey)));
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      alert("Error fetching admin data: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.email || !newMember.password) return;
    
    try {
      const currentUser = user || auth.currentUser;
      let token: string | undefined = undefined;
      if (currentUser) {
        try {
          token = await currentUser.getIdToken(true);
        } catch (tokenErr) {
          console.warn("Could not fetch ID token:", tokenErr);
        }
      }
      
      let createdUid: string | null = null;

      // 1. Attempt to create Firebase Auth user via server endpoint
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/admin/create-member', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email: newMember.email,
            password: newMember.password,
            role: 'pro'
          })
        });

        if (res.ok) {
          const data = await res.json();
          createdUid = data.uid || null;
        } else {
          const errData = await res.json().catch(() => ({}));
          console.warn("Backend create-member error:", errData.error || res.statusText);
        }
      } catch (apiErr) {
        console.warn("API request failed, falling back to client document creation:", apiErr);
      }

      // 2. Save member profile document in Firestore 'members' collection
      const memberData = {
        email: newMember.email,
        role: 'pro',
        status: 'active',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        deviceId: null
      };

      if (createdUid) {
        await setDoc(doc(db, 'members', createdUid), memberData);
      } else {
        await addDoc(collection(db, 'members'), memberData);
      }

      setNewMember({ email: '', password: '' });
      setIsAddingMember(false);
      fetchData();
    } catch (error) {
      console.error("Error adding member:", error);
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

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' });

  const updateMemberRole = async (memberId: string, role: string) => {
    try {
      const currentUser = user || auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        await fetch('/api/admin/update-member-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ targetUid: memberId, role })
        });
      }

      await updateDoc(doc(db, 'members', memberId), { role });
      fetchData();
    } catch (error) {
      console.error("Error updating subscription role:", error);
      alert("Error updating role: " + (error as Error).message);
    }
  };

  const handleUpdateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      const currentUser = user || auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        await fetch('/api/admin/update-member-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            targetUid: editingMember.id,
            name: editForm.name,
            phone: editForm.phone,
            email: editForm.email
          })
        });
      }

      await updateDoc(doc(db, 'members', editingMember.id), {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email
      });

      setEditingMember(null);
      fetchData();
    } catch (error) {
      console.error("Error updating registration:", error);
      alert("Error updating registration: " + (error as Error).message);
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

  const handleAddPreviewKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPreviewKey.key || !newPreviewKey.name) return;
    try {
      await addDoc(collection(db, 'preview_api_keys'), {
        ...newPreviewKey,
        createdAt: serverTimestamp()
      });
      setNewPreviewKey({ key: '', name: '' });
      setIsAddingPreviewKey(false);
      fetchData();
    } catch (error) {
      console.error("Error adding preview key:", error);
      alert("Error adding preview key: " + (error as Error).message);
    }
  };

  const deletePreviewKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this preview key?")) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'preview_api_keys', id));
      fetchData();
    } catch (error) {
      alert("Error deleting key");
    }
  };

  const syncVoices = async () => {
    if (!confirm("This will overwrite src/data/voices.json with the latest voices from Cartesia using the primary Preview API key. Continue?")) return;
    try {
      const token = await user?.getIdToken(true);
      
      if (!token) throw new Error("Not authenticated");
      
      const res = await fetch('/api/internal/sync-voices', {
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
         const err = await res.text();
         throw new Error(err || 'Failed to sync');
      }
      
      const data = await res.json();
      alert(`Success! Synced ${data.count} voices. Note: You may need to rebuild or refresh the app to see changes in the library.`);
    } catch (error) {
      alert("Sync Error: " + (error as Error).message);
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
          <TabButton 
            active={activeTab === 'previews'} 
            onClick={() => setActiveTab('previews')}
            icon={<Key className="w-5 h-5" />}
            label="Preview APIs"
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
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Registered Members</h2>
                  <p className="text-sm text-slate-500">Manage registered accounts, subscription roles, and member details</p>
                </div>
                <button 
                  onClick={() => setIsAddingMember(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">User / Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">WhatsApp / Phone</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Subscription</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">
                          No registered members found.
                        </td>
                      </tr>
                    ) : (
                      members.map(member => (
                        <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                {(member.name || member.email || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-sm">{member.name || 'Unnamed Member'}</p>
                                <p className="text-xs text-slate-500">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                            {member.phone ? (
                              <span className="inline-flex items-center gap-1.5 text-slate-800">
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                {member.phone}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Not provided</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <RoleBadge role={member.role} />
                              {member.role === 'admin' ? null : member.role === 'pro' ? (
                                <button
                                  onClick={() => updateMemberRole(member.id, 'free')}
                                  className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors font-medium"
                                  title="Downgrade to Free"
                                >
                                  Make Free
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateMemberRole(member.id, 'pro')}
                                  className="text-xs px-2.5 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-semibold shadow-xs flex items-center gap-1"
                                  title="Upgrade to Pro"
                                >
                                  <Crown className="w-3 h-3 text-amber-300" />
                                  Make Pro
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={member.status} />
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {member.createdAt?.toDate ? member.createdAt.toDate().toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => {
                                  setEditingMember(member);
                                  setEditForm({
                                    name: member.name || '',
                                    phone: member.phone || '',
                                    email: member.email || ''
                                  });
                                }}
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit Registration Details"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => resetDevice(member.id)}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Reset Device Binding"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => updateMemberStatus(member.id, member.status === 'active' ? 'suspended' : 'active')}
                                className={cn(
                                  "p-2 rounded-lg transition-colors",
                                  member.status === 'active' ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50" : "text-amber-600 bg-amber-50 hover:bg-amber-100"
                                )}
                                title={member.status === 'active' ? "Suspend User" : "Activate User"}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => updateMemberStatus(member.id, 'revoked')}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Revoke Access"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
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

          {activeTab === 'previews' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Preview API Keys</h2>
                  <p className="text-slate-500 text-sm mt-1">Manage Cartesia keys for generating voice library previews</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={syncVoices}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200 font-semibold"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sync Library
                  </button>
                  <button 
                    onClick={() => setIsAddingPreviewKey(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Key
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Name</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Key</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Created</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewKeys.map(pk => (
                      <tr key={pk.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{pk.name}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                          {pk.key.substring(0, 8)}...{pk.key.substring(pk.key.length - 4)}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          {pk.createdAt?.toDate().toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => deletePreviewKey(pk.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {previewKeys.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                          No preview API keys configured yet.
                        </td>
                      </tr>
                    )}
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

      {/* Add Preview Key Modal */}
      {isAddingPreviewKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Add Preview API Key</h3>
            <form onSubmit={handleAddPreviewKey} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Label Name</label>
                <input 
                  type="text"
                  required
                  value={newPreviewKey.name}
                  onChange={e => setNewPreviewKey({ ...newPreviewKey, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Main Cartesia Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                <input 
                  type="password"
                  required
                  value={newPreviewKey.key}
                  onChange={e => setNewPreviewKey({ ...newPreviewKey, key: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="sk_cartesia_..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddingPreviewKey(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Registration Details Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Edit Member Registration</h3>
              <button onClick={() => setEditingMember(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateRegistration} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp / Phone Number</label>
                <input 
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="+923001234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email"
                  required
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="user@example.com"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const RoleBadge: React.FC<{ role?: string }> = ({ role }) => {
  if (role === 'admin') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
        <Shield className="w-3 h-3" />
        ADMIN
      </span>
    );
  }
  if (role === 'pro') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
        <Crown className="w-3 h-3 text-emerald-600" />
        PRO
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
      FREE
    </span>
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
