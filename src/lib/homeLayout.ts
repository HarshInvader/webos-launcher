import type {AppEntry} from './apps';

export const HOME_DOCK_SIZE = 4;

export function splitHomeApps (apps: AppEntry[]): {dock: AppEntry[]; remaining: AppEntry[]} {
	return {
		dock: apps.slice(0, HOME_DOCK_SIZE),
		remaining: apps.slice(HOME_DOCK_SIZE)
	};
}

export function nextFocusableLine (focusable: boolean[], from: number, direction: 1 | -1): number {
	for (let line = from + direction; line >= 0 && line < focusable.length; line += direction) {
		if (focusable[line]) return line;
	}
	return -1;
}

export function nearestFocusableLine (focusable: boolean[], at: number, direction: 1 | -1): number {
	if (focusable[at]) return at;
	const ahead = nextFocusableLine(focusable, at, direction);
	if (ahead !== -1) return ahead;
	return Math.max(0, nextFocusableLine(focusable, at, direction === 1 ? -1 : 1));
}
