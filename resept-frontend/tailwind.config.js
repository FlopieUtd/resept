/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      sans: ["FuturaPTBook", "sans-serif"],
    },
    extend: {
      fontFamily: {
        radley: ["Radley", "serif"],
        futura: ["FuturaPTDemi", "sans-serif"],
      },
    },
  },
  plugins: [],
};
