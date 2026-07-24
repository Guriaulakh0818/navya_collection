import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#183A73',
        orange: '#F15A25',
        bg: '#FAFAFA',
        text: '#1E1E1E',
        border: '#E5E7EB',
        success: '#22C55E',
        error: '#EF4444',
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 16px 40px rgba(24, 58, 115, 0.08)',
      },
      borderRadius: {
        xl: '16px',
      },
    },
  },
  plugins: [],
};

export default config;
