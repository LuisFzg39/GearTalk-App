/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        geartalk: {
          sidebar: '#1a1f2e',
          canvas: '#f8f9fa',
          accent: '#2563eb',
          /** Deep blue auth backdrop */
          auth: '#0c1629',
          authDeep: '#070d18',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};
