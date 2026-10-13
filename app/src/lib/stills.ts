import registry from '$lib/content/generated/stills.json';
import placements from '$lib/content/generated/placements.json';
import type { Still, StillVariant, Surface } from '$lib/model/types';

type RegistryItem = {
	fileKey: string;
	alt: string | null;
	aspectRatio: number | null;
	lqip: string | null;
};

const items = registry.items as Record<string, RegistryItem>;
const surfaces = placements as Record<Surface, string[]>;

/**
 * Image URLs are rebuilt here rather than stored per still: three absolute URLs
 * per still is far more data than the file key they are derived from, and the
 * build ships this registry to every page.
 */
export function stillUrl(fileKey: string, variant: StillVariant): string {
	return `${registry.baseUrl}/storage/v1/object/public/${registry.bucket}/${variant}/${fileKey}.webp`;
}

export function stillSrcset(fileKey: string): string {
	return [
		`${stillUrl(fileKey, 'w480')} 480w`,
		`${stillUrl(fileKey, 'w960')} 960w`,
		`${stillUrl(fileKey, 'w1600')} 1600w`
	].join(', ');
}

export function getStill(id: string): Still | null {
	const item = items[id];
	return item ? { id, ...item } : null;
}

export function getStills(ids: string[]): Still[] {
	return ids.map(getStill).filter((still): still is Still => still !== null);
}

export function allStills(): Still[] {
	return Object.entries(items).map(([id, item]) => ({ id, ...item }));
}

/** Stills curated for a surface, in their configured order. May be empty. */
export function placedStills(surface: Surface): Still[] {
	return getStills(surfaces[surface] ?? []);
}
