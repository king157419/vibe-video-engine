/** 《峰终》自用的发光画笔（在 kit/glow.ts 的基础上加了：沿 x 变色变亮的光线、精灵粒子、画布字形）。
 *  全部在 'lighter' 叠加下使用；只依赖传入的 t 和预算数据（确定性）。 */
import {clamp, hexToRgb} from '../kit/util';

export type P = [number, number];
export type RGB = [number, number, number];
export type Ctx = CanvasRenderingContext2D;

const h = (hex: string): RGB => hexToRgb(hex) as RGB;
export const ICE: RGB = h('#a9c8ff');
export const ICE_W: RGB = h('#dbe8ff');
export const GOLD: RGB = h('#f0d28c');
export const GOLD_C: RGB = h('#fff7d6');
export const WARM: RGB = h('#ffe9c4');
export const PINK: RGB = h('#ee5c80');
export const DIM: RGB = h('#5b6168');
export const GREY: RGB = h('#7d838c');
export const SILVER: RGB = h('#c9d2dc');
export const EMBER: RGB = h('#ff9a52');
export const WHITE: RGB = [255, 255, 255];

export const mixc = (a: RGB, b: RGB, t: number): RGB => {
	const u = clamp(t);
	return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
};
export const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a).toFixed(4)})`;

/** 记忆光点的颜色：k 越小越往暖金偏（混 0.6·(1−k)） */
export const memColor = (base: RGB, k: number): RGB => mixc(base, GOLD, 0.6 * (1 - k));

/** 光线的芯：暖白（审片修改：经历线用暖白偏金的芯，冰蓝只做外晕） */
export const CORE: RGB = h('#fff2d8');
const CORE_MIX = 0.4; // 内两层描边往暖白偏的程度

// 审片修改：光晕半径和亮度都加到原来的约 2 倍（原 [26,.015][13,.028][6.5,.055][3.2,.12][1.7,.3][1,.78]）
// 终版复看：6 遍描边每遍都是一条平涂的带，最外一遍（α 0.024）在暗底上看得出一条直边的「光条」。
// 改成 11 遍、每遍的台阶减半，叠出来接近一条连续衰减的光晕（中心总亮度不变）。
const PASSES: [number, number][] = [
	[34, 0.012],
	[26, 0.015],
	[20, 0.021],
	[15, 0.03],
	[11, 0.045],
	[8, 0.066],
	[5.6, 0.1],
	[3.8, 0.15],
	[2.4, 0.2],
	[1.5, 0.35],
	[1.0, 0.7],
];
const passColor = (c: RGB, m: number): RGB => (m <= 2.0 ? mixc(c, CORE, CORE_MIX) : c);

export const tracePath = (g: Ctx, pts: P[], closed = false) => {
	g.beginPath();
	g.moveTo(pts[0][0], pts[0][1]);
	for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
	if (closed) g.closePath();
};

/** 发光折线：一次建路径，多遍描边（宽而淡 → 窄而亮）+ 白热细芯 */
export const beam = (g: Ctx, pts: P[], c: RGB, w = 2, k = 1, closed = false, core = 0.55) => {
	if (pts.length < 2 || k <= 0.003) return;
	g.lineCap = 'round';
	g.lineJoin = 'round';
	tracePath(g, pts, closed);
	for (const [m, a] of PASSES) {
		g.strokeStyle = rgba(passColor(c, m), a * k);
		g.lineWidth = w * m;
		g.stroke();
	}
	if (core > 0) {
		g.strokeStyle = rgba(CORE, core * k);
		g.lineWidth = Math.max(0.6, w * 0.42);
		g.stroke();
	}
};

/** 沿 x 方向变色、变亮的发光线（点列需大致沿 x 单调）。f(x) → [颜色, 亮度] */
export const beamX = (g: Ctx, pts: P[], w: number, f: (x: number) => [RGB, number], n = 64, core = 0.55, xr?: [number, number], maxM = Infinity) => {
	if (pts.length < 2) return;
	let x0 = Infinity;
	let x1 = -Infinity;
	for (const p of pts) {
		if (p[0] < x0) x0 = p[0];
		if (p[0] > x1) x1 = p[0];
	}
	if (xr) {
		x0 = Math.min(x0, xr[0]);
		x1 = Math.max(x1, xr[1]);
	}
	if (x1 - x0 < 0.5) {
		const [c, k] = f(x0);
		beam(g, pts, c, w, k, false, core);
		return;
	}
	const S: {u: number; c: RGB; k: number}[] = [];
	let any = false;
	for (let i = 0; i <= n; i++) {
		const x = x0 + ((x1 - x0) * i) / n;
		const [c, k] = f(x);
		if (k > 0.003) any = true;
		S.push({u: i / n, c, k: Math.max(0, k)});
	}
	if (!any) return;
	g.lineCap = 'round';
	g.lineJoin = 'round';
	tracePath(g, pts);
	const grad = (a: number, m: number) => {
		const gr = g.createLinearGradient(x0, 0, x1, 0);
		for (const s of S) gr.addColorStop(s.u, rgba(m < 0 ? CORE : passColor(s.c, m), a * s.k));
		return gr;
	};
	for (const [m, a] of PASSES) {
		if (m > maxM) continue;
		g.strokeStyle = grad(a, m);
		g.lineWidth = w * m;
		g.stroke();
	}
	if (core > 0) {
		g.strokeStyle = grad(core, -1);
		g.lineWidth = Math.max(0.6, w * 0.42);
		g.stroke();
	}
};

/** 沿 y 方向渐变亮度的发光线（f(y) → 亮度） */
export const beamY = (g: Ctx, pts: P[], c: RGB, w: number, f: (y: number) => number, n = 24, core = 0.5) => {
	if (pts.length < 2) return;
	let y0 = Infinity;
	let y1 = -Infinity;
	for (const p of pts) {
		if (p[1] < y0) y0 = p[1];
		if (p[1] > y1) y1 = p[1];
	}
	if (y1 - y0 < 0.5) return beam(g, pts, c, w, f(y0), false, core);
	g.lineCap = 'round';
	g.lineJoin = 'round';
	tracePath(g, pts);
	const grad = (a: number, col: RGB) => {
		const gr = g.createLinearGradient(0, y0, 0, y1);
		for (let i = 0; i <= n; i++) gr.addColorStop(i / n, rgba(col, a * Math.max(0, f(y0 + ((y1 - y0) * i) / n))));
		return gr;
	};
	for (const [m, a] of PASSES) {
		g.strokeStyle = grad(a, passColor(c, m));
		g.lineWidth = w * m;
		g.stroke();
	}
	g.strokeStyle = grad(core, CORE);
	g.lineWidth = Math.max(0.6, w * 0.42);
	g.stroke();
};

/** 彗星拖尾：点列最后 len 像素再描一遍，越靠头越亮越粗（笔尖带 0.3–0.5 s 的尾巴） */
export const comet = (g: Ctx, pts: P[], len: number, c: RGB, w: number, k = 1) => {
	if (pts.length < 2 || k <= 0.003) return;
	const tail: P[] = [pts[pts.length - 1]];
	let acc = 0;
	for (let i = pts.length - 2; i >= 0 && acc < len; i--) {
		acc += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
		tail.push(pts[i]);
	}
	if (tail.length < 2 || acc < 2) return;
	tail.reverse();
	const a = tail[0];
	const b = tail[tail.length - 1];
	if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 2) return;
	g.lineCap = 'round';
	g.lineJoin = 'round';
	tracePath(g, tail);
	const grad = (al: number, col: RGB) => {
		const gr = g.createLinearGradient(a[0], a[1], b[0], b[1]);
		gr.addColorStop(0, rgba(col, 0));
		gr.addColorStop(0.55, rgba(col, al * 0.22));
		gr.addColorStop(0.85, rgba(col, al * 0.6));
		gr.addColorStop(1, rgba(col, al));
		return gr;
	};
	for (const [m, al] of PASSES) {
		g.strokeStyle = grad(al * k, passColor(c, m));
		g.lineWidth = w * m * 1.5;
		g.stroke();
	}
	g.strokeStyle = grad(0.8 * k, CORE);
	g.lineWidth = Math.max(0.8, w * 0.7);
	g.stroke();
};

/** 不发光的暗细线 */
export const hairline = (g: Ctx, pts: P[], c: RGB, w = 1, a = 0.3, closed = false) => {
	if (pts.length < 2 || a <= 0.003) return;
	tracePath(g, pts, closed);
	g.strokeStyle = rgba(c, a);
	g.lineWidth = w;
	g.stroke();
};

/** 发光点：白热核 + 彩色光晕；r 是光晕半径 */
export const glow = (g: Ctx, x: number, y: number, r: number, c: RGB, k = 1, core = 0.16) => {
	if (k <= 0.003 || r <= 0.2) return;
	const gr = g.createRadialGradient(x, y, 0, x, y, r);
	gr.addColorStop(0, rgba(WHITE, k));
	gr.addColorStop(core, rgba(c, 0.85 * k));
	gr.addColorStop(0.42, rgba(c, 0.2 * k));
	gr.addColorStop(1, rgba(c, 0));
	g.fillStyle = gr;
	g.beginPath();
	g.arc(x, y, r, 0, Math.PI * 2);
	g.fill();
};

/** 一颗「真的光」：小白核 + 中光晕 + 大而淡的外晕（三层叠加） */
export const star = (g: Ctx, x: number, y: number, r: number, c: RGB, k = 1) => {
	if (k <= 0.003) return;
	haze(g, x, y, r * 4.2, c, 0.09 * k);
	glow(g, x, y, r * 1.6, c, 0.55 * k, 0.12);
	glow(g, x, y, r * 0.55, mixc(c, WHITE, 0.5), Math.min(1.4, 1.1 * k), 0.3);
};

/** 横向镜头光：一道很扁的光雾 */
export const flare = (g: Ctx, x: number, y: number, len: number, c: RGB, k = 0.2) => {
	if (k <= 0.003 || len <= 1) return;
	g.save();
	g.translate(x, y);
	g.scale(1, 0.05);
	haze(g, 0, 0, len, c, k);
	g.restore();
};

/** 记忆光点 / 金点：r 是剧本里的 r。审片修改：画出来放大 1.5 倍（r 30 → 45），外晕约 4r（r 30 → 约 125 px），
 *  加白热小核和一道横向镜头光 */
export const mdot = (g: Ctx, x: number, y: number, r: number, c: RGB, k = 1) => {
	if (k <= 0.003) return;
	const R = r * 1.5;
	haze(g, x, y, R * 2.8, c, 0.17 * k);
	glow(g, x, y, R, c, k, 0.2);
	glow(g, x, y, R * 0.32, mixc(c, WHITE, 0.55), Math.min(1.2, 1.05 * k), 0.45);
	flare(g, x, y, R * 3.4, mixc(c, WHITE, 0.3), 0.3 * Math.min(1, k));
};

/** 记忆光点（02、03 章）：金芯（金 = 记忆留下的帧），越难受越亮、越大；冰蓝只做最外一层晕 */
export const memDot = (g: Ctx, x: number, y: number, r: number, k = 1, aura: RGB = ICE) => {
	if (k <= 0.003) return;
	haze(g, x, y, r * 5.5, aura, 0.08 * k);
	mdot(g, x, y, r, GOLD, k);
};

/** 大而柔的光雾，没有白核 */
export const haze = (g: Ctx, x: number, y: number, r: number, c: RGB, k = 0.3) => {
	if (k <= 0.002 || r <= 0.5) return;
	// 近似高斯的衰减，多几个色标（色标少时暗处会出现一圈圈的台阶）
	const gr = g.createRadialGradient(x, y, 0, x, y, r);
	gr.addColorStop(0, rgba(c, k));
	gr.addColorStop(0.18, rgba(c, k * 0.66));
	gr.addColorStop(0.36, rgba(c, k * 0.38));
	gr.addColorStop(0.54, rgba(c, k * 0.18));
	gr.addColorStop(0.72, rgba(c, k * 0.07));
	gr.addColorStop(0.88, rgba(c, k * 0.018));
	gr.addColorStop(1, rgba(c, 0));
	g.fillStyle = gr;
	g.beginPath();
	g.arc(x, y, r, 0, Math.PI * 2);
	g.fill();
};

/** 发光圆弧 */
export const arc = (g: Ctx, x: number, y: number, r: number, c: RGB, w = 1.4, k = 1, a0 = 0, a1 = Math.PI * 2, core = 0.5) => {
	if (k <= 0.003 || r <= 0.2) return;
	const n = Math.max(16, Math.ceil(((a1 - a0) * r) / 5));
	const pts: P[] = [];
	for (let i = 0; i <= n; i++) {
		const a = a0 + ((a1 - a0) * i) / n;
		pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
	}
	beam(g, pts, c, w, k, false, core);
};

/** 椭圆环（涟漪） */
export const ellipse = (g: Ctx, x: number, y: number, rx: number, ry: number, c: RGB, w = 1.2, k = 1) => {
	if (k <= 0.003 || rx <= 0.5) return;
	const n = 96;
	const pts: P[] = [];
	for (let i = 0; i <= n; i++) {
		const a = (Math.PI * 2 * i) / n;
		pts.push([x + Math.cos(a) * rx, y + Math.sin(a) * ry]);
	}
	beam(g, pts, c, w, k, true, 0.3);
};

/** 精灵：预先画好的径向光斑，用 drawImage 大量复用（比每颗建渐变快得多） */
export const makeSprite = (c: RGB, white = 0.9, size = 64): HTMLCanvasElement => {
	const cv = document.createElement('canvas');
	cv.width = size;
	cv.height = size;
	const g = cv.getContext('2d')!;
	const r = size / 2;
	const gr = g.createRadialGradient(r, r, 0, r, r, r);
	gr.addColorStop(0, rgba(mixc(c, WHITE, white), 1));
	gr.addColorStop(0.12, rgba(mixc(c, WHITE, white * 0.6), 0.9));
	gr.addColorStop(0.3, rgba(c, 0.32));
	gr.addColorStop(0.6, rgba(c, 0.08));
	gr.addColorStop(1, rgba(c, 0));
	g.fillStyle = gr;
	g.fillRect(0, 0, size, size);
	return cv;
};
export const blit = (g: Ctx, spr: HTMLCanvasElement, x: number, y: number, r: number, a: number) => {
	if (a <= 0.003) return;
	g.globalAlpha = Math.min(1, a);
	g.drawImage(spr, x - r, y - r, 2 * r, 2 * r);
};

/** Catmull-Rom 平滑（centripetal 近似用均匀参数即可） */
export const catmull = (pts: P[], seg = 8, closed = false): P[] => {
	const n = pts.length;
	if (n < 3) return pts.slice();
	const out: P[] = [];
	const get = (i: number): P => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
	const last = closed ? n : n - 1;
	for (let i = 0; i < last; i++) {
		const p0 = get(i - 1);
		const p1 = get(i);
		const p2 = get(i + 1);
		const p3 = get(i + 2);
		for (let s = 0; s < seg; s++) {
			const u = s / seg;
			const u2 = u * u;
			const u3 = u2 * u;
			out.push([
				0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
				0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3),
			]);
		}
	}
	out.push(closed ? pts[0] : pts[n - 1]);
	return out;
};

export const pathLen = (pts: P[]) => {
	let L = 0;
	for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
	return L;
};

/** 截取折线前 p（0–1）长度 */
export const partial = (pts: P[], p: number): P[] => {
	if (p >= 1) return pts;
	if (p <= 0 || pts.length < 2) return pts.slice(0, 1);
	const L = pathLen(pts) * p;
	let acc = 0;
	const out: P[] = [pts[0]];
	for (let i = 1; i < pts.length; i++) {
		const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
		if (acc + d >= L) {
			const f = d > 0 ? (L - acc) / d : 0;
			out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]);
			return out;
		}
		acc += d;
		out.push(pts[i]);
	}
	return out;
};

/** 重采样成 n 个等弧长的点 */
export const resample = (pts: P[], n: number): P[] => {
	if (pts.length === 0) return [];
	if (pts.length === 1) return Array.from({length: n}, () => [pts[0][0], pts[0][1]] as P);
	const cum = [0];
	for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
	const L = cum[cum.length - 1];
	const out: P[] = [];
	let j = 1;
	for (let i = 0; i < n; i++) {
		const s = n === 1 ? 0 : (L * i) / (n - 1);
		while (j < pts.length - 1 && cum[j] < s) j++;
		const d = cum[j] - cum[j - 1];
		const f = d > 0 ? clamp((s - cum[j - 1]) / d) : 0;
		out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f]);
	}
	return out;
};

export const morph = (a: P[], b: P[], t: number): P[] => {
	const u = clamp(t);
	return a.map((p, i) => [p[0] + (b[i][0] - p[0]) * u, p[1] + (b[i][1] - p[1]) * u]);
};

export const inPoly = (x: number, y: number, poly: P[]) => {
	let inside = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [xi, yi] = poly[i];
		const [xj, yj] = poly[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
	}
	return inside;
};

/** 圆角矩形路径 */
export const rrect = (g: Ctx, cx: number, cy: number, w: number, hh: number, r: number) => {
	const x = cx - w / 2;
	const y = cy - hh / 2;
	const rr = Math.max(0, Math.min(r, w / 2, hh / 2));
	g.beginPath();
	g.moveTo(x + rr, y);
	g.lineTo(x + w - rr, y);
	g.arcTo(x + w, y, x + w, y + rr, rr);
	g.lineTo(x + w, y + hh - rr);
	g.arcTo(x + w, y + hh, x + w - rr, y + hh, rr);
	g.lineTo(x + rr, y + hh);
	g.arcTo(x, y + hh, x, y + hh - rr, rr);
	g.lineTo(x, y + rr);
	g.arcTo(x, y, x + rr, y, rr);
	g.closePath();
};

/** 发光圆角框 */
export const glowRect = (g: Ctx, cx: number, cy: number, w: number, hh: number, r: number, c: RGB, lw = 1.2, k = 1) => {
	if (k <= 0.003 || w < 0.5) return;
	rrect(g, cx, cy, w, hh, r);
	for (const [m, a] of PASSES) {
		g.strokeStyle = rgba(c, a * k);
		g.lineWidth = lw * m;
		g.stroke();
	}
	g.strokeStyle = rgba(WHITE, 0.45 * k);
	g.lineWidth = Math.max(0.5, lw * 0.4);
	g.stroke();
};

/** 二次贝塞尔 */
export const qbez = (a: P, c: P, b: P, u: number): P => {
	const v = 1 - u;
	return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]];
};

/** 一次「光的钟形」：在 c 附近 ±w 秒内从 0 升到 1 再落回 */
export const bell = (t: number, c: number, w: number) => Math.exp(-((t - c) / w) * ((t - c) / w));

/** 正弦缓动（镜头用） */
export const sine = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x));
