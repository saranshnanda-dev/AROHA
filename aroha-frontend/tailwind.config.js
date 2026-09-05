/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: { colors: { brand: { light: '#f0fdf4', DEFAULT: '#16a34a', dark: '#14532d' } } },
  },
  plugins: [],
}