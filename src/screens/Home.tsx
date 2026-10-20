import {memo} from 'preact/compat';
import {useCallback, useEffect, useMemo, useRef, useState} from 'preact/hooks';
import {Tile, type TileModel} from '../components/Tile';
import {useKeys, clamp, type NavKey} from '../hooks/useKeys';
import {LAYOUT} from '../theme/tokens';
import {backdrop} from '../lib/backdrop';
import {formatHomeDate, formatHomeTime, getHomeGreeting} from '../lib/homeClock';
import {nearestFocusableLine, nextFocusableLine} from '../lib/homeLayout';

export interface HomeRow {
	id: string;
	label: string;
	items: TileModel[];
	emptyText?: string;
}

interface Props {
	dockItems: TileModel[];
	rows: HomeRow[];
	active: boolean;
	onActivate: (rowId: string, item: TileModel) => void;
}

type FocusArea = 'dock' | 'content';

/** One line of the grid: up to `homeColumns` tiles from a single section, or a
 *  section's empty message. */
interface Line {
	rowId: string;
	items: TileModel[];
	emptyText?: string;
}

const LINE_STEP = LAYOUT.homeTileHeight + LAYOUT.homeLineGap;

/** Lays the lower sections out as one grid, `homeColumns` wide. */
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

/** Apple TV-style home: focused artwork above a four-app dock and scrollable content. */
export function Home ({dockItems, rows, active, onActivate}: Props) {
	const lines = useMemo(() => toLines(rows), [rows]);
	const [focus, setFocus] = useState({area: 'dock' as FocusArea, line: 0, col: 0});
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const updateTime = () => setNow(new Date());
		const onVisibility = () => { if (!document.hidden) updateTime(); };
		const timer = window.setInterval(updateTime, 60000);
		document.addEventListener('visibilitychange', onVisibility);
		return () => {
			window.clearInterval(timer);
			document.removeEventListener('visibilitychange', onVisibility);
		};
	}, []);

	// Keep focus on a real tile when the lists change underneath it.
	const focusable = lines.map((l) => l.items.length > 0);
	const firstContentLine = nextFocusableLine(focusable, -1, 1);
	const lineIndex = firstContentLine === -1
		? -1
		: nearestFocusableLine(focusable, clamp(focus.line, 0, lines.length - 1), 1);
	const line = lineIndex === -1 ? undefined : lines[lineIndex];
	const onDock = dockItems.length > 0 && focus.area === 'dock';
	const dockCol = dockItems.length > 0 ? clamp(focus.col, 0, dockItems.length - 1) : 0;
	const contentCol = line ? clamp(focus.col, 0, line.items.length - 1) : 0;
	const focused = onDock ? dockItems[dockCol] : line && line.items[contentCol];

	const handleKey = useCallback((key: NavKey): boolean => {
		if (!focused) return key === 'back';
		if (onDock) {
			switch (key) {
				case 'up': return true;
				case 'down':
					if (firstContentLine !== -1) {
						setFocus({area: 'content', line: firstContentLine, col: clamp(dockCol, 0, lines[firstContentLine].items.length - 1)});
					}
					return true;
				case 'left': setFocus({area: 'dock', line: 0, col: clamp(dockCol - 1, 0, dockItems.length - 1)}); return true;
				case 'right': setFocus({area: 'dock', line: 0, col: clamp(dockCol + 1, 0, dockItems.length - 1)}); return true;
				case 'enter': onActivate('apps', focused); return true;
				case 'back': return true;
			}
		}

		if (!line || lineIndex === -1) return key === 'back';
		switch (key) {
			case 'up': {
				if (lineIndex === firstContentLine && dockItems.length > 0) {
					setFocus({area: 'dock', line: 0, col: clamp(contentCol, 0, dockItems.length - 1)});
					return true;
				}
				const previous = nextFocusableLine(focusable, lineIndex, -1);
				if (previous !== -1) setFocus({area: 'content', line: previous, col: clamp(contentCol, 0, lines[previous].items.length - 1)});
				return true;
			}
			case 'down': {
				const next = nextFocusableLine(focusable, lineIndex, 1);
				if (next !== -1) setFocus({area: 'content', line: next, col: clamp(contentCol, 0, lines[next].items.length - 1)});
				return true;
			}
			case 'left': setFocus({area: 'content', line: lineIndex, col: clamp(contentCol - 1, 0, line.items.length - 1)}); return true;
			case 'right': setFocus({area: 'content', line: lineIndex, col: clamp(contentCol + 1, 0, line.items.length - 1)}); return true;
			case 'enter': onActivate(line.rowId, focused); return true;
			case 'back': return true;   // swallow: Back on the home screen does nothing
		}
	}, [focused, onDock, firstContentLine, dockCol, lines, dockItems.length, line, lineIndex, focusable, contentCol, onActivate]);

	useKeys(handleKey, active);

	// Stable callbacks for the tiles, so a focus move re-renders only the two tiles whose
	// focus changed.
	const latest = useRef({onActivate});
	latest.current.onActivate = onActivate;
	const tileApi = useMemo<TileApi>(() => ({
		hover: (area, line, col) => setFocus({area, line, col}),
		activate: (rowId, item) => latest.current.onActivate(rowId, item)
	}), []);

	// Bake the dock backdrops up front so moving along it is instant.
	useEffect(() => {
		dockItems.forEach((item) => { const art = shelfArt(item); if (art) backdrop(art); });
	}, [dockItems]);

	// Lower lines scroll up to sit near the top, but never past the point where the last
	// line reaches the bottom margin.
	const lastLineBottom = LAYOUT.homeContentTop + lines.length * LINE_STEP - LAYOUT.homeLineGap;
	const maxOffset = Math.max(0, lastLineBottom - (LAYOUT.screenHeight - LAYOUT.homeBottomMargin));
	const offset = onDock || lineIndex === -1
		? 0
		: clamp(LAYOUT.homeContentTop + lineIndex * LINE_STEP - LAYOUT.homeFocusTop, 0, maxOffset);
	const shelfItem = focused || dockItems[0];

	return (
		<div class={`screen home${onDock ? '' : ' home--scrolled'}`}>
			<HomeHeader now={now} />
			<TopShelf item={shelfItem} />
			{dockItems.length > 0 && (
				<div class="home__dock">
					{dockItems.map((item, col) => (
						<HomeTile
							key={item.key}
							item={item}
							rowId="apps"
							area="dock"
							line={0}
							col={col}
							focused={onDock && col === dockCol}
							api={tileApi}
						/>
					))}
				</div>
			)}
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
									area="content"
									line={i}
									col={c}
									focused={!onDock && i === lineIndex && c === contentCol}
									api={tileApi}
								/>
							))}
					</div>
				))}
			</div>
		</div>
	);
}

function HomeHeader ({now}: {now: Date}) {
	return (
		<header class="home__header">
			<div class="home__greeting">{getHomeGreeting(now)}</div>
			<div class="home__time">
				<span class="home__date">{formatHomeDate(now)}</span>
				<span class="home__clock">{formatHomeTime(now)}</span>
			</div>
		</header>
	);
}

interface TileApi {
	hover: (area: FocusArea, line: number, col: number) => void;
	activate: (rowId: string, item: TileModel) => void;
}

interface HomeTileProps {
	item: TileModel;
	rowId: string;
	area: FocusArea;
	line: number;
	col: number;
	focused: boolean;
	api: TileApi;
}

const HomeTile = memo(function HomeTile ({item, rowId, area, line, col, focused, api}: HomeTileProps) {
	return <Tile model={item} wide focused={focused} onHover={() => api.hover(area, line, col)} onActivate={() => api.activate(rowId, item)} />;
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
