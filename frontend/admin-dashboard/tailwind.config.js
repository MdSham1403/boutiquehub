/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#9B2242", dark: "#7A1B35", light: "#C2486A" },
        sidebar: "#1C1917",
        surface: "#FAFAF9",
        ink: "#1C1917",
        muted: "#78716C",
        border: "#E7E5E4",
        gold: "#C99B5B",
        sage: "#3F6B4F",
        clay: "#B3392C",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
