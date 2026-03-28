/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg:       '#060b18',
          surface:  '#0d1526',
          card:     '#111d35',
          border:   '#1e3a5f',
          cyan:     '#00d4ff',
          blue:     '#3b82f6',
          purple:   '#7c3aed',
          green:    '#10b981',
          red:      '#ef4444',
          yellow:   '#f59e0b',
          text:     '#e2e8f0',
          muted:    '#64748b',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'cyber-grid': `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
        `,
        'glow-cyan':   'radial-gradient(ellipse at center, rgba(0,212,255,0.15) 0%, transparent 70%)',
        'glow-purple': 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':         'glow 2s ease-in-out infinite alternate',
        'slide-in':     'slideIn 0.4s ease-out',
        'fade-in':      'fadeIn 0.5s ease-out',
        'scan':         'scan 3s linear infinite',
      },
      keyframes: {
        glow: {
          from: { boxShadow: '0 0 10px rgba(0,212,255,0.3)' },
          to:   { boxShadow: '0 0 25px rgba(0,212,255,0.7), 0 0 50px rgba(0,212,255,0.3)' },
        },
        slideIn: {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to:   { transform: 'translateY(0)',     opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      boxShadow: {
        'cyber':        '0 0 20px rgba(0,212,255,0.2)',
        'cyber-strong': '0 0 40px rgba(0,212,255,0.4)',
        'cyber-purple': '0 0 20px rgba(124,58,237,0.3)',
        'card':         '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
