/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F3864',
          light: '#2d4f8a',
          dark: '#152547',
        },
      },
    },
  },
  plugins: [],
}
