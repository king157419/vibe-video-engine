// 数据与时间轴：字幕（subs.json）是时钟，镜头/事件来自 beats.json，所有数字来自 numbers.json。
// 画面代码里不手写毫秒：动作都写成“第 n 句字幕出现 + 偏移秒”，或 beats.json 里的事件时间。
import {COL} from './theme';

export type Sub = {t0: number; t1: number; zh: string};
export type CamKey = [number, string, number | [number, number] | null];
export type Beats = {
	durationSec: number;
	sections: {id: string; name: string; subs: number[]; t0: number; t1: number}[];
	camera: CamKey[];
	pins: {text: string; hour: number; showAt: number; writeSec: number}[];
	events: [string, number, number][];
};
export type Series = {t: number[]; S: number[]; C: number[]};
export type Numbers = {
	scroll: {t0: number; t1: number; hours: number};
	opening: {t0: number; t1: number; clockKeys: [number, number][]};
	model: {tauWake: number; tauSleep: number; S0: number; cLow: number; cAmp: number};
	main: Series & {step: number};
	keys: {
		d1_21_gap: number;
		gapOpen: number;
		maxGap: {t: number; g: number};
		wide90: [number, number];
		reliefBest: {t: number; g: number};
		afternoonMax: {t: number; g: number};
		tidePeak: number;
		tideTrough: number;
		tideDip: number;
	};
	pins: {t: number; text: string}[];
	cards: {t: number[]; A: number[]; B: number[]; C: number[]};
	accidents: {source: string; n: number; peaks: number[]; label: string};
	london: Series & {tzDiff: number; keyLocal: number; keyHome: number};
	nap: Series & {start: number; len: number; Sno: number[]; openNo: number; openNap: number};
	chronotype: {M: number; N: number; E: number; diffH: number};
	sky: {season: string; sunrise: number; sunset: number};
};
export type Props = {subs: Sub[] | null; beats: Beats | null; nums: Numbers | null};

// ---------------------------------------------------------------- 数学小工具
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const ramp = (t: number, t0: number, dur: number) => (dur <= 0 ? (t >= t0 ? 1 : 0) : clamp01((t - t0) / dur));
export const ease = (u: number) => {
	const x = clamp01(u);
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (u: number) => 1 - Math.pow(1 - clamp01(u), 3);
export const easeIn = (u: number) => Math.pow(clamp01(u), 3);
export const easeOutBack = (u: number) => {
	const x = clamp01(u);
	const c1 = 1.4;
	const c3 = c1 + 1;
	return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
/** 出现 → 停留 → 消失 的不透明度 */
export const window01 = (t: number, t0: number, t1: number, fin = 0.4, fout = 0.4) =>
	Math.min(ramp(t, t0, fin), 1 - ramp(t, t1 - fout, fout));
/** 闪一下：0→1→0（用于“亮一下”） */
export const pulse = (t: number, t0: number, dur = 1.0) => {
	const u = (t - t0) / dur;
	if (u <= 0 || u >= 1) return 0;
	return Math.sin(Math.PI * u);
};

/** 有序数组上的线性插值（两端夹住） */
export const interp = (xs: number[], ys: number[], x: number) => {
	const n = xs.length;
	if (x <= xs[0]) return ys[0];
	if (x >= xs[n - 1]) return ys[n - 1];
	let lo = 0;
	let hi = n - 1;
	while (hi - lo > 1) {
		const m = (lo + hi) >> 1;
		if (xs[m] <= x) lo = m;
		else hi = m;
	}
	const u = (x - xs[lo]) / (xs[hi] - xs[lo]);
	return ys[lo] + (ys[hi] - ys[lo]) * u;
};

/** 单调三次插值（Fritsch–Carlson）：镜头关键帧之间平滑、不回退；值不变的两帧之间速度为 0（停住） */
export const pchip = (xs: number[], ys: number[]) => {
	const n = xs.length;
	const h: number[] = [];
	const d: number[] = [];
	for (let k = 0; k < n - 1; k++) {
		h.push(xs[k + 1] - xs[k]);
		d.push((ys[k + 1] - ys[k]) / (xs[k + 1] - xs[k]));
	}
	const m: number[] = new Array(n).fill(0);
	for (let k = 1; k < n - 1; k++) {
		if (d[k - 1] * d[k] <= 0) m[k] = 0;
		else {
			const w1 = 2 * h[k] + h[k - 1];
			const w2 = h[k] + 2 * h[k - 1];
			m[k] = (w1 + w2) / (w1 / d[k - 1] + w2 / d[k]);
		}
	}
	m[0] = 0; // 起步、收尾都从静止开始
	m[n - 1] = 0;
	return (x: number) => {
		if (x <= xs[0]) return ys[0];
		if (x >= xs[n - 1]) return ys[n - 1];
		let k = 0;
		while (k < n - 2 && x > xs[k + 1]) k++;
		const s = (x - xs[k]) / h[k];
		const h00 = 2 * s ** 3 - 3 * s ** 2 + 1;
		const h10 = s ** 3 - 2 * s ** 2 + s;
		const h01 = -2 * s ** 3 + 3 * s ** 2;
		const h11 = s ** 3 - s ** 2;
		return h00 * ys[k] + h10 * h[k] * m[k] + h01 * ys[k + 1] + h11 * h[k] * m[k + 1];
	};
};

/** 带种子的确定性伪随机（mulberry32） */
export const rng = (seed: number) => {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};
/** 平滑的一维“手抖”：几个不可约频率的正弦相加，按故事时间取值，所以平移、缩放时线不会抖 */
export const wobble = (x: number, seed = 0) =>
	0.5 * Math.sin(x * 2.31 + seed * 1.7) + 0.3 * Math.sin(x * 5.17 + seed * 3.1 + 1.3) + 0.2 * Math.sin(x * 11.3 + seed * 0.7 + 2.1);

// ---------------------------------------------------------------- 颜色
const hex = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
export const mix = (a: string, b: string, u: number) => {
	const A = hex(a);
	const B = hex(b);
	const v = A.map((x, i) => Math.round(x + (B[i] - x) * clamp01(u)));
	return `#${v.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
};

/** 天色带：一天中的钟点 → 颜色（10 月中旬北京：日出 06:23、日落 17:37，色标照分镜表 §1） */
const SKY_STOPS: [number, string][] = [
	[0, COL.deep],
	[5.3, COL.deep],
	[5.85, mix(COL.deep, COL.pink, 0.55)],
	[6.35, COL.pink],
	[7.0, COL.gold],
	[9.5, COL.noon],
	[15.6, COL.noon],
	[16.5, COL.dusk],
	[17.9, COL.dusk],
	[18.6, COL.indigo],
	[19.3, COL.deep],
	[24, COL.deep],
];
export const skyColor = (hour: number) => {
	const h = ((hour % 24) + 24) % 24;
	for (let k = 0; k < SKY_STOPS.length - 1; k++) {
		const [h0, c0] = SKY_STOPS[k];
		const [h1, c1] = SKY_STOPS[k + 1];
		if (h >= h0 && h <= h1) return mix(c0, c1, (h - h0) / (h1 - h0));
	}
	return COL.deep;
};
/** 天有多黑（0 白天 → 1 深夜）：决定星星、天色带里的字用白色还是墨色 */
export const darkness = (hour: number) => {
	const c = hex(skyColor(hour));
	const lum = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
	return clamp01((0.75 - lum) / 0.5);
};

// ---------------------------------------------------------------- 曲线
export type Model = ReturnType<typeof makeModel>;
export const makeModel = (n: Numbers) => {
	const {t, S, C} = n.main;
	const h0 = t[0];
	const wrap = (h: number) => h0 + ((((h - h0) % 24) + 24) % 24);
	const s = (h: number) => interp(t, S, h);
	const c = (h: number) => interp(t, C, h >= h0 && h <= t[t.length - 1] ? h : wrap(h));
	return {
		S: s,
		C: c,
		/** 潮水整体平移 shift 小时（时型、倒时差用） */
		Cshift: (h: number, shift: number) => c(wrap(h - shift)),
		gap: (h: number) => s(h) - c(h),
	};
};

// ---------------------------------------------------------------- 时间锚
export const makeClock = (subs: Sub[], beats: Beats) => {
	/** 第 n 句字幕（从 1 数，和分镜表的 ①…㉚ 对应） */
	const sub = (n: number) => subs[n - 1];
	/** beats.json 里名字以 key 开头的事件的开始秒 */
	const ev = (key: string) => {
		const e = beats.events.find((x) => x[0].startsWith(key));
		if (!e) throw new Error(`beats.json 里没有事件：${key}`);
		return e[1];
	};
	const evDur = (key: string) => {
		const e = beats.events.find((x) => x[0].startsWith(key));
		return e ? e[2] : 1;
	};
	const cam = (mode: string, k = 0) => beats.camera.filter((c) => c[1] === mode)[k][0];
	return {sub, ev, evDur, cam, end: beats.durationSec};
};
export type Clock = ReturnType<typeof makeClock>;

/** 故事时间（从第一天 0 点算的小时）→ 纸签文字（只走整点） */
export const tagText = (hour: number) => {
	const h = Math.floor(hour + 1e-6);
	const day = h < 24 ? '第一天' : '第二天';
	const hh = ((h % 24) + 24) % 24;
	const part = hh < 6 ? '凌晨' : hh < 9 ? '早上' : hh < 12 ? '上午' : hh < 13 ? '中午' : hh < 18 ? '下午' : hh < 19 ? '傍晚' : '晚上';
	return {day, part, clock: `${String(hh).padStart(2, '0')}:00`};
};
export const hhmm = (hour: number) => {
	const hh = ((Math.floor(hour) % 24) + 24) % 24;
	return `${String(hh).padStart(2, '0')}:00`;
};
