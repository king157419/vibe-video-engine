/** 确定性工具：带种子的随机数、缓动、时间窗。所有动画只由帧号（或秒）推出。 */

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

/** 二维整数哈希 → [0,1)，用于逐帧/逐格的确定性抖动 */
export const hash2 = (x: number, y: number, seed = 0) => {
	let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	h ^= h >>> 16;
	return (h >>> 0) / 4294967296;
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (a: number, b: number, v: number) => clamp((v - a) / (b - a));
export const smooth = (t: number) => {
	const x = clamp(t);
	return x * x * (3 - 2 * x);
};
export const easeInOut = (t: number) => {
	const x = clamp(t);
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
export const easeOutExpo = (t: number) => (clamp(t) >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));

/** 在 [a,b] 区间里淡入（fi 秒）再淡出（fo 秒）的可见度，t 单位秒 */
export const win = (t: number, a: number, b: number, fi = 0.5, fo = 0.5) => {
	if (t < a || t > b) return 0;
	return Math.min(fi > 0 ? smooth((t - a) / fi) : 1, fo > 0 ? smooth((b - t) / fo) : 1);
};

/** 区间进度 0→1（带缓动） */
export const prog = (t: number, a: number, b: number, e: (x: number) => number = easeInOut) => e(inv(a, b, t));

export const hexToRgb = (hex: string): [number, number, number] => {
	const h = hex.replace('#', '');
	const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgba = (hex: string, a: number) => {
	const [r, g, b] = hexToRgb(hex);
	return `rgba(${r},${g},${b},${clamp(a)})`;
};
export const mix = (h1: string, h2: string, t: number) => {
	const a = hexToRgb(h1);
	const b = hexToRgb(h2);
	const c = a.map((v, i) => Math.round(lerp(v, b[i], clamp(t))));
	return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};
