import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#f6f0e3",
          light: "#fcf9f1",
        },
        ink: {
          DEFAULT: "#26221d",
          deep: "#191612",
        },
        cobalt: {
          DEFAULT: "#b65e3c",
          deep: "#8e432c",
          wash: "#f1dfd4",
        },
        sun: {
          DEFAULT: "#f2d77a",
          light: "#fae8a8",
        },
        cream: "#eee3cf",
        rust: {
          DEFAULT: "#b65e3c",
          deep: "#8e432c",
          wash: "#f1dfd4",
        },
        clay: "#9f4430",
        teal: "#3f6b62",
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
          "linear-gradient(rgba(38, 34, 29, 0.026) 1px, transparent 1px)",
        "navy-grid":
          "linear-gradient(rgba(255, 255, 255, 0.032) 1px, transparent 1px)",
      },
      boxShadow: {
        drawer: "-18px 0 50px rgba(25, 22, 18, 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
