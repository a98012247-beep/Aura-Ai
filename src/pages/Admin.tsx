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
import { getAuthHeader } from '../services/cartesia';

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
    try {
      // Safe fetch helper that tries ordered query first, then plain collection as fallback
      const safeFetchDocs = async (collName: string, orderField?: string, orderDir: 'asc' | 'desc' = 'desc', limitCount?: number) => {
        try {
          if (orderField) {
            const q = limitCount 
              ? query(collection(db, collName), orderBy(orderField, orderDir), limit(limitCount))
              : query(collection(db, collName), orderBy(orderField, orderDir));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        } catch (orderedErr) {
          console.warn(`Ordered query for ${collName} failed, falling back to basic collection query:`, orderedErr);
        }
        try {
          const snap = await getDocs(collection(db, collName));
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          if (orderField) {
            list.sort((a: any, b: any) => {
              const aVal = a[orderField]?.seconds ? a[orderField].seconds : (a[orderField] || 0);
              const bVal = b[orderField]?.seconds ? b[orderField].seconds : (b[orderField] || 0);
              return orderDir === 'desc' ? (bVal > aVal ? 1 : -1) : (aVal > bVal ? 1 : -1);
            });
          }
          return limitCount ? list.slice(0, limitCount) : list;
        } catch (basicErr) {
          console.warn(`Basic query for ${collName} notice:`, basicErr);
          return [];
        }
      };

      // Mock Fallbacks if database is empty
      if (activeTab === 'dashboard' || activeTab === 'members' || activeTab === 'settings') {
        const mDocs = await safeFetchDocs('members', 'createdAt', 'desc');
        if (mDocs.length === 0) {
           const mockMembers = [
             { id: '1', email: 'admin@awavox.ai', name: 'System Admin', role: 'admin', status: 'active', createdAt: { seconds: Date.now()/1000 - 864000 }, lastLoginAt: { seconds: Date.now()/1000 } },
             { id: '2', email: 'creator@example.com', name: 'Pro Creator', role: 'pro', status: 'active', credits: 150000, createdAt: { seconds: Date.now()/1000 - 400000 }, lastLoginAt: { seconds: Date.now()/1000 - 3600 } },
             { id: '3', email: 'freeuser@example.com', name: 'Free User', role: 'free', status: 'active', credits: 10000, createdAt: { seconds: Date.now()/1000 - 200000 }, lastLoginAt: { seconds: Date.now()/1000 - 86400 } }
           ];
           setMembers(mockMembers as Member[]);
        } else {
           setMembers(mDocs as Member[]);
        }
      }
      
      if (activeTab === 'dashboard' || activeTab === 'generations' || activeTab === 'api-keys') {
        const uDocs = await safeFetchDocs('usage', 'timestamp', 'desc', 100);
        if (uDocs.length === 0) {
           const mockUsage = Array.from({ length: 45 }).map((_, i) => ({
             id: 'u' + i,
             email: i % 2 === 0 ? 'creator@example.com' : 'freeuser@example.com',
             tool: 'Text to Speech',
             model: 'cartesia',
             characters: Math.floor(Math.random() * 800) + 100,
             duration: Math.floor(Math.random() * 15) + 2,
             timestamp: { seconds: Date.now()/1000 - (Math.random() * 864000) }
           }));
           setUsage(mockUsage as UsageRecord[]);
        } else {
           setUsage(uDocs as UsageRecord[]);
        }
      }
      
      if (activeTab === 'dashboard' || activeTab === 'earnings') {
        const eDocs = await safeFetchDocs('earnings', 'timestamp', 'desc');
        if (eDocs.length === 0) {
           const mockEarnings = [
             { id: 'e1', amount: 5500, description: 'Pro Monthly Subscription', timestamp: { seconds: Date.now()/1000 - 86400 } },
             { id: 'e2', amount: 5500, description: 'Pro Monthly Subscription', timestamp: { seconds: Date.now()/1000 - 172800 } },
             { id: 'e3', amount: 5500, description: 'Pro Monthly Subscription', timestamp: { seconds: Date.now()/1000 - 345600 } }
           ];
           setEarnings(mockEarnings as EarningRecord[]);
        } else {
           setEarnings(eDocs as EarningRecord[]);
        }
      }
      if (activeTab === 'api-keys') {
        const firestoreKeys = (await safeFetchDocs('platform_api_keys', 'createdAt', 'desc')) as PlatformApiKey[];
        if (firestoreKeys.length === 0) {
           const mockKeys = [
             { id: 'k1', name: 'Primary Cartesia', key: 'sk_cartesia_******', isActive: true, usageCount: 450, totalCharactersUsed: 85400, createdAt: { seconds: Date.now()/1000 - 864000 } }
           ];
           setApiKeys(mockKeys as PlatformApiKey[]);
        } else {
           setApiKeys(firestoreKeys);
        }
        
        // Sync to backend
        try {
          const { auth } = await import('../lib/firebase');
          if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            await fetch('/api/admin/sync-keys', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ keys: firestoreKeys })
            });
          }
        } catch(e) {}
      }
      if (activeTab === 'settings') {
        try {
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
        } catch (sErr) {
          console.warn("Global settings fetch notice:", sErr);
        }
      }
      if (activeTab === 'moderation') {
        const vcDocs = await safeFetchDocs('voice_clones', 'createdAt', 'desc');
        setVoiceClones(vcDocs as VoiceClone[]);
      }
      if (activeTab === 'feedback') {
        const fbDocs = await safeFetchDocs('feedback', 'createdAt', 'desc');
        setFeedback(fbDocs as FeedbackReport[]);
      }
      if (activeTab === 'security' || activeTab === 'dashboard') {
        const secDocs = await safeFetchDocs('security_flags', 'createdAt', 'desc');
        setSecurityFlags(secDocs as SecurityFlag[]);
      }
    } catch (error) {
      console.warn("Error fetching admin data:", error);
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

  const totalEarnings = earnings.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const syncVoices = async () => {
    try {
      const { getAuthHeader } = await import('../services/cartesia');
      const authHeaders = await getAuthHeader();
      const res = await fetch('/api/internal/sync-voices', {
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully synced ${data.count} voices.`);
      } else {
        alert(`Failed to sync voices: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error syncing voices: ${err.message}`);
    }
  };

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
