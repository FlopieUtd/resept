/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      sans: ["sans-serif"],
    },
    extend: {
      fontFamily: {
        radley: ["Radley", "serif"],
      },
    },
  },
  plugins: [],
};
