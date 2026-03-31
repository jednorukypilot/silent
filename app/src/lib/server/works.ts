import type { QueryData } from '@supabase/supabase-js';
import type { DbWorkStill, WorksData } from '$lib/model/types';
import { supabaseServerClient } from '$lib/server/client';

const displayedWorksSelection = `
  id,
  created_at,
  displayed,
  name,
  description,
  aspect_ratio,
  year,
  video_link,
  works_stills (
    id,
    created_at,
    work_id,
    file_key,
    alt,
    sort_order
  )
`;

function createDisplayedWorksQuery() {
	return supabaseServerClient
		.from('works')
		.select(displayedWorksSelection)
		.not('displayed', 'is', null)
		.order('year', { ascending: false })
		.order('sort_order', { foreignTable: 'works_stills', ascending: true });
}

type DisplayedWorksResult = QueryData<ReturnType<typeof createDisplayedWorksQuery>>;
type DisplayedWorkRow = DisplayedWorksResult[number];

function mapStill(still: NonNullable<DisplayedWorkRow['works_stills']>[number]): DbWorkStill {
	return {
		id: still.id,
		createdAt: still.created_at,
		workId: still.work_id,
		alt: still.alt,
		fileKey: still.file_key,
		sortOrder: still.sort_order
	};
}

function mapWorkToHomeTile(record: DisplayedWorkRow): WorksData {
	return {
		id: record.id,
		title: record.name,
		description: record.description,
		aspectRatio: record.aspect_ratio,
		year: record.year,
		videoLink: record.video_link,
		stills: (record.works_stills ?? []).map(mapStill)
	};
}

export async function getDisplayedWorks(): Promise<DisplayedWorksResult> {
	const { data, error } = await createDisplayedWorksQuery();

	if (error) throw error;
	return data ?? [];
}

export async function getHomeTiles(): Promise<WorksData[]> {
	const works = await getDisplayedWorks();

	console.log('Fetched works for home tiles:', works);

	works.sort((a, b) => {
		const orderA = a.displayed;
		const orderB = b.displayed;

		return orderA - orderB;
	});

	return works.map(mapWorkToHomeTile);
}

export async function getWorkById(id: string): Promise<DisplayedWorkRow> {
	const { data, error } = await supabaseServerClient
		.from('works')
		.select(displayedWorksSelection)
		.eq('id', id)
		.single();

	if (error) throw error;
	return data as DisplayedWorkRow;
}
