/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--odys-background)",
        "on-background": "var(--odys-on-background)",
        primary: "var(--odys-primary)",
        secondary: "var(--odys-secondary)",
        "primary-container": "var(--odys-primary-container)",
        "on-primary": "var(--odys-on-primary)",
        "on-primary-container": "var(--odys-on-primary-container)",
        "surface-container": "var(--odys-surface-container)",
        "surface-container-low": "var(--odys-surface-container-low)",
        "surface-container-lowest": "var(--odys-surface-container-lowest)",
        "surface-container-high": "var(--odys-surface-container-high)",
        "surface-container-highest": "var(--odys-surface-container-highest)",
        "on-surface": "var(--odys-on-surface)",
        "on-surface-variant": "var(--odys-on-surface-variant)",
        "outline-variant": "var(--odys-outline-variant)",
      },
      fontFamily: {
        body: ["Outfit", "sans-serif"],
        headline: ["Plus Jakarta Sans", "Outfit", "sans-serif"],
        label: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
};
