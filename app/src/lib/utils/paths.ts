import { asset as resolveAsset, resolve } from '$app/paths';

const rootPath = resolve('/');

function prefixWithRoot(path: string): string {
	if (path === '/') return rootPath;

	const cleanPath = path.startsWith('/') ? path.slice(1) : path;
	return `${rootPath}${cleanPath}`;
}

/**
 * Get the correct asset path with base path prefix for GitHub Pages
 */
export function asset(path: string): string {
	return resolveAsset(path.startsWith('/') ? path : `/${path}`);
}

/**
 * Get the correct route path with base path prefix
 */
export function route(path: string): string {
	return prefixWithRoot(path);
}
