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
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        primary: {
          400: '#FF6B6B',
          500: '#F05454',
          600: '#D64545',
        },
        secondary: {
          400: '#4ECDC4',
          500: '#3AB5AC',
          600: '#2C9A92',
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
