import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "oklch(0.955 0.014 85)",
          light: "oklch(0.955 0.014 85)",
        },
        ink: {
          DEFAULT: "oklch(0.22 0.012 60)",
          deep: "oklch(0.22 0.012 60)",
        },
        cobalt: {
          DEFAULT: "oklch(0.605 0.128 40)",
          deep: "oklch(0.52 0.128 40)",
          wash: "oklch(0.918 0.022 82)",
        },
        sun: {
          DEFAULT: "#f2d77a",
          light: "#fae8a8",
        },
        cream: "oklch(0.918 0.022 82)",
        rust: {
          DEFAULT: "oklch(0.605 0.128 40)",
          deep: "oklch(0.52 0.128 40)",
          wash: "oklch(0.918 0.022 82)",
        },
        clay: "#9f4430",
        teal: "#3f6b62",
      },
      fontFamily: {
        body: ["var(--font-work-sans)", "Work Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-instrument-serif)", "Instrument Serif", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-work-sans)", "Work Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "paper-grid": "none",
        "navy-grid": "none",
      },
      boxShadow: {
        drawer: "-18px 0 50px rgba(25, 22, 18, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
