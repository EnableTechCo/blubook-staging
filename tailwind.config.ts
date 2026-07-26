import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#f2eee3",
          light: "#fbf8ef",
        },
        ink: {
          DEFAULT: "#13263c",
          deep: "#0d2136",
        },
        cobalt: {
          DEFAULT: "#315f82",
          deep: "#21445f",
          wash: "#e6edf0",
        },
        sun: {
          DEFAULT: "#e5b94f",
          light: "#f4d775",
        },
        clay: "#a95035",
        teal: "#487b73",
      },
      fontFamily: {
        body: ["Aptos", "Segoe UI", "Arial", "sans-serif"],
        heading: [
          "Iowan Old Style",
          "Palatino Linotype",
          "Book Antiqua",
          "Georgia",
          "serif",
        ],
        mono: ["Cascadia Mono", "SFMono-Regular", "Consolas", "monospace"],
      },
      backgroundImage: {
        "paper-grid":
          "linear-gradient(rgba(19, 38, 60, 0.026) 1px, transparent 1px)",
        "navy-grid":
          "linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px)",
      },
      boxShadow: {
        drawer: "-18px 0 50px rgba(5, 18, 30, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
