import type { Config } from 'tailwindcss';
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#dfeffd",
          200: "#c8e5fb",
          300: "#93c7f6",
          400: "#5aa5f1",
          500: "#3278db",
          600: "#255dc0",
          700: "#1f4790",
          800: "#1b3b77",
          900: "#162f5d"
        }
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
} satisfies Config;
