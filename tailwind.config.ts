import type { Config } from "tailwindcss";

/**
 * Brand palette carried over from the original Arabiana static site:
 * deep teal background + warm gold accents. Keeps the restaurant identity
 * consistent across the new subscription app.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#081f1f",
          secondary: "#0d2e2e",
          card: "#0f3535",
          cardhover: "#144040",
          surface: "#0b2828",
        },
        gold: {
          DEFAULT: "#c9a84c",
          light: "#e0c777",
          dark: "#a68b38",
        },
        teal: {
          DEFAULT: "#1a6b6a",
          light: "#238c8a",
          dark: "#0e4f4e",
        },
        spice: "#c44536",
        saffron: "#e0c777",
        ink: {
          DEFAULT: "#f0ece4",
          secondary: "#b0c8c4",
          muted: "#6b9490",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        arabic: ["var(--font-naskh)", "serif"],
      },
      borderColor: {
        DEFAULT: "rgba(201, 168, 76, 0.2)",
      },
      boxShadow: {
        gold: "0 4px 30px rgba(201, 168, 76, 0.2)",
        teal: "0 4px 30px rgba(26, 107, 106, 0.2)",
        card: "0 8px 30px rgba(0, 0, 0, 0.4)",
      },
      backgroundImage: {
        "gradient-gold": "linear-gradient(135deg, #c9a84c, #e0c777, #c9a84c)",
        "gradient-warm": "linear-gradient(135deg, #1a6b6a, #c9a84c)",
        "gradient-teal": "linear-gradient(135deg, #0e4f4e, #1a6b6a, #238c8a)",
      },
    },
  },
  plugins: [],
};

export default config;
