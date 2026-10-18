import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/frontend/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        navy: {
          DEFAULT: '#183A73',
          hover: '#122D5A',
          50: '#EFF4FA',
          100: '#DBE5F3',
          200: '#B9CCE7',
          300: '#8BAAD6',
          400: '#5A84C0',
          500: '#2E5FA5',
          600: '#183A73',
          700: '#122D5A',
          800: '#0E2142',
          900: '#09172E',
        },
        orange: {
          DEFAULT: '#F15A25',
          hover: '#DB4613',
          50: '#FEF4F0',
          100: '#FDE6DC',
          200: '#FBCBB9',
          300: '#F7A88D',
          400: '#F47F57',
          500: '#F15A25',
          600: '#DB4613',
          700: '#B5350B',
          800: '#8F2A0B',
          900: '#74240C',
        },
        brand: {
          primary: '#183A73',
          primaryDark: '#09172E',
          accent: '#F15A25',
          background: '#FAFAFA',
          surface: '#FFFFFF',
          foreground: '#1E1E1E',
          muted: '#6B7280',
          border: '#E5E7EB',
          divider: '#F3F4F6',
          warning: '#F59E0B',
          success: '#22C55E',
          error: '#EF4444',
          info: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        heading: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
      },
      fontSize: {
        h1: ['48px', { lineHeight: '1.1', fontWeight: '700' }],
        h2: ['40px', { lineHeight: '1.2', fontWeight: '700' }],
        h3: ['32px', { lineHeight: '1.3', fontWeight: '600' }],
        h4: ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        h5: ['20px', { lineHeight: '1.5', fontWeight: '500' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        body: ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        small: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
      },

      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.06)',
        dropdown: '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
        modal: '0 12px 40px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
        premium: '0 8px 30px rgba(10, 35, 66, 0.08)',
        glow: '0 0 20px rgba(242, 140, 40, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'scale-in': 'scaleIn 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
