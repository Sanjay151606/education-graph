/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brain: {
          50: "#f2f7ff",
          100: "#dfeaff",
          200: "#bfd7fe",
          300: "#93befe",
          400: "#5f9dff",
          500: "#3b7dff",
          600: "#2a63e0",
          700: "#1d4cb8",
          800: "#1e4094",
          900: "#1e3778",
        },
        focus: {
          400: "#7fd8a3",
          500: "#4fbf82",
        },
        // Feature Accent Tokens
        tasks: {
          light: "#eef2ff",
          DEFAULT: "#6366f1",
          dark: "#4338ca",
          border: "#c7d2fe",
          text: "#3730a3",
        },
        materials: {
          light: "#ecfdf5",
          DEFAULT: "#10b981",
          dark: "#047857",
          border: "#a7f3d0",
          text: "#065f46",
        },
        focusMode: {
          light: "#fffbeb",
          DEFAULT: "#f59e0b",
          dark: "#b45309",
          border: "#fde68a",
          text: "#92400e",
        },
        liveClass: {
          light: "#faf5ff",
          DEFAULT: "#a855f7",
          dark: "#7e22ce",
          border: "#e9d5ff",
          text: "#6b21a8",
        },
        reports: {
          light: "#fdf2f8",
          DEFAULT: "#ec4899",
          dark: "#be185d",
          border: "#fbcfe8",
          text: "#9d174d",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        "card-hover": "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
        "card-active": "0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      borderRadius: {
        card: "1rem",
        "card-lg": "1.5rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

