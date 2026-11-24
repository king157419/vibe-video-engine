import {noise2D} from '@remotion/noise';
import {clamp01, easeInOut, lerp} from './anim';
import {H, W} from './theme';

// 镜头：像白板讲解的摄像机，在一张大纸上平移/缩放。关键帧 = 「从 t 开始，用 dur 毫秒移到 (cx, cy, s)」。
// 两段之间保持上一关键帧的目标值。

export type CamKey = {t: number; dur: number; cx: number; cy: number; s: number};
export type Cam = {cx: number; cy: number; s: number};

export const camAt = (ms: number, keys: CamKey[]): Cam => {
	let cur: Cam = {cx: keys[0].cx, cy: keys[0].cy, s: keys[0].s};
	for (let i = 1; i < keys.length; i++) {
		const k = keys[i];
		if (ms < k.t) break;
		const u = easeInOut(clamp01((ms - k.t) / Math.max(1, k.dur)));
		// 缩放走对数插值，推拉速度感觉均匀
		cur = {cx: lerp(cur.cx, k.cx, u), cy: lerp(cur.cy, k.cy, u), s: Math.exp(lerp(Math.log(cur.s), Math.log(k.s), u))};
		if (u < 1) break;
	}
	return cur;
};

/** 很轻的手持漂移 + 可选的抖动（火上来那一下） */
export const drift = (ms: number, shake: number): [number, number] => {
	const a = 2.2 + shake * 9;
	return [noise2D('camx', ms / 2600, 0) * a, noise2D('camy', 0, ms / 2300) * a];
};

export const camTransform = (c: Cam, d: [number, number]) => `translate(${W / 2 + d[0]} ${H / 2 + d[1]}) scale(${c.s}) translate(${-c.cx} ${-c.cy})`;

export const toScreen = (c: Cam, d: [number, number], p: [number, number]): [number, number] => [
	W / 2 + d[0] + (p[0] - c.cx) * c.s,
	H / 2 + d[1] + (p[1] - c.cy) * c.s,
];
