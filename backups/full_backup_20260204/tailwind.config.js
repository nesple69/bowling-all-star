export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#121212",
        surface: "#1a1a1a",
      },
      boxShadow: {
        neumorphicout: "8px 8px 16px #0b0b0b, -8px -8px 16px #191919",
        neumorphicin: "inset 8px 8px 16px #0b0b0b, inset -8px -8px 16px #191919",
        neumorphicout_sm: "4px 4px 8px #0b0b0b, -4px -4px 8px #191919",
        neumorphicin_sm: "inset 4px 4px 8px #0b0b0b, inset -4px -4px 8px #191919",
      }
    },
  },
  plugins: [],
}
