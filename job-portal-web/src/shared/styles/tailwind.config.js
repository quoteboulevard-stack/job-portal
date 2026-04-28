/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        "primary-blue": "#3B82F6",
        "secondary-gray": "#6B7280",
        "accent-green": "#10B981",
        "bg-white": "#FFFFFF",
        "border-gray": "#E5E7EB",
      },
      spacing: {
        0: "0",
        1: "0.5rem",
        2: "1rem",
        3: "1.5rem",
        4: "2rem",
        5: "2.5rem",
        6: "3rem",
        8: "4rem",
      },
      fontSize: {
        sm: ["0.875rem", { lineHeight: "1.5" }],
        base: ["1rem", { lineHeight: "1.5" }],
        lg: ["1.125rem", { lineHeight: "1.5" }],
        xl: ["1.5rem", { lineHeight: "1.33" }],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      boxShadow: {
        interactive: "0 2px 8px rgba(17, 24, 39, 0.08)",
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
