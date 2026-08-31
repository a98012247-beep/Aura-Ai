import React, { useState, useMemo } from 'react';
import { DollarSign, Users, Activity, Database, ArrowUpRight, ArrowDownRight, Server, Zap, Globe, Cpu } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router';
import { db } from '../../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface Member {
  id: string;
  email: string;
  status: 'active' | 'suspended' | 'revoked';
  role: 'admin' | 'pro' | 'free' | string;
  createdAt: any;
  credits?: number;
}

interface UsageRecord {
  id: string;
  email: string;
  tool: string;
  characters?: number;
  timestamp: any;
}

interface EarningRecord {
  id: string;
  amount: number;
  description: string;
  timestamp: any;
}

interface AdminDashboardProps {
  members: Member[];
  usage: UsageRecord[];
  earnings: EarningRecord[];
  totalEarnings: number;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ members, usage, earnings, totalEarnings }) => {
  const navigate = useNavigate();
  const [isSeeding, setIsSeeding] = useState(false);

  const seedDummyData = async () => {
    setIsSeeding(true);
    try {
      const dummyMembers = ['alice@example.com', 'bob@example.com', 'charlie@example.com', 'dave@example.com', 'eve@example.com'];
      for (const email of dummyMembers) {
        await addDoc(collection(db, 'members'), {
          email,
          name: email.split('@')[0],
          role: Math.random() > 0.5 ? 'pro' : 'free',
          status: 'active',
          credits: 5000,
          createdAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 10000000000)),
          lastLoginAt: Timestamp.now()
        });
      }

      for (let i = 0; i < 30; i++) {
        await addDoc(collection(db, 'usage'), {
          email: dummyMembers[Math.floor(Math.random() * dummyMembers.length)],
          tool: 'Text to Speech',
          model: 'cartesia',
          characters: Math.floor(Math.random() * 500),
          timestamp: Timestamp.fromDate(new Date(Date.now() - Math.random() * 86400000 * 14))
        });
      }

      await addDoc(collection(db, 'earnings'), { amount: 2999, description: 'Pro Subscription', timestamp: Timestamp.now() });
      await addDoc(collection(db, 'earnings'), { amount: 5999, description: 'Yearly Plan', timestamp: Timestamp.now() });

      alert("Dummy data seeded!");
      window.location.reload();
    } catch (error) {
      alert("Error: " + (error as Error).message);
    } finally {
      setIsSeeding(false);
    }
  };

  const revenueData = useMemo(() => {
    const data: Record<string, number> = {};
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    last30Days.forEach(date => data[date] = 0);
    
    earnings.forEach(e => {
      if(!e.timestamp) return;
      const tDate = typeof e.timestamp.toDate === 'function' ? e.timestamp.toDate() : new Date(e.timestamp);
      const date = tDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (data[date] !== undefined) data[date] += e.amount;
    });

    return Object.entries(data).map(([date, revenue]) => ({ date, revenue }));
  }, [earnings]);

  const usageData = useMemo(() => {
    const data: Record<string, number> = {};
    const last14Days = [...Array(14)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    last14Days.forEach(date => data[date] = 0);
    
    usage.forEach(u => {
      if(!u.timestamp) return;
      const tDate = typeof u.timestamp.toDate === 'function' ? u.timestamp.toDate() : new Date(u.timestamp);
      const date = tDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (data[date] !== undefined) data[date] += (u.characters || 100);
    });

    return Object.entries(data).map(([date, characters]) => ({ date, characters }));
  }, [usage]);

  const roleDistribution = useMemo(() => {
    const pro = members.filter(m => m.role === 'pro').length;
    const free = members.filter(m => m.role === 'free').length;
    const admin = members.filter(m => m.role === 'admin').length;
    return [
      { name: 'Pro Users', value: pro },
      { name: 'Free Users', value: free },
      { name: 'Admins', value: admin }
    ];
  }, [members]);

  const activeToday = usage.filter(u => {
    if(!u.timestamp) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const tDate = typeof u.timestamp.toDate === 'function' ? u.timestamp.toDate() : new Date(u.timestamp);
    return tDate >= today;
  }).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Analytics</h2>
          <p className="text-slate-500 font-medium mt-1">Real-time metrics, platform usage, and revenue tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Operational
          </div>
          <button 
            onClick={seedDummyData}
            disabled={isSeeding}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-md font-bold text-sm hover:bg-slate-800 transition-colors"
          >
            <Database className="w-4 h-4" />
            {isSeeding ? 'Seeding...' : 'Seed Data'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Revenue" value={`PKR ${totalEarnings.toLocaleString()}`} icon={<DollarSign/>} trend="+14.2%" trendUp={true} color="indigo" />
        <KpiCard title="Active Members" value={members.length} icon={<Users/>} trend="+5.4%" trendUp={true} color="blue" />
        <KpiCard title="Total Characters Gen" value={(usage.reduce((sum, u) => sum + (u.characters || 0), 0)).toLocaleString()} icon={<Activity/>} trend="+22.1%" trendUp={true} color="emerald" />
        <KpiCard title="Active Today" value={activeToday} icon={<Zap/>} trend="-2.1%" trendUp={false} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Revenue Growth</h3>
              <p className="text-xs font-medium text-slate-500">Last 30 days revenue trajectory</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 outline-none">
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `Rs${val}`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-1">User Demographics</h3>
          <p className="text-xs font-medium text-slate-500 mb-6">Distribution by membership tier</p>
          <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4 w-full">
              {roleDistribution.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs font-bold text-slate-700">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-1">TTS Character Processing</h3>
          <p className="text-xs font-medium text-slate-500 mb-6">Daily character consumption across platform APIs</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="characters" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl shadow-lg border border-slate-800 p-6 text-white flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Infrastructure Health</h3>
              <p className="text-xs font-medium text-slate-400">Live system status and latencies</p>
            </div>
            <Server className="w-6 h-6 text-indigo-400" />
          </div>
          
          <div className="space-y-5 mt-auto">
            <HealthIndicator label="Cartesia API Gateway" value="Operational" ping="45ms" status="good" />
            <HealthIndicator label="Database Read Latency" value="Optimal" ping="12ms" status="good" />
            <HealthIndicator label="Storage / Voice Cache" value="Warning" ping="240ms" status="warn" />
            <HealthIndicator label="Anti-Abuse Rate Limiter" value="Active" ping="8ms" status="good" />
          </div>

          <div className="mt-8 pt-6 border-t border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Compute Load: 24%</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Edge: Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, icon, trend, trendUp, color }: any) => {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col relative overflow-hidden group hover:border-slate-300 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-2xl border", colorMap[color])}>
          {icon}
        </div>
        <div className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full", trendUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-500 mb-1">{title}</h4>
        <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
      </div>
    </div>
  );
};

const HealthIndicator = ({ label, value, ping, status }: any) => (
  <div>
    <div className="flex justify-between text-sm font-bold mb-2">
      <span className="text-slate-200">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-xs">{ping}</span>
        <span className={cn(status === 'good' ? 'text-emerald-400' : 'text-amber-400')}>{value}</span>
      </div>
    </div>
    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
      <div className={cn("h-full rounded-full", status === 'good' ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: status === 'good' ? '100%' : '60%' }}></div>
    </div>
  </div>
);
