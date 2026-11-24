/** 赫布专用的画笔与工具（不改 kit，只在这里扩展）。
 *  - 发光精灵（sprite）：预渲染的径向光斑，drawImage 叠加，比逐个 createRadialGradient 快得多
 *  - 镜头：canvas 内部变换（线条保持矢量清晰），HTML 层用同一套变换算屏幕坐标
 *  - 渐变发光线、横向光芒（flare）、二次贝塞尔、泊松撒点 */
import {clamp, hexToRgb, mulberry32, rgba} from '../../kit';

export type Pt = [number, number];
export type Ctx = CanvasRenderingContext2D;
export const TAU = Math.PI * 2;

// ---------------------------------------------------------------- 镜头
export type Cam = {s: number; ox: number; oy: number; dx: number; dy: number};
export const cam = (s: number, ox = 960, oy = 540, dx = 0, dy = 0): Cam => ({s, ox, oy, dx, dy});
export const camSet = (g: Ctx, c: Cam) => g.setTransform(c.s, 0, 0, c.s, c.ox + c.dx - c.s * c.ox, c.oy + c.dy - c.s * c.oy);
export const camReset = (g: Ctx) => g.setTransform(1, 0, 0, 1, 0, 0);
export const toScr = (c: Cam, x: number, y: number): Pt => [c.ox + c.dx + c.s * (x - c.ox), c.oy + c.dy + c.s * (y - c.oy)];
export const fromScr = (c: Cam, X: number, Y: number): Pt => [c.ox + (X - c.ox - c.dx) / c.s, c.oy + (Y - c.oy - c.dy) / c.s];

// ---------------------------------------------------------------- 发光精灵
// 审片修改：原来用 createRadialGradient 画精灵，Skia 会给渐变加抖动，精灵画布的四角留下 ±1 的 alpha，
// 放大叠加后成了看得见的「圆角方框」。现在逐像素算（浮点 → 8 位），外圈乘 (1 − smoothstep(0.8R, R, r))，
// 画布边上 4 px 一律是 0；大光雾用 256 px 的精灵，色阶更细。
type Kind = 'dot' | 'soft' | 'spark';
const SPR = new Map<string, HTMLCanvasElement>();
// 衰减用两个高斯相加（审片：光晕衰减改成高斯，不要分段线性——线性的折点会形成一圈圈看得见的色带）
// 返回 [白的比例 0–1, alpha]；数值贴着原来那组色标（dot：0.15 处 0.7、0.32 处 0.22、0.6 处 0.06）
const G2 = (r: number, c1: number, s1: number, c2: number, s2: number) => c1 * Math.exp(-((r / s1) ** 2)) + c2 * Math.exp(-((r / s2) ** 2));
const PROFILE: Record<Kind, (r: number) => [number, number]> = {
	dot: (r) => [Math.exp(-((r / 0.08) ** 2)), G2(r, 0.7, 0.215, 0.3, 0.47)],
	soft: (r) => [0, G2(r, 0.6, 0.22, 0.4, 0.45)],
	spark: (r) => [Math.exp(-((r / 0.09) ** 2)), G2(r, 0.55, 0.25, 0.45, 0.45)],
};
const SIZE: Record<Kind, number> = {dot: 160, soft: 256, spark: 64};
export const sprite = (color: string, kind: Kind = 'dot') => {
	const key = color + kind;
	const hit = SPR.get(key);
	if (hit) return hit;
	const SZ = SIZE[kind];
	const cv = document.createElement('canvas');
	cv.width = cv.height = SZ;
	const g = cv.getContext('2d')!;
	const [r, gg, b] = hexToRgb(color);
	const img = g.createImageData(SZ, SZ);
	const R = SZ / 2 - 4; // 最外 4 px 留空
	for (let y = 0; y < SZ; y++)
		for (let x = 0; x < SZ; x++) {
			const d = Math.hypot(x + 0.5 - SZ / 2, y + 0.5 - SZ / 2) / R;
			const [wt, a0] = d >= 1 ? [0, 0] : PROFILE[kind](d);
			const u = clamp((d - 0.8) / 0.2);
			const a = a0 * (1 - u * u * (3 - 2 * u));
			const i = (y * SZ + x) * 4;
			img.data[i] = Math.round(r + (255 - r) * wt);
			img.data[i + 1] = Math.round(gg + (255 - gg) * wt);
			img.data[i + 2] = Math.round(b + (255 - b) * wt);
			img.data[i + 3] = Math.round(255 * a);
		}
	g.putImageData(img, 0, 0);
	SPR.set(key, cv);
	return cv;
};
/** 画布比光晕半径多出 4 px 的空边：drawImage 时按这个比例放大，r 仍是光晕半径 */
const sprPad = (kind: Kind) => SIZE[kind] / 2 / (SIZE[kind] / 2 - 4);

/** 精灵光点：r 是光晕半径，k 可以 > 1（多叠几遍） */
export const spr = (g: Ctx, x: number, y: number, r: number, color: string, k = 1, kind: Kind = 'dot') => {
	if (k <= 0.003 || r <= 0.05) return;
	const cv = sprite(color, kind);
	const rr = r * sprPad(kind);
	let kk = k;
	while (kk > 0.003) {
		g.globalAlpha = Math.min(1, kk);
		g.drawImage(cv, x - rr, y - rr, 2 * rr, 2 * rr);
		kk -= 1;
	}
	g.globalAlpha = 1;
};

/** 横向光芒：很扁的椭圆光（镜头光学的那一道横线） */
export const flare = (g: Ctx, x: number, y: number, len: number, color: string, k = 1, thin = 0.02) => {
	if (k <= 0.003) return;
	g.save();
	g.translate(x, y);
	g.scale(1, thin);
	spr(g, 0, 0, len, color, k, 'soft');
	g.restore();
};

const pathOf = (g: Ctx, pts: Pt[]) => {
	g.beginPath();
	g.moveTo(pts[0][0], pts[0][1]);
	for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
};

/** 发光线（可两端不同色）。w 是芯线宽；passes 越多光晕越厚 */
export const gline = (g: Ctx, pts: Pt[], c0: string, c1: string | null, w = 1.5, k = 1, core = true) => {
	if (pts.length < 2 || k <= 0.003) return;
	const [x0, y0] = pts[0];
	const [x1, y1] = pts[pts.length - 1];
	const passes: [number, number][] = [
		[w * 9, 0.04],
		[w * 4.5, 0.085],
		[w * 2.2, 0.22],
		[w, 0.85],
	];
	g.lineCap = 'round';
	g.lineJoin = 'round';
	for (const [lw, a] of passes) {
		if (c1 && c1 !== c0 && Math.hypot(x1 - x0, y1 - y0) > 1) {
			const gr = g.createLinearGradient(x0, y0, x1, y1);
			gr.addColorStop(0, rgba(c0, a * k));
			gr.addColorStop(1, rgba(c1, a * k));
			g.strokeStyle = gr;
		} else g.strokeStyle = rgba(c0, a * k);
		g.lineWidth = lw;
		pathOf(g, pts);
		g.stroke();
	}
	if (core) {
		g.strokeStyle = `rgba(255,255,255,${clamp(0.5 * k)})`;
		g.lineWidth = Math.max(0.5, w * 0.35);
		pathOf(g, pts);
		g.stroke();
	}
};

/** 暗细线 */
export const hairl = (g: Ctx, pts: Pt[], color: string, w = 1, a = 0.35) => {
	if (pts.length < 2 || a <= 0.003) return;
	g.strokeStyle = rgba(color, a);
	g.lineWidth = w;
	g.lineCap = 'round';
	pathOf(g, pts);
	g.stroke();
};

/** 发光圆环（自己的版本：线宽按屏幕像素传入） */
export const gring = (g: Ctx, x: number, y: number, r: number, color: string, w = 1.5, k = 1, a0 = 0, a1 = TAU) => {
	if (k <= 0.003 || r <= 0.3) return;
	const n = Math.max(32, Math.ceil(((a1 - a0) * r) / 5));
	const pts: Pt[] = [];
	for (let i = 0; i <= n; i++) {
		const a = a0 + ((a1 - a0) * i) / n;
		pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
	}
	gline(g, pts, color, null, w, k);
};

// ---------------------------------------------------------------- 曲线
export const qpt = (p0: Pt, c: Pt, p1: Pt, u: number): Pt => {
	const a = (1 - u) * (1 - u);
	const b = 2 * (1 - u) * u;
	const d = u * u;
	return [a * p0[0] + b * c[0] + d * p1[0], a * p0[1] + b * c[1] + d * p1[1]];
};
export const qpts = (p0: Pt, c: Pt, p1: Pt, n = 24): Pt[] => Array.from({length: n + 1}, (_, i) => qpt(p0, c, p1, i / n));
/** 二次曲线的前 u 段（de Casteljau），返回新的 [p0, c, p1] */
export const qsub = (p0: Pt, c: Pt, p1: Pt, u: number): [Pt, Pt, Pt] => {
	const c2: Pt = [p0[0] + (c[0] - p0[0]) * u, p0[1] + (c[1] - p0[1]) * u];
	return [p0, c2, qpt(p0, c, p1, u)];
};
export const plen = (pts: Pt[]) => {
	let L = 0;
	for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
	return L;
};
/** 折线上弧长比例 u 处的点与切向 */
export const along = (pts: Pt[], cum: number[], u: number): [number, number, number, number] => {
	const L = cum[cum.length - 1];
	const s = Math.max(0, Math.min(L, u * L));
	let lo = 0;
	let hi = cum.length - 1;
	while (hi - lo > 1) {
		const m = (lo + hi) >> 1;
		if (cum[m] <= s) lo = m;
		else hi = m;
	}
	const seg = cum[hi] - cum[lo] || 1;
	const f = (s - cum[lo]) / seg;
	const [ax, ay] = pts[lo];
	const [bx, by] = pts[hi];
	const dx = bx - ax;
	const dy = by - ay;
	const dl = Math.hypot(dx, dy) || 1;
	return [ax + dx * f, ay + dy * f, dx / dl, dy / dl];
};
export const cumlen = (pts: Pt[]) => {
	const c = [0];
	for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
	return c;
};

// ---------------------------------------------------------------- 随机
export const gaussian = (R: () => number) => {
	const u = 1 - R();
	const v = R();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
};

/** 泊松撒点（掷飞镖 + 网格），inside 判断是否在区域内 */
export const poisson = (seed: number, x0: number, y0: number, x1: number, y1: number, rmin: number, tries: number, inside: (x: number, y: number) => boolean = () => true): Pt[] => {
	const R = mulberry32(seed);
	const cs = rmin / Math.SQRT2;
	const gw = Math.ceil((x1 - x0) / cs) + 1;
	const gh = Math.ceil((y1 - y0) / cs) + 1;
	const grid = new Int32Array(gw * gh).fill(-1);
	const out: Pt[] = [];
	for (let k = 0; k < tries; k++) {
		const x = x0 + R() * (x1 - x0);
		const y = y0 + R() * (y1 - y0);
		if (!inside(x, y)) continue;
		const gx = Math.floor((x - x0) / cs);
		const gy = Math.floor((y - y0) / cs);
		let ok = true;
		for (let j = Math.max(0, gy - 2); j <= Math.min(gh - 1, gy + 2) && ok; j++)
			for (let i = Math.max(0, gx - 2); i <= Math.min(gw - 1, gx + 2); i++) {
				const id = grid[j * gw + i];
				if (id >= 0 && Math.hypot(out[id][0] - x, out[id][1] - y) < rmin) {
					ok = false;
					break;
				}
			}
		if (!ok) continue;
		grid[gy * gw + gx] = out.length;
		out.push([x, y]);
	}
	return out;
};

/** 分段时间表：给 [[t, v], ...]，返回 t 处的值（段内 easeInOut 插值） */
export const keys = (t: number, kv: [number, number][], e: (x: number) => number) => {
	if (t <= kv[0][0]) return kv[0][1];
	for (let i = 1; i < kv.length; i++) {
		if (t <= kv[i][0]) {
			const [ta, va] = kv[i - 1];
			const [tb, vb] = kv[i];
			return va + (vb - va) * e((t - ta) / (tb - ta));
		}
	}
	return kv[kv.length - 1][1];
};

/** 一次闪光的包络：t0 起 0→1 用 rise 秒，然后按 decay 秒指数衰减 */
export const pulse = (t: number, t0: number, rise = 0.08, decay = 0.35) => {
	const u = t - t0;
	if (u < 0) return 0;
	if (u < rise) return u / rise;
	return Math.exp(-(u - rise) / decay);
};
