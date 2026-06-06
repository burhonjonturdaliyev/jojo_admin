/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0B0F1A",
          panel: "#121826",
          card: "#1A2030",
          hover: "#222B3D",
          input: "#1A2030",
        },
        brand: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
          soft: "rgba(59, 130, 246, 0.12)",
        },
        line: {
          DEFAULT: "#222B3D",
          soft: "#1A2030",
        },
        text: {
          primary: "#E6EAF2",
          secondary: "#9AA3B2",
          muted: "#6B7280",
        },
        status: {
          new: "#9AA3B2",
          progress: "#F59E0B",
          waiting: "#3B82F6",
          resolved: "#10B981",
          closed: "#6B7280",
          blocked: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
        panel: "0 4px 24px 0 rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};
