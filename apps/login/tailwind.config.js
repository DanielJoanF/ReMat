/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        remat: {
          green: "#046B3C",
          "green-dark": "#034D2C",
          "green-light": "#E8F5EE",
        },
      },
    },
  },
  plugins: [],
};
