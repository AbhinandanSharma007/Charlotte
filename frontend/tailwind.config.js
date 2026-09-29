/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        charlotte: {
          50: '#fff7d8',
          100: '#fce4ad',
          200: '#f7cc7c',
          300: '#f3b44e',
          400: '#f2a359',
          500: '#f2dc5d',
          600: '#db9065',
          700: '#a4031f',
          800: '#8b0a2f',
          900: '#240b36',
          950: '#160518',
        },
        grid: {
          dark: 'var(--bg-dark)',
          panel: 'var(--bg-panel)',
          panelHover: 'var(--bg-panel-hover)',
          border: 'var(--border-color)',
        },
        theme: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          positive: 'var(--color-positive)',
          theft: 'var(--color-theft)',
          blue: 'var(--accent-blue)',
          red: 'var(--accent-red)',
          text: 'var(--text-main)',
          muted: 'var(--text-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
