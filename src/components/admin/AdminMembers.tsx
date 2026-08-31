import React, { useState, useMemo } from 'react';
import { UserPlus, Search, Phone, Shield, Crown, Power, X, Edit, RefreshCw, MoreVertical, Filter, Download, Mail, Ban, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

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
  country?: string;
  notes?: string;
  tags?: string[];
}

interface AdminMembersProps {
  members: Member[];
  fetchData: () => void;
  currentUserUid: string;
}

export const AdminMembers: React.FC<AdminMembersProps> = ({ members, fetchData, currentUserUid }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Filter and sort members locally
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = 
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.phone || '').includes(searchTerm);
      
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchTerm, roleFilter, statusFilter]);

  const updateMemberStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'members', id), { status });
      fetchData();
    } catch (error) {
      alert("Error updating status");
    }
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    try {
      await fetch('/api/admin/update-member-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid: memberId, role })
      }).catch(() => {}); // Optimistic UI or fallback
      
      await updateDoc(doc(db, 'members', memberId), { role });
      if (selectedUser?.id === memberId) {
        setSelectedUser({ ...selectedUser, role });
      }
      fetchData();
    } catch (error) {
      alert("Error updating role");
    }
  };

  const updateMemberCredits = async (id: string, currentCredits?: number) => {
    const newCredits = prompt("Enter new credit amount (characters):", currentCredits?.toString() || "5000");
    if (newCredits !== null && !isNaN(parseInt(newCredits))) {
      await updateDoc(doc(db, 'members', id), { credits: parseInt(newCredits) });
      if (selectedUser?.id === id) {
        setSelectedUser({ ...selectedUser, credits: parseInt(newCredits) });
      }
      fetchData();
    }
  };

  const resetDevice = async (id: string) => {
    try {
      await updateDoc(doc(db, 'members', id), { deviceId: null });
      fetchData();
      alert("Device binding reset successfully.");
    } catch (error) {
      alert("Error resetting device");
    }
  };
  
  const saveNotes = async (id: string, notes: string) => {
      await updateDoc(doc(db, 'members', id), { notes });
      fetchData();
  };

  // If a user is selected, show their full profile view
  if (selectedUser) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <button 
          onClick={() => setSelectedUser(null)}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Members
        </button>
        
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
          {/* Profile Sidebar */}
          <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-8 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-black mb-4 shadow-inner border border-indigo-200">
              {(selectedUser.name || selectedUser.email)[0].toUpperCase()}
            </div>
            <h2 className="text-2xl font-black text-slate-900">{selectedUser.name || 'Unnamed Member'}</h2>
            <p className="text-sm text-slate-500 mb-4">{selectedUser.email}</p>
            <RoleBadge role={selectedUser.role} />
            
            <div className="w-full mt-8 space-y-4 text-left">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 tracking-widest">User ID</p>
                <p className="text-xs font-mono text-slate-700 bg-slate-200/50 p-2 rounded mt-1 break-all">{selectedUser.id}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 tracking-widest">Joined</p>
                <p className="text-sm font-medium text-slate-700">{selectedUser.createdAt?.toDate().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-500 tracking-widest">Phone / WhatsApp</p>
                <p className="text-sm font-medium text-slate-700">{selectedUser.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
          
          {/* Profile Content */}
          <div className="w-full md:w-2/3 p-8 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Status</p>
                <select 
                  className="bg-transparent font-black text-lg text-emerald-900 outline-none w-full"
                  value={selectedUser.status}
                  onChange={(e) => updateMemberStatus(selectedUser.id, e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Credits</p>
                  <p className="font-black text-lg text-indigo-900">{selectedUser.credits !== undefined ? selectedUser.credits : 'Unlimited'}</p>
                </div>
                <button onClick={() => updateMemberCredits(selectedUser.id, selectedUser.credits)} className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => resetDevice(selectedUser.id)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors">
                  <RefreshCw className="w-4 h-4" /> Force Logout / Reset Device
                </button>
                <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors">
                  <Mail className="w-4 h-4" /> Send Password Reset
                </button>
                {selectedUser.role !== 'pro' ? (
                  <button onClick={() => updateMemberRole(selectedUser.id, 'pro')} className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors">
                    <Crown className="w-4 h-4" /> Upgrade to Pro
                  </button>
                ) : (
                  <button onClick={() => updateMemberRole(selectedUser.id, 'free')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors">
                    Downgrade to Free
                  </button>
                )}
                <button onClick={() => updateMemberStatus(selectedUser.id, 'suspended')} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors">
                  <Ban className="w-4 h-4" /> Suspend Account
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">Internal Admin Notes</h3>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none h-32"
                placeholder="Add private notes about this user..."
                defaultValue={selectedUser.notes || ''}
                onBlur={(e) => saveNotes(selectedUser.id, e.target.value)}
              />
              <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-2">Notes save automatically when you click away. Not visible to the user.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Table View
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Registered Members</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage {members.length} total users across all plans.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-xl shadow-sm border border-slate-200 font-bold text-sm hover:bg-slate-50">
            <Download className="w-4 h-4" /> Export
          </button>
          <button 
            onClick={() => setIsAddingMember(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-slate-900 dark:text-slate-900 rounded-xl hover:opacity-90 shadow-md font-bold text-sm border border-purple-500/30"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/40">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by name, email, or ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Filter className="w-4 h-4" />
              <select className="bg-transparent outline-none font-medium" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="all">All Plans</option>
                <option value="pro">Pro</option>
                <option value="free">Free</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <select className="bg-transparent text-sm text-slate-600 font-medium outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">User / Name</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Plan</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm font-medium">
                    No members match your filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-white/80 transition-colors group">
                    <td className="px-6 py-4 cursor-pointer" onClick={() => setSelectedUser(member)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-inner">
                          {(member.name || member.email || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{member.name || 'Unnamed'}</p>
                          <p className="text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {member.createdAt?.toDate ? member.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedUser(member)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const RoleBadge: React.FC<{ role?: string }> = ({ role }) => {
  if (role === 'admin') {
    return (
      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 inline-flex items-center gap-1">
        <Shield className="w-3 h-3" /> ADMIN
      </span>
    );
  }
  if (role === 'pro') {
    return (
      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 inline-flex items-center gap-1">
        <Crown className="w-3 h-3" /> PRO
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
      FREE
    </span>
  );
};

const StatusBadge: React.FC<{ status: Member['status'] }> = ({ status }) => {
  const styles = {
    active: "bg-emerald-100 text-emerald-700",
    suspended: "bg-amber-100 text-amber-700",
    revoked: "bg-red-100 text-red-700"
  };

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
      styles[status] || styles.active
    )}>
      {status}
    </span>
  );
};
