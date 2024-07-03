import flowbitePlugin from 'flowbite/plugin';

/** @type {import('tailwindcss').Config} */
export default {
	content: [
	  "./src/**/*.{svelte,js,ts,jsx,tsx}",
	],
	theme: {
	  extend: {},
	},
	plugins: [flowbitePlugin],
	daisyui: {
		themes: ["light", "dark"],
	  },
  }