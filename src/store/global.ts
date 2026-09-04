import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { PRICING_PLANS as DEFAULT_PRICING_PLANS } from '../lib/pricing';

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency?: string;
  interval?: string;
  characterLimit: number;
  features: string[];
  isActive?: boolean;
  recommended?: boolean;
  formattedPrice?: string;
  formattedCredits?: string;
}

export interface SiteContent {
  whatsappNumber: string;
  supportEmail: string;
  supportHours: string;
  discordLink: string;
  telegramLink: string;
  facebookLink: string;
  youtubeLink: string;
  heroHeading: string;
  heroSubtext: string;
  ctaButtonText: string;
  twitterLink: string;
  linkedinLink: string;
  instagramLink: string;
  companyName: string;
  copyrightText: string;
}

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

const defaultContent: SiteContent = {
  whatsappNumber: '', supportEmail: '', supportHours: '',
  discordLink: '', telegramLink: '', facebookLink: '', youtubeLink: '',
  heroHeading: '', heroSubtext: '', ctaButtonText: '',
  twitterLink: '', linkedinLink: '', instagramLink: '',
  companyName: '', copyrightText: '',
};

const defaultSettings: GlobalSettings = {
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
};

interface GlobalState {
  siteContent: SiteContent;
  pricingPlans: Plan[];
  globalSettings: GlobalSettings;
  loading: boolean;
  fetchGlobalData: () => Promise<void>;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  siteContent: defaultContent,
  pricingPlans: DEFAULT_PRICING_PLANS,
  globalSettings: defaultSettings,
  loading: true,
  fetchGlobalData: async () => {
    try {
      const [contentSnap, pricingSnap, settingsSnap] = await Promise.all([
        getDoc(doc(db, 'site_content', 'main')),
        getDocs(collection(db, 'pricing_plans')),
        getDocs(collection(db, 'global_settings'))
      ]);

      let siteContent = defaultContent;
      if (contentSnap.exists()) {
        siteContent = { ...defaultContent, ...contentSnap.data() } as SiteContent;
      }

      let globalSettings = defaultSettings;
      if (!settingsSnap.empty) {
        globalSettings = { ...defaultSettings, ...settingsSnap.docs[0].data(), id: settingsSnap.docs[0].id } as GlobalSettings;
      }

      let pricingPlans = DEFAULT_PRICING_PLANS;
      if (!pricingSnap.empty) {
        const dbPlans = pricingSnap.docs.map(d => ({ id: d.id, ...d.data() } as Plan));
        // Only use dbPlans if there are any active ones, otherwise fallback
        const activePlans = dbPlans.filter(p => p.isActive);
        if (activePlans.length > 0) {
          pricingPlans = activePlans.map(p => ({
            ...p,
            formattedPrice: p.price === 0 ? 'Free' : `${p.currency === 'PKR' ? 'Rs ' : '$'}${p.price}`,
            formattedCredits: p.characterLimit === -1 ? 'Unlimited Credits' : `${p.characterLimit.toLocaleString()} Credits`,
            recommended: p.id === 'pro'
          })).sort((a, b) => a.price - b.price);
        }
      }

      set({ siteContent, pricingPlans, globalSettings, loading: false });
    } catch (error) {
      // console.warn("Failed to fetch global data:", error); // Suppressed to avoid confusing users when rules are tight
      set({ loading: false });
    }
  }
}));
