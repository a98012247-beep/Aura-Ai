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
    features: ['Up to 10 minutes of voiceover', 'Standard generation', 'Premium voices', 'Community access']
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 1200,
    formattedPrice: 'Rs 1,200',
    characterLimit: 150000,
    formattedCredits: '150,000 characters',
    features: ['Up to 2.5 hours of voiceover', 'Fast generation', 'Premium voices', 'Community support']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 3500,
    formattedPrice: 'Rs 3,500',
    characterLimit: 500000,
    formattedCredits: '500,000 characters',
    features: ['Up to 8 hours of voiceover', 'Very fast generation', 'All premium voices', 'Private creator group'],
    recommended: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 7000,
    formattedPrice: 'Rs 7,000',
    characterLimit: 125000000,
    formattedCredits: '125,000,000 characters',
    features: ['Up to 2,000+ hours of voiceover', 'Fastest generation', 'All premium voices', 'Priority support']
  }
];

export const getPlanDetails = (planId: string) => {
  return PRICING_PLANS.find(p => p.id === planId) || PRICING_PLANS[0];
};
