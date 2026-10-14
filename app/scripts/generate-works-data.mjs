import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const envPath = path.join(appRoot, '.env');
const generatedDir = path.join(appRoot, 'src', 'lib', 'content', 'generated');
const BUCKET = 'stills';
const VARIANTS = ['w480', 'w960', 'w1600'];
const SURFACES = ['hero', 'contact'];

// Output is normalized on purpose. Every still is written once into stills.json
// and referenced by id everywhere else, so a still used by a work, the hero and
// the contact page costs one entry rather than three. Image URLs are rebuilt
// from the file key at runtime instead of being stored: there are three of them
// per still and they are ~110 characters each, which dwarfs the data they encode.
const OUTPUTS = {
	stills: path.join(generatedDir, 'stills.json'),
	works: path.join(generatedDir, 'works.json'),
	placements: path.join(generatedDir, 'placements.json')
};

function log(message, details) {
	if (details === undefined) {
		console.log(`[generate-works-data] ${message}`);
		return;
	}

	console.log(`[generate-works-data] ${message}`, details);
}

function fail(message, details) {
	console.error(`[generate-works-data] ${message}`, details ?? '');
	throw new Error(message);
}

const worksSelection = `
  id,
  name,
  description,
  description_long,
  aspect_ratio,
  year,
  video_link,
  displayed,
  highlighted,
  cover_still_id,
  works_stills (
    sort_order,
    stills (
      id,
      file_key,
      alt,
      aspect_ratio,
      lqip
    )
  )
`;

const placementsSelection = `
  surface,
  sort_order,
  stills (
    id,
    file_key,
    alt,
    aspect_ratio,
    lqip
  )
`;

function parseEnvFile(content) {
	const entries = {};

	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const separatorIndex = trimmed.indexOf('=');
		if (separatorIndex === -1) continue;

		const key = trimmed.slice(0, separatorIndex).trim();
		let value = trimmed.slice(separatorIndex + 1).trim();

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		entries[key] = value;
	}

	return entries;
}

async function loadLocalEnv() {
	try {
		const content = await fs.readFile(envPath, 'utf8');
		const parsed = parseEnvFile(content);

		log('Loaded local app/.env file', {
			path: path.relative(appRoot, envPath),
			keys: Object.keys(parsed).sort()
		});

		for (const [key, value] of Object.entries(parsed)) {
			if (!(key in process.env)) {
				process.env[key] = value;
			}
		}
	} catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
			log('No local app/.env file found, using process environment only');
			return;
		}

		throw error;
	}
}

function mapStill(still) {
	return {
		fileKey: still.file_key,
		alt: still.alt,
		aspectRatio: still.aspect_ratio === null ? null : Number(still.aspect_ratio),
		lqip: still.lqip ?? null
	};
}

function mapWork(work, stillIds) {
	return {
		id: work.id,
		title: work.name,
		description: work.description,
		descriptionLong: work.description_long,
		aspectRatio: work.aspect_ratio === null ? null : Number(work.aspect_ratio),
		year: work.year,
		videoLink: work.video_link,
		listOrder: work.displayed,
		homeOrder: work.highlighted,
		coverStillId: work.cover_still_id ?? null,
		stillIds
	};
}

function byOrderThenTitle(field) {
	return (a, b) =>
		(a[field] ?? Infinity) - (b[field] ?? Infinity) || a.title.localeCompare(b.title);
}

// Reading back what was just written catches a dataset that is internally broken
// (a work pointing at a still that no longer exists) before it reaches the build,
// and does the same job for the reused-on-disk fallback below.
function validateDataset({ stills, works, placements }) {
	if (!stills?.items || typeof stills.items !== 'object') {
		fail('stills.json must have an items object.');
	}

	if (!stills.baseUrl) {
		fail('stills.json is missing baseUrl; image URLs cannot be rebuilt without it.');
	}

	for (const [id, still] of Object.entries(stills.items)) {
		if (!still?.fileKey) {
			fail(`Still ${id} has no fileKey.`, still);
		}
	}

	if (!Array.isArray(works)) {
		fail('works.json must be an array.');
	}

	for (const work of works) {
		if (!Array.isArray(work.stillIds)) {
			fail(`Work ${work?.id} is missing a stillIds array.`, work);
		}

		for (const stillId of work.stillIds) {
			if (!stills.items[stillId]) {
				fail(`Work ${work.id} references unknown still ${stillId}.`);
			}
		}
	}

	for (const surface of SURFACES) {
		const ids = placements?.[surface];
		if (!Array.isArray(ids)) {
			fail(`placements.json is missing the ${surface} array.`, placements);
		}

		for (const stillId of ids) {
			if (!stills.items[stillId]) {
				fail(`Placement ${surface} references unknown still ${stillId}.`);
			}
		}
	}

	log('Validated generated data', {
		stills: Object.keys(stills.items).length,
		works: works.length,
		placements: Object.fromEntries(SURFACES.map((s) => [s, placements[s].length]))
	});
}

async function writeDataset(dataset) {
	validateDataset(dataset);
	await fs.mkdir(generatedDir, { recursive: true });

	for (const [key, outputPath] of Object.entries(OUTPUTS)) {
		await fs.writeFile(outputPath, `${JSON.stringify(dataset[key], null, 2)}\n`, 'utf8');
	}

	log('Wrote generated data', {
		output: path.relative(appRoot, generatedDir),
		files: Object.keys(OUTPUTS).length
	});
}

async function readDataset() {
	const entries = await Promise.all(
		Object.entries(OUTPUTS).map(async ([key, outputPath]) => [
			key,
			JSON.parse(await fs.readFile(outputPath, 'utf8'))
		])
	);

	return Object.fromEntries(entries);
}

async function writeFallback() {
	try {
		const existing = await readDataset();
		validateDataset(existing);
		log('Using existing generated data because env is incomplete');
	} catch {
		log('No valid generated data found; writing an empty fallback dataset');
		await writeDataset({
			stills: { baseUrl: 'about:blank', bucket: BUCKET, variants: VARIANTS, items: {} },
			works: [],
			placements: Object.fromEntries(SURFACES.map((surface) => [surface, []]))
		});
	}
}

async function fetchDataset(supabaseClient, publicBaseUrl) {
	log('Fetching works and placements from Supabase');

	const [worksResult, placementsResult] = await Promise.all([
		supabaseClient
			.from('works')
			.select(worksSelection)
			.or('displayed.not.is.null,highlighted.not.is.null'),
		supabaseClient.from('still_placements').select(placementsSelection)
	]);

	if (worksResult.error) throw worksResult.error;
	if (placementsResult.error) throw placementsResult.error;

	const items = {};

	const works = (worksResult.data ?? []).map((work) => {
		const memberships = (work.works_stills ?? [])
			.filter((row) => row.stills)
			.sort((a, b) => a.sort_order - b.sort_order);

		for (const row of memberships) {
			items[row.stills.id] = mapStill(row.stills);
		}

		return mapWork(
			work,
			memberships.map((row) => row.stills.id)
		);
	});

	works.sort(byOrderThenTitle('listOrder'));

	const placements = Object.fromEntries(SURFACES.map((surface) => [surface, []]));

	for (const row of (placementsResult.data ?? []).filter((row) => row.stills)) {
		if (!placements[row.surface]) {
			log(`Ignoring placement for unknown surface "${row.surface}"`);
			continue;
		}

		items[row.stills.id] = mapStill(row.stills);
		placements[row.surface].push({ id: row.stills.id, sortOrder: row.sort_order });
	}

	for (const surface of SURFACES) {
		placements[surface] = placements[surface]
			.sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity))
			.map((row) => row.id);
	}

	log('Fetched from Supabase', {
		works: works.length,
		stills: Object.keys(items).length,
		placements: Object.fromEntries(SURFACES.map((s) => [s, placements[s].length]))
	});

	await writeDataset({
		stills: { baseUrl: publicBaseUrl, bucket: BUCKET, variants: VARIANTS, items },
		works,
		placements
	});
}

async function main() {
	await loadLocalEnv();

	const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } = process.env;

	log('Environment summary', {
		hasSupabaseUrl: Boolean(SUPABASE_URL),
		hasPublicSupabaseUrl: Boolean(PUBLIC_SUPABASE_URL),
		hasPublishableKey: Boolean(SUPABASE_PUBLISHABLE_KEY)
	});

	if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
		console.warn(
			'[generate-works-data] Missing Supabase env vars. Reusing existing generated data if present.'
		);

		await writeFallback();
		return;
	}

	const publicBaseUrl = (PUBLIC_SUPABASE_URL ?? SUPABASE_URL).replace(/\/$/, '');

	if (!publicBaseUrl) {
		fail('Could not determine PUBLIC_SUPABASE_URL for generated image URLs.');
	}

	const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
		auth: {
			persistSession: false,
			autoRefreshToken: false
		}
	});

	await fetchDataset(supabaseClient, publicBaseUrl);
}

main().catch((error) => {
	console.error('Failed to generate works data JSON:', error);
	process.exitCode = 1;
});
