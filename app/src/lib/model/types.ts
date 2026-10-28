export type MenuTile = {
	title: string;
	href: string;
};

export type StillVariant = 'w480' | 'w960' | 'w1600';

export type Surface = 'hero' | 'contact';

/** One image in the stills registry, resolved from its generated entry. */
export type Still = {
	id: string;
	fileKey: string;
	alt: string | null;
	aspectRatio: number | null;
	/** Tiny blurred data URI shown while the full image loads. */
	lqip: string | null;
};

/** A work as stored in works.json, still referencing its stills by id. */
export type RawWork = {
	id: string;
	title: string;
	description: string | null;
	descriptionLong: string | null;
	aspectRatio: number | null;
	year: number | null;
	videoLink: string | null;
	listOrder: number | null;
	homeOrder: number | null;
	coverStillId: string | null;
	smallCoverStillId: string | null;
	stillIds: string[];
};

/** A work with its stills resolved, as pages consume it. */
export type WorksData = Omit<RawWork, 'stillIds' | 'coverStillId' | 'smallCoverStillId'> & {
	stills: Still[];
	/** The still representing this work on /works; falls back to the first. */
	cover: Still | null;
	/** The still the home viewer shows on small displays; falls back to the first. */
	smallCover: Still | null;
};
