import { resolve } from '$app/paths';
import type { MenuTile } from './types';

export const MENU_TILES: MenuTile[] = [
	{
		title: 'Home',
		href: resolve('/')
	},
	{
		title: 'Kontakt',
		href: resolve('/contact')
	}
];
