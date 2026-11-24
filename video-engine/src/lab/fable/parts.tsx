import {noise2D} from '@remotion/noise';
import {evolvePath} from '@remotion/paths';
import {getStroke} from 'perfect-freehand';
import React from 'react';
import {clamp01, easeInOut, lerp, progress} from './anim';
import type {Geo, Pt} from './rough';
import {drawGeo, R, tipAt} from './rough';
import {AMBER, INK, LW, SERIF} from './theme';
import type {Written as WrittenData} from './write';

// ---------- 墨线：画到进度 p；画完后在几版抖动之间切换（呼吸） ----------
export const Ink: React.FC<{
	geo: Geo | Geo[];
	p: number;
	vi?: number;
	lag?: number;
	color?: string;
	width?: number;
	opacity?: number;
	dash?: string;
}> = ({geo, p, vi = 0, lag = 0.1, color = INK, width = LW.main, opacity = 1, dash}) => {
	if (p <= 0 || opacity <= 0) return null;
	const g = Array.isArray(geo) ? (p >= 1 ? geo[vi % geo.length] : geo[0]) : geo;
	const {ds} = drawGeo(g, p, lag);
	return (
		<g opacity={opacity}>
			{ds.map((d, i) => (
				<path key={i} d={d} fill="none" stroke={color} strokeWidth={i === 0 ? width : width * 0.75} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
			))}
		</g>
	);
};

// ---------- 排线填充：像马克笔从左往右涂过去 ----------
export const Hatch: React.FC<{d: string; p: number; box: [number, number, number, number]; id: string; color?: string; opacity?: number; width?: number; angle?: number}> = ({
	d,
	p,
	box,
	id,
	color = AMBER,
	opacity = 0.55,
	width = 3.2,
	angle = -12,
}) => {
	if (p <= 0 || opacity <= 0) return null;
	const [x, y, w, h] = box;
	const cx = x + w / 2;
	const cy = y + h / 2;
	const diag = Math.hypot(w, h);
	return (
		<g opacity={opacity}>
			<defs>
				<clipPath id={id}>
					<rect x={cx - diag / 2} y={cy - diag / 2} width={diag * p} height={diag} transform={`rotate(${angle} ${cx} ${cy})`} />
				</clipPath>
			</defs>
			<path d={d} clipPath={`url(#${id})`} stroke={color} strokeWidth={width} strokeLinecap="round" fill="none" />
		</g>
	);
};

// ---------- 手写文字：一字一字写出来（每个字从左往右擦出），字有一点点歪 ----------
const isWide = (g: string) => /[⺀-鿿豈-﫿＀-￯　-〿]/u.test(g);
export const adv = (g: string) => (isWide(g) ? 1 : /[0-9]/.test(g) ? 0.58 : 0.5);
export const textWidth = (text: string, size: number) => Array.from(text).reduce((a, g) => a + adv(g), 0) * size;
const jit = (i: number, k: number) => {
	const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
	return v - Math.floor(v) - 0.5;
};

export type HandTextProps = {
	text: string;
	x: number;
	y: number; // 基线位置
	size: number;
	t0: number;
	dur: number;
	ms: number;
	id: string;
	color?: string;
	weight?: number;
	family?: string;
	anchor?: 'start' | 'middle' | 'end';
	opacity?: number;
	wobble?: number; // 0..1，字的歪斜程度
};

export const HandText: React.FC<HandTextProps> = ({text, x, y, size, t0, dur, ms, id, color = INK, weight = 700, family = SERIF, anchor = 'start', opacity = 1, wobble = 1}) => {
	if (ms < t0 || opacity <= 0) return null;
	const glyphs = Array.from(text);
	const total = glyphs.reduce((a, g) => a + adv(g), 0);
	const width = total * size;
	const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - width / 2 : x - width;
	const per = dur / Math.max(1, total); // 每 1em 用多久
	let cursor = 0;
	return (
		<g opacity={opacity}>
			{glyphs.map((g, i) => {
				const a = adv(g);
				const gx = x0 + cursor * size;
				const start = t0 + cursor * per;
				cursor += a;
				const q = clamp01((ms - start) / Math.max(1, per * a * 1.5));
				if (q <= 0) return null;
				const rot = jit(i, 1) * 3.2 * wobble;
				const dy = jit(i, 2) * size * 0.05 * wobble;
				const cid = `${id}-${i}`;
				return (
					<g key={i}>
						{q < 1 ? (
							<defs>
								<clipPath id={cid}>
									<rect x={gx - size * 0.1} y={y - size * 1.05} width={(a * size + size * 0.2) * q} height={size * 1.35} />
								</clipPath>
							</defs>
						) : null}
						<text
							x={gx + (a * size) / 2}
							y={y + dy}
							textAnchor="middle"
							fontFamily={family}
							fontWeight={weight}
							fontSize={size}
							fill={color}
							transform={`rotate(${rot} ${gx + (a * size) / 2} ${y - size * 0.35})`}
							clipPath={q < 1 ? `url(#${cid})` : undefined}
						>
							{g}
						</text>
					</g>
				);
			})}
		</g>
	);
};

// ---------- 假手写：一行波浪线，表示「有些字」但不说是什么 ----------
export const scribbleGeo = (x: number, y: number, w: number, seed: number, amp = 4): Geo => {
	const pts: Pt[] = [];
	const n = Math.max(3, Math.round(w / 12));
	for (let k = 0; k <= n; k++) {
		const u = k / n;
		pts.push([x + u * w, y + noise2D(seed, k * 0.9, 0) * amp]);
	}
	return R.curve(pts, {seed, roughness: 0.9, bowing: 0.6, strokeWidth: 2});
};

/** 手写文字给笔用的「轨迹」：一条从起点到终点的直线（画不出来，只用来定位笔尖） */
export const textTrack = (x: number, y: number, size: number, text: string, anchor: 'start' | 'middle' | 'end' = 'start'): Geo => {
	const w = textWidth(text, size);
	const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
	return R.line([x0, y - size * 0.15], [x0 + w, y - size * 0.15], {seed: 1, roughness: 0, bowing: 0, disableMultiStroke: true});
};

// ---------- 笔 ----------
export type Stroke = {t0: number; t1: number; geo: Geo; lag?: number};
export type PenState = {pt: Pt; alpha: number; drawing: boolean};

const GLIDE = 520;
const IN = 160;
const OUT = 240;

export const penAt = (ms: number, strokes: Stroke[]): PenState | null => {
	if (!strokes.length) return null;
	let i = -1;
	for (let k = 0; k < strokes.length; k++) {
		if (strokes[k].t0 <= ms) i = k;
		else break;
	}
	if (i < 0) {
		const n = strokes[0];
		if (ms >= n.t0 - IN) return {pt: n.geo.start, alpha: clamp01((ms - (n.t0 - IN)) / IN), drawing: false};
		return null;
	}
	const s = strokes[i];
	if (ms <= s.t1) {
		const p = progress(ms, s.t0, s.t1 - s.t0);
		return {pt: tipAt(s.geo, p, s.lag ?? 0.1), alpha: 1, drawing: true};
	}
	const next = strokes[i + 1];
	if (next && next.t0 - s.t1 <= GLIDE) {
		const u = easeInOut(clamp01((ms - s.t1) / Math.max(1, next.t0 - s.t1)));
		return {pt: [lerp(s.geo.end[0], next.geo.start[0], u), lerp(s.geo.end[1], next.geo.start[1], u) - Math.sin(u * Math.PI) * 24 * Math.min(1, (next.t0 - s.t1) / 450)], alpha: 1, drawing: false};
	}
	const gap = next ? next.t0 - s.t1 : Infinity;
	const outD = Math.min(OUT, Math.max(60, gap * 0.5));
	const inD = Math.min(IN, Math.max(60, gap * 0.5));
	const lift = clamp01((ms - s.t1) / outD);
	if (lift < 1) return {pt: [s.geo.end[0] + lift * 12, s.geo.end[1] - lift * 16], alpha: 1 - lift, drawing: false};
	if (next && ms >= next.t0 - inD) return {pt: next.geo.start, alpha: clamp01((ms - (next.t0 - inD)) / inD), drawing: false};
	return null;
};

export const Pencil: React.FC<{pt: Pt; alpha: number; ms: number; scale?: number}> = ({pt, alpha, ms, scale = 1}) => {
	if (alpha <= 0.01) return null;
	const wob = noise2D('pen', ms / 900, 0) * 3.5;
	return (
		<g transform={`translate(${pt[0]} ${pt[1]}) scale(${scale}) rotate(${-40 + wob})`} opacity={alpha}>
			<g transform="translate(5 7)" opacity={0.09}>
				<path d="M0 0 L20 -7.5 L68 -7.5 L78 -6 L78 6 L68 7.5 L20 7.5 Z" fill="#000" />
			</g>
			<path d="M0 0 L20 -7.5 L20 7.5 Z" fill="#F1E2C6" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
			<path d="M0 0 L7.5 -2.8 L7.5 2.8 Z" fill={INK} />
			<path d="M20 -7.5 L64 -7.5 L64 7.5 L20 7.5 Z" fill={AMBER} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
			<path d="M22 -2.5 L62 -2.5" stroke="rgba(47,42,38,0.35)" strokeWidth={1.4} />
			<path d="M64 -7.5 L71 -7.5 L71 7.5 L64 7.5 Z" fill="#D9D5CC" stroke={INK} strokeWidth={1.8} />
			<path d="M71 -7.5 L77 -7.5 Q80 -7.5 80 -4 L80 4 Q80 7.5 77 7.5 L71 7.5 Z" fill="#EDB8A8" stroke={INK} strokeWidth={1.8} />
		</g>
	);
};

// ---------- 常用形状 ----------
export const roundRectD = (x: number, y: number, w: number, h: number, r: number) =>
	`M${x + r} ${y} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} Q${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} Z`;

/** 聊天气泡：圆角矩形 + 小尾巴（side = 尾巴在哪边） */
export const bubbleD = (x: number, y: number, w: number, h: number, side: 'left' | 'right', r = 14) => {
	const tail =
		side === 'right'
			? `M${x + w - 26} ${y + h - 2} L${x + w + 10} ${y + h + 12} L${x + w - 8} ${y + h - 14}`
			: `M${x + 26} ${y + h - 2} L${x - 10} ${y + h + 12} L${x + 8} ${y + h - 14}`;
	return `${roundRectD(x, y, w, h, r)} ${tail}`;
};

/** 心形（宽 s） */
export const heartD = (cx: number, cy: number, s: number) => {
	const w = s;
	const h = s * 0.92;
	const x = cx - w / 2;
	const y = cy - h / 2;
	return `M${cx} ${y + h} C${x - w * 0.1} ${y + h * 0.55} ${x} ${y + h * 0.1} ${x + w * 0.25} ${y} C${x + w * 0.4} ${y - h * 0.05} ${cx} ${y + h * 0.12} ${cx} ${y + h * 0.28} C${cx} ${y + h * 0.12} ${x + w * 0.6} ${y - h * 0.05} ${x + w * 0.75} ${y} C${x + w} ${y + h * 0.1} ${x + w * 1.1} ${y + h * 0.55} ${cx} ${y + h} Z`;
};

/** 火苗轮廓：底宽 w、高 h，尖在上；几个控制点让它像手画的 */
export const flamePts = (cx: number, base: number, w: number, h: number, lean = 0): Pt[] => {
	const p = (u: number, v: number): Pt => [cx + u * w + v * lean * w, base - v * h];
	return [p(-0.5, 0), p(-0.56, 0.22), p(-0.34, 0.4), p(-0.46, 0.58), p(-0.2, 0.74), p(-0.16, 0.9), p(0.02, 1), p(0.12, 0.84), p(0.3, 0.7), p(0.24, 0.52), p(0.46, 0.36), p(0.42, 0.18), p(0.5, 0)];
};

/** 箭头：一条线 + 两撇箭头 */
export const arrowGeos = (a: Pt, b: Pt, seed: number, head = 26, o: {strokeWidth?: number; roughness?: number} = {}): {line: Geo; head: Geo} => {
	const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
	const l = R.line(a, b, {seed, roughness: o.roughness ?? 1.1, strokeWidth: o.strokeWidth ?? LW.main});
	const h1: Pt = [b[0] - Math.cos(ang - 0.5) * head, b[1] - Math.sin(ang - 0.5) * head];
	const h2: Pt = [b[0] - Math.cos(ang + 0.5) * head, b[1] - Math.sin(ang + 0.5) * head];
	const hd = R.linear([h1, b, h2], {seed: seed + 1, roughness: 0.9, strokeWidth: o.strokeWidth ?? LW.main});
	return {line: l, head: hd};
};

/** 「正」字计数的五笔（box 左上角 x,y、边长 s） */
export const zhengStrokes = (x: number, y: number, s: number, seed: number, sw = LW.main): Geo[] => {
	const o = (k: number) => ({seed: seed + k, roughness: 1.0, bowing: 0.8, strokeWidth: sw});
	return [
		R.line([x + s * 0.1, y + s * 0.1], [x + s * 0.9, y + s * 0.12], o(0)),
		R.line([x + s * 0.5, y + s * 0.14], [x + s * 0.5, y + s * 0.9], o(1)),
		R.line([x + s * 0.52, y + s * 0.5], [x + s * 0.86, y + s * 0.5], o(2)),
		R.line([x + s * 0.2, y + s * 0.46], [x + s * 0.2, y + s * 0.9], o(3)),
		R.line([x + s * 0.08, y + s * 0.9], [x + s * 0.92, y + s * 0.9], o(4)),
	];
};

// ---------- 「写出来」：真实笔顺，一笔一笔露出（中线描边当遮罩） ----------
export const Written: React.FC<{w: WrittenData; ms: number; id: string; color?: string; opacity?: number}> = ({w, ms, id, color = INK, opacity = 1}) => {
	if (ms < w.t0 || opacity <= 0) return null;
	return (
		<g opacity={opacity}>
			{w.strokes.map((s, i) => {
				const q = clamp01((ms - s.t0) / s.dur);
				if (q <= 0) return null;
				if (q >= 1) return <path key={i} transform={s.tf} d={s.d} fill={color} />;
				const ev = evolvePath(q, s.med);
				const mid = `${id}-${i}`;
				return (
					<g key={i} transform={s.tf}>
						<defs>
							<mask id={mid} maskUnits="userSpaceOnUse" x={-200} y={-300} width={1424} height={1424}>
								<path d={s.med} fill="none" stroke="#fff" strokeWidth={230} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
							</mask>
						</defs>
						<path d={s.d} fill={color} mask={`url(#${mid})`} />
					</g>
				);
			})}
		</g>
	);
};

// ---------- 「马克笔」：perfect-freehand 生成有粗细的笔迹，按进度截取点列 ----------
export type MarkerPath = {pts: Pt[]; geo: Geo};

/** 沿点列重采样（间距带一点噪声，让模拟压力有轻重变化） */
const resample = (pts: Pt[], spacing: number, seed: number): Pt[] => {
	const out: Pt[] = [pts[0]];
	let carry = 0;
	for (let i = 1; i < pts.length; i++) {
		const [ax, ay] = pts[i - 1];
		const [bx, by] = pts[i];
		const len = Math.hypot(bx - ax, by - ay);
		let d = carry;
		while (d < len) {
			const u = d / len;
			out.push([ax + (bx - ax) * u, ay + (by - ay) * u]);
			d += spacing * (1 + 0.45 * noise2D('mk' + seed, out.length * 0.37, 0));
		}
		carry = d - len;
	}
	out.push(pts[pts.length - 1]);
	return out;
};

const wob = (seed: number, k: number, amp: number) => noise2D('wb' + seed, k * 0.23, 0) * amp;

/** 手抖的矩形（从左上角起、顺时针，起笔和收笔略错开） */
export const markerRect = (x: number, y: number, w: number, h: number, seed: number, amp = 5): MarkerPath => {
	const corners: Pt[] = [
		[x - 6, y + 4],
		[x + w, y],
		[x + w, y + h],
		[x, y + h],
		[x, y - 8],
	];
	const pts = resample(corners, 9, seed).map((p, k): Pt => [p[0] + wob(seed, k, amp), p[1] + wob(seed + 7, k, amp)]);
	return {pts, geo: R.linear(pts, {seed: 1, roughness: 0, bowing: 0, disableMultiStroke: true})};
};

/** 手抖的椭圆圈（多画 1/8 圈，像随手圈一下） */
export const markerEllipse = (cx: number, cy: number, w: number, h: number, seed: number, amp = 4): MarkerPath => {
	const pts: Pt[] = [];
	const n = 64;
	for (let k = 0; k <= n * 1.12; k++) {
		const a = (k / n) * Math.PI * 2 - 2.4;
		pts.push([cx + (Math.cos(a) * w) / 2 + wob(seed, k, amp), cy + (Math.sin(a) * h) / 2 + wob(seed + 7, k, amp)]);
	}
	return {pts, geo: R.linear(pts, {seed: 1, roughness: 0, bowing: 0, disableMultiStroke: true})};
};

/** 一条手写线（下划线、删除线）：从 a 到 b，中间轻微弓起 */
export const markerLine = (a: Pt, b: Pt, seed: number, amp = 3): MarkerPath => {
	const raw = resample([a, b], 8, seed);
	const pts = raw.map((p, k): Pt => {
		const u = k / Math.max(1, raw.length - 1);
		const bow = Math.sin(u * Math.PI) * amp * 1.6;
		return [p[0] + wob(seed, k, amp * 0.5), p[1] + bow + wob(seed + 7, k, amp)];
	});
	return {pts, geo: R.linear(pts, {seed: 1, roughness: 0, bowing: 0, disableMultiStroke: true})};
};

export const Marker: React.FC<{m: MarkerPath; p: number; color?: string; size?: number; opacity?: number}> = ({m, p, color = AMBER, size = 9, opacity = 0.9}) => {
	if (p <= 0 || opacity <= 0) return null;
	const k = Math.max(2, Math.ceil(m.pts.length * p));
	const poly = getStroke(m.pts.slice(0, k), {size, thinning: 0.6, smoothing: 0.55, streamline: 0.35, simulatePressure: true, last: k >= m.pts.length, start: {taper: 12}, end: {taper: 20}});
	if (!poly.length) return null;
	const d = 'M' + poly.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L') + ' Z';
	return <path d={d} fill={color} opacity={opacity} />;
};
