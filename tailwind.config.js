/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Override default colors to use rgb with alpha values
        // This should prevent oklch generation
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        // Add other colors used in the project if necessary
        // For example, if gray-600 is used, define it here
        gray: {
          50: 'rgb(249 250 251 / <alpha-value>)',
          100: 'rgb(243 244 246 / <alpha-value>)',
          200: 'rgb(229 231 235 / <alpha-value>)',
          300: 'rgb(209 213 219 / <alpha-value>)',
          400: 'rgb(156 163 175 / <alpha-value>)',
          500: 'rgb(107 114 128 / <alpha-value>)',
          600: 'rgb(75 85 99 / <alpha-value>)',
          700: 'rgb(55 65 81 / <alpha-value>)',
          800: 'rgb(31 41 55 / <alpha-value>)',
          900: 'rgb(17 24 39 / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}