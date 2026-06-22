/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#FBF7F2",
        espresso: "#2B2420",
        rose: {
          DEFAULT: "#9B2242",
          dark: "#7A1B35",
          light: "#C2486A",
        },
        gold: "#C99B5B",
        taupe: "#8A7F73",
        sage: "#3F6B4F",
        clay: "#B3392C",
        cream: "#F4EFE7",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(43, 36, 32, 0.08)",
        lift: "0 8px 24px rgba(43, 36, 32, 0.14)",
      },
    },
  },
  plugins: [],
};
