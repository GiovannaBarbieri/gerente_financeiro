import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        muted: "#64748B",
        surface: "#F7F8FA",
        line: "#E2E8F0",
        agro: "#166534",
        cardblue: "#3454D1"
      },
      boxShadow: {
        soft: "0 12px 35px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
