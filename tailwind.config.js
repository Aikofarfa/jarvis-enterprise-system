const { themeColors } = require("./theme.config");
const plugin = require("tailwindcss/plugin");

const tailwindColors = Object.fromEntries(
  Object.entries(themeColors).map(([name, swatch]) => [
    name,
    {
      DEFAULT: `var(--color-${name})`,
      light: swatch.light,
      dark: swatch.dark,
    },
  ]),
);

tailwindColors.slate = {
  950: '#08090c',
  900: '#11151b',
  800: '#1b222b',
  700: '#2b3642',
  600: '#53606d',
  500: '#7d8997',
  400: '#9aa5b1',
  300: '#b9c4ce',
  200: '#d4dde5',
  100: '#edf2f7',
};
tailwindColors.emerald = { 950: '#052e1a', 900: '#064e2b', 400: '#4ade80', 300: '#86efac' };
tailwindColors.amber = { 950: '#451a03', 900: '#78350f', 300: '#fcd34d', 200: '#fde68a', 100: '#fef3c7' };
tailwindColors.red = { 950: '#450a0a', 900: '#7f1d1d', 300: '#fca5a5' };

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  // Scan all component and app files for Tailwind classes
  content: ["./app/**/*.{js,ts,tsx}", "./components/**/*.{js,ts,tsx}", "./lib/**/*.{js,ts,tsx}", "./hooks/**/*.{js,ts,tsx}"],

  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: tailwindColors,
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("light", ':root:not([data-theme="dark"]) &');
      addVariant("dark", ':root[data-theme="dark"] &');
    }),
  ],
};
