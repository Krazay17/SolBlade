import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await"

export default defineConfig({
	base: '/',
	root: './client',               // Project root
	publicDir: 'public',     // Static files
	build: {
		outDir: 'dist',        // Output folder for deployment
		emptyOutDir: true
	},
	plugins: [wasm(), topLevelAwait()]
});