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
          DEFAULT: "oklch(0.24 0.04 252)",
          deep: "oklch(0.18 0.05 252)",
        },
        cobalt: {
          DEFAULT: "oklch(0.54 0.16 252)",
          deep: "oklch(0.42 0.15 252)",
          wash: "oklch(0.92 0.035 245)",
        },
        sun: {
          DEFAULT: "#8dc7e8",
          light: "#bbdff2",
        },
        cream: "oklch(0.918 0.022 82)",
        rust: {
          DEFAULT: "oklch(0.54 0.16 252)",
          deep: "oklch(0.42 0.15 252)",
          wash: "oklch(0.92 0.035 245)",
        },
        clay: "#315fa8",
        teal: "#2f718f",
        // Every other colour here is a blue, which is fine for identity but
        // cannot say "good" or "bad". These two are the only hues on the
        // palette that carry a verdict, so they are used for exactly that and
        // nothing decorative.
        positive: {
          DEFAULT: "oklch(0.52 0.13 150)",
          wash: "oklch(0.94 0.04 150)",
        },
        negative: {
          DEFAULT: "oklch(0.52 0.19 27)",
          wash: "oklch(0.94 0.04 27)",
        },
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
        drawer: "-18px 0 50px rgba(19, 35, 61, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
