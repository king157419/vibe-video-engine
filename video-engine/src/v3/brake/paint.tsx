import React from 'react';
import type {V2} from './cam';
import {ptsAttr} from './cam';
import {C, SANS} from './theme';

// 哑光标线漆：实心、硬边，下方 1–2 px 厚度阴影。不用发光、光晕、模糊。

export const PaintPoly: React.FC<{pts: V2[]; fill: string; sh?: number; opacity?: number}> = ({pts, fill, sh = 2, opacity = 1}) => {
	if (pts.length < 3 || opacity <= 0.001) return null;
	const p = ptsAttr(pts);
	return (
		<g opacity={opacity}>
			{sh > 0 ? <polygon points={p} fill={C.shadow} transform={`translate(0 ${sh})`} /> : null}
			<polygon points={p} fill={fill} />
		</g>
	);
};

export const PaintLine: React.FC<{a: V2; b: V2; w: number; color: string; dash?: string; sh?: number; opacity?: number; cap?: 'butt' | 'round' | 'square'}> = ({
	a,
	b,
	w,
	color,
	dash,
	sh = 2,
	opacity = 1,
	cap = 'butt',
}) => {
	if (opacity <= 0.001) return null;
	return (
		<g opacity={opacity}>
			{sh > 0 ? <line x1={a[0]} y1={a[1] + sh} x2={b[0]} y2={b[1] + sh} stroke={C.shadow} strokeWidth={w} strokeDasharray={dash} strokeLinecap={cap} /> : null}
			<line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeWidth={w} strokeDasharray={dash} strokeLinecap={cap} />
		</g>
	);
};

export const PaintPath: React.FC<{d: string; w: number; color: string; dash?: string; sh?: number; opacity?: number; fill?: string; cap?: 'butt' | 'round'}> = ({
	d,
	w,
	color,
	dash,
	sh = 2,
	opacity = 1,
	fill = 'none',
	cap = 'round',
}) => {
	if (opacity <= 0.001) return null;
	return (
		<g opacity={opacity}>
			{sh > 0 ? <path d={d} transform={`translate(0 ${sh})`} stroke={C.shadow} strokeWidth={w} strokeDasharray={dash} fill={fill === 'none' ? 'none' : C.shadow} strokeLinecap={cap} strokeLinejoin="round" /> : null}
			<path d={d} stroke={color} strokeWidth={w} strokeDasharray={dash} fill={fill} strokeLinecap={cap} strokeLinejoin="round" />
		</g>
	);
};

export const PaintDot: React.FC<{x: number; y: number; r: number; color: string; opacity?: number; sh?: number}> = ({x, y, r, color, opacity = 1, sh = 2}) => {
	if (opacity <= 0.001) return null;
	return (
		<g opacity={opacity}>
			{sh > 0 ? <circle cx={x} cy={y + sh} r={r} fill={C.shadow} /> : null}
			<circle cx={x} cy={y} r={r} fill={color} />
		</g>
	);
};

type TextProps = {
	x: number;
	y: number;
	size: number;
	color?: string;
	weight?: number;
	anchor?: 'start' | 'middle' | 'end';
	opacity?: number;
	stretch?: number; // 纵向拉长（路面喷字 = 2）
	sh?: number;
	tnum?: boolean;
	scale?: number;
	letterSpacing?: number;
	children: React.ReactNode;
};

/** 漆字：y 是基线 */
export const PaintText: React.FC<TextProps> = ({
	x,
	y,
	size,
	color = C.white,
	weight = 500,
	anchor = 'start',
	opacity = 1,
	stretch = 1,
	sh = 2,
	tnum = false,
	scale = 1,
	letterSpacing = 0,
	children,
}) => {
	if (opacity <= 0.001) return null;
	const style: React.CSSProperties = {
		fontFamily: SANS,
		fontWeight: weight,
		fontSize: size,
		letterSpacing,
		fontFeatureSettings: tnum ? '"tnum" 1' : undefined,
	};
	const tf = `translate(${x} ${y}) scale(${scale} ${scale * stretch})`;
	return (
		<g opacity={opacity} transform={tf}>
			{sh > 0 ? (
				<text x={0} y={sh / (scale * stretch)} textAnchor={anchor} style={style} fill={C.shadow}>
					{children}
				</text>
			) : null}
			<text x={0} y={0} textAnchor={anchor} style={style} fill={color}>
				{children}
			</text>
		</g>
	);
};

/** 估算一行字的宽度（中文按字号，其余按 0.56 字号） */
export const textW = (s: string, size: number) => [...s].reduce((w, ch) => w + (/[　-鿿＀-￯]/.test(ch) ? size : /\s/.test(ch) ? size * 0.3 : size * 0.56), 0);

/** 压在沥青色哑光底板上的字（底板挡住下面的细线和残留标注） */
export const PlateText: React.FC<TextProps & {pad?: number; plate?: number; plateFill?: string}> = ({pad = 10, plate = 0.92, plateFill = C.asphalt, ...p}) => {
	if ((p.opacity ?? 1) <= 0.001) return null;
	const str = React.Children.toArray(p.children).join('');
	const w = textW(str, p.size) * (p.scale ?? 1);
	const anchor = p.anchor ?? 'start';
	const x0 = anchor === 'start' ? p.x : anchor === 'middle' ? p.x - w / 2 : p.x - w;
	const sc = p.scale ?? 1;
	return (
		<g opacity={p.opacity ?? 1}>
			<rect x={x0 - pad} y={p.y - p.size * 0.92 * sc} width={w + 2 * pad} height={p.size * 1.18 * sc} fill={plateFill} opacity={plate} />
			<PaintText {...p} opacity={1} />
		</g>
	);
};

/** 黄色菱形警示牌（段落牌、小卡角标）：黄底黑字。
 *  第二轮审片：段落牌原来一行写“④ 换路面”，字只有 28 px（低于 36 px 下限）→ 给 text2 时分两行：上面序号、下面名称（36 px） */
export const Diamond: React.FC<{cx: number; cy: number; r: number; text: string; size?: number; opacity?: number; text2?: string; size2?: number}> = ({
	cx,
	cy,
	r,
	text,
	size = 40,
	opacity = 1,
	text2,
	size2 = 36,
}) => {
	if (opacity <= 0.001) return null;
	const pts: V2[] = [
		[cx, cy - r],
		[cx + r, cy],
		[cx, cy + r],
		[cx - r, cy],
	];
	const st = (s: number): React.CSSProperties => ({fontFamily: SANS, fontWeight: 800, fontSize: s});
	return (
		<g opacity={opacity}>
			<polygon points={ptsAttr(pts)} fill={C.shadow} transform="translate(0 3)" />
			<polygon points={ptsAttr(pts)} fill={C.yellow} />
			<polygon points={ptsAttr(pts.map((p) => [cx + (p[0] - cx) * 0.86, cy + (p[1] - cy) * 0.86] as V2))} fill="none" stroke={C.ink} strokeWidth={4} />
			{text2 ? (
				<>
					<text x={cx} y={cy - 8} textAnchor="middle" style={st(size)} fill={C.ink}>
						{text}
					</text>
					<text x={cx} y={cy + size2 * 0.86} textAnchor="middle" style={st(size2)} fill={C.ink}>
						{text2}
					</text>
				</>
			) : (
				<text x={cx} y={cy + size * 0.36} textAnchor="middle" style={st(size)} fill={C.ink}>
					{text}
				</text>
			)}
		</g>
	);
};

/** 哑光漆面小牌（押注卡、小卡底） */
export const Panel: React.FC<{x: number; y: number; w: number; h: number; fill?: string; stroke?: string; sw?: number; opacity?: number; children?: React.ReactNode}> = ({
	x,
	y,
	w,
	h,
	fill = C.panel,
	stroke,
	sw = 4,
	opacity = 1,
	children,
}) => {
	if (opacity <= 0.001) return null;
	return (
		<g opacity={opacity}>
			<rect x={x} y={y + 4} width={w} height={h} fill={C.shadow} />
			<rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={stroke ? sw : 0} />
			{children}
		</g>
	);
};

/** 尺寸线：两端短竖线 + 中间文字 */
export const DimLine: React.FC<{x1: number; x2: number; y: number; color: string; label?: string; size?: number; opacity?: number; above?: boolean; w?: number}> = ({
	x1,
	x2,
	y,
	color,
	label,
	size = 40,
	opacity = 1,
	above = true,
	w = 4,
}) => {
	if (opacity <= 0.001) return null;
	return (
		<g opacity={opacity}>
			<PaintLine a={[x1, y]} b={[x2, y]} w={w} color={color} />
			<PaintLine a={[x1, y - 14]} b={[x1, y + 14]} w={w} color={color} />
			<PaintLine a={[x2, y - 14]} b={[x2, y + 14]} w={w} color={color} />
			{label ? (
				<PaintText x={(x1 + x2) / 2} y={above ? y - 18 : y + size + 10} size={size} anchor="middle" color={color} weight={600}>
					{label}
				</PaintText>
			) : null}
		</g>
	);
};

/** 括号（开口朝上或朝下） */
export const Bracket: React.FC<{x1: number; x2: number; y: number; color: string; dir?: 1 | -1; depth?: number; w?: number; opacity?: number; reveal?: number}> = ({
	x1,
	x2,
	y,
	color,
	dir = 1,
	depth = 16,
	w = 4,
	opacity = 1,
	reveal = 1,
}) => {
	if (opacity <= 0.001 || reveal <= 0) return null;
	const xm = (x1 + x2) / 2;
	const half = ((x2 - x1) / 2) * reveal;
	const d = `M ${xm - half} ${y - dir * depth} L ${xm - half} ${y} L ${xm + half} ${y} L ${xm + half} ${y - dir * depth} M ${xm} ${y} L ${xm} ${y + dir * 10}`;
	return <PaintPath d={d} w={w} color={color} opacity={opacity} cap="butt" />;
};
