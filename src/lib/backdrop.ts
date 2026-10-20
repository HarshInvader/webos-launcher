// Top-shelf backdrops, blurred once on a small canvas instead of with a live CSS filter.
// A full-screen `filter: blur()` re-rasterises on every focus change and drops most
// frames on the TV's GPU; a pre-blurred 160×90 image scaled up costs a plain image draw.

const WIDTH = 160;
const HEIGHT = 90;
const cache: Record<string, Promise<string | null>> = {};

/** Data URL of `url` blurred and darkened, or null if it can't be drawn. Cached. */
export function backdrop (url: string): Promise<string | null> {
	if (!cache[url]) cache[url] = new Promise((resolve) => {
		const img = new Image();
		img.onload = () => {
			try {
				const canvas = document.createElement('canvas');
				canvas.width = WIDTH;
				canvas.height = HEIGHT;
				const ctx = canvas.getContext('2d')!;
				ctx.fillStyle = '#0b0b0d';
				ctx.fillRect(0, 0, WIDTH, HEIGHT);
				if ('filter' in ctx) ctx.filter = 'blur(7px) saturate(1.4) brightness(0.72)';
				// cover, slightly oversized so the blur has no soft edge
				const scale = Math.max(WIDTH / img.naturalWidth, HEIGHT / img.naturalHeight) * 1.3;
				const w = img.naturalWidth * scale;
				const h = img.naturalHeight * scale;
				ctx.drawImage(img, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);
				resolve(canvas.toDataURL('image/jpeg', 0.9));
			} catch (e) {
				resolve(null);
			}
		};
		img.onerror = () => resolve(null);
		img.src = url;
	});
	return cache[url];
}
