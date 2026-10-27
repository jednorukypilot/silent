/** The site's own name: browser tab, bookmarks, share sheets. */
export const SITE_NAME = 'Kryštof Tichý';

export const SITE_ROLE = 'cinematographer';

/** Site sections lead with the name, so bookmarks of them read as his. */
export function sectionTitle(section: string): string {
	return `${SITE_NAME} — ${section}`;
}

/** A work leads with its own title, which is what that page is about. */
export function workTitle(title: string): string {
	return `${title} — ${SITE_NAME}`;
}
