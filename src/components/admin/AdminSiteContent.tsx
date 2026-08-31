import React, { useState, useEffect } from 'react';
import { Save, Globe, Phone, MessageCircle, Link2 } from 'lucide-react';
import { AdminCard, SectionHeader, AdminInput, AdminButton } from './AdminShared';
import { db } from '../../lib/firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';

interface SiteContent {
  // Support
  whatsappNumber: string;
  supportEmail: string;
  supportHours: string;
  // Community
  discordLink: string;
  telegramLink: string;
  facebookLink: string;
  youtubeLink: string;
  // Homepage
  heroHeading: string;
  heroSubtext: string;
  ctaButtonText: string;
  // Social
  twitterLink: string;
  linkedinLink: string;
  instagramLink: string;
  // Footer
  companyName: string;
  copyrightText: string;
}

const defaultContent: SiteContent = {
  whatsappNumber: '', supportEmail: '', supportHours: '',
  discordLink: '', telegramLink: '', facebookLink: '', youtubeLink: '',
  heroHeading: '', heroSubtext: '', ctaButtonText: '',
  twitterLink: '', linkedinLink: '', instagramLink: '',
  companyName: '', copyrightText: '',
};

export const AdminSiteContent: React.FC = () => {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'site_content'));
      if (!snap.empty) {
        setContent({ ...defaultContent, ...snap.docs[0].data() } as SiteContent);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'site_content', 'main'), content);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Error saving: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof SiteContent, value: string) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Site Content" subtitle="Manage website text, links, and support information">
        <AdminButton icon={<Save className="w-4 h-4" />} onClick={handleSave} disabled={saving}>
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save All'}
        </AdminButton>
      </SectionHeader>

      {/* Support Info */}
      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-900 uppercase tracking-widest">Support Info</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminInput label="WhatsApp Number" value={content.whatsappNumber} onChange={e => update('whatsappNumber', e.target.value)} placeholder="+923001234567" />
          <AdminInput label="Support Email" value={content.supportEmail} onChange={e => update('supportEmail', e.target.value)} placeholder="support@awavox.ai" />
          <AdminInput label="Support Hours" value={content.supportHours} onChange={e => update('supportHours', e.target.value)} placeholder="Mon-Fri 9AM-6PM PKT" />
        </div>
      </AdminCard>

      {/* Community Links */}
      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-900 uppercase tracking-widest">Community Links</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminInput label="Discord" value={content.discordLink} onChange={e => update('discordLink', e.target.value)} placeholder="https://discord.gg/..." />
          <AdminInput label="Telegram" value={content.telegramLink} onChange={e => update('telegramLink', e.target.value)} placeholder="https://t.me/..." />
          <AdminInput label="Facebook Group" value={content.facebookLink} onChange={e => update('facebookLink', e.target.value)} placeholder="https://facebook.com/groups/..." />
          <AdminInput label="YouTube Channel" value={content.youtubeLink} onChange={e => update('youtubeLink', e.target.value)} placeholder="https://youtube.com/@..." />
        </div>
      </AdminCard>

      {/* Homepage Settings */}
      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-900 uppercase tracking-widest">Homepage Content</h3>
        </div>
        <div className="space-y-4">
          <AdminInput label="Hero Heading" value={content.heroHeading} onChange={e => update('heroHeading', e.target.value)} placeholder="Create the Most Realistic AI Voice." />
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Hero Subtext</label>
            <textarea
              value={content.heroSubtext}
              onChange={e => update('heroSubtext', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-white dark:bg-white border border-slate-300 dark:border-slate-200 rounded-xl text-slate-900 dark:text-slate-900 text-sm font-medium placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/40"
              placeholder="Create natural AI voiceovers from short or very long scripts..."
            />
          </div>
          <AdminInput label="CTA Button Text" value={content.ctaButtonText} onChange={e => update('ctaButtonText', e.target.value)} placeholder="Start Creating Free" />
        </div>
      </AdminCard>

      {/* Social Media */}
      <AdminCard>
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-4 h-4 text-pink-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-900 uppercase tracking-widest">Social Media</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminInput label="Twitter/X" value={content.twitterLink} onChange={e => update('twitterLink', e.target.value)} placeholder="https://x.com/..." />
          <AdminInput label="LinkedIn" value={content.linkedinLink} onChange={e => update('linkedinLink', e.target.value)} placeholder="https://linkedin.com/..." />
          <AdminInput label="Instagram" value={content.instagramLink} onChange={e => update('instagramLink', e.target.value)} placeholder="https://instagram.com/..." />
        </div>
      </AdminCard>

      {/* Footer */}
      <AdminCard>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-900 uppercase tracking-widest mb-4">Footer Content</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminInput label="Company Name" value={content.companyName} onChange={e => update('companyName', e.target.value)} placeholder="Awavox AI" />
          <AdminInput label="Copyright Text" value={content.copyrightText} onChange={e => update('copyrightText', e.target.value)} placeholder="© 2026 Awavox AI. All rights reserved." />
        </div>
      </AdminCard>
    </div>
  );
};
