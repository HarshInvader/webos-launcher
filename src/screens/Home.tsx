import {memo} from 'preact/compat';
import {useCallback, useEffect, useMemo, useRef, useState} from 'preact/hooks';
import {Tile, type TileModel} from '../components/Tile';
import {useKeys, clamp, type NavKey} from '../hooks/useKeys';
import {LAYOUT} from '../theme/tokens';
import {backdrop} from '../lib/backdrop';

export interface HomeRow {
	id: string;
	label: string;
	items: TileModel[];
	emptyText?: string;
}

interface Props {
	rows: HomeRow[];
	active: boolean;
	onActivate: (rowId: string, item: TileModel) => void;
}

/** One line of the grid: up to `homeColumns` tiles from a single section, or a
 *  section's empty message. */
interface Line {
	rowId: string;
	items: TileModel[];
	emptyText?: string;
}

const LINE_STEP = LAYOUT.homeTileHeight + LAYOUT.homeLineGap;

/** Lays the sections out as one grid, `homeColumns` wide, the way tvOS does. */
function toLines (rows: HomeRow[]): Line[] {
	const lines: Line[] = [];
	for (const row of rows) {
		if (row.items.length === 0) {
			if (row.emptyText) lines.push({rowId: row.id, items: [], emptyText: row.emptyText});
			continue;
		}
		for (let i = 0; i < row.items.length; i += LAYOUT.homeColumns) {
			lines.push({rowId: row.id, items: row.items.slice(i, i + LAYOUT.homeColumns)});
		}
	}
	return lines;
}

/** The home screen, modelled on the Apple TV: a top shelf showing the focused app's
 *  artwork, then a grid of wide icons. Focus in the first line keeps the top shelf in
 *  view; moving below it scrolls the grid up over it. */
export function Home ({rows, active, onActivate}: Props) {
	const lines = useMemo(() => toLines(rows), [rows]);
	const [focus, setFocus] = useState({line: 0, col: 0});

	// Keep focus on a real tile when the lists change underneath it.
	const focusable = lines.map((l) => l.items.length > 0);
	const lineIndex = nearestFocusable(focusable, clamp(focus.line, 0, Math.max(0, lines.length - 1)), 1);
	const line = lines[lineIndex];
	const col = line ? clamp(focus.col, 0, Math.max(0, line.items.length - 1)) : 0;
	const focused = line && line.items[col];

	const handleKey = useCallback((key: NavKey): boolean => {
		if (!focused) return key === 'back';
		switch (key) {
			case 'up':
			case 'down': {
				const next = nextFocusable(focusable, lineIndex, key === 'up' ? -1 : 1);
				if (next !== -1) setFocus({line: next, col: clamp(col, 0, lines[next].items.length - 1)});
				return true;
			}
			case 'left': setFocus({line: lineIndex, col: clamp(col - 1, 0, line.items.length - 1)}); return true;
			case 'right': setFocus({line: lineIndex, col: clamp(col + 1, 0, line.items.length - 1)}); return true;
			case 'enter':
				if (focused) onActivate(line.rowId, focused);
				return true;
			case 'back': return true;   // swallow: Back on the home screen does nothing
		}
	}, [lines, lineIndex, col, onActivate]);

	useKeys(handleKey, active);

	// Stable callbacks for the tiles, so a focus move re-renders only the two tiles whose
	// focus changed.
	const latest = useRef({onActivate});
	latest.current.onActivate = onActivate;
	const tileApi = useMemo<TileApi>(() => ({
		hover: (line, col) => setFocus({line, col}),
		activate: (rowId, item) => latest.current.onActivate(rowId, item)
	}), []);

	// Bake the top-shelf backdrops for the first line up front so moving along it is instant.
	useEffect(() => {
		if (lines[0]) lines[0].items.forEach((item) => { const art = shelfArt(item); if (art) backdrop(art); });
	}, [lines]);

	const onShelf = lineIndex === 0;
	// Lower lines scroll up to sit near the top, but never past the point where the last
	// line reaches the bottom margin.
	const lastLineBottom = LAYOUT.homeGridTop + lines.length * LINE_STEP - LAYOUT.homeLineGap;
	const maxOffset = Math.max(0, lastLineBottom - (LAYOUT.screenHeight - LAYOUT.homeBottomMargin));
	const offset = onShelf ? 0 : clamp(LAYOUT.homeGridTop + lineIndex * LINE_STEP - LAYOUT.homeFocusTop, 0, maxOffset);
	const shelfItem = lines[0] && lines[0].items[onShelf ? col : 0];

	return (
		<div class={`screen home${onShelf ? '' : ' home--scrolled'}`}>
			<TopShelf item={shelfItem} />
			<div class="home__grid" style={{transform: `translateY(${-offset}px)`}}>
				{lines.map((l, i) => (
					<div key={`${l.rowId}-${i}`} class="home__line" style={{top: `${i * LINE_STEP}px`}}>
						{l.items.length === 0
							? <div class="home__empty">{l.emptyText}</div>
							: l.items.map((item, c) => (
								<HomeTile
									key={item.key}
									item={item}
									rowId={l.rowId}
									line={i}
									col={c}
									focused={i === lineIndex && c === col}
									api={tileApi}
								/>
							))}
					</div>
				))}
			</div>
		</div>
	);
}

interface TileApi {
	hover: (line: number, col: number) => void;
	activate: (rowId: string, item: TileModel) => void;
}

interface HomeTileProps {
	item: TileModel;
	rowId: string;
	line: number;
	col: number;
	focused: boolean;
	api: TileApi;
}

const HomeTile = memo(function HomeTile ({item, rowId, line, col, focused, api}: HomeTileProps) {
	return <Tile model={item} wide focused={focused} onHover={() => api.hover(line, col)} onActivate={() => api.activate(rowId, item)} />;
});

function shelfArt (item?: TileModel): string | undefined {
	return item && (item.imageUrl || item.glyphImageUrl);
}

interface ShelfLayer {
	id: number;
	src?: string;
	color?: string;
}

/** Backdrop for the top of the screen: the app's artwork, blown up and blurred, fading
 *  into the background. Apple TV apps supply real top-shelf art; we have only icons.
 *  The new backdrop fades in over the previous one (opacity only, on the compositor). */
function TopShelf ({item}: {item?: TileModel}) {
	const [layers, setLayers] = useState<ShelfLayer[]>([]);
	const nextId = useRef(0);
	const art = shelfArt(item);
	const color = item && item.color;

	useEffect(() => {
		let live = true;
		const show = (layer: Omit<ShelfLayer, 'id'>) => {
			if (!live) return;
			const next = {...layer, id: ++nextId.current};
			setLayers((prev) => prev.slice(-1).concat(next));
		};
		if (art) backdrop(art).then((src) => show(src ? {src} : {color}));
		else show({color});
		return () => { live = false; };
	}, [art, color]);

	return (
		<div class="shelf">
			<div class="shelf__wallpaper" />
			{layers.map((layer) => layer.src
				? <img key={layer.id} class="shelf__layer" src={layer.src} alt="" />
				: <div key={layer.id} class="shelf__layer shelf__layer--wash" style={layer.color ? {background: layer.color} : undefined} />)}
			<div class="shelf__fade" />
			{item && <div class="shelf__title">{item.label}</div>}
		</div>
	);
}

function nextFocusable (focusable: boolean[], from: number, dir: 1 | -1): number {
	for (let i = from + dir; i >= 0 && i < focusable.length; i += dir) if (focusable[i]) return i;
	return -1;
}

function nearestFocusable (focusable: boolean[], at: number, dir: 1 | -1): number {
	if (focusable[at]) return at;
	const ahead = nextFocusable(focusable, at, dir);
	return ahead !== -1 ? ahead : Math.max(0, nextFocusable(focusable, at, dir === 1 ? -1 : 1));
}
