/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#0f1117",
        panel: "#161b22",
        border: "#21262d",
        accent: {
          blue: "#1a56db",
          red: "#dc2626",
        },
        text: {
          primary: "#f0f6fc",
          muted: "#8b949e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
