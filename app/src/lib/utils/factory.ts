import type { CatalogData } from '$lib/model/types';
import { asset } from '$lib/utils/paths';

function prefixPath(path: string): string {
	return asset(path);
}

export function createCatalogData(raw: any): CatalogData {
	return {
		id: raw.id,
		name: raw.name,
		title: raw.title,
		investment: raw.investment,
		currency: raw.currency,
		paragraphs: raw.paragraphs,
		coverImg: raw.coverImg
			? {
					small: {
						'1x': prefixPath(raw.coverImg.small['1x']),
						'2x': prefixPath(raw.coverImg.small['2x'])
					},
					large: {
						'1x': prefixPath(raw.coverImg.large['1x']),
						'2x': prefixPath(raw.coverImg.large['2x'])
					}
				}
			: undefined,
		imageSrc: raw.imageSrc?.map((path: string) => prefixPath(path)),
		area: raw.area,
		plotCount: raw.plot_count,
		estateCount: raw.estate_count
	};
}
