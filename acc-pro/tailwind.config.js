/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0c',
        card: 'rgba(23, 23, 26, 0.7)',
        accent: '#3b82f6',
        secondary: '#8b5cf6',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
