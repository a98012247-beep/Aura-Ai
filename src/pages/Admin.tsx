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
import { motion } from 'motion/react';

import { useParams, useNavigate } from 'react-router';
import { useAuthStore } from '../store/auth';

type Tab = 'dashboard' | 'members' | 'generations' | 'earnings' | 'api-keys' | 'settings' | 'moderation' | 'feedback' | 'security';

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
  credits?: number;
}

interface UsageRecord {
  id: string;
  email: string;
  tool: string;
  model?: string;
  characters?: number;
  duration?: number;
  timestamp: any;
}

interface EarningRecord {
  id: string;
  amount: number;
  description: string;
  timestamp: any;
}

interface PlatformApiKey {
  id: string;
  provider: 'elevenlabs' | 'cartesia' | 'openai' | 'openrouter';
  name: string;
  key: string;
  isActive: boolean;
  createdAt: any;
}

interface GlobalSettings {
  id?: string;
  maintenanceMode: boolean;
  defaultModel: string;
  freeCharacterLimit: number;
  proCharacterLimit: number;
  signupEnabled: boolean;
}

interface VoiceClone {
  id: string;
  userId: string;
  userEmail: string;
  voiceName: string;
  provider: string; // elevenlabs / cartesia
  providerVoiceId: string;
  createdAt: any;
  status: 'active' | 'banned';
}

interface FeedbackReport {
  id: string;
  userEmail: string;
  type: 'bug' | 'feature' | 'other';
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: any;
}

interface SecurityFlag {
  id: string;
  userId: string;
  userEmail: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: any;
  resolved: boolean;
}

export const AdminPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const activeTab = (tab as Tab) || 'dashboard';

  const [members, setMembers] = useState<Member[]>([]);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [apiKeys, setApiKeys] = useState<PlatformApiKey[]>([]);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [voiceClones, setVoiceClones] = useState<VoiceClone[]>([]);
  const [feedback, setFeedback] = useState<FeedbackReport[]>([]);
  const [securityFlags, setSecurityFlags] = useState<SecurityFlag[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newMember, setNewMember] = useState({ email: '', password: '' });
  const [newEarning, setNewEarning] = useState({ amount: '', description: '' });
  const [newApiKey, setNewApiKey] = useState({ key: '', name: '', provider: 'cartesia' as any });
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddingEarning, setIsAddingEarning] = useState(false);
  const [isAddingApiKey, setIsAddingApiKey] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    console.log("Fetching data for tab:", activeTab);
    try {
      if (activeTab === 'dashboard' || activeTab === 'members' || activeTab === 'settings') {
        const mSnap = await getDocs(query(collection(db, 'members'), orderBy('createdAt', 'desc')));
        setMembers(mSnap.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
      }
      if (activeTab === 'dashboard' || activeTab === 'generations') {
        const uSnap = await getDocs(query(collection(db, 'usage'), orderBy('timestamp', 'desc'), limit(100)));
        setUsage(uSnap.docs.map(d => ({ id: d.id, ...d.data() } as UsageRecord)));
      }
      if (activeTab === 'dashboard' || activeTab === 'earnings') {
        const eSnap = await getDocs(query(collection(db, 'earnings'), orderBy('timestamp', 'desc')));
        setEarnings(eSnap.docs.map(d => ({ id: d.id, ...d.data() } as EarningRecord)));
      }
      if (activeTab === 'api-keys') {
        const kSnap = await getDocs(query(collection(db, 'platform_api_keys'), orderBy('createdAt', 'desc')));
        setApiKeys(kSnap.docs.map(d => ({ id: d.id, ...d.data() } as PlatformApiKey)));
      }
      if (activeTab === 'settings') {
        const sSnap = await getDocs(collection(db, 'global_settings'));
        if (!sSnap.empty) {
          setSettings({ id: sSnap.docs[0].id, ...sSnap.docs[0].data() } as GlobalSettings);
        } else {
          setSettings({
            maintenanceMode: false,
            defaultModel: 'cartesia',
            freeCharacterLimit: 5000,
            proCharacterLimit: 50000,
            signupEnabled: true
          });
        }
      }
      if (activeTab === 'moderation') {
        const vcSnap = await getDocs(query(collection(db, 'voice_clones'), orderBy('createdAt', 'desc')));
        setVoiceClones(vcSnap.docs.map(d => ({ id: d.id, ...d.data() } as VoiceClone)));
      }
      if (activeTab === 'feedback') {
        const fbSnap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc')));
        setFeedback(fbSnap.docs.map(d => ({ id: d.id, ...d.data() } as FeedbackReport)));
      }
      if (activeTab === 'security' || activeTab === 'dashboard') {
        const secSnap = await getDocs(query(collection(db, 'security_flags'), orderBy('createdAt', 'desc')));
        setSecurityFlags(secSnap.docs.map(d => ({ id: d.id, ...d.data() } as SecurityFlag)));
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

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiKey.key || !newApiKey.name || !newApiKey.provider) return;
    try {
      await addDoc(collection(db, 'platform_api_keys'), {
        ...newApiKey,
        isActive: true,
        createdAt: serverTimestamp()
      });
      setNewApiKey({ key: '', name: '', provider: 'cartesia' as any });
      setIsAddingApiKey(false);
      fetchData();
    } catch (error) {
      console.error("Error adding api key:", error);
      alert("Error adding api key: " + (error as Error).message);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'platform_api_keys', id));
      fetchData();
    } catch (error) {
      alert("Error deleting key");
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    try {
      if (settings.id) {
        await updateDoc(doc(db, 'global_settings', settings.id), { ...settings });
      } else {
        await addDoc(collection(db, 'global_settings'), { ...settings });
      }
      alert('Settings saved successfully!');
      fetchData();
    } catch (error) {
      alert("Error saving settings");
    }
  };

  const banVoiceClone = async (id: string) => {
    if (!confirm("Are you sure you want to ban this voice clone? This will prevent it from being used.")) return;
    try {
      await updateDoc(doc(db, 'voice_clones', id), { status: 'banned' });
      fetchData();
    } catch (error) {
      alert("Error banning voice clone");
    }
  };

  const deleteVoiceClone = async (id: string, providerVoiceId: string) => {
    if (!confirm("Are you sure you want to delete this voice clone permanently? You may also need to delete it from the provider (ElevenLabs/Cartesia) dashboard.")) return;
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'voice_clones', id));
      fetchData();
    } catch (error) {
      alert("Error deleting voice clone");
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
    <div className="min-h-screen bg-neutral-50 relative flex font-sans w-full">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-amber-400/10 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute top-[40%] left-[20%] w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none z-0"></div>



      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                  label="Total Earnings" 
                  value={`${totalEarnings.toLocaleString()} PKR`}
                  icon={<DollarSign className="text-emerald-600" />}
                  bgColor="bg-emerald-50"
                />
                <StatCard 
                  label="Pro Members" 
                  value={members.filter(m => m.role === 'pro').length}
                  icon={<Crown className="text-amber-600" />}
                  bgColor="bg-amber-50"
                />
                <StatCard 
                  label="Free Users" 
                  value={members.filter(m => m.role !== 'pro' && m.role !== 'admin').length}
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
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/20">
                    <h3 className="font-black text-slate-900 tracking-tight">Recent Usage</h3>
                    <button onClick={() => navigate('/admin/generations')} className="text-xs font-bold uppercase tracking-widest text-purple-600 hover:text-purple-700 hover:underline">View all</button>
                  </div>
                  <div className="divide-y divide-white/50">
                    {usage.slice(0, 5).map(u => (
                      <div key={u.id} className="p-4 flex items-center justify-between hover:bg-white/40 transition-colors">
                        <div>
                          <p className="font-semibold text-slate-900">{u.email}</p>
                          <p className="text-xs font-medium text-slate-500">{u.tool}</p>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                          {u.timestamp?.toDate().toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="p-6 border-b border-white/50 flex justify-between items-center bg-white/20">
                    <h3 className="font-black text-slate-900 tracking-tight">New Members</h3>
                    <button onClick={() => setActiveTab('members')} className="text-xs font-bold uppercase tracking-widest text-purple-600 hover:text-purple-700 hover:underline">View all</button>
                  </div>
                  <div className="divide-y divide-white/50">
                    {members.slice(0, 5).map(m => (
                      <div key={m.id} className="p-4 flex items-center justify-between hover:bg-white/40 transition-colors">
                        <div>
                          <p className="font-semibold text-slate-900">{m.email}</p>
                          <p className="text-xs font-medium text-slate-500">Joined {m.createdAt?.toDate().toLocaleDateString()}</p>
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Registered Members</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">Manage registered accounts, subscription roles, and member details</p>
                </div>
                <button 
                  onClick={() => setIsAddingMember(true)}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 hover:shadow-[0_8px_20px_rgba(168,85,247,0.3)] transition-all shadow-md font-bold text-sm border border-purple-500/30"
                >
                  <UserPlus className="w-4 h-4 drop-shadow-sm" />
                  Add Member
                </button>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white/40 border-b border-white/50 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">User / Name</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">WhatsApp / Phone</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Subscription</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Joined</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
                    {members.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm font-medium">
                          No registered members found.
                        </td>
                      </tr>
                    ) : (
                      members.map(member => (
                        <tr key={member.id} className="hover:bg-white/50 transition-colors group">
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
                                onClick={() => setSelectedUser(member)}
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Search className="w-4 h-4" />
                              </button>
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

          {activeTab === 'generations' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Generation Analytics</h2>
              <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/40 border-b border-white/50 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">User</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Tool</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Model</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Chars / Duration</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
                    {usage.map(u => (
                      <tr key={u.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100/80 text-slate-600 border border-slate-200/50 rounded-lg text-xs font-bold shadow-sm">
                            {u.tool}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                            {u.model || 'unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                          {u.characters ? `${u.characters} chars` : '-'} 
                          {u.duration ? ` / ${u.duration.toFixed(1)}s` : ''}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                          {u.timestamp?.toDate().toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {usage.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium italic">
                          No generations logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Financial History</h2>
                <button 
                  onClick={() => setIsAddingEarning(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:opacity-90 shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all font-bold text-sm border border-emerald-400/30"
                >
                  <Plus className="w-4 h-4" />
                  Manual Entry
                </button>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/40 border-b border-white/50 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
                    {earnings.map(e => (
                      <tr key={e.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-6 py-4 font-black text-slate-900">{e.amount.toLocaleString()} PKR</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{e.description}</td>
                        <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                          {e.timestamp?.toDate().toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">API Integrations</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Manage global API keys for ElevenLabs, Cartesia, OpenAI, and OpenRouter</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsAddingApiKey(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 shadow-[0_8px_20px_rgba(99,102,241,0.3)] transition-all font-bold text-sm border border-indigo-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    Add Key
                  </button>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/40 border-b border-white/50 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Provider</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Label</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Key (Masked)</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
                    {apiKeys.map(pk => (
                      <tr key={pk.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900 capitalize">{pk.provider}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{pk.name}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 font-medium bg-slate-50/50 rounded px-2">
                          sk_...{pk.key.substring(pk.key.length - 4)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border", pk.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200")}>
                            {pk.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => deleteApiKey(pk.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {apiKeys.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium italic">
                          No API keys configured yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Global Settings</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Configure platform-wide limits and behaviors</p>
                </div>
                <button 
                  onClick={saveSettings}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:opacity-90 shadow-[0_8px_20px_rgba(59,130,246,0.3)] transition-all font-bold text-sm border border-blue-500/30"
                >
                  <Shield className="w-4 h-4" />
                  Save Settings
                </button>
              </div>

              {settings && (
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-8 space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest">General Configuration</h3>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-white/50 border border-white/60 rounded-xl cursor-pointer hover:bg-white transition-colors">
                          <div>
                            <p className="font-bold text-slate-900">Maintenance Mode</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Disable app access for non-admins</p>
                          </div>
                          <div className="relative inline-block w-12 h-6 rounded-full bg-slate-200">
                            <input type="checkbox" className="peer sr-only" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} />
                            <span className="absolute inset-y-1 left-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:left-7 peer-checked:bg-indigo-600 shadow-sm"></span>
                          </div>
                        </label>
                        <label className="flex items-center justify-between p-4 bg-white/50 border border-white/60 rounded-xl cursor-pointer hover:bg-white transition-colors">
                          <div>
                            <p className="font-bold text-slate-900">Enable New Signups</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Allow new users to register</p>
                          </div>
                          <div className="relative inline-block w-12 h-6 rounded-full bg-slate-200">
                            <input type="checkbox" className="peer sr-only" checked={settings.signupEnabled} onChange={e => setSettings({...settings, signupEnabled: e.target.checked})} />
                            <span className="absolute inset-y-1 left-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:left-7 peer-checked:bg-indigo-600 shadow-sm"></span>
                          </div>
                        </label>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Default TTS Model</label>
                          <select 
                            value={settings.defaultModel}
                            onChange={e => setSettings({...settings, defaultModel: e.target.value})}
                            className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-900"
                          >
                            <option value="elevenlabs">ElevenLabs</option>
                            <option value="cartesia">Cartesia</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest">Resource Limits</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Free Tier Char Limit (Monthly)</label>
                          <input 
                            type="number"
                            value={settings.freeCharacterLimit}
                            onChange={e => setSettings({...settings, freeCharacterLimit: parseInt(e.target.value) || 0})}
                            className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Pro Tier Char Limit (Monthly)</label>
                          <input 
                            type="number"
                            value={settings.proCharacterLimit}
                            onChange={e => setSettings({...settings, proCharacterLimit: parseInt(e.target.value) || 0})}
                            className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Content Moderation</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Review and manage user-created voice clones</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/40 border-b border-white/50 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">User</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Voice Name</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Provider</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
                    {voiceClones.map(vc => (
                      <tr key={vc.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{vc.userEmail}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{vc.voiceName}</td>
                        <td className="px-6 py-4 font-medium text-slate-500 capitalize">{vc.provider}</td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border", vc.status === 'active' ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-red-100 text-red-700 border-red-200")}>
                            {vc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {vc.status === 'active' ? (
                            <button 
                              onClick={() => banVoiceClone(vc.id)}
                              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-lg transition-colors border border-red-200"
                            >
                              Ban Clone
                            </button>
                          ) : (
                            <button 
                              onClick={() => deleteVoiceClone(vc.id, vc.providerVoiceId)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {voiceClones.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium italic">
                          No custom voice clones found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Feedback & Bugs</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Manage user bug reports and feature requests</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/40 border-b border-white/50 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">User</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest w-1/2">Message</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-5 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
                    {feedback.map(fb => (
                      <tr key={fb.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{fb.userEmail}</td>
                        <td className="px-6 py-4 font-bold text-slate-900 capitalize">{fb.type}</td>
                        <td className="px-6 py-4 font-medium text-slate-600 text-sm">{fb.message}</td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border", 
                            fb.status === 'open' ? "bg-amber-100 text-amber-700 border-amber-200" : 
                            fb.status === 'in-progress' ? "bg-blue-100 text-blue-700 border-blue-200" :
                            "bg-emerald-100 text-emerald-700 border-emerald-200")}>
                            {fb.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <select 
                            value={fb.status}
                            onChange={(e) => updateDoc(doc(db, 'feedback', fb.id), { status: e.target.value }).then(fetchData)}
                            className="px-3 py-1.5 bg-white/50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-indigo-300"
                          >
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {feedback.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium italic">
                          No feedback reports found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-red-600 tracking-tight drop-shadow-sm">Anti-Abuse System</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1">Review flagged accounts for spam and abuse</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-red-100 shadow-[0_8px_32px_rgba(239,68,68,0.05)] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-red-50/50 border-b border-red-100 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-5 text-[11px] font-black text-red-700 uppercase tracking-widest">User</th>
                      <th className="px-6 py-5 text-[11px] font-black text-red-700 uppercase tracking-widest">Reason</th>
                      <th className="px-6 py-5 text-[11px] font-black text-red-700 uppercase tracking-widest">Severity</th>
                      <th className="px-6 py-5 text-[11px] font-black text-red-700 uppercase tracking-widest">Time</th>
                      <th className="px-6 py-5 text-[11px] font-black text-red-700 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-50">
                    {securityFlags.map(sf => (
                      <tr key={sf.id} className={cn("transition-colors", sf.resolved ? "opacity-50" : "bg-red-50/20 hover:bg-red-50/40")}>
                        <td className="px-6 py-4 font-semibold text-slate-900">{sf.userEmail}</td>
                        <td className="px-6 py-4 font-bold text-red-600">{sf.reason}</td>
                        <td className="px-6 py-4">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border", 
                            sf.severity === 'high' ? "bg-red-100 text-red-700 border-red-200" : 
                            sf.severity === 'medium' ? "bg-orange-100 text-orange-700 border-orange-200" :
                            "bg-amber-100 text-amber-700 border-amber-200")}>
                            {sf.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                          {sf.createdAt?.toDate().toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          {!sf.resolved && (
                            <>
                              <button 
                                onClick={() => {
                                  if(confirm("Suspend this user?")) {
                                    updateDoc(doc(db, 'members', sf.userId), { status: 'suspended' });
                                    updateDoc(doc(db, 'security_flags', sf.id), { resolved: true }).then(fetchData);
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 font-bold text-xs rounded-lg transition-colors shadow-sm"
                              >
                                Suspend User
                              </button>
                              <button 
                                onClick={() => updateDoc(doc(db, 'security_flags', sf.id), { resolved: true }).then(fetchData)}
                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-lg transition-colors shadow-sm"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                          {sf.resolved && <span className="text-xs font-bold text-slate-400">Resolved</span>}
                        </td>
                      </tr>
                    ))}
                    {securityFlags.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-emerald-600 font-medium italic bg-emerald-50/20">
                          No active security alerts. The platform is safe!
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl w-full max-w-md p-8 shadow-[0_16px_64px_rgba(0,0,0,0.1)] border border-white">
            <h3 className="text-2xl font-black text-slate-900 mb-6 drop-shadow-sm">Create Pro Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email"
                  required
                  value={newMember.email}
                  onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-900"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Password</label>
                <input 
                  type="password"
                  required
                  value={newMember.password}
                  onChange={e => setNewMember({ ...newMember, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-900"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="flex-1 px-4 py-3 bg-white/50 border border-white/60 text-slate-600 rounded-xl hover:bg-white transition-colors font-bold shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:opacity-90 transition-all font-bold shadow-[0_8px_20px_rgba(168,85,247,0.3)] border border-purple-500/30"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl w-full max-w-md p-8 shadow-[0_16px_64px_rgba(0,0,0,0.1)] border border-white">
            <h3 className="text-2xl font-black text-slate-900 mb-6 drop-shadow-sm">Add Earnings Entry</h3>
            <form onSubmit={handleAddEarning} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Amount (PKR)</label>
                <input 
                  type="number"
                  required
                  value={newEarning.amount}
                  onChange={e => setNewEarning({ ...newEarning, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-900"
                  placeholder="2999"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Description</label>
                <input 
                  type="text"
                  required
                  value={newEarning.description}
                  onChange={e => setNewEarning({ ...newEarning, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-900"
                  placeholder="Lifetime Subscription"
                />
              </div>
              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setIsAddingEarning(false)}
                  className="flex-1 px-4 py-3 bg-white/50 border border-white/60 text-slate-600 rounded-xl hover:bg-white transition-colors font-bold shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:opacity-90 transition-all font-bold shadow-[0_8px_20px_rgba(16,185,129,0.3)] border border-emerald-400/30"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add API Key Modal */}
      {isAddingApiKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl w-full max-w-md p-8 shadow-[0_16px_64px_rgba(0,0,0,0.1)] border border-white">
            <h3 className="text-2xl font-black text-slate-900 mb-6 drop-shadow-sm">Add API Key</h3>
            <form onSubmit={handleAddApiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Provider</label>
                <select
                  value={newApiKey.provider}
                  onChange={e => setNewApiKey({ ...newApiKey, provider: e.target.value as any })}
                  className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-900"
                >
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="cartesia">Cartesia</option>
                  <option value="openai">OpenAI</option>
                  <option value="openrouter">OpenRouter</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Label Name</label>
                <input 
                  type="text"
                  required
                  value={newApiKey.name}
                  onChange={e => setNewApiKey({ ...newApiKey, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-900"
                  placeholder="Main Key"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">API Key</label>
                <input 
                  type="password"
                  required
                  value={newApiKey.key}
                  onChange={e => setNewApiKey({ ...newApiKey, key: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-900"
                  placeholder="sk_..."
                />
              </div>
              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setIsAddingApiKey(false)}
                  className="flex-1 px-4 py-3 bg-white/50 border border-white/60 text-slate-600 rounded-xl hover:bg-white transition-colors font-bold shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all font-bold shadow-[0_8px_20px_rgba(99,102,241,0.3)] border border-indigo-500/30"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl w-full max-w-md p-8 shadow-[0_16px_64px_rgba(0,0,0,0.1)] border border-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-slate-900 drop-shadow-sm">Edit Registration</h3>
              <button onClick={() => setEditingMember(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateRegistration} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-900"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">WhatsApp / Phone</label>
                <input 
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-900"
                  placeholder="+923001234567"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email"
                  required
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all shadow-inner font-medium text-slate-900"
                  placeholder="user@example.com"
                />
              </div>
              <div className="flex gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 px-4 py-3 bg-white/50 border border-white/60 text-slate-600 rounded-xl hover:bg-white transition-colors font-bold shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-all font-bold shadow-[0_8px_20px_rgba(99,102,241,0.3)] border border-indigo-400/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_16px_64px_rgba(0,0,0,0.1)] border border-white">
            <div className="p-6 border-b border-white/60 flex items-center justify-between bg-white/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-lg">
                  {(selectedUser.name || selectedUser.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 drop-shadow-sm">{selectedUser.name || 'Unnamed Member'}</h3>
                  <p className="text-sm font-medium text-slate-500">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-50/50">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                    <StatusBadge status={selectedUser.status} />
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Joined</p>
                    <p className="text-xs font-semibold text-slate-700">{selectedUser.createdAt?.toDate().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Subscription Tier</p>
                    <RoleBadge role={selectedUser.role} />
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">Billing Cycle</p>
                    <p className="text-xs font-semibold text-slate-700">{selectedUser.role === 'pro' ? 'Monthly ($19.99/mo)' : 'Free Tier (No Billing)'}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Available Credits</p>
                    <p className="text-2xl font-black text-slate-900">{selectedUser.credits !== undefined ? selectedUser.credits : 'Unlimited'}</p>
                  </div>
                  <button 
                    onClick={() => {
                      const newCredits = prompt("Enter new credit amount:", selectedUser.credits?.toString() || "1000");
                      if (newCredits !== null && !isNaN(parseInt(newCredits))) {
                         updateDoc(doc(db, 'members', selectedUser.id), { credits: parseInt(newCredits) }).then(() => {
                            setSelectedUser({ ...selectedUser, credits: parseInt(newCredits) });
                            fetchData();
                         });
                      }
                    }}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest">Simulated Billing History</h4>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 font-bold text-slate-600">Invoice ID</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Amount</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Status</th>
                        <th className="px-4 py-3 font-bold text-slate-600 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedUser.role === 'pro' ? (
                        <tr>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">INV-{selectedUser.id.substring(0, 8).toUpperCase()}-1</td>
                          <td className="px-4 py-3 font-bold text-slate-900">$19.99</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">Paid</span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">{new Date().toLocaleDateString()}</td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic font-medium">No billing history for free tier user.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest">Recent Generations</h4>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 font-bold text-slate-600">Tool</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Model</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Cost/Chars</th>
                        <th className="px-4 py-3 font-bold text-slate-600 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {usage.filter(u => u.email === selectedUser.email).length > 0 ? (
                        usage.filter(u => u.email === selectedUser.email).map(u => (
                          <tr key={u.id}>
                            <td className="px-4 py-3 font-medium text-slate-700">{u.tool}</td>
                            <td className="px-4 py-3"><span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{u.model || 'unknown'}</span></td>
                            <td className="px-4 py-3 text-slate-500">{u.characters ? `${u.characters} chars` : '-'}</td>
                            <td className="px-4 py-3 text-right text-slate-500">{u.timestamp?.toDate().toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No generations found for this user in recent logs.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RoleBadge: React.FC<{ role?: string }> = ({ role }) => {
  if (role === 'admin') {
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 border border-purple-200/50 inline-flex items-center gap-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]">
        <Shield className="w-3.5 h-3.5" />
        ADMIN
      </span>
    );
  }
  if (role === 'pro') {
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-500/10 to-rose-500/10 text-amber-700 border border-amber-200/50 inline-flex items-center gap-1 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]">
        <Crown className="w-3.5 h-3.5 text-amber-600 drop-shadow-sm" />
        PRO
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100/50 text-slate-600 border border-slate-200/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]">
      FREE
    </span>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; bgColor: string }> = ({
  label, value, icon, bgColor
}) => (
  <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04),inset_0_2px_4px_rgba(255,255,255,1)] flex items-center gap-5 hover:-translate-y-1 transition-transform duration-300">
    <div className={cn("p-4 rounded-2xl flex items-center justify-center border border-white/50 shadow-inner", bgColor)}>
      {React.cloneElement(icon as React.ReactElement, { className: cn("w-7 h-7 drop-shadow-sm", (icon as React.ReactElement).props.className) })}
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">{label}</p>
      <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight drop-shadow-sm">{value}</p>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: Member['status'] }> = ({ status }) => {
  const styles = {
    active: "bg-gradient-to-r from-emerald-400/10 to-teal-500/10 text-emerald-700 border-emerald-200/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]",
    suspended: "bg-gradient-to-r from-amber-400/10 to-orange-500/10 text-amber-700 border-amber-200/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]",
    revoked: "bg-gradient-to-r from-red-400/10 to-rose-500/10 text-red-700 border-red-200/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]"
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border inline-flex items-center",
      styles[status]
    )}>
      {status}
    </span>
  );
};
