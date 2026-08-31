import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, CreditCard, Check, X } from 'lucide-react';
import { AdminCard, SectionHeader, AdminModal, AdminInput, AdminButton } from './AdminShared';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  characterLimit: number;
  features: string[];
  isActive: boolean;
}

export const AdminPricing: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: '', price: '', currency: 'PKR', interval: 'monthly', characterLimit: '', features: '' });

  const fetchPlans = async () => {
    const snap = await getDocs(collection(db, 'pricing_plans'));
    setPlans(snap.docs.map(d => ({ id: d.id, ...d.data() } as Plan)));
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name,
      price: parseInt(form.price) || 0,
      currency: form.currency,
      interval: form.interval,
      characterLimit: parseInt(form.characterLimit) || 0,
      features: form.features.split('\n').filter(f => f.trim()),
      isActive: true,
    };
    if (editingPlan) {
      await updateDoc(doc(db, 'pricing_plans', editingPlan.id), data);
    } else {
      await addDoc(collection(db, 'pricing_plans'), { ...data, createdAt: serverTimestamp() });
    }
    setForm({ name: '', price: '', currency: 'PKR', interval: 'monthly', characterLimit: '', features: '' });
    setShowAdd(false); setEditingPlan(null);
    fetchPlans();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    await deleteDoc(doc(db, 'pricing_plans', id));
    fetchPlans();
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      price: plan.price.toString(),
      currency: plan.currency || 'PKR',
      interval: plan.interval || 'monthly',
      characterLimit: plan.characterLimit.toString(),
      features: plan.features.join('\n'),
    });
    setShowAdd(true);
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Pricing Plans" subtitle="Manage subscription plans and their features">
        <AdminButton icon={<Plus className="w-4 h-4" />} onClick={() => { setEditingPlan(null); setForm({ name: '', price: '', currency: 'PKR', interval: 'monthly', characterLimit: '', features: '' }); setShowAdd(true); }}>
          Add Plan
        </AdminButton>
      </SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <AdminCard key={plan.id} className="flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-900 text-lg">{plan.name}</h3>
                  <p className="text-xs text-slate-500 capitalize">{plan.interval}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(plan)} className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(plan.id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-900">{plan.price.toLocaleString()}</span>
              <span className="text-sm text-slate-500 ml-1">{plan.currency}/{plan.interval === 'yearly' ? 'yr' : plan.interval === 'lifetime' ? 'once' : 'mo'}</span>
            </div>

            <div className="mb-4">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Character Limit</p>
              <p className="text-sm text-slate-900 dark:text-slate-900 font-bold">{plan.characterLimit.toLocaleString()} chars/month</p>
            </div>

            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Features</p>
              <ul className="space-y-1.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-700">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </AdminCard>
        ))}

        {plans.length === 0 && (
          <AdminCard className="col-span-full text-center py-12">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No pricing plans created yet.</p>
            <AdminButton onClick={() => setShowAdd(true)} className="mt-4 mx-auto" icon={<Plus className="w-4 h-4" />}>
              Create First Plan
            </AdminButton>
          </AdminCard>
        )}
      </div>

      {showAdd && (
        <AdminModal title={editingPlan ? 'Edit Plan' : 'Add Plan'} onClose={() => { setShowAdd(false); setEditingPlan(null); }}>
          <form onSubmit={handleSave} className="space-y-4">
            <AdminInput label="Plan Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Pro Monthly" />
            <div className="grid grid-cols-2 gap-3">
              <AdminInput label="Price" type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="2999" />
              <AdminInput label="Currency" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} placeholder="PKR" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Interval</label>
                <select value={form.interval} onChange={e => setForm({ ...form, interval: e.target.value })} className="w-full px-4 py-2.5 bg-white dark:bg-white border border-slate-300 dark:border-slate-200 rounded-xl text-slate-900 dark:text-slate-900 text-sm font-medium outline-none">
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
              <AdminInput label="Char Limit" type="number" required value={form.characterLimit} onChange={e => setForm({ ...form, characterLimit: e.target.value })} placeholder="50000" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Features (one per line)</label>
              <textarea
                value={form.features}
                onChange={e => setForm({ ...form, features: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 bg-white dark:bg-white border border-slate-300 dark:border-slate-200 rounded-xl text-slate-900 dark:text-slate-900 text-sm font-medium placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/40"
                placeholder={"800+ AI Voices\nLong-form voiceovers\nPriority support"}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <AdminButton variant="secondary" type="button" onClick={() => { setShowAdd(false); setEditingPlan(null); }} className="flex-1">Cancel</AdminButton>
              <AdminButton type="submit" className="flex-1">{editingPlan ? 'Save Changes' : 'Create Plan'}</AdminButton>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
};
