import { base } from '$app/paths';

/**
 * Get the correct asset path with base path prefix for GitHub Pages
 */
export function asset(path: string): string {
	// Remove leading slash if present, as base already includes it
	const cleanPath = path.startsWith('/') ? path.slice(1) : path;
	return `${base}/${cleanPath}`;
}

/**
 * Get the correct route path with base path prefix
 */
export function route(path: string): string {
	// Remove leading slash if present, as base already includes it
	const cleanPath = path.startsWith('/') ? path.slice(1) : path;
	return `${base}/${cleanPath}`;
}
