/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      sans: ["League Spartan", "sans-serif"],
      serif: ["Caprasimo", "serif"],
    },
    extend: {
      fontFamily: {
        caprasimo: ["Caprasimo", "serif"],
        spartan: ["League Spartan", "sans-serif"],
        radley: ["Radley", "serif"],
      },
    },
  },
  plugins: [],
};
