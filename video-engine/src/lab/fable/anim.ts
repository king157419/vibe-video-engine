import {Easing} from 'remotion';

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const penEase = Easing.bezier(0.42, 0, 0.3, 1); // 起笔慢一点，收笔减速
/** 一笔从 t0 画 dur 毫秒的进度 0..1 */
export const progress = (ms: number, t0: number, dur: number) => penEase(clamp01((ms - t0) / dur));
export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const fade = (ms: number, t0: number, dur: number) => easeOut(clamp01((ms - t0) / dur));
/** 线性 0..1 */
export const lin = (ms: number, t0: number, dur: number) => clamp01((ms - t0) / dur);

/** 被说到时轻轻一跳：0 → 1 → 0 */
export const bump = (ms: number, t: number, dur = 520): number => {
	const x = (ms - t) / dur;
	if (x <= 0 || x >= 1) return 0;
	return Math.sin(Math.PI * x) * (1 - x * 0.35);
};

/** 出现后又消失：t0 淡入 din，t1 淡出 dout */
export const window = (ms: number, t0: number, din: number, t1: number, dout: number) => Math.min(fade(ms, t0, din), 1 - fade(ms, t1, dout));
