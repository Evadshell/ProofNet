/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from 'tailwindcss-animate';

const config = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
      extend: {
        animation: {
          'gradient': 'gradient 8s linear infinite',
          'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        keyframes: {
          gradient: {
            '0%, 100%': {
              'background-size': '200% 200%',
              'background-position': 'left center'
            },
            '50%': {
              'background-size': '200% 200%',
              'background-position': 'right center'
            },
          },
        },
      },
    },
    plugins: [
      tailwindcssAnimate,
    ],
  };

export default config;