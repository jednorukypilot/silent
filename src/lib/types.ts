export type MenuTile = {
	title: string;
	link: string;
};

export type CatalogData = {
	id: string;
	name: string;
	title: string;
	investment: number;
	currency?: string;
	paragraphs: string[];
	coverImg?: {
		small: {
			'1x': string;
			'2x': string;
		};
		large: {
			'1x': string;
			'2x': string;
		};
	};
	imageSrc: string[];
	area: number;
	plotCount: number;
	estateCount: number;
};