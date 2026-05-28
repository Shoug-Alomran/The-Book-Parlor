import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: "#F8EFE3",
        linen: "#EFE0CD",
        cafe: "#B9885F",
        mocha: "#7B5138",
        espresso: "#2D1E18",
        sage: "#8FA88F",
        rose: "#C98E8B",
        gold: "#D6A84F",
      },
      fontFamily: {
        serif: ["Playfair Display", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 20px 80px rgba(123, 81, 56, 0.18)",
        shelf: "inset 0 -10px 18px rgba(45, 30, 24, 0.24)",
      },
    },
  },
  plugins: [],
} satisfies Config;
