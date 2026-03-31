import { PUBLIC_SUPABASE_URL } from '$env/static/public';

const BUCKET = 'stills';

export type ImageVariant = 'w480' | 'w960' | 'w1600';

export function imageUrl(fileKey: string, variant: ImageVariant) {
	return `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${variant}/${fileKey}.webp`;
}
