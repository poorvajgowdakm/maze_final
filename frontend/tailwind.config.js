/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'tranzincY(0)' },
          '50%': { transform: 'tranzincY(-10px)' },
        },
        shake: {
          '10%, 90%': { transform: 'tranzinc3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'tranzinc3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'tranzinc3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'tranzinc3d(4px, 0, 0)' }
        }
      }
    },
  },
  plugins: [],
}
