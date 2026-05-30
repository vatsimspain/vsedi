/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        akira: ['Akira Expanded', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
  plugins: [],
};
