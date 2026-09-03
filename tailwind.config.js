/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['HelveticaNowDisplay-Medium', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['HelveticaNowDisplayW01-Rg', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        dbsm: {
          gold: '#f3c066',
          amber: '#e69535',
          dark: '#0e1117',
          surface: '#181c24',
          border: 'rgba(255, 255, 255, 0.12)',
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        pulseSubtle: 'pulseSubtle 2s infinite ease-in-out',
      }
    },
  },
  plugins: [],
}
