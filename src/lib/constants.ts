// ========================================
// ANDEXA - Design Tokens & Constants
// ========================================

export const BRAND = {
  name: 'ANDEXA',
  tagline: 'Sovereign AI Analytics for Saudi Healthcare',
  domain: 'andexa.tech',
  email: 'contact@andexa.tech',
} as const;

export const COLORS = {
  primary: {
    teal900: '#0D4A5E',
    teal700: '#1B6B8A',
    teal500: '#2A8BA8',
    cyan400: '#3BB3B1',
    cyan300: '#5ECFCD',
    cyan100: '#D4F5F4',
  },
  neutral: {
    slate950: '#0A1118',
    slate800: '#1E2A35',
    slate600: '#475569',
    slate200: '#E8ECF0',
    slate50: '#F8FAFB',
    creamWhite: '#FDFEFE',
  },
  accent: {
    sandGold: '#C9A962',
    desertAmber: '#D4A853',
    palmGreen: '#1D6F42',
    royalPearl: '#F5F3EF',
  },
  semantic: {
    success: '#34B584',
    warning: '#E6A23C',
    error: '#DC4446',
  },
} as const;

export const BREAKPOINTS = {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

export const NAV_ITEMS = [
  { key: 'features', href: '#features' },
  { key: 'howItWorks', href: '#how-it-works' },
  { key: 'security', href: '#security' },
  { key: 'pricing', href: '#pricing' },
  { key: 'contact', href: '#contact' },
] as const;

export const SOCIAL_LINKS = {
  linkedin: 'https://linkedin.com/company/andexa',
  twitter: 'https://twitter.com/andexa',
} as const;

// Statistics for animated counters
export const STATS = {
  itBacklogReduction: 40,
  costAdvantage: 500,
  hospitalsInKSA: 516,
  aiAdoptionRate: 81,
  privacyConcernRate: 62,
  investmentBillions: 214,
  reportGenerationSeconds: 5,
} as const;
