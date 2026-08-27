export interface PlanFeature {
  name: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  formattedPrice: string;
  characterLimit: number;
  formattedCredits: string;
  features: string[];
  recommended?: boolean;
}

export const PRICING_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    formattedPrice: 'Rs 0',
    characterLimit: 10000,
    formattedCredits: '10,000 characters',
    features: ['Standard Voices', 'Standard Generation Speed', 'Community Support']
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 1200,
    formattedPrice: 'Rs 1,200',
    characterLimit: 150000,
    formattedCredits: '150,000 characters',
    features: ['Premium Voices', 'Fast Generation Speed', 'Standard Support']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 3500,
    formattedPrice: 'Rs 3,500',
    characterLimit: 500000,
    formattedCredits: '500,000 characters',
    features: ['All Premium Voices', 'Highest Quality Audio', 'Priority Support', 'Early Access Features'],
    recommended: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 7000,
    formattedPrice: 'Rs 7,000',
    characterLimit: 1250000,
    formattedCredits: '1,250,000 characters',
    features: ['100+ Projects', 'Dedicated Account Manager', 'Custom Voice API', '24/7 Phone Support']
  }
];

export const getPlanDetails = (planId: string) => {
  return PRICING_PLANS.find(p => p.id === planId) || PRICING_PLANS[0];
};
