/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#452e81',  // Your deep purple
          600: '#3a256b',
          700: '#301e56',
          800: '#261842',
          900: '#1c122e',
          
        },
        secondary: {
          50: '#f0f4fd',
          100: '#e1e9fb',
          200: '#c3d3f7',
          300: '#93b3f0',
          400: '#5f93e7',
          500: '#3790d6',  // Your bright blue
          600: '#2c73b5',
          700: '#255d93',
          800: '#1e4a75',
          900: '#163a5e',
        },
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 