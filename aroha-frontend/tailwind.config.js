/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { light: '#e6f3f0', DEFAULT: '#167d78', dark: '#126a66' },
        aroha: { ink: '#243447', muted: '#617084', navy: '#17324d', coral: '#df765f', sand: '#f7f8f5' },
      },
      boxShadow: { soft: '0 12px 32px rgba(36, 52, 71, 0.08)' },
    },
  },
  plugins: [],
}