/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E32636', // Vibrant Red (matching the sign)
        secondary: '#ffffff', // White
        accent: '#FFD700', // Gold / Yellow
        highlight: '#007FFF', // Bright Blue (matching the photo borders)
        background: '#f3f4f6', // Light gray bg
        surface: '#ffffff', // Card bg
        textMain: '#111827',
        textMuted: '#6b7280',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
