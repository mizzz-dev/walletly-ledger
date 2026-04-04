import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        card: "hsl(var(--card))",
        primary: "hsl(var(--primary))",
      },
      boxShadow: {
        glass: "0 10px 30px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
} satisfies Config;
