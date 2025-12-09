/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Primary brand colors (from logo)
        teal: {
          50: '#E6F4F5',
          100: '#D4F5F4',
          200: '#A8E8E6',
          300: '#5ECFCD',
          400: '#3BB3B1',
          500: '#2A9D9A',
          600: '#2A8BA8',
          700: '#1B6B8A',
          800: '#15566F',
          900: '#0D4A5E',
          950: '#0A3A4A',
        },
        // Neutral palette (warm-tinted)
        slate: {
          50: '#F8FAFB',
          100: '#F1F5F9',
          200: '#E8ECF0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E2A35',
          900: '#0F172A',
          950: '#0A1118',
        },
        // Accent colors
        'cream-white': '#FDFEFE',
        'royal-pearl': '#F5F3EF',
        'sand-gold': '#C9A962',
        'desert-amber': '#D4A853',
        'palm-green': '#1D6F42',
      },
      fontFamily: {
        'display': ['Clash Display', 'system-ui', 'sans-serif'],
        'sans': ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        'arabic': ['IBM Plex Sans Arabic', 'Tahoma', 'Arial', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'hero': ['clamp(2.25rem, 5vw + 1rem, 4.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'section-title': ['clamp(1.75rem, 3vw + 1rem, 3rem)', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'subsection': ['clamp(1.25rem, 2vw + 0.5rem, 1.75rem)', { lineHeight: '1.3' }],
        'body-lg': ['clamp(1rem, 1vw + 0.5rem, 1.25rem)', { lineHeight: '1.7' }],
      },
      spacing: {
        'section-sm': '3rem',
        'section-md': '5rem',
        'section-lg': '7rem',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
        'button': '0 10px 25px -5px rgba(27, 107, 138, 0.3)',
        'hero-video': '0 25px 50px -12px rgba(13, 74, 94, 0.25)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-right': 'slideRight 0.6s ease-out forwards',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
  // RTL support
  future: {
    hoverOnlyWhenSupported: true,
  },
};
