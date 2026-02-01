import { mdsvex } from 'mdsvex';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess(), mdsvex()],

	kit: {
		adapter: undefined,
		alias: {
			$lib: './lib',
			'$lib/*': './lib/*'
		}
	},
	extensions: ['.svelte', '.svx']
};

export default config;
