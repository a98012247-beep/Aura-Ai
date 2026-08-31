import React, { useState } from 'react';
import { Save, AlertTriangle, Layout, CreditCard, Shield, Settings2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';

export interface GlobalSettings {
  id?: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  defaultModel: string;
  freeCharacterLimit: number;
  proCharacterLimit: number;
  signupEnabled: boolean;
  heroHeadline?: string;
  heroSubtext?: string;
  heroCtaText?: string;
  featureVoiceCloning?: boolean;
}

interface AdminSettingsProps {
  settings: GlobalSettings | null;
  fetchData: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, fetchData }) => {
  const [formData, setFormData] = useState<GlobalSettings>(settings || {
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing scheduled maintenance. Please check back soon.',
    defaultModel: 'cartesia',
    freeCharacterLimit: 10000,
    proCharacterLimit: 150000,
    signupEnabled: true,
    heroHeadline: 'Create the Most Realistic AI Voice.',
    heroSubtext: 'Create natural AI voiceovers from short or very long scripts. Get realistic voices, fast, with the latest AI voice technology.',
    heroCtaText: 'Start Creating for Free',
    featureVoiceCloning: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (settings?.id) {
        await updateDoc(doc(db, 'global_settings', settings.id), { ...formData });
      } else {
        await addDoc(collection(db, 'global_settings'), { ...formData });
      }
      fetchData();
      alert('Settings saved successfully!');
    } catch (error) {
      alert("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof GlobalSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight drop-shadow-sm">Global Settings</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage platform configuration, features, and content.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-slate-900 dark:text-slate-900 rounded-xl hover:opacity-90 shadow-md font-bold text-sm disabled:opacity-50 transition-all"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* General configuration */}
        <div className="space-y-8">
          
          {/* Maintenance Mode */}
          <section className="bg-white/60 backdrop-blur-xl rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-rose-100 bg-rose-50/50 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-rose-900">Maintenance Mode</h3>
            </div>
            <div className="p-6 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-bold text-slate-900">Enable Maintenance Mode</p>
                  <p className="text-xs text-slate-500">Locks all non-admin users out of the Studio.</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={formData.maintenanceMode} onChange={(e) => handleChange('maintenanceMode', e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                </div>
              </label>
              {formData.maintenanceMode && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Maintenance Message</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-rose-300 h-20 resize-none"
                    value={formData.maintenanceMessage || ''}
                    onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Feature Flags */}
          <section className="bg-white/60 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Settings2 className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-900">Feature Flags</h3>
            </div>
            <div className="p-6 space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-bold text-slate-900">Enable Signups</p>
                  <p className="text-xs text-slate-500">Allow new users to register.</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={formData.signupEnabled} onChange={(e) => handleChange('signupEnabled', e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </div>
              </label>
              <div className="h-px bg-slate-100 w-full my-2"></div>
              <label className="flex items-center justify-between cursor-pointer opacity-60">
                <div>
                  <p className="font-bold text-slate-900">Voice Cloning (BETA)</p>
                  <p className="text-xs text-slate-500">Enable voice cloning UI for Pro users.</p>
                </div>
                <div className="relative">
                  <input type="checkbox" disabled className="sr-only peer" checked={formData.featureVoiceCloning} onChange={(e) => handleChange('featureVoiceCloning', e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </div>
              </label>
            </div>
          </section>

          {/* Limits */}
          <section className="bg-white/60 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-900">Plan Limits (Default Overrides)</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Free Tier Character Limit (Monthly)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={formData.freeCharacterLimit}
                  onChange={(e) => handleChange('freeCharacterLimit', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pro Tier Character Limit (Monthly)</label>
                <input 
                  type="number" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={formData.proCharacterLimit}
                  onChange={(e) => handleChange('proCharacterLimit', parseInt(e.target.value))}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Content Configuration */}
        <div className="space-y-8">
          <section className="bg-white/60 backdrop-blur-xl rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <Layout className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-slate-900">Homepage Content</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Hero Headline</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 h-16 resize-none font-semibold text-slate-800"
                  value={formData.heroHeadline || ''}
                  onChange={(e) => handleChange('heroHeadline', e.target.value)}
                />
                <p className="text-[10px] text-slate-600 dark:text-slate-500 mt-1">Use `&lt;br /&gt;` for line breaks.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Hero Subtext</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 h-24 resize-none text-slate-600"
                  value={formData.heroSubtext || ''}
                  onChange={(e) => handleChange('heroSubtext', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Primary CTA Button</label>
                <input 
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  value={formData.heroCtaText || ''}
                  onChange={(e) => handleChange('heroCtaText', e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
