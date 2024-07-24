import flowbitePlugin from 'flowbite/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{svelte,js,ts,jsx,tsx}",
    "node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}",  // Add this line
  ],
  theme: {
    extend: {},
  },
  plugins: [flowbitePlugin],
  daisyui: {
    themes: ["light", "dark"],
  },
};
