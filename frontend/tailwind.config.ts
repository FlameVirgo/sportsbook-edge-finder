import type { Config } from "tailwindcss";

// Design tokens mirrored from index.css's dark "money green" theme so
// Tailwind utilities (for new components going forward) match the
// current visual identity.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0e14",
        card: "#161b22",
        "card-border": "#2a3441",
        "text-primary": "#f1f5f9",
        "text-muted": "#8b96a5",
        accent: "#00d68f",
        "accent-hover": "#00f5a8",
        success: "#22c55e",
        danger: "#f87171",
      },
      fontFamily: {
        sans: ["Outfit", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
