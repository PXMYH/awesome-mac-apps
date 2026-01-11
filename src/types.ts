export interface App {
  id: number;
  name: string;
  url: string;
  description: string;
  category: string;
  subcategory: string;
  pricing: 'free' | 'paid';
  isOpenSource: boolean;
  isAppStore: boolean;
  repoUrl?: string;
  appStoreUrl?: string;
}

export interface AppData {
  apps: App[];
  categories: string[];
  subcategories: Record<string, string[]>;
  meta: {
    totalApps: number;
    freeApps: number;
    paidApps: number;
    openSourceApps: number;
    generatedAt: string;
  };
}

export type PricingFilter = 'all' | 'free' | 'paid';

declare global {
  interface Window {
    Fuse: typeof import('fuse.js').default;
  }
}
