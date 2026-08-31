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
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminMembers } from '../components/admin/AdminMembers';
import { AdminSettings } from '../components/admin/AdminSettings';
import { AdminGenerations } from '../components/admin/AdminGenerations';
import { AdminEarnings } from '../components/admin/AdminEarnings';
import { AdminApiKeys } from '../components/admin/AdminApiKeys';
import { AdminPricing } from '../components/admin/AdminPricing';
import { AdminSiteContent } from '../components/admin/AdminSiteContent';
import { AdminFeedback } from '../components/admin/AdminFeedback';
import { AdminModeration } from '../components/admin/AdminModeration';
import { AdminSecurity } from '../components/admin/AdminSecurity';
import { AdminAuditLog } from '../components/admin/AdminAuditLog';

type Tab = 'dashboard' | 'members' | 'generations' | 'earnings' | 'api-keys' | 'settings' | 'moderation' | 'feedback' | 'security' | 'pricing' | 'site-content' | 'audit-logs';

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
  name: string;
  key: string;
  isActive: boolean;
  usageCount?: number;
  totalCharactersUsed?: number;
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
    <div className="min-h-screen bg-transparent relative flex font-sans w-full">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-amber-400/10 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute top-[40%] left-[20%] w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto relative z-10">
          {activeTab === 'dashboard' && (
            <AdminDashboard members={members} usage={usage} earnings={earnings} totalEarnings={totalEarnings} />
          )}

          {activeTab === 'members' && (
            <AdminMembers members={members} fetchData={fetchData} currentUserUid={user?.uid || auth.currentUser?.uid || ''} />
          )}

          {activeTab === 'generations' && (
            <AdminGenerations usage={usage} />
          )}

          {activeTab === 'earnings' && (
            <AdminEarnings earnings={earnings} fetchData={fetchData} />
          )}

          {activeTab === 'api-keys' && (
            <AdminApiKeys apiKeys={apiKeys} usage={usage} fetchData={fetchData} onSyncVoices={syncVoices} />
          )}

          {activeTab === 'settings' && (
            <AdminSettings settings={settings as any} fetchData={fetchData} />
          )}

          {activeTab === 'pricing' && (
            <AdminPricing />
          )}

          {activeTab === 'site-content' && (
            <AdminSiteContent />
          )}

          {activeTab === 'feedback' && (
            <AdminFeedback feedback={feedback} fetchData={fetchData} />
          )}

          {activeTab === 'moderation' && (
            <AdminModeration voiceClones={voiceClones} fetchData={fetchData} />
          )}

          {activeTab === 'security' && (
            <AdminSecurity securityFlags={securityFlags} fetchData={fetchData} />
          )}

          {activeTab === 'audit-logs' && (
            <AdminAuditLog />
          )}
        </div>
      </main>
    </div>
  );
};
