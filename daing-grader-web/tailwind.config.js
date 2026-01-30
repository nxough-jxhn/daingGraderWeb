/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
        accent: '#10b981',
        muted: '#94a3b8',
        /* Monday.com-style sidebar & UI */
        sidebar: '#1e3a5f',
        'sidebar-hover': '#2a4a75',
        'sidebar-active': '#3b82f6',
        'sidebar-active-bg': 'rgba(59, 130, 246, 0.2)',
        surface: '#f1f5f9',
        'status-done': '#22c55e',
        'status-progress': '#f59e0b',
        'status-stuck': '#ef4444',
      },
      borderRadius: {
        lgmod: '12px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(2, 6, 23, 0.06)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.08)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
}
