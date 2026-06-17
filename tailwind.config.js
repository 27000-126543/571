/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0A2463",
          50: "#E6EBF5",
          100: "#C2CDE5",
          200: "#9AAFCF",
          300: "#7291B9",
          400: "#5579A9",
          500: "#386199",
          600: "#2A4A7A",
          700: "#1C335B",
          800: "#131D3D",
          900: "#0A2463",
        },
        warning: {
          DEFAULT: "#FCA311",
          50: "#FFF5E1",
          100: "#FFE4B3",
          200: "#FFD180",
          300: "#FFBE4D",
          400: "#FFB026",
          500: "#FCA311",
          600: "#D98700",
          700: "#A66800",
          800: "#734900",
          900: "#402800",
        },
        success: {
          DEFAULT: "#2EC4B6",
          50: "#E0F8F6",
          100: "#B4EDEA",
          200: "#84E1DC",
          300: "#54D5CD",
          400: "#37CCBF",
          500: "#2EC4B6",
          600: "#1E9D92",
          700: "#15736B",
          800: "#0D4A45",
          900: "#05211F",
        },
        danger: {
          DEFAULT: "#E63946",
          50: "#FDE4E6",
          100: "#F9BBC0",
          200: "#F58D95",
          300: "#F15F6A",
          400: "#EC424F",
          500: "#E63946",
          600: "#C41F2C",
          700: "#961722",
          800: "#680F17",
          900: "#3A080D",
        },
        bg: {
          DEFAULT: "#0D1117",
          light: "#161B22",
          lighter: "#21262D",
          card: "#1C2128",
          border: "#30363D",
        },
      },
      fontFamily: {
        orbitron: ["Orbitron", "sans-serif"],
        noto: ["'Noto Sans SC'", "sans-serif"],
      },
      animation: {
        "scan-line": "scan 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 20px rgba(46, 196, 182, 0.5)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 40px rgba(46, 196, 182, 0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
