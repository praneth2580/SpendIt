/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-primary": "#00363d",
        "on-surface": "#e5e2e1",
        "on-primary-container": "#00626e",
        "outline": "#849396",
        "on-secondary-fixed-variant": "#00513c",
        "primary-fixed": "#9cf0ff",
        "error": "#ffb4ab",
        "inverse-primary": "#006875",
        "surface-container-highest": "#353534",
        "error-container": "#93000a",
        "tertiary-fixed-dim": "#d4bbff",
        "secondary-fixed": "#34ffc5",
        "surface-variant": "#353534",
        "on-background": "#e5e2e1",
        "on-tertiary-fixed": "#260058",
        "secondary-fixed-dim": "#00e1ac",
        "inverse-on-surface": "#313030",
        "primary-container": "#00e5ff",
        "background": "#131313",
        "tertiary-container": "#ddc7ff",
        "surface-container": "#201f1f",
        "tertiary-fixed": "#ebdcff",
        "surface-tint": "#00daf3",
        "primary-fixed-dim": "#00daf3",
        "on-tertiary-fixed-variant": "#582a9f",
        "on-error": "#690005",
        "on-secondary": "#003828",
        "surface-container-lowest": "#0e0e0e",
        "surface-container-low": "#1c1b1b",
        "on-error-container": "#ffdad6",
        "surface-dim": "#131313",
        "on-tertiary": "#400688",
        "primary": "#c3f5ff",
        "outline-variant": "#3b494c",
        "on-surface-variant": "#bac9cc",
        "secondary-container": "#00fdc1",
        "secondary": "#f4fff7",
        "tertiary": "#f4e8ff",
        "on-tertiary-container": "#6b40b2",
        "on-primary-fixed-variant": "#004f58",
        "on-secondary-container": "#007054",
        "surface-container-high": "#2a2a2a",
        "surface": "#131313",
        "surface-bright": "#393939",
        "inverse-surface": "#e5e2e1",
        "on-primary-fixed": "#001f24",
        "on-secondary-fixed": "#002116"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        "touch-target": "3rem",
        xl: "2.5rem",
        xs: "0.25rem"
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        h1: ["Inter", "sans-serif"],
        "label-caps": ["Inter", "sans-serif"],
        h2: ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        inter: ["Inter", "sans-serif"]
      },
      fontSize: {
        display: ["38px", { lineHeight: "1.1", letterSpacing: "-0.04em", fontWeight: "700" }],
        h1: ["26px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "label-caps": ["10px", { lineHeight: "1", letterSpacing: "0.1em", fontWeight: "700" }],
        h2: ["20px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-md": ["14px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" }],
        "body-lg": ["16px", { lineHeight: "1.6", letterSpacing: "0", fontWeight: "400" }]
      }
    }
  },
  plugins: [],
}
