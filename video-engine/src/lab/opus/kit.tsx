import React from 'react';
import type {Board, StrokeOpts} from './engine/board';
import {clamp01, easeOut} from './engine/camera';
import type {Pt} from './engine/rough';
import {R, rr} from './engine/rough';
import {C, FONT_HAND, textW} from './engine/theme';

// 场景词汇表：可复用的手绘组件。每个组件 = 往分镜板上加一组带时间的笔画。
// 约定：坐标都是世界坐标；t0 是开始落笔的时刻（ms），dur 是这一组画完的总时长。

const pol = (cx: number, cy: number, r: number, deg: number): Pt => {
	const a = (deg * Math.PI) / 180;
	return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
};

/** 箭头：a → b，bend 是弯曲量（正数向左手边鼓） */
export const arrow = (b: Board, a: Pt, e: Pt, t0: number, dur = 420, o: StrokeOpts & {bend?: number; head?: number} = {}) => {
	const bend = o.bend ?? 0.18;
	const mx = (a[0] + e[0]) / 2;
	const my = (a[1] + e[1]) / 2;
	const dx = e[0] - a[0];
	const dy = e[1] - a[1];
	const m: Pt = [mx - dy * bend, my + dx * bend];
	const body = b.stroke((seed) => R.curve([a, m, e], {seed, roughness: 0.9}), t0, dur * 0.75, o);
	// 箭头方向：用终点附近的切线（二次曲线在终点的切线 = e - m）
	const tx = e[0] - m[0];
	const ty = e[1] - m[1];
	const tl = Math.hypot(tx, ty) || 1;
	const ux = tx / tl;
	const uy = ty / tl;
	const hl = o.head ?? 26;
	const p1: Pt = [e[0] - ux * hl - uy * hl * 0.6, e[1] - uy * hl + ux * hl * 0.6];
	const p2: Pt = [e[0] - ux * hl + uy * hl * 0.6, e[1] - uy * hl - ux * hl * 0.6];
	b.stroke((seed) => R.linear([p1, e, p2], {seed, roughness: 0.7}), t0 + dur * 0.75, dur * 0.25, {...o, lag: 0});
	return body;
};

/** 圈出来：手绘椭圆（多绕半圈，像真的用笔圈） */
export const ring = (b: Board, cx: number, cy: number, w: number, h: number, t0: number, dur = 420, o: StrokeOpts = {}) =>
	b.stroke((seed) => R.ellipse(cx, cy, w, h, {seed, roughness: 1.6, bowing: 2}), t0, dur, {color: C.red, w: 3.4, ...o});

/** 下划线 */
export const under = (b: Board, x0: number, x1: number, y: number, t0: number, dur = 300, o: StrokeOpts = {}) =>
	b.stroke((seed) => R.line([x0, y], [x1, y + 3], {seed, roughness: 1.1, bowing: 1.5}), t0, dur, {color: C.amber, w: 5, ...o});

/** 手机：圆角机身 + 听筒 + 屏幕框，返回屏幕矩形 */
export const phone = (b: Board, x: number, y: number, w: number, h: number, t0: number, dur = 1100, o: StrokeOpts = {}) => {
	b.stroke((seed) => R.path(rr(x, y, w, h, 34), {seed, roughness: 0.8, bowing: 0.6}), t0, dur * 0.6, {w: 4.2, ...o});
	b.stroke((seed) => R.line([x + w / 2 - 28, y + 22], [x + w / 2 + 28, y + 22], {seed, roughness: 0.4}), t0 + dur * 0.62, dur * 0.12, {w: 4, ...o});
	const s = {x: x + 14, y: y + 44, w: w - 28, h: h - 88};
	b.stroke((seed) => R.rect(s.x, s.y, s.w, s.h, {seed, roughness: 0.5}), t0 + dur * 0.72, dur * 0.28, {color: C.pencil, w: 2, ...o});
	return s;
};

/** 聊天气泡（side = 'r' 自己发的，'l' 对方）；dashed 用来画「本该出现却没出现」的那条 */
export const bubble = (
	b: Board,
	x: number,
	y: number,
	w: number,
	h: number,
	t0: number,
	o: StrokeOpts & {side?: 'l' | 'r'; text?: string; size?: number; dashed?: boolean} = {},
) => {
	const side = o.side ?? 'r';
	const tailX = side === 'r' ? x + w : x;
	const tail = side === 'r' ? `M${tailX - 4} ${y + h - 16} L${tailX + 14} ${y + h + 4} L${tailX - 20} ${y + h - 2}` : `M${tailX + 4} ${y + h - 16} L${tailX - 14} ${y + h + 4} L${tailX + 20} ${y + h - 2}`;
	b.stroke((seed) => R.path(rr(x, y, w, h, 18), {seed, roughness: 0.8}), t0, 300, {w: 3, dash: o.dashed ? '9 11' : undefined, ...o});
	if (!o.dashed) b.stroke((seed) => R.path(tail, {seed, roughness: 0.6}), t0 + 280, 120, {w: 3, lag: 0, ...o});
	if (o.text) b.text(o.text, x + w / 2, y + h / 2 + (o.size ?? 26) * 0.36, o.size ?? 26, t0 + 320, {anchor: 'middle', g: o.g, out: o.out});
};

/** 钟：表盘 + 刻度 + 时针；分针单独做成可转动的组 `${id}` */
export const clock = (b: Board, id: string, cx: number, cy: number, r: number, t0: number, minute: (ms: number) => number, hour = 8.25) => {
	b.stroke((seed) => R.circle(cx, cy, r, {seed, roughness: 1, bowing: 1.2}), t0, 520, {w: 4});
	const ticks: Pt[][] = [];
	for (let k = 0; k < 12; k++) {
		const long = k % 3 === 0;
		ticks.push([pol(cx, cy, r * (long ? 0.74 : 0.82), k * 30), pol(cx, cy, r * 0.9, k * 30)]);
	}
	ticks.forEach((tk, k) => b.stroke((seed) => R.line(tk[0], tk[1], {seed, roughness: 0.4}), t0 + 520 + k * 22, 60, {w: k % 3 === 0 ? 3.4 : 2.2, boil: false}));
	// 已经过去的时间：扇形淡墨
	const m0 = minute(0);
	b.node(t0 + 600, (ms) => {
		const m = minute(ms);
		if (m - m0 < 0.2) return null;
		const a0 = m0 * 6;
		const a1 = m * 6;
		const p0 = pol(cx, cy, r * 0.66, a0);
		const p1 = pol(cx, cy, r * 0.66, a1);
		const large = a1 - a0 > 180 ? 1 : 0;
		return <path d={`M${cx} ${cy} L${p0[0]} ${p0[1]} A${r * 0.66} ${r * 0.66} 0 ${large} 1 ${p1[0]} ${p1[1]} Z`} fill={C.red} opacity={0.16} />;
	});
	b.stroke((seed) => R.line([cx, cy], pol(cx, cy, r * 0.46, hour * 30), {seed, roughness: 0.4}), t0 + 820, 160, {w: 5.5});
	b.groups[id] = (ms) => `rotate(${(minute(ms) - m0) * 6} ${cx} ${cy})`;
	b.stroke((seed) => R.line([cx, cy], pol(cx, cy, r * 0.7, m0 * 6), {seed, roughness: 0.4}), t0 + 1000, 180, {w: 3.6, g: id, boil: false});
	b.node(t0 + 1150, () => <circle cx={cx} cy={cy} r={6} fill={C.ink} />);
};

/** 「正」字计数：times[i] 是第 i 笔出现的时刻（第 5 笔之后可以继续画下一个正） */
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

/** 心形（描边） */
export const heartPath = (cx: number, cy: number, s: number) =>
	`M${cx} ${cy + s * 0.42} C${cx - s * 0.62} ${cy} ${cx - s * 0.5} ${cy - s * 0.5} ${cx} ${cy - s * 0.2} C${cx + s * 0.5} ${cy - s * 0.5} ${cx + s * 0.62} ${cy} ${cx} ${cy + s * 0.42} Z`;

/** 火苗：外焰描边 + 会闪的排线 + 内焰 */
export const flame = (b: Board, cx: number, cy: number, s: number, t0: number, o: {out?: number} = {}) => {
	const P = (pts: number[][]) => pts.map(([x, y]) => `${(cx + x * s).toFixed(1)} ${(cy + y * s).toFixed(1)}`);
	const outer = P([
		[0, 0.7],
		[-0.45, 0.7],
		[-0.58, 0.3],
		[-0.42, 0.0],
		[-0.3, -0.22],
		[-0.16, -0.26],
		[-0.14, -0.52],
		[0.0, -0.38],
		[0.06, -0.3],
		[0.06, -0.2],
		[0.12, -0.48],
		[0.26, -0.62],
		[0.2, -0.9],
		[0.48, -0.58],
		[0.58, -0.18],
		[0.46, 0.2],
		[0.4, 0.55],
		[0.24, 0.7],
		[0, 0.7],
	]);
	const d = `M${outer[0]} C${outer[1]} ${outer[2]} ${outer[3]} C${outer[4]} ${outer[5]} ${outer[6]} C${outer[7]} ${outer[8]} ${outer[9]} C${outer[10]} ${outer[11]} ${outer[12]} C${outer[13]} ${outer[14]} ${outer[15]} C${outer[16]} ${outer[17]} ${outer[18]} Z`;
	const inner = P([
		[0.02, 0.62],
		[-0.22, 0.62],
		[-0.26, 0.36],
		[-0.14, 0.18],
		[-0.06, 0.06],
		[0.02, 0.0],
		[0.06, -0.12],
		[0.2, 0.08],
		[0.26, 0.3],
		[0.22, 0.5],
		[0.16, 0.6],
		[0.08, 0.62],
		[0.02, 0.62],
	]);
	const di = `M${inner[0]} C${inner[1]} ${inner[2]} ${inner[3]} C${inner[4]} ${inner[5]} ${inner[6]} C${inner[7]} ${inner[8]} ${inner[9]} C${inner[10]} ${inner[11]} ${inner[12]} Z`;
	b.fill((seed) => R.hatchPath(d, {seed, hachureGap: 9, hachureAngle: -60, roughness: 1.3}), t0 + 350, 500, {color: C.red, w: 3, flicker: 3, out: o.out});
	b.stroke((seed) => R.path(d, {seed, roughness: 1.1}), t0, 520, {color: C.red, w: 4.4, out: o.out});
	b.stroke((seed) => R.path(di, {seed, roughness: 1.0}), t0 + 600, 300, {color: C.red, w: 3, out: o.out});
};

/** 天平：横梁按 tilt(ms) 摆动，两个秤盘始终竖直挂着 */
export const balance = (b: Board, id: string, cx: number, top: number, L: number, t0: number, tilt: (ms: number) => number, labels: [string, string], o: {out?: number} = {}) => {
	const bottom = top + 220;
	const oo = {out: o.out};
	b.stroke((seed) => R.line([cx, top - 8], [cx, bottom], {seed, roughness: 0.6}), t0, 260, {w: 4.2, ...oo});
	b.stroke((seed) => R.line([cx - 70, bottom], [cx + 70, bottom + 2], {seed, roughness: 0.8}), t0 + 250, 180, {w: 4.2, ...oo});
	b.groups[`${id}-beam`] = (ms) => `rotate(${tilt(ms)} ${cx} ${top})`;
	b.stroke((seed) => R.line([cx - L, top], [cx + L, top], {seed, roughness: 0.6}), t0 + 430, 260, {w: 4.2, g: `${id}-beam`, ...oo});
	b.node(t0 + 500, () => <circle cx={cx} cy={top} r={8} fill={C.ink} />, oo);
	const side = (sgn: -1 | 1, label: string, tt: number) => {
		const gid = `${id}-pan${sgn}`;
		b.groups[gid] = (ms) => {
			const a = (tilt(ms) * Math.PI) / 180;
			return `translate(${sgn * L * (Math.cos(a) - 1)} ${sgn * L * Math.sin(a)})`;
		};
		const px = cx + sgn * L;
		const py = top + 110;
		b.stroke((seed) => R.linear([[px - 70, py], [px, top], [px + 70, py]], {seed, roughness: 0.5}), tt, 220, {w: 2.4, color: C.pencilDark, g: gid, ...oo});
		b.stroke((seed) => R.path(`M${px - 86} ${py} Q${px} ${py + 56} ${px + 86} ${py} Z`, {seed, roughness: 0.8}), tt + 200, 240, {w: 3.6, g: gid, ...oo});
		b.text(label, px, py + 98, 40, tt + 420, {anchor: 'middle', g: gid, out: o.out});
	};
	side(-1, labels[0], t0 + 620);
	side(1, labels[1], t0 + 820);
};

/** 放大镜（里面一颗小心）——「找证据」 */
export const magnifier = (b: Board, cx: number, cy: number, r: number, t0: number, o: StrokeOpts = {}) => {
	b.stroke((seed) => R.circle(cx, cy, r, {seed, roughness: 0.8}), t0, 300, {w: 4, ...o});
	b.stroke((seed) => R.line([cx + r * 0.72, cy + r * 0.72], [cx + r * 1.6, cy + r * 1.6], {seed, roughness: 0.5}), t0 + 300, 150, {w: 7, lag: 0, ...o});
	b.stroke((seed) => R.path(heartPath(cx, cy + 2, r * 0.9), {seed, roughness: 0.6}), t0 + 450, 220, {w: 2.6, color: C.red, ...o});
};

/** 小手机图标（带一个自己发出去的气泡） */
export const miniPhone = (b: Board, x: number, y: number, s: number, t0: number, o: StrokeOpts = {}) => {
	const w = s * 0.56;
	b.stroke((seed) => R.path(rr(x, y, w, s, s * 0.1), {seed, roughness: 0.6}), t0, 320, {w: 3.4, ...o});
	b.stroke((seed) => R.path(rr(x + w * 0.38, y + s * 0.22, w * 0.5, s * 0.14, 6), {seed, roughness: 0.5}), t0 + 300, 160, {w: 2.4, ...o});
	b.stroke((seed) => R.path(rr(x + w * 0.12, y + s * 0.46, w * 0.46, s * 0.14, 6), {seed, roughness: 0.5}), t0 + 440, 160, {w: 2.2, color: C.pencil, dash: '5 6', ...o});
};

/** 母题：琥珀色的「需要」——一颗实心的小圆点 + 墨圈；glow(ms) 控制它亮不亮 */
export const seed = (b: Board, cx: number, cy: number, r: number, t0: number, glow: (ms: number) => number = () => 1, o: {out?: number} = {}) => {
	b.node(
		t0 + 200,
		(ms) => {
			const g = glow(ms);
			const grow = easeOut(clamp01((ms - t0 - 200) / 380));
			return (
				<g>
					<circle cx={cx} cy={cy} r={r * 2.1 * grow} fill={C.amber} opacity={0.18 * g} />
					<circle cx={cx} cy={cy} r={r * grow} fill={C.amber} opacity={0.35 + 0.65 * g} />
				</g>
			);
		},
		o,
	);
	b.stroke((seed2) => R.circle(cx, cy, r + 3, {seed: seed2, roughness: 0.9}), t0, 340, {w: 3.4, color: C.ink, out: o.out});
};

/** 带圈的数字 ①②③（圈是画出来的，数字是写出来的） */
export const badge = (b: Board, cx: number, cy: number, r: number, n: string, t0: number, o: StrokeOpts = {}) => {
	b.stroke((seed) => R.circle(cx, cy, r, {seed, roughness: 1}), t0, 280, {w: 3.2, ...o});
	b.text(n, cx, cy + r * 0.42, r * 1.15, t0 + 200, {anchor: 'middle', dur: 160, color: o.color ?? C.ink, out: o.out});
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

/** 手写体文本，屏幕上的动态数字等用 */
export const HandText: React.FC<{x: number; y: number; size: number; color?: string; anchor?: 'start' | 'middle' | 'end'; children: string; opacity?: number}> = ({
	x,
	y,
	size,
	color = C.ink,
	anchor = 'start',
	children,
	opacity = 1,
}) => (
	<text x={x} y={y} fontFamily={FONT_HAND} fontSize={size} fontWeight={500} fill={color} textAnchor={anchor} opacity={opacity}>
		{children}
	</text>
);

export {textW};
