import {clamp01, easeInOut, easeOut} from './cam';

/** 0→1：从 a 开始，用 d 秒 */
export const ramp = (t: number, a: number, d = 0.35) => clamp01((t - a) / d);
/** 缓出淡入 */
export const fin = (t: number, a: number, d = 0.35) => easeOut(ramp(t, a, d));
/** 在 [a, b] 之间显示：a 处淡入，b 处淡出 */
export const win = (t: number, a: number, b: number, fi = 0.35, fo = 0.35) => Math.min(fin(t, a, fi), 1 - easeInOut(ramp(t, b, fo)));
/** 一次脉冲 0→1→0 */
export const bump = (t: number, a: number, d = 0.5) => {
	const s = (t - a) / d;
	return s <= 0 || s >= 1 ? 0 : Math.sin(Math.PI * s);
};
/** 位置插值：在 a 处开始从 p 移到 q */
export const mv = (t: number, a: number, d: number, p: number, q: number) => p + (q - p) * easeInOut(ramp(t, a, d));
