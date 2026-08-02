/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        trek: {
          sage: '#87A878',
          slate: '#4A5568',
          earth: '#8B7355',
          moss: '#6B8E5A',
          bark: '#5C4033',
          sky: '#A8C5D8',
          cream: '#F5F0E8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
