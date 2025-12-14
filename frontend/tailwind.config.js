/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'instagram-blue': '#0095f6',
        'instagram-blue-hover': '#1877f2',
        'instagram-gray': '#fafafa',
        'instagram-border': '#dbdbdb',
      }
    },
  },
  plugins: [],
}
