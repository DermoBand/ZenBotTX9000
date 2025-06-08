/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode based on class
  theme: {
    extend: {
      colors: {
        // Dark Theme Palette
        'background-dark': '#121212',
        'text-primary-dark': '#E0E0E0',
        'text-secondary-dark': '#A0A0A0',
        'accent-dark': '#14B8A6', // Teal accent
        'card-bg-dark': 'rgba(30, 30, 30, 0.7)',
        'border-dark': '#2D2D2D',

        // Light Theme Palette
        'background-light': '#F5F5F5',
        'text-primary-light': '#202020',
        'text-secondary-light': '#707070',
        'accent-light': '#14B8A6', // Same Teal accent
        'card-bg-light': 'rgba(255, 255, 255, 0.7)',
        'border-light': '#DCDCDC',

        // Old colors for reference or gradual phase-out if needed (can be removed later)
        'grey-dark': '#1a1a1a', // Example: could be mapped to background-dark or a new shade
        'grey-medium': '#2a2a2a',
        'grey-light': '#4a4a4a',
        'beige-accent': '#f5e6cc', // Example: could be mapped to accent-light or a new shade
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      },
      backgroundImage: {
        'gradient-grey': 'linear-gradient(135deg, #1a1a1a, #4a4a4a)', // Consider updating if it uses old colors
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