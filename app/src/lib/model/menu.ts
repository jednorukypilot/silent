import { resolve } from '$app/paths';
import type { MenuTile } from './types';

export const MENU_TILES: MenuTile[] = [
	{
		title: 'Works',
		href: resolve('/')
	},
	{
		title: 'Contact',
		href: resolve('/contact')
	}
];
