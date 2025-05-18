/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
    },
  },
  plugins: [
    plugin(({ theme, addUtilities}) => {
      const neonUntilities = {};
      const colors = theme('colors');
      for (const color in colors) {
        if (typeof colors[color] === 'object') {
          const color1 = colors[color]['200'];
          const color2 = colors[color]['500'];
          const color3 = colors[color]['700'];
          neonUntilities[`.neon-${color}`] = {
            boxShadow: `0 0 5px ${color1}, 0 0 15px ${color2}, 0 0 30px ${color3}`,
          };
        }
      }
      addUtilities(neonUntilities);
    })
  ],
};