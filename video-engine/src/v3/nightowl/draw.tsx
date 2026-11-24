// 手绘小部件：线条用 roughjs（固定种子，只算一次），逐帧只决定画到哪里、放在哪里，不重画随机线。
import React from 'react';
import type {Geo, Pt} from '../../whiteboard/rough';
import {drawGeo, R} from '../../whiteboard/rough';
import {clamp01} from './data';
import {COL, FONT_HAND} from './theme';

// ---------------------------------------------------------------- 缓存
const CACHE = new Map<string, Geo>();
export const memo = (key: string, make: () => Geo): Geo => {
	let g = CACHE.get(key);
	if (!g) {
		g = make();
		CACHE.set(key, g);
	}
	return g;
};

/** 一组 roughjs 线条：p<1 时只画前 p（落笔动画） */
export const Rough: React.FC<{
	geo: Geo;
	p?: number;
	color?: string;
	w?: number;
	opacity?: number;
	dash?: string;
	fill?: string;
}> = ({geo, p = 1, color = COL.ink, w = 3, opacity = 1, dash, fill}) => {
	if (p <= 0) return null;
	const {ds} = drawGeo(geo, clamp01(p), 0.12);
	return (
		<g opacity={opacity}>
			{ds.map((d, i) => (
				<path
					key={i}
					d={d}
					fill={fill ?? 'none'}
					stroke={color}
					strokeWidth={w}
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeDasharray={dash}
					vectorEffect="non-scaling-stroke"
				/>
			))}
		</g>
	);
};

// ---------------------------------------------------------------- 文字
const charEm = (ch: string) => {
	if (/[一-鿿　-〿＀-￯]/.test(ch)) return 1.0;
	if (ch === ' ') return 0.32;
	if (ch === '·') return 0.5;
	if (/[0-9]/.test(ch)) return 0.56;
	if (/[A-Z]/.test(ch)) return 0.66;
	if (/[a-z]/.test(ch)) return 0.52;
	if (ch === ':' || ch === '.') return 0.3;
	return 0.6;
};
export const textW = (s: string, size: number) => Array.from(s).reduce((a, ch) => a + charEm(ch), 0) * size;

/** 霞鹜文楷文字；wipe<1 时从左往右“写出来”（裁切揭开） */
export const Hand: React.FC<{
	id?: string;
	x: number;
	y: number;
	size: number;
	children: string;
	color?: string;
	anchor?: 'start' | 'middle' | 'end';
	opacity?: number;
	wipe?: number;
	halo?: string;
}> = ({id, x, y, size, children, color = COL.ink, anchor = 'start', opacity = 1, wipe = 1, halo}) => {
	if (opacity <= 0 || wipe <= 0) return null;
	const w = textW(children, size);
	const left = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
	const body = (
		<text
			x={x}
			y={y}
			fontFamily={FONT_HAND}
			fontSize={size}
			fontWeight={500}
			fill={color}
			textAnchor={anchor}
			opacity={opacity}
			stroke={halo}
			strokeWidth={halo ? size * 0.16 : undefined}
			strokeLinejoin="round"
			paintOrder={halo ? 'stroke' : undefined}
		>
			{children}
		</text>
	);
	if (wipe >= 1 || !id) return body;
	return (
		<g>
			<defs>
				<clipPath id={id}>
					<rect x={left - size * 0.2} y={y - size * 1.2} width={(w + size * 0.4) * clamp01(wipe)} height={size * 1.6} />
				</clipPath>
			</defs>
			<g clipPath={`url(#${id})`}>{body}</g>
		</g>
	);
};

// ---------------------------------------------------------------- 图钉 + 钉子
export const PinHead: React.FC<{x: number; y: number; r?: number; color?: string; opacity?: number}> = ({x, y, r = 9, color = COL.ink, opacity = 1}) => (
	<g opacity={opacity}>
		<line x1={x} y1={y} x2={x + r * 0.5} y2={y + r * 1.9} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
		<circle cx={x} cy={y} r={r} fill={color} />
		<circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="#ffffff" opacity={0.55} />
	</g>
);

// ---------------------------------------------------------------- 沙漏
/** 沙漏：中心 (cx,cy)，高 h；level = 下半边沙子的高度（0–1，就是图表里沙漏曲线的值）。
 *  top = 上半边还剩多少沙（默认 1 − level，即沙子从上往下漏）；“睡着 = 倒空”那格传 0（审片 P2-11：上下都空，不像被翻过来） */
export const Hourglass: React.FC<{cx: number; cy: number; h: number; level: number; top?: number; opacity?: number; w?: number; seed?: number}> = ({
	cx,
	cy,
	h,
	level,
	top,
	opacity = 1,
	w = 3,
	seed = 3,
}) => {
	const hw = h * 0.31;
	const neck = h * 0.05;
	const hh = h / 2;
	const key = `hg${Math.round(h)}_${seed}`;
	const geo = memo(key, () =>
		R.path(
			`M${-hw} ${-hh + 6} C${-hw} ${-hh * 0.35} ${-neck * 1.5} ${-h * 0.08} ${-neck} 0 C${-neck * 1.5} ${h * 0.08} ${-hw} ${hh * 0.35} ${-hw} ${hh - 6} ` +
				`M${hw} ${-hh + 6} C${hw} ${-hh * 0.35} ${neck * 1.5} ${-h * 0.08} ${neck} 0 C${neck * 1.5} ${h * 0.08} ${hw} ${hh * 0.35} ${hw} ${hh - 6} ` +
				`M${-hw - h * 0.08} ${-hh} L${hw + h * 0.08} ${-hh} M${-hw - h * 0.08} ${hh} L${hw + h * 0.08} ${hh}`,
			{seed, roughness: Math.min(1.1, 0.4 + h / 200), bowing: 0.6},
		),
	);
	// 玻璃内壁宽度：从瓶颈（y=0）到上下两端
	const half = (y: number) => {
		const u = clamp01(Math.abs(y) / (hh - 6));
		return neck + (hw - neck) * Math.pow(u, 0.62) * 0.94;
	};
	const lv = clamp01(level);
	const bottomTop = hh - 6 - lv * (hh - 8);
	const ptsB: string[] = [];
	const N = 12;
	for (let k = 0; k <= N; k++) {
		const y = bottomTop + ((hh - 6 - bottomTop) * k) / N;
		ptsB.push(`${-half(y)},${y}`);
	}
	for (let k = N; k >= 0; k--) {
		const y = bottomTop + ((hh - 6 - bottomTop) * k) / N;
		ptsB.push(`${half(y)},${y}`);
	}
	const topH = clamp01(top ?? 1 - lv) * (hh - 8);
	const ptsT: string[] = [];
	for (let k = 0; k <= N; k++) {
		const y = -2 - (topH * k) / N;
		ptsT.push(`${-half(y)},${y}`);
	}
	for (let k = N; k >= 0; k--) {
		const y = -2 - (topH * k) / N;
		ptsT.push(`${half(y)},${y}`);
	}
	return (
		<g transform={`translate(${cx} ${cy})`} opacity={opacity}>
			{lv > 0.01 ? <polygon points={ptsB.join(' ')} fill={COL.sleep} opacity={0.85} /> : null}
			{topH > 1.5 ? <polygon points={ptsT.join(' ')} fill={COL.sleep} opacity={0.85} /> : null}
			{lv < 0.995 && topH > 1.5 ? <line x1={0} y1={0} x2={0} y2={bottomTop} stroke={COL.sleep} strokeWidth={Math.max(1.2, h * 0.012)} /> : null}
			<Rough geo={geo} w={w} />
		</g>
	);
};

// ---------------------------------------------------------------- 小人
type Joints = {
	head: Pt;
	r: number;
	neck: Pt;
	sh: Pt;
	hip: Pt;
	eL: Pt;
	hL: Pt;
	eR: Pt;
	hR: Pt;
	kL: Pt;
	fL: Pt;
	kR: Pt;
	fR: Pt;
};
// 单位坐标：站立身高 100，脚底 y=0，向上为负；桌子在右边
export const POSES: Record<string, Joints> = {
	stand: {head: [0, -88], r: 11, neck: [0, -77], sh: [0, -72], hip: [0, -42], eL: [-10, -58], hL: [-14, -44], eR: [10, -58], hR: [14, -44], kL: [-5, -21], fL: [-9, 0], kR: [5, -21], fR: [9, 0]},
	walk: {head: [2, -88], r: 11, neck: [1, -77], sh: [1, -72], hip: [0, -42], eL: [-9, -58], hL: [-15, -47], eR: [10, -59], hR: [18, -52], kL: [-7, -22], fL: [-16, -1], kR: [9, -22], fR: [15, 0]},
	sit: {head: [5, -86], r: 11, neck: [3, -75], sh: [3, -71], hip: [0, -40], eL: [13, -59], hL: [27, -55], eR: [15, -57], hR: [30, -53], kL: [22, -41], fL: [23, 0], kR: [19, -39], fR: [17, 0]},
	sitNod: {head: [13, -79], r: 11, neck: [8, -70], sh: [6, -67], hip: [0, -40], eL: [14, -56], hL: [28, -54], eR: [17, -55], hR: [31, -53], kL: [22, -41], fL: [23, 0], kR: [19, -39], fR: [17, 0]},
	sitProp: {head: [11, -84], r: 11, neck: [6, -74], sh: [5, -70], hip: [0, -40], eL: [22, -54], hL: [16, -73], eR: [16, -57], hR: [30, -53], kL: [22, -41], fL: [23, 0], kR: [19, -39], fR: [17, 0]},
	slump: {head: [33, -63], r: 11, neck: [21, -62], sh: [16, -61], hip: [0, -40], eL: [26, -54], hL: [44, -53], eR: [24, -53], hR: [40, -54], kL: [22, -41], fL: [23, 0], kR: [19, -39], fR: [17, 0]},
	bedUp: {head: [-2, -67], r: 11, neck: [-2, -56], sh: [-2, -52], hip: [0, -22], eL: [-12, -64], hL: [-16, -80], eR: [10, -64], hR: [14, -80], kL: [26, -24], fL: [52, -22], kR: [26, -22], fR: [52, -21]},
	lie: {head: [-42, -24], r: 11, neck: [-31, -21], sh: [-27, -21], hip: [5, -19], eL: [-12, -17], hL: [2, -15], eR: [-12, -18], hR: [2, -16], kL: [26, -19], fL: [48, -18], kR: [26, -18], fR: [48, -17]},
};

const sc = (p: Pt, s: number): Pt => [p[0] * s, p[1] * s];

/** 小人：脚底参考点 (x, y)，scale = 每单位多少像素。headRot（度）绕脖子转头，armRot 绕肩膀转写字的手 */
export const Person: React.FC<{
	pose: keyof typeof POSES;
	x: number;
	y: number;
	s: number;
	seed?: number;
	headRot?: number;
	armRot?: number;
	level?: number | null;
	hgOpacity?: number;
	opacity?: number;
	w?: number;
	hgK?: number; // 头顶小沙漏放大倍数（审片第二轮 P2-11：当前那个小人的沙漏放大，沙面高低在手机上看得出）
}> = ({pose, x, y, s, seed = 1, headRot = 0, armRot = 0, level = null, hgOpacity = 1, opacity = 1, w = 3, hgK = 1}) => {
	const j = POSES[pose];
	const k = `p_${pose}_${s}_${seed}`;
	const rough = {seed, roughness: 0.7, bowing: 0.5};
	const head = memo(`${k}_h`, () => R.circle(j.head[0] * s, j.head[1] * s, j.r * s, {...rough, roughness: 0.6}));
	const body = memo(`${k}_b`, () =>
		R.path(
			`M${sc(j.neck, s).join(' ')} L${sc(j.hip, s).join(' ')} ` +
				`M${sc(j.sh, s).join(' ')} L${sc(j.eL, s).join(' ')} L${sc(j.hL, s).join(' ')} ` +
				`M${sc(j.hip, s).join(' ')} L${sc(j.kL, s).join(' ')} L${sc(j.fL, s).join(' ')} ` +
				`M${sc(j.hip, s).join(' ')} L${sc(j.kR, s).join(' ')} L${sc(j.fR, s).join(' ')}`,
			rough,
		),
	);
	const arm = memo(`${k}_a`, () => R.path(`M${sc(j.sh, s).join(' ')} L${sc(j.eR, s).join(' ')} L${sc(j.hR, s).join(' ')}`, rough));
	const [nx, ny] = sc(j.neck, s);
	const [sx, sy] = sc(j.sh, s);
	const [hx, hy] = sc(j.head, s);
	return (
		<g transform={`translate(${x} ${y})`} opacity={opacity}>
			<Rough geo={body} w={w} />
			<g transform={`rotate(${armRot} ${sx} ${sy})`}>
				<Rough geo={arm} w={w} />
			</g>
			<g transform={`rotate(${headRot} ${nx} ${ny})`}>
				<circle cx={hx} cy={hy} r={j.r * s * 0.95} fill={COL.paper} />
				<Rough geo={head} w={w} />
				{level !== null ? (
					// 固定尺寸画（roughjs 线条不随尺寸变），再整体缩放；底边始终离头顶 10 个单位
					<g transform={`translate(${hx} ${hy - j.r * s - (10 + 14 * hgK) * s}) scale(${hgK})`}>
						<Hourglass cx={0} cy={0} h={28 * s} level={level} opacity={hgOpacity} w={Math.max(2, w - 0.5)} seed={seed + 7} />
					</g>
				) : null}
			</g>
		</g>
	);
};
/** 头顶小沙漏中心（屏幕坐标），给“沙漏放大”用 */
export const hourglassAt = (pose: keyof typeof POSES, x: number, y: number, s: number): {cx: number; cy: number; h: number} => {
	const j = POSES[pose];
	return {cx: x + j.head[0] * s, cy: y + j.head[1] * s - j.r * s - 24 * s, h: 28 * s};
};

// ---------------------------------------------------------------- 道具（同一套单位坐标）
const P = (pts: number[][], s: number) => pts.map(([a, b]) => `${a * s} ${b * s}`);
const poly = (pts: number[][], s: number) => `M${P(pts, s).join(' L')}`;

export const propGeo = (kind: string, s: number, seed = 11): Geo[] => {
	const o = {seed, roughness: 0.8, bowing: 0.6};
	const k = `prop_${kind}_${s}_${seed}`;
	switch (kind) {
		case 'chair':
			return [memo(k, () => R.path(`${poly([[-15, -40], [8, -40]], s)} ${poly([[-14, -40], [-18, -80]], s)} ${poly([[-12, -40], [-12, 0]], s)} ${poly([[6, -40], [6, 0]], s)}`, o))];
		case 'desk':
			return [memo(k, () => R.path(`${poly([[16, -52], [100, -52]], s)} ${poly([[18, -48], [98, -48]], s)} ${poly([[24, -48], [24, 0]], s)} ${poly([[92, -48], [92, 0]], s)}`, o))];
		case 'lamp':
			return [
				memo(k, () =>
					R.path(
						`M${78 * s} ${-52 * s} L${92 * s} ${-52 * s} ${poly([[85, -52], [80, -78], [70, -90]], s)} ${poly([[58, -95], [76, -86], [70, -80], [58, -95]], s)}`,
						o,
					),
				),
			];
		case 'paper':
			return [memo(k, () => R.path(`${poly([[24, -52.5], [44, -52.5], [47, -55], [27, -55], [24, -52.5]], s)}`, {...o, roughness: 0.5}))];
		case 'books':
			return [memo(k, () => R.path(`${poly([[40, -52], [40, -58], [62, -58], [62, -52]], s)} ${poly([[42, -58], [42, -63], [60, -63], [60, -58]], s)}`, o))];
		case 'monitor':
			return [memo(k, () => R.path(`${poly([[50, -82], [84, -82], [84, -60], [50, -60], [50, -82]], s)} ${poly([[67, -60], [67, -52]], s)} ${poly([[58, -52], [76, -52]], s)}`, o))];
		case 'cup':
			return [memo(k, () => R.path(`${poly([[36, -61], [37, -52], [45, -52], [46, -61]], s)} M${46 * s} ${-59 * s} C${51 * s} ${-59 * s} ${51 * s} ${-54 * s} ${45.5 * s} ${-54 * s}`, o))];
		case 'handCup':
			return [memo(k, () => R.path(`${poly([[17, -55], [18, -47], [25, -47], [26, -55]], s)} M${18 * s} ${-58 * s} C${20 * s} ${-62 * s} ${22 * s} ${-60 * s} ${23 * s} ${-64 * s}`, o))];
		case 'bed':
			return [
				memo(k, () =>
					R.path(
						`${poly([[-58, 0], [-58, -44]], s)} ${poly([[-58, -14], [66, -14]], s)} ${poly([[66, 0], [66, -26]], s)} ${poly([[-54, -14], [-54, 0]], s)} ${poly([[62, -14], [62, 0]], s)}`,
						o,
					),
				),
				memo(`${k}_pil`, () => R.ellipse(-44 * s, -21 * s, 24 * s, 11 * s, {...o, seed: seed + 1})),
				memo(`${k}_bl`, () => R.path(poly([[-14, -16], [64, -16], [64, -27], [30, -30], [-12, -32], [-14, -16]], s), {...o, seed: seed + 2})),
			];
		case 'busstop':
			return [memo(k, () => R.path(`${poly([[-34, 0], [-34, -108]], s)} ${poly([[-54, -130], [-14, -130], [-14, -104], [-54, -104], [-54, -130]], s)}`, o))];
		default:
			return [];
	}
};
export const Prop: React.FC<{kind: string; x: number; y: number; s: number; seed?: number; w?: number; opacity?: number}> = ({kind, x, y, s, seed = 11, w = 3, opacity = 1}) => (
	<g transform={`translate(${x} ${y})`} opacity={opacity}>
		{kind === 'bed' ? (
			<path d={poly([[-14, -16], [64, -16], [64, -27], [30, -30], [-12, -32]], s) + ' Z'} fill={COL.cardEdge} opacity={0.9} />
		) : null}
		{propGeo(kind, s, seed).map((g, i) => (
			<Rough key={i} geo={g} w={w} />
		))}
	</g>
);
/** 台灯的光锥（只在夜里亮） */
export const LampGlow: React.FC<{x: number; y: number; s: number; on: number}> = ({x, y, s, on}) =>
	on <= 0 ? null : (
		<path
			transform={`translate(${x} ${y})`}
			d={poly([[60, -90], [74, -83], [104, -52], [34, -52]], s) + ' Z'}
			fill={COL.lamp}
			opacity={0.55 * on}
		/>
	);

// ---------------------------------------------------------------- 钟面
export const ClockFace: React.FC<{cx: number; cy: number; r: number; hour: number; seed?: number; w?: number; opacity?: number; secDeg?: number}> = ({
	cx,
	cy,
	r,
	hour,
	seed = 21,
	w = 3,
	opacity = 1,
	secDeg,
}) => {
	const ring = memo(`clock${Math.round(r)}_${seed}`, () => R.circle(0, 0, r, {seed, roughness: 0.7}));
	const hh = ((hour % 12) + 12) % 12;
	const ha = (hh / 12) * 360;
	const ma = ((hour % 1) + 1) % 1 * 360;
	const hand = (deg: number, len: number, sw: number, color: string = COL.ink) => {
		const a = (deg * Math.PI) / 180;
		return <line x1={0} y1={0} x2={Math.sin(a) * len} y2={-Math.cos(a) * len} stroke={color} strokeWidth={sw} strokeLinecap="round" />;
	};
	return (
		<g transform={`translate(${cx} ${cy})`} opacity={opacity}>
			<circle r={r * 0.97} fill={COL.card} />
			{Array.from({length: 12}, (_, i) => {
				const a = (i / 12) * Math.PI * 2;
				const r0 = i % 3 === 0 ? r * 0.76 : r * 0.84;
				return <line key={i} x1={Math.sin(a) * r0} y1={-Math.cos(a) * r0} x2={Math.sin(a) * r * 0.9} y2={-Math.cos(a) * r * 0.9} stroke={COL.ink} strokeWidth={i % 3 === 0 ? 3 : 1.6} strokeLinecap="round" />;
			})}
			<Rough geo={ring} w={w} />
			{hand(ha, r * 0.5, Math.max(3, r * 0.07))}
			{hand(ma, r * 0.74, Math.max(2.2, r * 0.045))}
			{secDeg !== undefined ? hand(secDeg, r * 0.8, 1.4, COL.sleepText) : null}
			<circle r={Math.max(3, r * 0.06)} fill={COL.ink} />
		</g>
	);
};

// ---------------------------------------------------------------- 箭头、括号、圈
export const arrowGeo = (key: string, a: Pt, b: Pt, bend = 0.15, head = 18, seed = 31): Geo[] => {
	const mx = (a[0] + b[0]) / 2;
	const my = (a[1] + b[1]) / 2;
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const m: Pt = [mx - dy * bend, my + dx * bend];
	const tx = b[0] - m[0];
	const ty = b[1] - m[1];
	const tl = Math.hypot(tx, ty) || 1;
	const ux = tx / tl;
	const uy = ty / tl;
	const p1: Pt = [b[0] - ux * head - uy * head * 0.55, b[1] - uy * head + ux * head * 0.55];
	const p2: Pt = [b[0] - ux * head + uy * head * 0.55, b[1] - uy * head - ux * head * 0.55];
	return [
		memo(`${key}_s`, () => R.curve([a, m, b], {seed, roughness: 0.6})),
		memo(`${key}_h`, () => R.linear([p1, b, p2], {seed: seed + 1, roughness: 0.4})),
	];
};
export const Arrow: React.FC<{k: string; a: Pt; b: Pt; p?: number; color?: string; w?: number; bend?: number; head?: number; opacity?: number}> = ({
	k,
	a,
	b,
	p = 1,
	color = COL.ink,
	w = 3,
	bend = 0.15,
	head = 18,
	opacity = 1,
}) => {
	const [s, h] = arrowGeo(`${k}_${a.map(Math.round).join('_')}_${b.map(Math.round).join('_')}`, a, b, bend, head);
	return (
		<g opacity={opacity}>
			<Rough geo={s} p={clamp01(p / 0.75)} color={color} w={w} />
			<Rough geo={h} p={clamp01((p - 0.75) / 0.25)} color={color} w={w} />
		</g>
	);
};
export const Ring: React.FC<{k: string; cx: number; cy: number; rx: number; ry: number; p?: number; color?: string; w?: number; opacity?: number}> = ({
	k,
	cx,
	cy,
	rx,
	ry,
	p = 1,
	color = COL.ink,
	w = 3.5,
	opacity = 1,
}) => {
	const g = memo(`ring_${k}_${Math.round(rx)}_${Math.round(ry)}`, () => R.ellipse(0, 0, rx * 2, ry * 2, {seed: 41, roughness: 1.1, bowing: 1.2}));
	return (
		<g transform={`translate(${cx} ${cy})`} opacity={opacity}>
			<Rough geo={g} p={p} color={color} w={w} />
		</g>
	);
};
/** 手绘方括号（开口朝上/下），两端在 x0、x1，横线在 y */
export const Bracket: React.FC<{k: string; x0: number; x1: number; y: number; up?: boolean; p?: number; color?: string; w?: number}> = ({
	k,
	x0,
	x1,
	y,
	up = false,
	p = 1,
	color = COL.ink,
	w = 2.6,
}) => {
	const d = up ? -12 : 12;
	const g = memo(`br_${k}_${Math.round(x0)}_${Math.round(x1)}_${Math.round(y)}_${up}`, () =>
		R.linear(
			[
				[x0, y - d],
				[x0, y],
				[x1, y],
				[x1, y - d],
			],
			{seed: 51, roughness: 0.5},
		),
	);
	return <Rough geo={g} p={p} color={color} w={w} />;
};

// ---------------------------------------------------------------- 便签
export const Note: React.FC<{k: string; w: number; h: number; tilt?: number; tape?: boolean; fill?: string; opacity?: number; children?: React.ReactNode}> = ({
	k,
	w,
	h,
	tilt = 0,
	tape = true,
	fill = COL.card,
	opacity = 1,
	children,
}) => {
	const g = memo(`note_${k}_${Math.round(w)}_${Math.round(h)}`, () => R.rect(-w / 2, -h / 2, w, h, {seed: 61 + k.length, roughness: 0.9, bowing: 0.5}));
	return (
		<g transform={`rotate(${tilt})`} opacity={opacity}>
			<rect x={-w / 2 + 6} y={-h / 2 + 8} width={w} height={h} fill="#000" opacity={0.06} />
			<rect x={-w / 2} y={-h / 2} width={w} height={h} fill={fill} />
			<Rough geo={g} w={2.4} color={COL.ink} />
			{tape ? <rect x={-w * 0.14} y={-h / 2 - 12} width={w * 0.28} height={24} fill="#e9dcc0" opacity={0.85} transform={`rotate(-3 0 ${-h / 2})`} /> : null}
			{children}
		</g>
	);
};

// ---------------------------------------------------------------- 其他小图标
export const Plane: React.FC<{x: number; y: number; s?: number; opacity?: number}> = ({x, y, s = 1, opacity = 1}) => {
	const g = memo(`plane_${s}`, () =>
		R.path(
			`M${-30 * s} 0 L${28 * s} ${-3 * s} C${34 * s} ${-3 * s} ${34 * s} ${3 * s} ${28 * s} ${3 * s} L${-30 * s} 0 ` +
				`M${2 * s} ${-2 * s} L${-10 * s} ${-20 * s} M${2 * s} ${2 * s} L${-10 * s} ${20 * s} M${22 * s} ${-2 * s} L${26 * s} ${-10 * s} M${22 * s} ${2 * s} L${26 * s} ${10 * s}`,
			{seed: 71, roughness: 0.5},
		),
	);
	// 机头朝左（向西飞）
	return (
		<g transform={`translate(${x} ${y}) scale(-1 1)`} opacity={opacity}>
			<Rough geo={g} w={3} />
		</g>
	);
};
export const BedIcon: React.FC<{x: number; y: number; s?: number; opacity?: number}> = ({x, y, s = 1, opacity = 1}) => <Prop kind="bed" x={x} y={y} s={s} seed={81} opacity={opacity} w={2.6} />;

export const Wheel: React.FC<{cx: number; cy: number; r: number; cross: number; opacity?: number}> = ({cx, cy, r, cross, opacity = 1}) => {
	const ring = memo(`wheel_${r}`, () => R.circle(0, 0, r, {seed: 91, roughness: 0.8}));
	const hub = memo(`wheelhub_${r}`, () => R.circle(0, 0, r * 0.32, {seed: 92, roughness: 0.6}));
	const spokes = memo(`wheelsp_${r}`, () =>
		R.path(`M${-r * 0.32} ${r * 0.05} L${-r * 0.95} ${r * 0.15} M${r * 0.32} ${r * 0.05} L${r * 0.95} ${r * 0.15} M0 ${r * 0.32} L0 ${r * 0.96}`, {seed: 93, roughness: 0.6}),
	);
	const x1 = memo(`wheelx1_${r}`, () => R.line([-r * 1.1, -r * 1.1], [r * 1.1, r * 1.1], {seed: 94, roughness: 1.0}));
	const x2 = memo(`wheelx2_${r}`, () => R.line([r * 1.1, -r * 1.1], [-r * 1.1, r * 1.1], {seed: 95, roughness: 1.0}));
	return (
		<g transform={`translate(${cx} ${cy})`} opacity={opacity}>
			<Rough geo={ring} w={4} />
			<Rough geo={hub} w={3} />
			<Rough geo={spokes} w={3} />
			<Rough geo={x1} p={clamp01(cross * 2)} color={COL.drowsy} w={7} />
			<Rough geo={x2} p={clamp01(cross * 2 - 1)} color={COL.drowsy} w={7} />
		</g>
	);
};

/** 一小段潮水波形图标（公式卡、图例用） */
export const WaveIcon: React.FC<{x: number; y: number; w: number; h: number; sw?: number}> = ({x, y, w, h, sw = 3.5}) => {
	const pts: string[] = [];
	for (let k = 0; k <= 24; k++) {
		const u = k / 24;
		pts.push(`${x + u * w},${y - Math.sin(u * Math.PI * 2 + 0.6) * h * 0.5}`);
	}
	return <polyline points={pts.join(' ')} fill="none" stroke={COL.tide} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />;
};
