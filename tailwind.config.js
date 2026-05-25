/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172124",
        muted: "#64706f",
        canvas: "#f6f3ed",
        panel: "#ffffff",
        line: "#d9ded8",
        pine: "#2f6f58",
        river: "#315f8f",
        saffron: "#a46f18",
        coral: "#b84b61"
      },
      boxShadow: {
        soft: "0 16px 42px rgba(32, 40, 41, 0.10)"
      }
    }
  },
  plugins: []
};
