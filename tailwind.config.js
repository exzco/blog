/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./template/**/*.html', './build.js'],
  theme: {
    extend: {
      colors: {
        'cactus-bg': '#13161b',
        'cactus-text': '#d2d8e1',
        'cactus-link': '#58a6ff',
        'cactus-meta': '#97a3b4',
        'cactus-border': '#343c49',
        'cactus-code-bg': '#2a303a',
        'cactus-code-text': '#e8edf4',
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        'mono': ['"Menlo"', '"Meslo LG"', 'Consolas', 'monospace'],
      },
      spacing: {
        '3': '0.75rem',
        '4': '1rem',
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
