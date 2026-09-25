/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        navy: { 950: '#0A1226', 900: '#0F1B33', 800: '#16264A', 700: '#1E3260' },
        brand: { 50: '#EFF5FF', 100: '#DBE8FE', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8' },
        canvas: '#F6F8FB',
      },
      boxShadow: { card: '0 1px 2px rgba(15,27,51,.05), 0 4px 16px -6px rgba(15,27,51,.08)' },
    },
  },
  plugins: [],
};
