/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Obsidian Studio surface scale ──────────────────────────────
        z: {
          950: '#0c0c0f',   // page background
          900: '#111116',   // sidebar / nav
          800: '#17171c',   // card surface
          750: '#1b1b22',   // card hover
          700: '#1f1f28',   // elevated card
          650: '#25252f',   // floating panels
          600: '#2c2c38',   // border bright
          500: '#3a3a4a',   // border visible
          400: '#4d4d62',   // disabled / muted edge
        },
        // ── Typography ─────────────────────────────────────────────────
        t: {
          1: '#f0f0f4',   // primary
          2: '#9090a4',   // secondary
          3: '#54546a',   // muted
          4: '#30303e',   // ghost
          hi: '#ffffff',  // high contrast
        },
        // ── Accent — indigo / violet ────────────────────────────────────
        vi: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',   // primary accent
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // ── Status ─────────────────────────────────────────────────────
        ok:   '#10b981',   // emerald
        warn: '#f59e0b',   // amber
        bad:  '#f43f5e',   // rose
        info: '#38bdf8',   // sky
        purp: '#a855f7',   // purple
        teal: '#14b8a6',   // teal
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        // KPI card gradient tops
        'grad-vi':   'linear-gradient(90deg,#6366f1,#818cf8)',
        'grad-ok':   'linear-gradient(90deg,#10b981,#34d399)',
        'grad-bad':  'linear-gradient(90deg,#f43f5e,#fb7185)',
        'grad-warn': 'linear-gradient(90deg,#f59e0b,#fbbf24)',
        'grad-purp': 'linear-gradient(90deg,#a855f7,#c084fc)',
        'grad-sky':  'linear-gradient(90deg,#38bdf8,#7dd3fc)',
        'grad-teal': 'linear-gradient(90deg,#14b8a6,#2dd4bf)',
        // Page / panel backgrounds
        'card-glow-vi':  'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.08), transparent)',
        'card-glow-ok':  'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.08), transparent)',
        'card-glow-bad': 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(244,63,94,0.08),  transparent)',
      },
      boxShadow: {
        card:         '0 1px 2px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)',
        'card-glow':  '0 0 0 1px rgba(99,102,241,0.35), 0 4px 24px rgba(99,102,241,0.12)',
        modal:        '0 24px 64px rgba(0,0,0,0.7)',
        sidebar:      '4px 0 24px rgba(0,0,0,0.4)',
      },
      borderRadius: {
        xl:  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      animation: {
        'fade-up':   'fadeUp .38s ease forwards',
        'fade-in':   'fadeIn .25s ease forwards',
        shimmer:     'shimmer 1.6s ease infinite',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
        'slide-in':  'slideIn .25s ease forwards',
        'number-in': 'numberIn .4s cubic-bezier(.2,0,.1,1) forwards',
      },
      keyframes: {
        fadeUp:   { '0%': { opacity:0, transform:'translateY(12px)' }, '100%': { opacity:1, transform:'translateY(0)' } },
        fadeIn:   { '0%': { opacity:0 }, '100%': { opacity:1 } },
        shimmer:  { '0%': { backgroundPosition:'100% 50%' }, '100%': { backgroundPosition:'0% 50%' } },
        pulseDot: { '0%,100%': { opacity:1, transform:'scale(1)' }, '50%': { opacity:.45, transform:'scale(1.5)' } },
        slideIn:  { '0%': { opacity:0, transform:'translateX(-8px)' }, '100%': { opacity:1, transform:'translateX(0)' } },
        numberIn: { '0%': { opacity:0, transform:'translateY(6px) scale(.96)' }, '100%': { opacity:1, transform:'translateY(0) scale(1)' } },
      },
    },
  },
  plugins: [],
};
