import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await"
import path from "path";

export default defineConfig({
	base: '/',
	root: '.',               // Project root
	publicDir: 'public',     // Static files
	build: {
		outDir: 'dist',        // Output folder for deployment
		emptyOutDir: true
	},
	plugins: [
		wasm(),
		topLevelAwait()
	],
	resolve: {
		alias: {
			"@solblade/client": path.resolve(__dirname, "src/client"),
			"@solblade/common": path.resolve(__dirname, "src/common"),
			"@solblade/server": path.resolve(__dirname, "src/server")
		}
	}
});