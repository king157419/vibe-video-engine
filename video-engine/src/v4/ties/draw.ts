/** 本片的画笔：在 kit/glow 的基础上加了「镜头」（世界坐标 → 屏幕，线宽保持屏幕像素，镜头推近时线依然细）
 *  和预渲染的光点贴图（两千颗星每帧用 drawImage，比每颗建一个渐变快得多）。全部用 'lighter' 叠加。 */
import {clamp, hexToRgb, lerp} from '../kit/util';
import type {XY} from './model';

export type Ctx = CanvasRenderingContext2D;

// ---------------------------------------------------------------- 颜色（全片固定）
export const SILVER = '#c9d2dc';
export const AMBER = '#eaa64a';
export const AMBER_CORE = '#fff0cf';
export const ENGRAVE = '#34406a';
export const YOU_CORE = '#fff3dc';
export const BG = '#050811';

// ---------------------------------------------------------------- 镜头
/** screen = world * s + (ox, oy) */
export type View = {s: number; ox: number; oy: number};
export const ID: View = {s: 1, ox: 0, oy: 0};
/** 把世界点 (fx, fy) 放到屏幕点 (sx, sy)，缩放 s */
export const cam = (s: number, fx: number, fy: number, sx = 960, sy = 540): View => ({s, ox: sx - fx * s, oy: sy - fy * s});
export const camLerp = (a: View, b: View, u: number): View => {
	// 在「焦点」空间里插值，避免缩放时画面乱跑：先算两端屏幕中心对应的世界点
	const fa: XY = [(960 - a.ox) / a.s, (540 - a.oy) / a.s];
	const fb: XY = [(960 - b.ox) / b.s, (540 - b.oy) / b.s];
	const s = Math.exp(lerp(Math.log(a.s), Math.log(b.s), u));
	return cam(s, lerp(fa[0], fb[0], u), lerp(fa[1], fb[1], u));
};
export const sx = (v: View, x: number) => x * v.s + v.ox;
export const sy = (v: View, y: number) => y * v.s + v.oy;
export const P = (v: View, p: XY): XY => [p[0] * v.s + v.ox, p[1] * v.s + v.oy];

// ---------------------------------------------------------------- 光点贴图
type Kind = 'dot' | 'star' | 'soft';
const sprites = new Map<string, HTMLCanvasElement>();
const SPR = 128;
const sprite = (color: string, kind: Kind): HTMLCanvasElement => {
	const key = color + kind;
	let c = sprites.get(key);
	if (c) return c;
	c = document.createElement('canvas');
	c.width = SPR;
	c.height = SPR;
	const g = c.getContext('2d')!;
	const [r, gg, b] = hexToRgb(color);
	const h = SPR / 2;
	const grad = g.createRadialGradient(h, h, 0, h, h, h);
	const col = (a: number) => `rgba(${r},${gg},${b},${a})`;
	if (kind === 'dot') {
		grad.addColorStop(0, 'rgba(255,255,255,1)');
		grad.addColorStop(0.18, col(0.85));
		grad.addColorStop(0.45, col(0.22));
		grad.addColorStop(0.75, col(0.05));
		grad.addColorStop(1, col(0));
	} else if (kind === 'star') {
		grad.addColorStop(0, 'rgba(255,255,255,1)');
		grad.addColorStop(0.08, 'rgba(255,255,255,0.9)');
		grad.addColorStop(0.2, col(0.55));
		grad.addColorStop(0.45, col(0.12));
		grad.addColorStop(1, col(0));
	} else {
		grad.addColorStop(0, col(1));
		grad.addColorStop(0.35, col(0.45));
		grad.addColorStop(0.7, col(0.1));
		grad.addColorStop(1, col(0));
	}
	g.fillStyle = grad;
	g.fillRect(0, 0, SPR, SPR);
	sprites.set(key, c);
	return c;
};

/** 屏幕坐标下画一个光点（r 是屏幕像素的光晕半径） */
export const glowAt = (g: Ctx, x: number, y: number, r: number, color: string, k = 1, kind: Kind = 'dot') => {
	if (k <= 0.003 || r <= 0.2) return;
	if (x < -r || y < -r || x > 1920 + r || y > 1080 + r) return;
	const spr = sprite(color, kind);
	if (k > 1) {
		// 亮度大于 1 时叠两次
		g.globalAlpha = 1;
		g.drawImage(spr, x - r, y - r, 2 * r, 2 * r);
		g.globalAlpha = clamp(k - 1);
		g.drawImage(spr, x - r, y - r, 2 * r, 2 * r);
	} else {
		g.globalAlpha = k;
		g.drawImage(spr, x - r, y - r, 2 * r, 2 * r);
	}
	g.globalAlpha = 1;
};

/** 世界坐标下的光点。半径随镜头放大，但只放大 s^zr 倍（默认 0.5：推近时星变大，但不会糊成一团） */
export const glow = (g: Ctx, v: View, p: XY, r: number, color: string, k = 1, kind: Kind = 'dot', zr = 0.5) =>
	glowAt(g, sx(v, p[0]), sy(v, p[1]), r * Math.pow(v.s, zr), color, k, kind);

/** 柔光雾（随镜头完整缩放） */
export const haze = (g: Ctx, v: View, p: XY, r: number, color: string, k = 0.3) => glowAt(g, sx(v, p[0]), sy(v, p[1]), r * v.s, color, k, 'soft');

// ---------------------------------------------------------------- 线
const rgb = (hex: string) => hexToRgb(hex).join(',');

/** 一组折线（世界坐标）合成一条路径 */
const tracePolys = (g: Ctx, v: View, polys: XY[][], closed = false) => {
	g.beginPath();
	for (const pts of polys) {
		if (pts.length < 2) continue;
		g.moveTo(pts[0][0] * v.s + v.ox, pts[0][1] * v.s + v.oy);
		for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] * v.s + v.ox, pts[i][1] * v.s + v.oy);
		if (closed) g.closePath();
	}
};

/** 发光线：宽而淡 → 窄而亮，中心一条白热细线。w 是屏幕像素 */
export const glowLines = (g: Ctx, v: View, polys: XY[][], color: string, w = 1.6, k = 1, core = true, closed = false) => {
	if (k <= 0.003 || polys.length === 0) return;
	const c = rgb(color);
	const passes: [number, number][] = [
		[w * 9, 0.04],
		[w * 4.5, 0.08],
		[w * 2.2, 0.2],
		[w, 0.85],
	];
	g.lineCap = 'round';
	g.lineJoin = 'round';
	tracePolys(g, v, polys, closed);
	for (const [lw, a] of passes) {
		g.strokeStyle = `rgba(${c},${clamp(a * k)})`;
		g.lineWidth = lw;
		g.stroke();
	}
	if (core) {
		g.strokeStyle = `rgba(255,248,235,${clamp(0.5 * k)})`;
		g.lineWidth = Math.max(0.6, w * 0.35);
		g.stroke();
	}
};
export const glowLine = (g: Ctx, v: View, pts: XY[], color: string, w = 1.6, k = 1, core = true) => glowLines(g, v, [pts], color, w, k, core);

/** 不发光的细线（刻线）。w 屏幕像素 */
export const hairLines = (g: Ctx, v: View, polys: XY[][], color: string, w = 1, a = 0.35, dash?: number[]) => {
	if (a <= 0.002 || polys.length === 0) return;
	g.strokeStyle = `rgba(${rgb(color)},${clamp(a)})`;
	g.lineWidth = w;
	g.lineCap = 'round';
	g.lineJoin = 'round';
	if (dash) g.setLineDash(dash);
	tracePolys(g, v, polys);
	g.stroke();
	if (dash) g.setLineDash([]);
};

/** 很多根两点线段（flat: [x1,y1,x2,y2,...] 世界坐标），一次画完 */
export const hairSegs = (g: Ctx, v: View, flat: number[], color: string, w = 1, a = 0.3) => {
	if (a <= 0.002 || flat.length < 4) return;
	g.strokeStyle = `rgba(${rgb(color)},${clamp(a)})`;
	g.lineWidth = w;
	g.lineCap = 'round';
	g.beginPath();
	const {s, ox, oy} = v;
	for (let i = 0; i + 3 < flat.length; i += 4) {
		g.moveTo(flat[i] * s + ox, flat[i + 1] * s + oy);
		g.lineTo(flat[i + 2] * s + ox, flat[i + 3] * s + oy);
	}
	g.stroke();
};

// ---------------------------------------------------------------- 几何
export const arcPts = (cx: number, cy: number, r: number, a0 = 0, a1 = Math.PI * 2, n = 0): XY[] => {
	const m = n || Math.max(24, Math.ceil((Math.abs(a1 - a0) * r) / 5));
	const out: XY[] = [];
	for (let i = 0; i <= m; i++) {
		const a = a0 + ((a1 - a0) * i) / m;
		out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
	}
	return out;
};

/** 二次贝塞尔：a → b，控制点在中点沿法线偏 bend × 长度 */
export const bez = (a: XY, b: XY, bend: number) => {
	const mx = (a[0] + b[0]) / 2;
	const my = (a[1] + b[1]) / 2;
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const c: XY = [mx - dy * bend, my + dx * bend];
	return (u: number): XY => [
		(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0],
		(1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1],
	];
};
export const bezC = (a: XY, c: XY, b: XY) => (u: number): XY => [
	(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0],
	(1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1],
];
export const samp = (fn: (u: number) => XY, n = 40, u0 = 0, u1 = 1): XY[] => {
	const out: XY[] = [];
	for (let i = 0; i <= n; i++) out.push(fn(u0 + ((u1 - u0) * i) / n));
	return out;
};
export const lerpXY = (a: XY, b: XY, u: number): XY => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
export const dist = (a: XY, b: XY) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** 彗星：tail 是走过的点（世界坐标），最后一个是头 */
export const comet = (g: Ctx, v: View, tail: XY[], color: string, w = 2.5, k = 1, head = 22) => {
	const n = tail.length;
	if (n < 2 || k <= 0.003) return;
	const c = rgb(color);
	g.lineCap = 'round';
	for (let i = 1; i < n; i++) {
		const f = i / (n - 1);
		const a = P(v, tail[i - 1]);
		const b = P(v, tail[i]);
		const lw = w * (0.25 + 0.75 * f);
		const kk = k * f * f;
		g.strokeStyle = `rgba(${c},${clamp(0.12 * kk)})`;
		g.lineWidth = lw * 5;
		g.beginPath();
		g.moveTo(a[0], a[1]);
		g.lineTo(b[0], b[1]);
		g.stroke();
		g.strokeStyle = `rgba(${c},${clamp(0.75 * kk)})`;
		g.lineWidth = lw;
		g.stroke();
	}
	const hp = tail[n - 1];
	glow(g, v, hp, head, color, k, 'dot');
	glow(g, v, hp, head * 0.35, AMBER_CORE, k * 0.9, 'star');
};

/** 「你」：白金色核 + 一圈银白细环，环很慢地呼吸。amber 0–1 把核染成琥珀 */
export const drawYou = (g: Ctx, v: View, p: XY, k: number, t: number, amber = 0, ringK = 0.5) => {
	if (k <= 0.003) return;
	const col = amber > 0 ? mixHex(YOU_CORE, AMBER, amber) : YOU_CORE;
	glow(g, v, p, 34, col, 0.55 * k, 'soft');
	glow(g, v, p, 16, col, k, 'dot');
	const br = 13 * (1 + 0.06 * Math.sin(t * 1.4));
	const z = Math.pow(v.s, 0.5);
	glowLines(g, ID, [arcPts(sx(v, p[0]), sy(v, p[1]), br * z, 0, Math.PI * 2, 48)], SILVER, 1.2, ringK * k * (0.85 + 0.15 * Math.sin(t * 1.4)), false);
};
/** 陌生人：银白点 + 同样的细环，亮度 0.35 */
export const drawStranger = (g: Ctx, v: View, p: XY, k: number, t: number, ringK = 0.35) => {
	if (k <= 0.003) return;
	glow(g, v, p, 26, SILVER, 0.35 * k, 'soft');
	glow(g, v, p, 12, SILVER, k, 'dot');
	const z = Math.pow(v.s, 0.5);
	const br = 13 * (1 + 0.06 * Math.sin(t * 1.4 + 1.3));
	glowLines(g, ID, [arcPts(sx(v, p[0]), sy(v, p[1]), br * z, 0, Math.PI * 2, 48)], SILVER, 1.2, ringK * k, false);
};

export const mixHex = (h1: string, h2: string, t: number) => {
	const a = hexToRgb(h1);
	const b = hexToRgb(h2);
	return `#${a.map((x, i) => Math.round(lerp(x, b[i], clamp(t))).toString(16).padStart(2, '0')).join('')}`;
};

/** 镜头微动：一直在动但很慢（±px 级的漂移，几十秒一个周期） */
export const drift = (t: number, amp = 6): XY => [amp * Math.sin(t * 0.11 + 0.7), amp * 0.6 * Math.sin(t * 0.083 + 2.1)];
