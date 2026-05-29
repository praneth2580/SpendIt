/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        'surface-2': 'var(--bg-surface-2)',
        elevated: 'var(--bg-elevated)',
        fg: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        subtle: 'var(--text-subtle)',
        border: 'var(--border-default)',
        'border-strong': 'var(--border-strong)',
        brand: {
          DEFAULT: 'var(--brand)',
          fg: 'var(--brand-fg)',
          muted: 'var(--brand-muted)',
        },
        success: {
          DEFAULT: 'var(--success)',
          muted: 'var(--success-muted)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          muted: 'var(--danger-muted)',
        },
        accent: {
          violet: 'var(--accent-violet)',
          emerald: 'var(--accent-emerald)',
          amber: 'var(--accent-amber)',
        },
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        float: 'var(--shadow-float)',
        brand: 'var(--shadow-brand)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['2.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '700' }],
        h1: ['1.625rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        h2: ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        caption: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.08em', fontWeight: '600' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
