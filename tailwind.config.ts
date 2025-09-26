import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", "dark"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark-first tokens
        bg: {
          DEFAULT: "#0D0D12",
          card: "#1E1E2E",
        },
        fg: {
          DEFAULT: "#EDEDED",
          muted: "#B8B8C3",
        },
        primary: {
          DEFAULT: "#00FFF7",
          foreground: "#001616",
        },
        accent: {
          DEFAULT: "#FF0080",
          foreground: "#2B0015",
        },
        // Extra palette
        terracotta: "#E2725B",
        "fresh-cream": "#FFF4E6",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;