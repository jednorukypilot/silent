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
	imageUrls: {
		w480: string;
		w960: string;
		w1600: string;
	};
};

export type WorksData = {
	id: string;
	title: string;
	description: string | null;
	descriptionLong: string | null;
	aspectRatio: number | null;
	year: number | null;
	videoLink: string | null;
	stills: DbWorkStill[];
};
