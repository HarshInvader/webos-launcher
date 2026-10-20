// Design tokens: the single source of truth for colour, spacing, type and motion.
// `applyTokens()` exposes them as CSS custom properties so the stylesheet and the
// components read the same values.

export const COLOR = {
	// tvOS dark appearance: near-black canvas, white text, greys from Apple's system palette
	bg: '#0b0b0d',
	textPrimary: '#FFFFFF',
	textSecondary: 'rgba(235, 235, 245, 0.78)',
	textMuted: 'rgba(235, 235, 245, 0.5)',
	tileBg: '#1c1c1e',
	tileBgFocus: '#2c2c2e',
	tileBorder: 'rgba(255, 255, 255, 0.12)',
	tileBorderFocus: '#FFFFFF',
	badge: '#FFFFFF',
	badgeText: '#000000',
	liftShadow: 'rgba(0, 0, 0, 0.7)',
	focusShadow: 'rgba(0, 0, 0, 0.6)',
	buttonBorder: 'rgba(255, 255, 255, 0.18)',
	buttonActiveBg: '#FFFFFF',
	buttonActiveText: '#000000',
	switchTrack: '#3a3a3c',
	switchTrackOn: '#FFFFFF',
	switchKnob: '#AAAAAA',
	switchKnobOn: '#000000',
	danger: '#ff453a'
} as const;

export const FONT = {
	family: '"Inter Variable", "LG Smart UI", "Helvetica Neue", Arial, sans-serif',
	tileLabel: 18,
	homeTileLabel: 25,
	homeGreeting: 42,
	homeDate: 20,
	homeClock: 34,
	shelfTitle: 76,
	homeMonogram: 44,
	settingsTitle: 40,
	settingsTab: 26,
	settingsButton: 22,
	optionLabel: 26,
	optionDescription: 20,
	toast: 24
} as const;

export const LAYOUT = {
	screenWidth: 1920,
	screenHeight: 1080,
	edgePadding: 140,       // heavy padding around the screen edges
	headerTop: 84,
	tileSize: 144,          // app / source tiles are square
	tileGap: 28,
	tileRadius: 24,
	// home screen (Apple TV layout): 5 wide icons a line, the first line under the top shelf
	homeColumns: 5,
	homeTileWidth: 310,
	homeTileHeight: 186,    // 5:3, the tvOS app icon shape
	homeTileGap: 48,
	homeTileRadius: 14,
	homeLineGap: 84,        // room for the focused tile's label
	homeDockTop: 570,
	homeContentTop: 930,    // lower content peeks in beneath the dock
	homeFocusTop: 150,      // where a lower line sits once the grid has scrolled up
	homeBottomMargin: 140,  // the grid never scrolls its last line above this
	gridColumns: 9          // settings picker grid
} as const;

export const MOTION = {
	focusMs: 160,
	scrollMs: 260,
	shelfMs: 420,
	focusScale: 1.12,
	homeFocusScale: 1.1,
	liftScale: 1.2          // a tile picked up in re-order mode
} as const;

/** Writes every token onto :root as --color-*, --font-*, --layout-*, --motion-*. */
export function applyTokens (root: HTMLElement = document.documentElement): void {
	const groups: Record<string, Record<string, string | number>> = {color: COLOR, font: FONT, layout: LAYOUT, motion: MOTION};
	for (const group in groups) {
		const values = groups[group];
		for (const key in values) {
			const value = values[key];
			const unit = typeof value === 'number' && !/scale|opacity|columns/i.test(key) ? (key.endsWith('Ms') ? 'ms' : 'px') : '';
			root.style.setProperty(`--${group}-${kebab(key)}`, `${value}${unit}`);
		}
	}
}

function kebab (s: string): string {
	return s.replace(/([A-Z])/g, '-$1').toLowerCase();
}
