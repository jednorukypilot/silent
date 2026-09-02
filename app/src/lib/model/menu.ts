import { resolve } from '$app/paths';
import type { MenuTile } from './types';

export const MENU_TILES: MenuTile[] = [
	{
		title: 'Home',
		href: resolve('/')
	},
	{
		title: 'Works',
		href: resolve('/works')
	},
	{
		title: 'Contact',
		href: resolve('/contact')
	}
];
