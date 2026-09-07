import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

/**
 * Strip the `crossorigin` attribute that Vite injects into <script> and
 * <link rel="stylesheet"> tags during build.
 *
 * Vite adds crossorigin to support CDN hosting, but under the
 * `chrome-extension://` protocol the anonymous CORS request has no
 * Access-Control-Allow-Origin response header, so the browser refuses to
 * load the stylesheet/script and the page renders unstyled. Removing the
 * attribute makes the requests same-origin (no CORS check), which is what
 * an unpacked browser extension needs.
 */
function stripCrossorigin(): Plugin {
	return {
		name: 'strip-crossorigin',
		transformIndexHtml(html) {
			return html.replace(/\s+crossorigin(="[^"]*")?/g, '');
		}
	};
}

export default defineConfig({
	base: './',
	plugins: [stripCrossorigin()],
	build: {
		outDir: 'dist',
		assetsDir: 'assets',
		sourcemap: false
	}
});
