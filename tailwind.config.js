/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        'portal-bg': '#e8e8e8',
        'portal-dark': '#171717',
        'portal-green': '#39FF14',
        'admin-blue': '#00065f',
        'admin-border': '#9c9a9a',
      },
    },
  },
  plugins: [],
}
