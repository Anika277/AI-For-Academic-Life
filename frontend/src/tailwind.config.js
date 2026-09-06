/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c2430",
        parchment: "#faf7f0",
      },
    },
  },
  plugins: [],
}