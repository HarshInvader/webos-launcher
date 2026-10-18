import {useEffect, useState} from 'preact/hooks';
import {CheckMark, Glyph, type GlyphName} from './Glyph';
import {edgeColors, type EdgeColors} from '../lib/edgeColor';

/** Everything a tile needs to draw itself; rows and grids build these from app/input data. */
export interface TileModel {
	key: string;
	label: string;
	/** full-bleed artwork (app icons) */
	imageUrl?: string;
	/** LG's grey line-art input icons, drawn smaller and lightened */
	glyphImageUrl?: string;
	/** built-in vector icon */
	glyph?: GlyphName;
	/** monogram background when there is no artwork */
	color?: string;
}

interface Props {
	model: TileModel;
	focused: boolean;
	/** picked up in re-order mode */
	lifted?: boolean;
	/** shown with a tick badge (settings picker) */
	checked?: boolean;
	/** greyed out (settings picker: not on the home screen) */
	dimmed?: boolean;
	/** Apple TV shape (home screen): wide, label only under the focused tile */
	wide?: boolean;
	onHover?: () => void;
	onActivate?: () => void;
}

export function Tile ({model, focused, lifted, checked, dimmed, wide, onHover, onActivate}: Props) {
	const edges = useEdgeColors(wide ? model.imageUrl : undefined);
	const boxStyle = edges
		? {background: `linear-gradient(to right, ${edges.left} 0%, ${edges.left} 30%, ${edges.right} 70%, ${edges.right} 100%)`}
		: model.color && !model.imageUrl ? {background: model.color} : undefined;
	const classes = ['tile', wide && 'tile--wide', focused && 'tile--focused', lifted && 'tile--lifted', dimmed && 'tile--dimmed'].filter(Boolean).join(' ');
	return (
		<div class={classes} onMouseEnter={onHover} onClick={onActivate}>
			{wide && <div class="tile__shadow" />}
			<div class="tile__box" style={boxStyle}>
				{model.imageUrl
					? <img class="tile__image" src={model.imageUrl} alt="" />
					: model.glyphImageUrl
						? <img class="tile__image tile__image--glyph" src={model.glyphImageUrl} alt="" />
						: model.glyph
							? <Glyph name={model.glyph} />
							: <div class="tile__monogram">{wide ? model.label : model.label.charAt(0).toUpperCase()}</div>}
				{wide && <div class="tile__sheen" />}
				{checked && <div class="tile__badge"><CheckMark /></div>}
			</div>
			<div class="tile__label">{model.label}</div>
		</div>
	);
}

/** Edge colours for a square icon shown in a wide tile (sampled once per image). */
function useEdgeColors (url?: string): EdgeColors | null {
	const [edges, setEdges] = useState<EdgeColors | null>(null);
	useEffect(() => {
		setEdges(null);
		if (!url) return;
		let live = true;
		edgeColors(url).then((e) => { if (live) setEdges(e); });
		return () => { live = false; };
	}, [url]);
	return edges;
}
