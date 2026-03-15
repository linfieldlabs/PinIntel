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
          DEFAULT: '#1152d4',
          dark: '#0e41a8',
          light: '#3d75e0',
          hover: '#0e44b1',
        },
        surface: {
          50: '#1e1e1e',
          100: '#2a2a2a',
          200: '#333333',
          300: '#3d3d3d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'custom': '8px',
      }
    },
  },
  plugins: [],
}
