/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#5DADE2',
        secondary: '#F8B500',
        dark: '#2C3E50',
        'light-blue': '#3498DB',
        'gray-100': '#ECEFF1',
        'gray-300': '#CFD8DC',
        'gray-500': '#90A4AE',
        'gray-700': '#546E7A',
        'gray-900': '#263238',
      },
      fontFamily: {
        sans: ['Roboto', 'Open Sans', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}

