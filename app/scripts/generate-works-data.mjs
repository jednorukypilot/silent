import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const envPath = path.join(appRoot, '.env');
const outputPath = path.join(appRoot, 'src', 'lib', 'content', 'generated', 'home-tiles.json');
const BUCKET = 'stills';

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

const displayedWorksSelection = `
  id,
  created_at,
  displayed,
  name,
  description,
  description_long,
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

async function readExistingTiles() {
	const content = await fs.readFile(outputPath, 'utf8');
	return JSON.parse(content);
}

function validateTiles(tiles) {
	if (!Array.isArray(tiles)) {
		fail('Generated home tiles must be an array.');
	}

	for (const [tileIndex, tile] of tiles.entries()) {
		if (!Array.isArray(tile.stills)) {
			fail(`Tile at index ${tileIndex} is missing a stills array.`, tile);
		}

		for (const [stillIndex, still] of tile.stills.entries()) {
			const imageUrls = still?.imageUrls;

			if (!imageUrls?.w480 || !imageUrls?.w960 || !imageUrls?.w1600) {
				fail(
					`Still ${still?.id ?? stillIndex} in tile ${tile?.id ?? tileIndex} is missing imageUrls. Regenerate home tiles before building.`,
					{ tileId: tile?.id, stillId: still?.id, imageUrls }
				);
			}
		}
	}

	log('Validated generated home tiles', {
		tiles: tiles.length,
		stills: tiles.reduce((count, tile) => count + tile.stills.length, 0)
	});
}

function createImageUrl(baseUrl, fileKey, variant) {
	return `${baseUrl}/storage/v1/object/public/${BUCKET}/${variant}/${fileKey}.webp`;
}

function mapStill(still, baseUrl) {
	return {
		id: still.id,
		createdAt: still.created_at,
		workId: still.work_id,
		alt: still.alt,
		fileKey: still.file_key,
		sortOrder: still.sort_order,
		imageUrls: {
			w480: createImageUrl(baseUrl, still.file_key, 'w480'),
			w960: createImageUrl(baseUrl, still.file_key, 'w960'),
			w1600: createImageUrl(baseUrl, still.file_key, 'w1600')
		}
	};
}

function mapWork(work, baseUrl) {
	return {
		id: work.id,
		title: work.name,
		description: work.description,
		descriptionLong: work.description_long,
		aspectRatio: work.aspect_ratio,
		year: work.year,
		videoLink: work.video_link,
		stills: (work.works_stills ?? []).map((still) => mapStill(still, baseUrl))
	};
}

async function writeTiles(tiles) {
	validateTiles(tiles);
	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, `${JSON.stringify(tiles, null, 2)}\n`, 'utf8');
	log(`Generated ${tiles.length} works data entries`, {
		output: path.relative(appRoot, outputPath)
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
			'[generate-works-data] Missing Supabase env vars. Reusing existing generated works data if present.'
		);

		try {
			const existingTiles = await readExistingTiles();
			validateTiles(existingTiles);
			log('Using existing generated works data because env is incomplete', {
				output: path.relative(appRoot, outputPath)
			});
			return;
		} catch {
			log('No valid generated works data found; writing empty fallback dataset');
			await writeTiles([]);
			return;
		}
	}

	const publicBaseUrl = (PUBLIC_SUPABASE_URL ?? SUPABASE_URL).replace(/\/$/, '');

	if (!publicBaseUrl) {
		fail('Could not determine PUBLIC_SUPABASE_URL for generated image URLs.');
	}

	log('Fetching home tiles from Supabase', {
		supabaseUrl: SUPABASE_URL,
		publicBaseUrl
	});

	const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
		auth: {
			persistSession: false,
			autoRefreshToken: false
		}
	});

	const { data, error } = await supabaseClient
		.from('works')
		.select(displayedWorksSelection)
		.not('displayed', 'is', null)
		.order('displayed', { ascending: true })
		.order('sort_order', { foreignTable: 'works_stills', ascending: true });

	if (error) {
		throw error;
	}

	log('Fetched works from Supabase', {
		works: data?.length ?? 0,
		stills: (data ?? []).reduce((count, work) => count + (work.works_stills?.length ?? 0), 0)
	});

	await writeTiles((data ?? []).map((work) => mapWork(work, publicBaseUrl)));
}

main().catch((error) => {
	console.error('Failed to generate works data JSON:', error);
	process.exitCode = 1;
});
