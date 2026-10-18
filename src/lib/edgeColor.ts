// Colours along the left and right edges of an icon, so a square icon can sit in a wide
// tile with its background continuing to the tile's edges.

export interface EdgeColors {
	left: string;
	right: string;
}

const cache: Record<string, Promise<EdgeColors | null>> = {};

/** Average colour of the outermost columns of `url`; null when the edges are transparent
 *  or the image can't be read. */
export function edgeColors (url: string): Promise<EdgeColors | null> {
	if (!cache[url]) cache[url] = new Promise((resolve) => {
		const img = new Image();
		img.onload = () => {
			try {
				const canvas = document.createElement('canvas');
				canvas.width = img.naturalWidth;
				canvas.height = img.naturalHeight;
				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(img, 0, 0);
				const left = columnAverage(ctx, Math.floor(img.naturalWidth * 0.03), img.naturalHeight);
				const right = columnAverage(ctx, Math.ceil(img.naturalWidth * 0.97) - 1, img.naturalHeight);
				resolve(left && right ? {left, right} : null);
			} catch (e) {
				resolve(null);
			}
		};
		img.onerror = () => resolve(null);
		img.src = url;
	});
	return cache[url];
}

/** Middle 60% of one pixel column (skips rounded corners). */
function columnAverage (ctx: CanvasRenderingContext2D, x: number, height: number): string | null {
	const top = Math.floor(height * 0.2);
	const data = ctx.getImageData(x, top, 1, Math.max(1, Math.floor(height * 0.6))).data;
	let r = 0, g = 0, b = 0, n = 0;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] < 200) continue;
		r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
	}
	if (n < (data.length / 4) * 0.5) return null;
	return `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
}
