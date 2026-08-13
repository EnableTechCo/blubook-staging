import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "oklch(var(--color-paper) / <alpha-value>)",
          light: "oklch(var(--color-paper-light) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "oklch(var(--color-ink) / <alpha-value>)",
          deep: "oklch(var(--color-ink-deep) / <alpha-value>)",
        },
        cobalt: {
          DEFAULT: "oklch(var(--color-cobalt) / <alpha-value>)",
          deep: "oklch(var(--color-cobalt-deep) / <alpha-value>)",
          wash: "oklch(var(--color-cobalt-wash) / <alpha-value>)",
        },
        sun: {
          DEFAULT: "#8dc7e8",
          light: "#bbdff2",
        },
        cream: "oklch(var(--color-cream) / <alpha-value>)",
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
        glass: "0 18px 50px rgba(31, 65, 115, 0.09), 0 2px 8px rgba(31, 65, 115, 0.05)",
        surface: "0 10px 30px rgba(31, 65, 115, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.78)",
      },
    },
  },
  plugins: [],
};

export default config;
