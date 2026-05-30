/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#e8f5ee",
          100: "#c6e6d4",
          200: "#a8d5b5",
          400: "#4caf7d",
          500: "#2e8b57",
          600: "#1b6b3a",
          700: "#145230",
          800: "#0d3b22",
          900: "#072414",
        },
        surface: {
          0:   "#ffffff",
          50:  "#f8f9fa",
          100: "#f1f3f5",
          200: "#e9ecef",
          300: "#dee2e6",
          400: "#ced4da",
          500: "#adb5bd",
          600: "#6c757d",
          700: "#495057",
          800: "#343a40",
          900: "#212529",
          950: "#0d1117",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "xl":  "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04)",
        "modal": "0 20px 60px rgba(0,0,0,.15)",
        "glow": "0 0 0 3px rgba(46,139,87,.2)",
      },
      animation: {
        "fade-in": "fadeIn .2s ease",
        "slide-up": "slideUp .25s ease",
        "pulse-soft": "pulseSoft 2s ease infinite",
      },
      keyframes: {
        fadeIn:     { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:    { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        pulseSoft:  { "0%,100%": { opacity: 1 }, "50%": { opacity: .6 } },
      }
    },
  },
  plugins: [],
}
