/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        paper: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        primary: {
          400: '#60a5fa', // Blue 400
          500: '#3b82f6', // Blue 500
          600: '#2563eb', // Blue 600
        },
        secondary: {
          400: '#22d3ee', // Cyan 400
          500: '#06b6d4', // Cyan 500
          600: '#0891b2', // Cyan 600
        }
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'soft-dark': '0 10px 40px -10px rgba(0,0,0,0.3)',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0) scale(0.8)', opacity: '0' },
          '10%': { transform: 'translateY(-20px) scale(1)', opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-200px) scale(0.8)', opacity: '0' }
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' }
        }
      },
      animation: {
        'float': 'float 2s ease-out forwards',
        'pop': 'pop 0.3s ease-in-out',
      }
    },
  },
  plugins: [],
}
