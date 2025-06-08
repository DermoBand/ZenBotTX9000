/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'grey-dark': '#1a1a1a',
        'grey-medium': '#2a2a2a',
        'grey-light': '#4a4a4a',
        'beige-accent': '#f5e6cc',
      },
      backgroundImage: {
        'gradient-grey': 'linear-gradient(135deg, #1a1a1a, #4a4a4a)',
      },
      keyframes: {
        typing: {
          '0%': { opacity: 0.3 },
          '50%': { opacity: 1 },
          '100%': { opacity: 0.3 },
        },
      },
      animation: {
        typing: 'typing 1.5s infinite',
      },
    },
  },
  plugins: [],
}