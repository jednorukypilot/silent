export type MenuTile = {
	title: string;
	href: string;
};

export type DbWorkStill = {
	id: string;
	createdAt: string;
	workId: string;
	alt: string | null;
	fileKey: string;
	sortOrder: number;
};

export type DbWork = {
	id: string;
	createdAt: string;
	displayed: number;
	videoLink: string | null;
	name: string;
	description: string | null;
	aspectRatio: number | null;
	year: number | null;
};

export type DbWorkWithStills = DbWork & {
	stills: DbWorkStill[];
};

export type WorksData = {
	id: string;
	title: string;
	description: string | null;
	aspectRatio: number | null;
	year: number | null;
	videoLink: string | null;
	stills: DbWorkStill[];
};

export type CatalogImageSet = {
	'1x': string;
	'2x': string;
};

export type CatalogCoverImage = {
	small: CatalogImageSet;
	large: CatalogImageSet;
};

export type CatalogData = {
	id: string;
	name: string;
	title: string;
	investment: number;
	currency: string;
	paragraphs: string[];
	coverImg?: CatalogCoverImage;
	imageSrc?: string[];
	area: number;
	plotCount: number;
	estateCount: number;
};
