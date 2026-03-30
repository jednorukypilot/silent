export type MenuTile = {
	title: string;
	link: string;
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
