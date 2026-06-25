import type { Config } from "tailwindcss";

// Design tokens mirrored from the existing app so Tailwind utilities
// (used by new components going forward) match the current visual
// identity without a redesign.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#e0f2fe",
        card: "#ffffff",
        "card-border": "#bae6fd",
        "text-primary": "#0f172a",
        "text-muted": "#475569",
        accent: "#0284c7",
        "accent-hover": "#0369a1",
        success: "#10b981",
        danger: "#ef4444",
      },
      fontFamily: {
        sans: ["Outfit", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
