/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme-aware palette driven by CSS variables set per data-theme in index.css.
        // Usage across components: bg-app-bg, text-app-text, border-app-border, etc.
        app: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          surfaceAlt: 'var(--color-surface-alt)',
          border: 'var(--color-border)',
          text: 'var(--color-text)',
          muted: 'var(--color-muted)',
          primary: 'var(--color-primary)',
          primaryText: 'var(--color-primary-text)',
          accent: 'var(--color-accent)',
          danger: 'var(--color-danger)',
          warn: 'var(--color-warn)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
