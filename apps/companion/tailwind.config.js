/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // EFT-inspired colors
        tarkov: {
          bg: "#1a1a1a",
          surface: "#2d2d2d",
          border: "#404040",
          text: "#e5e5e5",
          muted: "#9ca3af",
          accent: "#d4a574",
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
