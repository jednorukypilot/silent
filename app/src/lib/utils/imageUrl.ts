import { env } from '$env/dynamic/public';

const BUCKET = 'stills';

export type ImageVariant = 'w480' | 'w960' | 'w1600';

export function imageUrl(fileKey: string, variant: ImageVariant) {
	const baseUrl = env.PUBLIC_SUPABASE_URL?.replace(/\/$/, '');

	if (!baseUrl) {
		return '';
	}

	return `${baseUrl}/storage/v1/object/public/${BUCKET}/${variant}/${fileKey}.webp`;
}
