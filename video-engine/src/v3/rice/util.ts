// 只由时间（帧号 / 30）推出画面的小工具。不用 Math.random，随机一律走带种子的 mulberry32。

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
/** t 在 [t0, t1] 里的进度，0..1 */
export const lin = (t: number, t0: number, t1: number) => (t1 === t0 ? (t >= t1 ? 1 : 0) : clamp((t - t0) / (t1 - t0)));
export const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
export const easeIn = (u: number) => u * u * u;
export const sineInOut = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * u);
/** 从 t0 开始、持续 d 秒的缓动进度 */
export const ramp = (t: number, t0: number, d: number, fn: (u: number) => number = easeInOut) => fn(lin(t, t0, t0 + d));
export const mix = (a: number, b: number, u: number) => a + (b - a) * u;
/** 淡入淡出：tIn 开始淡入，tOut 开始淡出（不传则不淡出） */
export const fade = (t: number, tIn: number, tOut = Infinity, dIn = 0.35, dOut = 0.35) =>
	Math.min(lin(t, tIn, tIn + dIn), 1 - lin(t, tOut, tOut + dOut));
/** 弹出：0→1 带一点回弹 */
export const pop = (t: number, t0: number, d = 0.4) => {
	const u = lin(t, t0, t0 + d);
	if (u <= 0) return 0;
	const c1 = 1.5;
	const c3 = c1 + 1;
	return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};
/** 一次脉冲：t0 起 d 秒内 0→1→0 */
export const pulse = (t: number, t0: number, d = 0.6) => {
	const u = lin(t, t0, t0 + d);
	return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u);
};

export const mulberry32 = (seed: number) => {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

export const hexToRgb = (h: string) => {
	const n = parseInt(h.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mixColor = (a: string, b: string, u: number) => {
	const A = hexToRgb(a);
	const B = hexToRgb(b);
	const c = A.map((x, i) => Math.round(mix(x, B[i], clamp(u))));
	return `rgb(${c[0]},${c[1]},${c[2]})`;
};

/** 平滑闭合曲线（Catmull-Rom → 三次贝塞尔） */
export const smoothClosed = (pts: [number, number][]) => {
	const n = pts.length;
	let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
	for (let i = 0; i < n; i++) {
		const p0 = pts[(i - 1 + n) % n];
		const p1 = pts[i];
		const p2 = pts[(i + 1) % n];
		const p3 = pts[(i + 2) % n];
		const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
		const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
		d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
	}
	return d + 'Z';
};

/** 不规则团块（淀粉块、肉纤维团等），固定种子 */
export const blobPath = (cx: number, cy: number, r: number, seed: number, k = 8, wobble = 0.28, sx = 1, sy = 1) => {
	const rnd = mulberry32(seed);
	const pts: [number, number][] = [];
	const ph = rnd() * Math.PI * 2;
	for (let i = 0; i < k; i++) {
		const a = ph + (i / k) * Math.PI * 2;
		const rr = r * (1 - wobble / 2 + wobble * rnd());
		pts.push([cx + Math.cos(a) * rr * sx, cy + Math.sin(a) * rr * sy]);
	}
	return smoothClosed(pts);
};

/** 估算文字宽度（px）：汉字 1em，数字/拉丁约 0.56em，空格 0.3em。只用于排版留位，不要求精确 */
export const textW = (s: string, size: number) => {
	let w = 0;
	for (const ch of s) {
		if (/\s/.test(ch)) w += 0.3;
		else if (/[0-9]/.test(ch)) w += 0.53;
		else if (/[A-Za-z]/.test(ch)) w += 0.6;
		else if (/[.,:·°+\-/×≈≠≤]/.test(ch)) w += 0.45;
		else w += 1;
	}
	return w * size;
};
