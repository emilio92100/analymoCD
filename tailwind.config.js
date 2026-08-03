/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Titres uniquement (h1 du hero + titres de section).
        // Gabarito n'est chargée qu'en 700/800/900 : elle ne sert jamais
        // au texte courant, qui reste en DM Sans via body.
        display: ['Gabarito', 'DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
