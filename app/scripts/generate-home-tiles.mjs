import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const envPath = path.join(appRoot, '.env');
const outputPath = path.join(appRoot, 'src', 'lib', 'content', 'generated', 'home-tiles.json');

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

		for (const [key, value] of Object.entries(parsed)) {
			if (!(key in process.env)) {
				process.env[key] = value;
			}
		}
	} catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
			return;
		}

		throw error;
	}
}

function mapStill(still) {
	return {
		id: still.id,
		createdAt: still.created_at,
		workId: still.work_id,
		alt: still.alt,
		fileKey: still.file_key,
		sortOrder: still.sort_order
	};
}

function mapWork(work) {
	return {
		id: work.id,
		title: work.name,
		description: work.description,
		aspectRatio: work.aspect_ratio,
		year: work.year,
		videoLink: work.video_link,
		stills: (work.works_stills ?? []).map(mapStill)
	};
}

async function writeTiles(tiles) {
	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, `${JSON.stringify(tiles, null, 2)}\n`, 'utf8');
	console.log(`Generated ${tiles.length} home tiles at ${path.relative(appRoot, outputPath)}`);
}

async function main() {
	await loadLocalEnv();

	const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;

	if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
		console.warn('Missing Supabase env vars. Keeping existing generated home tiles if present.');

		try {
			await fs.access(outputPath);
			return;
		} catch {
			await writeTiles([]);
			return;
		}
	}

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

	await writeTiles((data ?? []).map(mapWork));
}

main().catch((error) => {
	console.error('Failed to generate home tiles JSON:', error);
	process.exitCode = 1;
});