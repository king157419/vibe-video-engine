/** Canvas 发光画笔。全部用 'lighter' 叠加：光与光相加变亮，像真的光。
 *  用法：在 <GlowCanvas draw={(g, t) => {...}}/> 的 draw 里调用。 */
import {clamp, hexToRgb} from './util';

export type Ctx = CanvasRenderingContext2D;

const rgb = (hex: string) => hexToRgb(hex).join(',');

/** 发光点：白热的核 + 彩色光晕。r 是光晕半径（像素），k 是亮度 0–1+ */
export const dot = (g: Ctx, x: number, y: number, r: number, color: string, k = 1, core = 0.18) => {
	if (k <= 0.002 || r <= 0.1) return;
	const c = rgb(color);
	const grad = g.createRadialGradient(x, y, 0, x, y, r);
	grad.addColorStop(0, `rgba(255,255,255,${clamp(k)})`);
	grad.addColorStop(core, `rgba(${c},${clamp(0.85 * k)})`);
	grad.addColorStop(0.45, `rgba(${c},${clamp(0.22 * k)})`);
	grad.addColorStop(1, `rgba(${c},0)`);
	g.fillStyle = grad;
	g.beginPath();
	g.arc(x, y, r, 0, Math.PI * 2);
	g.fill();
};

/** 大而柔的光雾（不带白核），用于氛围和高潮的辉光 */
export const haze = (g: Ctx, x: number, y: number, r: number, color: string, k = 0.3) => {
	if (k <= 0.002) return;
	const c = rgb(color);
	const grad = g.createRadialGradient(x, y, 0, x, y, r);
	grad.addColorStop(0, `rgba(${c},${clamp(k)})`);
	grad.addColorStop(0.5, `rgba(${c},${clamp(k * 0.3)})`);
	grad.addColorStop(1, `rgba(${c},0)`);
	g.fillStyle = grad;
	g.beginPath();
	g.arc(x, y, r, 0, Math.PI * 2);
	g.fill();
};

/** 发光折线/曲线：多遍描边（宽而淡 → 窄而亮）。pts 是 [x,y][]；w 是核心线宽 */
export const line = (g: Ctx, pts: [number, number][], color: string, w = 2, k = 1, closed = false) => {
	if (pts.length < 2 || k <= 0.002) return;
	const c = rgb(color);
	const passes: [number, number][] = [
		[w * 9, 0.045],
		[w * 4.5, 0.09],
		[w * 2.2, 0.22],
		[w, 0.85],
	];
	g.lineCap = 'round';
	g.lineJoin = 'round';
	for (const [lw, a] of passes) {
		g.strokeStyle = `rgba(${c},${clamp(a * k)})`;
		g.lineWidth = lw;
		g.beginPath();
		g.moveTo(pts[0][0], pts[0][1]);
		for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
		if (closed) g.closePath();
		g.stroke();
	}
	// 白热的中心细线
	g.strokeStyle = `rgba(255,255,255,${clamp(0.55 * k)})`;
	g.lineWidth = Math.max(0.6, w * 0.35);
	g.beginPath();
	g.moveTo(pts[0][0], pts[0][1]);
	for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
	if (closed) g.closePath();
	g.stroke();
};

/** 不发光的细线（结构线、刻度、网格），很暗 */
export const hair = (g: Ctx, pts: [number, number][], color: string, w = 1, a = 0.35) => {
	if (pts.length < 2 || a <= 0.002) return;
	g.strokeStyle = `rgba(${rgb(color)},${clamp(a)})`;
	g.lineWidth = w;
	g.beginPath();
	g.moveTo(pts[0][0], pts[0][1]);
	for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
	g.stroke();
};

/** 发光圆环 */
export const ring = (g: Ctx, x: number, y: number, r: number, color: string, w = 2, k = 1, a0 = 0, a1 = Math.PI * 2) => {
	const n = Math.max(24, Math.ceil(((a1 - a0) * r) / 6));
	const pts: [number, number][] = [];
	for (let i = 0; i <= n; i++) {
		const a = a0 + ((a1 - a0) * i) / n;
		pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
	}
	line(g, pts, color, w, k);
};

/** 彗星：沿轨迹的拖尾光（tail 是已经走过的点，最后一个是头） */
export const comet = (g: Ctx, tail: [number, number][], color: string, w = 2.5, k = 1) => {
	const n = tail.length;
	if (n < 2) return;
	for (let i = 1; i < n; i++) {
		const f = i / (n - 1);
		line(g, [tail[i - 1], tail[i]], color, w * (0.25 + 0.75 * f), k * f * f);
	}
	const [hx, hy] = tail[n - 1];
	dot(g, hx, hy, w * 9, color, k);
};

/** 采样一段二次/三次贝塞尔或任意参数曲线 */
export const sample = (fn: (u: number) => [number, number], n = 64, u0 = 0, u1 = 1): [number, number][] => {
	const out: [number, number][] = [];
	for (let i = 0; i <= n; i++) out.push(fn(u0 + ((u1 - u0) * i) / n));
	return out;
};

/** 截取折线的前 p（0–1）长度，用来做「线条生长」 */
export const partial = (pts: [number, number][], p: number): [number, number][] => {
	if (p >= 1) return pts;
	if (p <= 0 || pts.length < 2) return pts.slice(0, 1);
	const seg: number[] = [];
	let total = 0;
	for (let i = 1; i < pts.length; i++) {
		const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
		seg.push(d);
		total += d;
	}
	let left = total * p;
	const out: [number, number][] = [pts[0]];
	for (let i = 1; i < pts.length; i++) {
		if (left >= seg[i - 1]) {
			out.push(pts[i]);
			left -= seg[i - 1];
		} else {
			const f = left / seg[i - 1];
			out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]);
			break;
		}
	}
	return out;
};

/** 把折线重采样成 n 个等距点（形变转场的前提：两条形状点数一致） */
export const resample = (pts: [number, number][], n: number): [number, number][] => {
	if (pts.length === 0) return [];
	if (pts.length === 1) return Array.from({length: n}, () => [pts[0][0], pts[0][1]] as [number, number]);
	const out: [number, number][] = [];
	for (let i = 0; i < n; i++) {
		const p = partial(pts, n === 1 ? 0 : i / (n - 1));
		out.push(p[p.length - 1]);
	}
	return out;
};

/** 形变：两组点（各自先 resample 成同样数量）按 t 插值。上一幕的主角变成下一幕的起点。 */
export const morph = (a: [number, number][], b: [number, number][], t: number): [number, number][] => {
	const n = Math.max(a.length, b.length, 2);
	const A = a.length === n ? a : resample(a, n);
	const B = b.length === n ? b : resample(b, n);
	return A.map((p, i) => [p[0] + (B[i][0] - p[0]) * t, p[1] + (B[i][1] - p[1]) * t]);
};
