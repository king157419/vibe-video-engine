import React from 'react';
import type {Board, Box, Item, StrokeOpts, TextOpts} from './board';
import {rotMat} from './board';
import {clamp01, easeOut} from './camera';
import type {Pt} from './rough';
import {R, rr} from './rough';
import {C, FONT_HAND, textW} from './theme';
import {freehand} from './verbs';

// 场景词汇表：可复用的手绘组件。每个组件 = 往分镜板上加一组带时间的条目。
// 约定：坐标都是世界坐标；t0 是开始落笔的时刻（ms）；o 里通用 color / w / out / g / pen。
// 大多数组件返回它加进去的条目（Item[]），方便之后 b.eraseAll(items, t)。

const pol = (cx: number, cy: number, r: number, deg: number): Pt => {
	const a = (deg * Math.PI) / 180;
	return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
};

/** 确定性伪随机（给涂鸦抖动用） */
const hash = (n: number) => {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

/** 手写体文本（给 node 里的动态文字用） */
export const HandText: React.FC<{x: number; y: number; size: number; color?: string; anchor?: 'start' | 'middle' | 'end'; children: React.ReactNode; opacity?: number; weight?: number}> = ({
	x,
	y,
	size,
	color = C.ink,
	anchor = 'start',
	children,
	opacity = 1,
	weight = 500,
}) => (
	<text x={x} y={y} fontFamily={FONT_HAND} fontSize={size} fontWeight={weight} fill={color} textAnchor={anchor} opacity={opacity}>
		{children}
	</text>
);

// ================= 标注类 =================

/** 箭头：a → e，bend 是弯曲量（正数向左手边鼓） */
export const arrow = (b: Board, a: Pt, e: Pt, t0: number, dur = 420, o: StrokeOpts & {bend?: number; head?: number} = {}): Item[] =>
	b.collect(() => {
		const bend = o.bend ?? 0.18;
		const mx = (a[0] + e[0]) / 2;
		const my = (a[1] + e[1]) / 2;
		const dx = e[0] - a[0];
		const dy = e[1] - a[1];
		const m: Pt = [mx - dy * bend, my + dx * bend];
		b.stroke((seed) => R.curve([a, m, e], {seed, roughness: 0.9}), t0, dur * 0.75, o);
		const tx = e[0] - m[0];
		const ty = e[1] - m[1];
		const tl = Math.hypot(tx, ty) || 1;
		const ux = tx / tl;
		const uy = ty / tl;
		const hl = o.head ?? 26;
		const p1: Pt = [e[0] - ux * hl - uy * hl * 0.6, e[1] - uy * hl + ux * hl * 0.6];
		const p2: Pt = [e[0] - ux * hl + uy * hl * 0.6, e[1] - uy * hl - ux * hl * 0.6];
		b.stroke((seed) => R.linear([p1, e, p2], {seed, roughness: 0.7}), t0 + dur * 0.75, dur * 0.25, {...o, lag: 0});
	});

/** 圈出来：手绘椭圆（像真的用笔圈） */
export const ring = (b: Board, cx: number, cy: number, w: number, h: number, t0: number, dur = 420, o: StrokeOpts = {}) =>
	b.stroke((seed) => R.ellipse(cx, cy, w, h, {seed, roughness: 1.6, bowing: 2}), t0, dur, {w: 3.6, ...o});

/** 下划线 */
export const under = (b: Board, x0: number, x1: number, y: number, t0: number, dur = 300, o: StrokeOpts = {}) =>
	b.stroke((seed) => R.line([x0, y], [x1, y + 3], {seed, roughness: 1.1, bowing: 1.5}), t0, dur, {w: 5, ...o});

/** 波浪下划线（「那句话」） */
export const wavy = (b: Board, x0: number, x1: number, y: number, t0: number, dur = 500, o: StrokeOpts & {amp?: number; wave?: number} = {}) => {
	const amp = o.amp ?? 9;
	const wl = o.wave ?? 46;
	const n = Math.max(2, Math.round((x1 - x0) / (wl / 2)));
	const pts: Pt[] = [];
	for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y + (i % 2 ? amp : -amp)]);
	return b.stroke((seed) => R.curve(pts, {seed, roughness: 0.7}), t0, dur, {w: 4, ...o});
};

/** 划掉：一道有粗细的笔迹（x0→x1，略斜） */
export const strike = (b: Board, x0: number, x1: number, y: number, t0: number, dur = 280, o: {color?: string; size?: number; out?: number; g?: string; tilt?: number} = {}) =>
	freehand(b, [[x0, y + (o.tilt ?? 6)], [(x0 + x1) / 2, y], [x1, y - (o.tilt ?? 6)]], t0, dur, {size: o.size ?? 12, color: o.color ?? C.ink, out: o.out, g: o.g});

/** 涂黑：在 box 里来回涂（涂黑的名字） */
export const scribble = (b: Board, box: Box, t0: number, dur = 700, o: {color?: string; size?: number; out?: number; g?: string; rows?: number} = {}) => {
	const [x0, y0, x1, y1] = box;
	const rows = o.rows ?? Math.max(3, Math.round((y1 - y0) / 14));
	const pts: Pt[] = [];
	for (let i = 0; i <= rows; i++) {
		const y = y0 + ((y1 - y0) * i) / rows + (hash(i + x0) - 0.5) * 6;
		const l = x0 + hash(i * 3 + y0) * 10;
		const r = x1 - hash(i * 7 + x1) * 10;
		pts.push(i % 2 ? [r, y] : [l, y]);
	}
	return freehand(b, pts, t0, dur, {size: o.size ?? (y1 - y0) / rows + 8, thinning: 0.2, color: o.color ?? C.ink, out: o.out, g: o.g, opacity: 0.96});
};

/** 对勾 ✓ */
export const check = (b: Board, cx: number, cy: number, s: number, t0: number, dur = 260, o: StrokeOpts = {}) =>
	b.stroke((seed) => R.linear([[cx - s * 0.42, cy], [cx - s * 0.1, cy + s * 0.32], [cx + s * 0.46, cy - s * 0.42]], {seed, roughness: 0.6}), t0, dur, {w: 5, lag: 0, ...o});

/** 叉 ✗ */
export const cross = (b: Board, cx: number, cy: number, s: number, t0: number, dur = 360, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		b.stroke((seed) => R.line([cx - s / 2, cy - s / 2], [cx + s / 2, cy + s / 2], {seed, roughness: 0.9}), t0, dur / 2, {w: 5, ...o});
		b.stroke((seed) => R.line([cx + s / 2, cy - s / 2], [cx - s / 2, cy + s / 2], {seed, roughness: 0.9}), t0 + dur / 2, dur / 2, {w: 5, ...o});
	});

/** 画出来的问号 */
export const qmark = (b: Board, cx: number, cy: number, s: number, t0: number, dur = 420, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		const d = `M${cx - s * 0.28} ${cy - s * 0.22} C${cx - s * 0.28} ${cy - s * 0.52} ${cx + s * 0.3} ${cy - s * 0.56} ${cx + s * 0.3} ${cy - s * 0.22} C${cx + s * 0.3} ${cy - s * 0.02} ${cx} ${cy - s * 0.02} ${cx} ${cy + s * 0.18}`;
		b.stroke((seed) => R.path(d, {seed, roughness: 0.6}), t0, dur * 0.8, {w: 5, lag: 0.05, ...o});
		b.stroke((seed) => R.circle(cx, cy + s * 0.38, s * 0.05, {seed, roughness: 0.4}), t0 + dur * 0.85, dur * 0.15, {w: 6, lag: 0, ...o});
	});

/** 带圈的数字/字母 ①②③（圈是画的，字是写的） */
export const badge = (b: Board, cx: number, cy: number, r: number, n: string, t0: number, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		b.stroke((seed) => R.circle(cx, cy, r, {seed, roughness: 1}), t0, 280, {w: 3.2, ...o});
		b.text(n, cx, cy + r * 0.42, r * 1.15, t0 + 200, {anchor: 'middle', dur: 160, color: o.color ?? C.ink, out: o.out, g: o.g});
	});

/** 一排空圆点（证据 ①②③）；返回 light(i, t) 把第 i 个涂实 */
export const dots = (b: Board, x: number, y: number, n: number, gap: number, r: number, t0: number, o: StrokeOpts = {}) => {
	for (let i = 0; i < n; i++) b.stroke((seed) => R.circle(x + i * gap, y, r, {seed, roughness: 0.8}), t0 + i * 140, 220, {w: 3.4, ...o});
	return {
		light: (i: number, t: number, color: string = C.ink) =>
			b.node(
				t,
				(ms) => {
					const u = easeOut(clamp01((ms - t) / 320));
					return <circle cx={x + i * gap} cy={y} r={r * 0.72 * u} fill={color} />;
				},
				{bb: [x + i * gap - r, y - r, x + i * gap + r, y + r], out: o.out, g: o.g},
			),
	};
};

/** 数字计数：times[i] 时变成 i+1（或 labels[i]） */
export const counter = (b: Board, x: number, y: number, size: number, times: number[], o: {color?: string; labels?: string[]; anchor?: 'start' | 'middle' | 'end'; out?: number; g?: string; sfx?: boolean} = {}) => {
	if (o.sfx !== false) times.forEach((t) => b.sound(t, 'tick', 0.32));
	return b.node(
		times[0],
		(ms) => {
			const n = times.filter((t) => t <= ms).length;
			if (!n) return null;
			const last = times[n - 1];
			const pop = 1 + 0.25 * (1 - easeOut(clamp01((ms - last) / 260)));
			const label = o.labels ? o.labels[n - 1] : String(n);
			return (
				<g transform={`translate(${x} ${y}) scale(${pop}) translate(${-x} ${-y})`}>
					<HandText x={x} y={y} size={size} color={o.color} anchor={o.anchor ?? 'middle'}>
						{label}
					</HandText>
				</g>
			);
		},
		{bb: [x - size * 2, y - size, x + size * 2, y + size * 0.3], out: o.out, g: o.g, textSize: size, textLen: 2},
	);
};

// ================= 容器类 =================

/** 不透明的纸卡片/便签：盖在已有画面上（「一页备忘录叠上来」）。内容由调用者再往上画 */
export const sheet = (b: Board, box: Box, t0: number, o: StrokeOpts & {fill?: string; shadow?: boolean; lines?: number; tilt?: number; r?: number} = {}): Item[] =>
	b.collect(() => {
		const [x0, y0, x1, y1] = box;
		const tilt = o.tilt ?? 0;
		const cx = (x0 + x1) / 2;
		const cy = (y0 + y1) / 2;
		b.node(
			t0,
			(ms) => {
				const u = easeOut(clamp01((ms - t0) / 260));
				const s = 0.94 + 0.06 * u;
				return (
					<g transform={`rotate(${tilt} ${cx} ${cy}) translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`} opacity={u}>
						{o.shadow !== false ? <rect x={x0 + 10} y={y0 + 14} width={x1 - x0} height={y1 - y0} rx={o.r ?? 14} fill="#000" opacity={0.07} /> : null}
						<rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={o.r ?? 14} fill={o.fill ?? C.card} />
					</g>
				);
			},
			{bb: [x0, y0, x1 + 12, y1 + 16], out: o.out, outDur: o.outDur, g: o.g},
		);
		b.stroke((seed) => R.path(rr(x0, y0, x1 - x0, y1 - y0, o.r ?? 14), {seed, roughness: 0.7}), t0 + 60, 420, {w: 3, ...o});
		const n = o.lines ?? 0;
		for (let i = 1; i <= n; i++) {
			const y = y0 + ((y1 - y0) * i) / (n + 1);
			b.stroke((seed) => R.line([x0 + 30, y], [x1 - 30, y], {seed, roughness: 0.3}), t0 + 400 + i * 50, 160, {color: C.shade, w: 2, boil: false, pen: false, out: o.out, g: o.g});
		}
	});

/** 聊天气泡（side 'r' 自己发的，'l' 对方）；dashed = 本该出现却没出现的那条 */
export const bubble = (
	b: Board,
	x: number,
	y: number,
	w: number,
	h: number,
	t0: number,
	o: StrokeOpts & {side?: 'l' | 'r'; text?: string; size?: number; dashed?: boolean; textColor?: string; fillColor?: string} = {},
): Item[] =>
	b.collect(() => {
		const side = o.side ?? 'r';
		const tailX = side === 'r' ? x + w : x;
		const tail =
			side === 'r'
				? `M${tailX - 4} ${y + h - 18} L${tailX + 16} ${y + h + 4} L${tailX - 22} ${y + h - 2}`
				: `M${tailX + 4} ${y + h - 18} L${tailX - 16} ${y + h + 4} L${tailX + 22} ${y + h - 2}`;
		if (o.fillColor) b.node(t0 + 200, () => <rect x={x} y={y} width={w} height={h} rx={18} fill={o.fillColor} opacity={0.5} />, {bb: [x, y, x + w, y + h], out: o.out, g: o.g});
		b.stroke((seed) => R.path(rr(x, y, w, h, 18), {seed, roughness: 0.8}), t0, 320, {w: 3, dash: o.dashed ? '9 11' : undefined, ...o});
		if (!o.dashed) b.stroke((seed) => R.path(tail, {seed, roughness: 0.6}), t0 + 300, 120, {w: 3, lag: 0, ...o});
		const size = o.size ?? 44;
		if (o.text) b.text(o.text, x + w / 2, y + h / 2 + size * 0.36, size, t0 + 340, {anchor: 'middle', g: o.g, out: o.out, color: o.textColor ?? C.ink});
	});

/** 思考泡：云朵 + 两个小圆指向 tail */
export const thought = (b: Board, box: Box, tail: Pt, t0: number, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		const [x0, y0, x1, y1] = box;
		const cx = (x0 + x1) / 2;
		const cy = (y0 + y1) / 2;
		const rx = (x1 - x0) / 2;
		const ry = (y1 - y0) / 2;
		const n = Math.max(7, Math.round((rx + ry) / 45));
		let d = '';
		for (let i = 0; i <= n; i++) {
			const a = (i / n) * Math.PI * 2;
			const p: Pt = [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
			if (i === 0) d = `M${p[0]} ${p[1]}`;
			else {
				const am = ((i - 0.5) / n) * Math.PI * 2;
				const bulge = 1.28;
				d += ` Q${cx + rx * bulge * Math.cos(am)} ${cy + ry * bulge * Math.sin(am)} ${p[0]} ${p[1]}`;
			}
		}
		b.stroke((seed) => R.path(d, {seed, roughness: 0.7}), t0, 520, {w: 3, ...o});
		// 两个小圆
		const edge: Pt = [cx + (tail[0] - cx) * 0.62, cy + (tail[1] - cy) * 0.62];
		const mid: Pt = [(edge[0] + tail[0]) / 2, (edge[1] + tail[1]) / 2];
		const rr1 = Math.min(rx, ry) * 0.12;
		b.stroke((seed) => R.circle(mid[0], mid[1], rr1, {seed, roughness: 0.5}), t0 + 520, 140, {w: 2.6, ...o});
		b.stroke((seed) => R.circle(tail[0], tail[1], rr1 * 0.55, {seed, roughness: 0.5}), t0 + 640, 110, {w: 2.4, ...o});
	});

/** 手机外框 + 听筒 + 屏幕框，返回屏幕矩形 */
export const phone = (b: Board, x: number, y: number, w: number, h: number, t0: number, dur = 1100, o: StrokeOpts = {}) => {
	b.stroke((seed) => R.path(rr(x, y, w, h, Math.min(w, h) * 0.1), {seed, roughness: 0.8, bowing: 0.6}), t0, dur * 0.6, {w: 4.2, ...o});
	b.stroke((seed) => R.line([x + w / 2 - w * 0.08, y + h * 0.035], [x + w / 2 + w * 0.08, y + h * 0.035], {seed, roughness: 0.4}), t0 + dur * 0.62, dur * 0.12, {w: 4, ...o});
	const s = {x: x + w * 0.04, y: y + h * 0.07, w: w * 0.92, h: h * 0.86};
	b.stroke((seed) => R.rect(s.x, s.y, s.w, s.h, {seed, roughness: 0.5}), t0 + dur * 0.72, dur * 0.28, {color: C.pencil, w: 2, ...o});
	return s;
};

/** 小手机图标（带一个自己发出去的气泡） */
export const miniPhone = (b: Board, x: number, y: number, s: number, t0: number, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		const w = s * 0.56;
		b.stroke((seed) => R.path(rr(x, y, w, s, s * 0.1), {seed, roughness: 0.6}), t0, 320, {w: 3.4, ...o});
		b.stroke((seed) => R.path(rr(x + w * 0.38, y + s * 0.22, w * 0.5, s * 0.14, 6), {seed, roughness: 0.5}), t0 + 300, 160, {w: 2.4, ...o});
		b.stroke((seed) => R.path(rr(x + w * 0.12, y + s * 0.46, w * 0.46, s * 0.14, 6), {seed, roughness: 0.5}), t0 + 440, 160, {w: 2.2, color: C.pencil, dash: '5 6', ...o});
	});

/** 排线填充一个框（颜色块、格子涂色）；gap 越大越稀 */
export const hatchBox = (b: Board, box: Box, color: string, t0: number, dur = 600, o: {gap?: number; angle?: number; w?: number; opacity?: number; out?: number; g?: string; pen?: boolean} = {}) =>
	b.fill((seed) => R.hatchRect(box[0], box[1], box[2] - box[0], box[3] - box[1], {seed, hachureGap: o.gap ?? 12, hachureAngle: o.angle ?? -41, roughness: 1.1}), t0, dur, {
		color,
		w: o.w ?? 3,
		opacity: o.opacity ?? 0.7,
		out: o.out,
		g: o.g,
		pen: o.pen,
	});

/** 带颜色的标签块：圆角框 + 淡色排线 + 字（自测的选项块、句尾块） */
export const tag = (b: Board, box: Box, text: string, color: string, t0: number, o: StrokeOpts & {size?: number; textColor?: string; hatch?: boolean} = {}): Item[] =>
	b.collect(() => {
		const [x0, y0, x1, y1] = box;
		b.stroke((seed) => R.path(rr(x0, y0, x1 - x0, y1 - y0, 14), {seed, roughness: 0.7}), t0, 320, {color, w: 3.6, ...o});
		if (o.hatch !== false) hatchBox(b, [x0 + 6, y0 + 6, x1 - 6, y1 - 6], color, t0 + 200, 420, {gap: 16, opacity: 0.28, out: o.out, g: o.g, pen: false});
		const size = o.size ?? Math.min(56, (y1 - y0) * 0.55);
		if (text) b.text(text, (x0 + x1) / 2, (y0 + y1) / 2 + size * 0.36, size, t0 + 280, {anchor: 'middle', color: o.textColor ?? C.ink, out: o.out, g: o.g});
	});

/** 字母卡（A/B/C/D），边框和字母用句尾颜色 */
export const letterCard = (b: Board, cx: number, cy: number, s: number, letter: string, color: string, t0: number, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		sheet(b, [cx - s * 0.4, cy - s * 0.5, cx + s * 0.4, cy + s * 0.5], t0, {color, w: 4, r: 12, ...o});
		b.text(letter, cx, cy + s * 0.25, s * 0.72, t0 + 220, {anchor: 'middle', color, weight: 700, out: o.out, g: o.g, dur: 180});
	});

// ================= 物件类 =================

/** 钟面（模拟钟）：时针分针按 mins(ms) 转（mins = 当天的分钟数，例如 22*60+47）。id 必须全局唯一 */
export const clockFace = (b: Board, id: string, cx: number, cy: number, r: number, t0: number, mins: (ms: number) => number, o: StrokeOpts & {ticks?: boolean} = {}): Item[] =>
	b.collect(() => {
		b.stroke((seed) => R.circle(cx, cy, r, {seed, roughness: 1, bowing: 1.2}), t0, 480, {w: 4, ...o});
		if (o.ticks !== false) {
			for (let k = 0; k < 12; k++) {
				const long = k % 3 === 0;
				const a = pol(cx, cy, r * (long ? 0.72 : 0.8), k * 30);
				const e = pol(cx, cy, r * 0.88, k * 30);
				b.stroke((seed) => R.line(a, e, {seed, roughness: 0.4}), t0 + 480 + k * 20, 50, {w: long ? 3.2 : 2, boil: false, pen: false, ...o});
			}
		}
		const m0 = mins(t0);
		const hA = (m: number) => ((m / 60) % 12) * 30;
		const mA = (m: number) => (m % 60) * 6;
		b.groups[`${id}-h`] = (ms) => ({m: rotMat(hA(mins(ms)) - hA(m0), cx, cy), o: 1});
		b.groups[`${id}-m`] = (ms) => ({m: rotMat(mins(ms) * 6 - m0 * 6, cx, cy), o: 1});
		b.stroke((seed) => R.line([cx, cy], pol(cx, cy, r * 0.46, hA(m0)), {seed, roughness: 0.4}), t0 + 760, 150, {w: 5.5, g: `${id}-h`, boil: false, ...o});
		b.stroke((seed) => R.line([cx, cy], pol(cx, cy, r * 0.7, mA(m0)), {seed, roughness: 0.4}), t0 + 900, 170, {w: 3.6, g: `${id}-m`, boil: false, ...o});
		b.node(t0 + 1060, () => <circle cx={cx} cy={cy} r={Math.max(4, r * 0.07)} fill={o.color ?? C.ink} />, {bb: [cx - 8, cy - 8, cx + 8, cy + 8], out: o.out, g: o.g});
	});

/** 把「当天分钟数」写成 22:47 */
export const hhmm = (m: number) => {
	const mm = Math.floor(m) % (24 * 60);
	return `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
};

/** 秒表：表盘 + 按钮 + 指针按 deg(ms) 转（0 = 12 点方向）。id 必须全局唯一 */
export const stopwatch = (b: Board, id: string, cx: number, cy: number, r: number, t0: number, deg: (ms: number) => number, o: StrokeOpts & {sweep?: boolean} = {}): Item[] =>
	b.collect(() => {
		b.stroke((seed) => R.circle(cx, cy, r, {seed, roughness: 0.9}), t0, 420, {w: 4, ...o});
		b.stroke((seed) => R.rect(cx - r * 0.14, cy - r * 1.28, r * 0.28, r * 0.2, {seed, roughness: 0.5}), t0 + 400, 140, {w: 3.4, ...o});
		b.stroke((seed) => R.line([cx, cy - r * 1.08], [cx, cy - r], {seed, roughness: 0.3}), t0 + 520, 80, {w: 3.4, ...o});
		for (let k = 0; k < 12; k++) {
			const a = pol(cx, cy, r * 0.78, k * 30);
			const e = pol(cx, cy, r * 0.9, k * 30);
			b.stroke((seed) => R.line(a, e, {seed, roughness: 0.3}), t0 + 600 + k * 15, 40, {w: 2.2, boil: false, pen: false, ...o});
		}
		const d0 = deg(t0);
		if (o.sweep !== false) {
			b.node(
				t0 + 700,
				(ms) => {
					const d = deg(ms) - d0;
					if (d < 1) return null;
					const p0 = pol(cx, cy, r * 0.66, d0);
					const p1 = pol(cx, cy, r * 0.66, d0 + Math.min(359.9, d));
					const large = d > 180 ? 1 : 0;
					return <path d={`M${cx} ${cy} L${p0[0]} ${p0[1]} A${r * 0.66} ${r * 0.66} 0 ${large} 1 ${p1[0]} ${p1[1]} Z`} fill={o.color ?? C.ink} opacity={0.1} />;
				},
				{bb: [cx - r, cy - r, cx + r, cy + r], out: o.out, g: o.g},
			);
		}
		b.groups[id] = (ms) => ({m: rotMat(deg(ms) - d0, cx, cy), o: 1});
		b.stroke((seed) => R.line([cx, cy], pol(cx, cy, r * 0.74, d0), {seed, roughness: 0.3}), t0 + 800, 150, {w: 4, g: id, boil: false, ...o});
		b.node(t0 + 950, () => <circle cx={cx} cy={cy} r={Math.max(4, r * 0.08)} fill={o.color ?? C.ink} />, {bb: [cx - 8, cy - 8, cx + 8, cy + 8], out: o.out, g: o.g});
	});

export type Pose = 'stand' | 'raise' | 'hug' | 'run' | 'bend' | 'sit';

/** 火柴小人：脚底中心 (cx, footY)，身高 h */
export const person = (b: Board, cx: number, footY: number, h: number, t0: number, o: StrokeOpts & {pose?: Pose; flip?: boolean} = {}): Item[] =>
	b.collect(() => {
		const f = o.flip ? -1 : 1;
		const hr = h * 0.12;
		const headY = footY - h + hr;
		const neck: Pt = [cx, headY + hr];
		const hip: Pt = [cx, footY - h * 0.4];
		const sh: Pt = [cx, neck[1] + h * 0.08];
		const pose = o.pose ?? 'stand';
		const step = 90;
		let t = t0;
		const S = (make: (seed: number) => ReturnType<typeof R.line>, d = step) => {
			b.stroke(make, t, d, {w: 4, ...o});
			t += d + 20;
		};
		if (pose === 'bend') {
			const hd: Pt = [cx + f * h * 0.28, footY - h * 0.62];
			S((seed) => R.circle(hd[0], hd[1], hr, {seed, roughness: 0.8}), 200);
			const nk: Pt = [hd[0] - f * hr * 0.8, hd[1] + hr * 0.6];
			S((seed) => R.line(nk, hip, {seed, roughness: 0.6}));
			S((seed) => R.line([nk[0] - f * h * 0.05, nk[1] + h * 0.05], [nk[0] + f * h * 0.05, footY - h * 0.2], {seed, roughness: 0.6}));
			S((seed) => R.line(hip, [cx - f * h * 0.12, footY], {seed, roughness: 0.6}));
			S((seed) => R.line(hip, [cx + f * h * 0.12, footY], {seed, roughness: 0.6}));
			return;
		}
		S((seed) => R.circle(cx, headY, hr, {seed, roughness: 0.8}), 200);
		S((seed) => R.line(neck, hip, {seed, roughness: 0.6}));
		const arm = (a: Pt, e: Pt) => S((seed) => R.linear([sh, a, e], {seed, roughness: 0.6}));
		if (pose === 'stand' || pose === 'sit') {
			arm([cx - h * 0.14, sh[1] + h * 0.16], [cx - h * 0.18, sh[1] + h * 0.3]);
			arm([cx + h * 0.14, sh[1] + h * 0.16], [cx + h * 0.18, sh[1] + h * 0.3]);
		} else if (pose === 'raise') {
			arm([cx - h * 0.14, sh[1] + h * 0.16], [cx - h * 0.18, sh[1] + h * 0.3]);
			arm([cx + f * h * 0.14, sh[1] - h * 0.1], [cx + f * h * 0.18, sh[1] - h * 0.28]);
		} else if (pose === 'hug') {
			S((seed) => R.linear([sh, [cx - h * 0.16, sh[1] + h * 0.1], [cx + h * 0.12, sh[1] + h * 0.16]], {seed, roughness: 0.5}));
			S((seed) => R.linear([sh, [cx + h * 0.16, sh[1] + h * 0.1], [cx - h * 0.12, sh[1] + h * 0.2]], {seed, roughness: 0.5}));
		} else if (pose === 'run') {
			arm([cx + f * h * 0.14, sh[1] + h * 0.08], [cx + f * h * 0.26, sh[1] - h * 0.02]);
			arm([cx - f * h * 0.12, sh[1] + h * 0.14], [cx - f * h * 0.24, sh[1] + h * 0.18]);
		}
		if (pose === 'sit') {
			S((seed) => R.linear([hip, [cx + f * h * 0.22, hip[1]], [cx + f * h * 0.22, footY]], {seed, roughness: 0.5}));
			S((seed) => R.linear([hip, [cx + f * h * 0.16, hip[1] + h * 0.04], [cx + f * h * 0.14, footY]], {seed, roughness: 0.5}));
		} else if (pose === 'run') {
			S((seed) => R.linear([hip, [cx + f * h * 0.14, hip[1] + h * 0.18], [cx + f * h * 0.24, footY]], {seed, roughness: 0.5}));
			S((seed) => R.linear([hip, [cx - f * h * 0.06, hip[1] + h * 0.22], [cx - f * h * 0.24, footY - h * 0.06]], {seed, roughness: 0.5}));
		} else {
			S((seed) => R.line(hip, [cx - h * 0.12, footY], {seed, roughness: 0.6}));
			S((seed) => R.line(hip, [cx + h * 0.12, footY], {seed, roughness: 0.6}));
		}
	});

/** 拇指（按手机的那只）：中心 (cx,cy)，大小 s */
export const thumb = (b: Board, cx: number, cy: number, s: number, t0: number, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		const d = `M${cx - s * 0.18} ${cy + s * 0.5} L${cx - s * 0.2} ${cy - s * 0.18} C${cx - s * 0.2} ${cy - s * 0.46} ${cx + s * 0.2} ${cy - s * 0.46} ${cx + s * 0.2} ${cy - s * 0.18} L${cx + s * 0.22} ${cy + s * 0.5}`;
		b.stroke((seed) => R.path(d, {seed, roughness: 0.7}), t0, 360, {w: 4, ...o});
		b.stroke((seed) => R.path(rr(cx - s * 0.11, cy - s * 0.36, s * 0.22, s * 0.2, s * 0.08), {seed, roughness: 0.5}), t0 + 360, 160, {w: 2.6, ...o});
		b.stroke((seed) => R.line([cx - s * 0.12, cy + s * 0.08], [cx + s * 0.1, cy + s * 0.06], {seed, roughness: 0.5}), t0 + 520, 100, {w: 2.2, color: C.pencilDark, ...o});
	});

/** 铅笔图标（工具箱第 1 格「笔」） */
export const penIcon = (b: Board, cx: number, cy: number, s: number, t0: number, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		const a = -40;
		const L = s * 0.9;
		const wd = s * 0.16;
		const pts: Pt[] = [
			[-L / 2, -wd / 2],
			[L / 2 - s * 0.2, -wd / 2],
			[L / 2, 0],
			[L / 2 - s * 0.2, wd / 2],
			[-L / 2, wd / 2],
			[-L / 2, -wd / 2],
		];
		const rad = (a * Math.PI) / 180;
		const T = (p: Pt): Pt => [cx + p[0] * Math.cos(rad) - p[1] * Math.sin(rad), cy + p[0] * Math.sin(rad) + p[1] * Math.cos(rad)];
		b.stroke((seed) => R.linear(pts.map(T), {seed, roughness: 0.5}), t0, 360, {w: 3.4, ...o});
		b.stroke((seed) => R.line(T([L / 2 - s * 0.2, -wd / 2]), T([L / 2 - s * 0.2, wd / 2]), {seed, roughness: 0.3}), t0 + 360, 80, {w: 3, ...o});
		b.stroke((seed) => R.line(T([-L / 2 + s * 0.14, -wd / 2]), T([-L / 2 + s * 0.14, wd / 2]), {seed, roughness: 0.3}), t0 + 440, 80, {w: 3, ...o});
	});

/** 盾（防） */
export const shield = (b: Board, cx: number, cy: number, s: number, t0: number, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		const d = `M${cx} ${cy - s * 0.5} C${cx + s * 0.18} ${cy - s * 0.38} ${cx + s * 0.34} ${cy - s * 0.4} ${cx + s * 0.42} ${cy - s * 0.36} C${cx + s * 0.44} ${cy + s * 0.04} ${cx + s * 0.3} ${cy + s * 0.34} ${cx} ${cy + s * 0.52} C${cx - s * 0.3} ${cy + s * 0.34} ${cx - s * 0.44} ${cy + s * 0.04} ${cx - s * 0.42} ${cy - s * 0.36} C${cx - s * 0.34} ${cy - s * 0.4} ${cx - s * 0.18} ${cy - s * 0.38} ${cx} ${cy - s * 0.5}`;
		b.stroke((seed) => R.path(d, {seed, roughness: 0.7}), t0, 420, {w: 4, ...o});
		b.stroke((seed) => R.line([cx, cy - s * 0.36], [cx, cy + s * 0.38], {seed, roughness: 0.5}), t0 + 420, 140, {w: 2.6, ...o});
	});

/** 正在关上的门，门缝里两条被挡住的小路（关） */
export const door = (b: Board, cx: number, cy: number, s: number, t0: number, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		const w = s * 0.5;
		const x0 = cx - s * 0.42;
		const y0 = cy - s * 0.5;
		const y1 = cy + s * 0.5;
		b.stroke((seed) => R.rect(x0, y0, w, s, {seed, roughness: 0.6}), t0, 360, {w: 3.6, ...o});
		b.stroke((seed) => R.linear([[x0, y0], [x0 + w * 0.82, y0 + s * 0.06], [x0 + w * 0.82, y1 - s * 0.06], [x0, y1]], {seed, roughness: 0.6}), t0 + 360, 300, {w: 3.6, ...o});
		b.stroke((seed) => R.circle(x0 + w * 0.68, cy, s * 0.03, {seed, roughness: 0.3}), t0 + 660, 60, {w: 3, ...o});
		const gx = x0 + w + s * 0.04;
		b.stroke((seed) => R.linear([[gx, cy - s * 0.1], [gx + s * 0.22, cy - s * 0.2], [gx + s * 0.4, cy - s * 0.22]], {seed, roughness: 0.5}), t0 + 720, 200, {w: 2.4, dash: '7 8', ...o});
		b.stroke((seed) => R.linear([[gx, cy + s * 0.12], [gx + s * 0.22, cy + s * 0.2], [gx + s * 0.4, cy + s * 0.26]], {seed, roughness: 0.5}), t0 + 900, 200, {w: 2.4, dash: '7 8', ...o});
		b.stroke((seed) => R.line([gx + s * 0.1, cy - s * 0.3], [gx + s * 0.1, cy + s * 0.34], {seed, roughness: 0.5}), t0 + 1100, 140, {w: 4, ...o});
	});

/** 打分印章（评）：落下时带一声 stamp */
export const stamp = (b: Board, cx: number, cy: number, s: number, t0: number, o: StrokeOpts & {mark?: string; sfx?: boolean} = {}): Item[] =>
	b.collect(() => {
		b.stroke((seed) => R.circle(cx, cy - s * 0.38, s * 0.12, {seed, roughness: 0.6}), t0, 220, {w: 3.4, ...o});
		b.stroke((seed) => R.linear([[cx - s * 0.08, cy - s * 0.27], [cx - s * 0.1, cy - s * 0.1], [cx + s * 0.1, cy - s * 0.1], [cx + s * 0.08, cy - s * 0.27]], {seed, roughness: 0.5}), t0 + 220, 200, {w: 3.4, ...o});
		b.stroke((seed) => R.rect(cx - s * 0.3, cy - s * 0.1, s * 0.6, s * 0.16, {seed, roughness: 0.5}), t0 + 420, 200, {w: 3.6, ...o});
		// 印迹
		b.stroke((seed) => R.rect(cx - s * 0.34, cy + s * 0.18, s * 0.68, s * 0.3, {seed, roughness: 1.2}), t0 + 700, 160, {w: 3, ...o});
		if (o.mark) b.text(o.mark, cx, cy + s * 0.43, s * 0.24, t0 + 780, {anchor: 'middle', color: o.color, dur: 120, out: o.out, g: o.g});
		if (o.sfx !== false) b.sound(t0 + 700, 'stamp', 0.4);
	});

/** 空椅子，椅背挂一个小钟（等） */
export const chair = (b: Board, cx: number, cy: number, s: number, t0: number, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		const bx = cx - s * 0.2;
		b.stroke((seed) => R.line([bx, cy - s * 0.5], [bx, cy + s * 0.5], {seed, roughness: 0.5}), t0, 200, {w: 4, ...o});
		b.stroke((seed) => R.line([bx, cy + s * 0.05], [cx + s * 0.3, cy + s * 0.05], {seed, roughness: 0.5}), t0 + 200, 180, {w: 4, ...o});
		b.stroke((seed) => R.line([cx + s * 0.28, cy + s * 0.05], [cx + s * 0.28, cy + s * 0.5], {seed, roughness: 0.5}), t0 + 380, 140, {w: 4, ...o});
		b.stroke((seed) => R.line([bx, cy - s * 0.5], [bx + s * 0.06, cy - s * 0.5], {seed, roughness: 0.3}), t0 + 520, 60, {w: 4, ...o});
		// 小钟
		b.stroke((seed) => R.circle(bx + s * 0.02, cy - s * 0.26, s * 0.13, {seed, roughness: 0.6}), t0 + 600, 200, {w: 2.8, ...o});
		b.stroke((seed) => R.linear([[bx + s * 0.02, cy - s * 0.34], [bx + s * 0.02, cy - s * 0.26], [bx + s * 0.08, cy - s * 0.22]], {seed, roughness: 0.3}), t0 + 800, 120, {w: 2.4, ...o});
	});

/** 信封 */
export const mail = (b: Board, box: Box, t0: number, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		const [x0, y0, x1, y1] = box;
		b.stroke((seed) => R.rect(x0, y0, x1 - x0, y1 - y0, {seed, roughness: 0.6}), t0, 360, {w: 3.6, ...o});
		b.stroke((seed) => R.linear([[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + (y1 - y0) * 0.08], [x1, y0]], {seed, roughness: 0.6}), t0 + 360, 260, {w: 3.2, ...o});
	});

/** 锁 */
export const lock = (b: Board, cx: number, cy: number, s: number, t0: number, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		b.stroke((seed) => R.path(`M${cx - s * 0.22} ${cy - s * 0.05} L${cx - s * 0.22} ${cy - s * 0.25} C${cx - s * 0.22} ${cy - s * 0.55} ${cx + s * 0.22} ${cy - s * 0.55} ${cx + s * 0.22} ${cy - s * 0.25} L${cx + s * 0.22} ${cy - s * 0.05}`, {seed, roughness: 0.5}), t0, 260, {w: 4, ...o});
		b.stroke((seed) => R.path(rr(cx - s * 0.34, cy - s * 0.06, s * 0.68, s * 0.52, s * 0.06), {seed, roughness: 0.6}), t0 + 260, 260, {w: 4, ...o});
		b.stroke((seed) => R.line([cx, cy + s * 0.12], [cx, cy + s * 0.28], {seed, roughness: 0.3}), t0 + 520, 80, {w: 4, ...o});
	});

/** 旗杆（截止时间） */
export const flag = (b: Board, x: number, footY: number, h: number, t0: number, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		b.stroke((seed) => R.line([x, footY], [x, footY - h], {seed, roughness: 0.5}), t0, 220, {w: 4, ...o});
		b.stroke((seed) => R.linear([[x, footY - h], [x + h * 0.5, footY - h * 0.84], [x, footY - h * 0.68]], {seed, roughness: 0.6}), t0 + 220, 240, {w: 3.6, ...o});
	});

/** 麦克风 */
export const mic = (b: Board, cx: number, cy: number, s: number, t0: number, o: StrokeOpts = {}): Item[] =>
	b.collect(() => {
		b.stroke((seed) => R.path(rr(cx - s * 0.14, cy - s * 0.5, s * 0.28, s * 0.56, s * 0.14), {seed, roughness: 0.5}), t0, 280, {w: 3.6, ...o});
		b.stroke((seed) => R.path(`M${cx - s * 0.26} ${cy - s * 0.1} C${cx - s * 0.26} ${cy + s * 0.26} ${cx + s * 0.26} ${cy + s * 0.26} ${cx + s * 0.26} ${cy - s * 0.1}`, {seed, roughness: 0.5}), t0 + 280, 200, {w: 3, ...o});
		b.stroke((seed) => R.line([cx, cy + s * 0.18], [cx, cy + s * 0.4], {seed, roughness: 0.3}), t0 + 480, 80, {w: 3, ...o});
		b.stroke((seed) => R.line([cx - s * 0.16, cy + s * 0.42], [cx + s * 0.16, cy + s * 0.42], {seed, roughness: 0.3}), t0 + 560, 80, {w: 3, ...o});
	});

/** 心形 path */
export const heartPath = (cx: number, cy: number, s: number) =>
	`M${cx} ${cy + s * 0.42} C${cx - s * 0.62} ${cy} ${cx - s * 0.5} ${cy - s * 0.5} ${cx} ${cy - s * 0.2} C${cx + s * 0.5} ${cy - s * 0.5} ${cx + s * 0.62} ${cy} ${cx} ${cy + s * 0.42} Z`;

/** 「正」字计数：times[i] 是第 i 笔出现的时刻 */
export const zheng = (b: Board, x: number, y: number, s: number, times: number[], o: StrokeOpts = {}) => {
	const strokes: [Pt, Pt][] = [
		[[x - s * 0.42, y - s * 0.46], [x + s * 0.42, y - s * 0.46]],
		[[x, y - s * 0.46], [x, y + s * 0.44]],
		[[x, y - 0.02 * s], [x + s * 0.34, y - 0.02 * s]],
		[[x - s * 0.28, y + s * 0.05], [x - s * 0.28, y + s * 0.44]],
		[[x - s * 0.5, y + s * 0.46], [x + s * 0.5, y + s * 0.46]],
	];
	times.slice(0, 5).forEach((t, i) => b.stroke((seed) => R.line(strokes[i][0], strokes[i][1], {seed, roughness: 0.9, bowing: 0.6}), t, 190, {w: 5, lag: 0.05, ...o}));
};

/** 「正在输入…」的三个点：[t0, t1] 之间跳 rounds 轮（每轮三个点依次跳一下） */
export const typingDots = (b: Board, x: number, y: number, r: number, t0: number, t1: number, o: {rounds?: number; color?: string; out?: number; g?: string; gap?: number} = {}) => {
	const rounds = o.rounds ?? 3;
	const gap = o.gap ?? r * 3.2;
	const per = (t1 - t0) / rounds;
	return b.node(
		t0,
		(ms) => {
			// t1 之后点停住不跳（什么时候擦掉由 out 决定）
			const u = ((ms - t0) % per) / per;
			return (
				<g>
					{[0, 1, 2].map((i) => {
						const ph = clamp01((u - i * 0.18) / 0.36);
						const jump = ms <= t1 ? Math.sin(ph * Math.PI) * r * 1.3 : 0;
						return <circle key={i} cx={x + i * gap} cy={y - jump} r={r} fill={o.color ?? C.pencilDark} />;
					})}
				</g>
			);
		},
		{bb: [x - r, y - r * 3, x + gap * 2 + r, y + r], out: o.out, g: o.g},
	);
};

/** 手绘地层线：一条略有起伏的长线 */
export const stratum = (b: Board, x0: number, x1: number, y: number, t0: number, dur: number, o: StrokeOpts & {amp?: number; phase?: number} = {}) => {
	const pts: Pt[] = [];
	const n = Math.max(4, Math.round((x1 - x0) / 170));
	for (let i = 0; i <= n; i++) {
		const x = x0 + ((x1 - x0) * i) / n;
		pts.push([x, y + Math.sin(i * 1.7 + (o.phase ?? 0)) * (o.amp ?? 7)]);
	}
	return b.stroke((seed) => R.curve(pts, {seed, roughness: 0.8}), t0, dur, {w: 3.6, ...o});
};

/** 标题：手写一行字 + 下划线（stub 和段落标题用） */
export const titleLine = (b: Board, s: string, x: number, y: number, size: number, t0: number, o: TextOpts & {underline?: boolean} = {}): Item[] =>
	b.collect(() => {
		const it = b.text(s, x, y, size, t0, {anchor: 'middle', ...o});
		const w = textW(s, size);
		const x0 = (o.anchor ?? 'middle') === 'middle' ? x - w / 2 : (o.anchor ?? 'middle') === 'start' ? x : x - w;
		if (o.underline !== false) freehand(b, [[x0 - 10, y + size * 0.3], [x0 + w * 0.5, y + size * 0.26], [x0 + w + 10, y + size * 0.32]], t0 + it.dur + 60, 360, {size: 10, color: o.color ?? C.ink, out: o.out, g: o.g});
	});

export {textW};
