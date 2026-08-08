/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/*.{js,jsx}",
    "!./app/**/node_modules/**",
    "!**/node_modules/**",
  ],
  theme: {
    extend: {
      colors: {
        remat: {
          green: "#046B3C",
          "green-dark": "#034D2C",
          "green-light": "#E8F5EE",
          blue: "#EBF3FF",
          "blue-dark": "#C7DFFF",
        },
        status: {
          active: "#16A34A",
          pending: "#D97706",
          rejected: "#DC2626",
          draft: "#6B7280",
          sold: "#1F2937",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 16px rgba(4,107,60,0.12), 0 2px 4px rgba(0,0,0,0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
