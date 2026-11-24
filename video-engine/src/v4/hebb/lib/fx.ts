/** 全片统一的四种「光」：叮（看得见的版本）、光（真的来了）、虚影、回应。
 *  审片修改（P0）：序的主角整体放大约 2.1 倍（A/B 间距 400 → 850 px），A 有一团萤绿光雾托着；
 *  等光的那段 A 跟着 64 bpm 的心跳一起一亮（呼吸按播放时间算，和配乐的心跳对齐）。 */
import {clamp, easeOut, lerp} from '../../kit';
import {P, meta, toPlay} from '../data';
import {type Ctx, TAU, flare, gring, spr} from './core';

const BEAT0 = meta.prologue.heart_beat0_play; // 播放时间：M1 第一拍
const BEAT = meta.prologue.heart_beat_s; // 0.9375 s
/** 心跳包络（播放时间）：每拍一下，强拍 1、弱拍 0.65，拍后指数回落 */
export const heart = (tp: number) => {
	const ph = (tp - BEAT0) / BEAT;
	const n = Math.floor(ph);
	const f = ph - n;
	const strong = ((n % 2) + 2) % 2 === 0;
	const rise = clamp(f / 0.06);
	return rise * Math.exp(-Math.max(0, f - 0.06) * 3.2) * (strong ? 1 : 0.65);
};

/** 序和片尾的 A：一颗在呼吸的萤绿光点 + 光雾。hb 0–1：心跳呼吸的比重（0 = 慢呼吸）；size 光晕整体缩放 */
export const drawA = (g: Ctx, x: number, y: number, tau: number, k: number, hb = 0, size = 1) => {
	if (k <= 0.003) return;
	const tp = toPlay(tau);
	const slow = 0.5 + 0.5 * Math.sin((TAU * tp) / 3.4);
	const h = lerp(slow, heart(tp), hb);
	// 心跳时：k 在 0.55–0.9 之间、半径 ±20%；慢呼吸时幅度小一些
	const kb = lerp(0.85 + 0.15 * slow, 0.61 + 0.39 * h, hb);
	const rb = (1 + lerp(0.08, 0.2, hb) * (2 * h - 1)) * size;
	spr(g, x, y, 240 * rb, P.leafDeep, 0.32 * k * kb, 'soft');
	spr(g, x, y, 140 * rb, P.leaf, 0.4 * k * kb, 'soft');
	spr(g, x, y, 60 * rb, P.leaf, 0.95 * k * kb);
	spr(g, x, y, 22 * rb, '#eafff0', 0.55 * k * kb);
	flare(g, x, y, 440 * rb, P.leaf, 0.4 * k * kb, 0.012);
};

/** 叮：A 闪光 + 两圈声波环（r 320 / 240，线宽 3） */
export const drawDing = (g: Ctx, x: number, y: number, t: number, td: number, scale = 1, inv = 1) => {
	const u = t - td;
	if (u < 0 || u > 1.6) return;
	if (u < 1.3) {
		const e = easeOut(u / 0.6);
		const r = lerp(44, 120, e) * scale;
		const k = u < 0.6 ? lerp(1, 0.35, e) : 0.35 * (1 - (u - 0.6) / 0.7);
		spr(g, x, y, r * 1.5, P.leaf, k);
		spr(g, x, y, r * 3.2, P.chime, k * 0.24, 'soft');
		flare(g, x, y, 560 * scale, P.chime, k * 0.6, 0.012);
	}
	if (u <= 1.0) {
		const e = easeOut(u);
		gring(g, x, y, lerp(28, 320, e) * scale, P.chime, 3 * inv, 0.9 * Math.pow(1 - u, 1.4));
	}
	const u2 = u - 0.12;
	if (u2 >= 0 && u2 <= 1.0) {
		const e = easeOut(u2);
		gring(g, x, y, lerp(28, 240, e) * scale, P.chime, 2.2 * inv, 0.55 * Math.pow(1 - u2, 1.4));
	}
};

/** 光：B 处金色绽放。0.15 s 升到 K，停 0.2 s，1.1 s easeOut 落到 0；haze r 480；30 颗火花飘出约 80 px */
export const lightK = (u: number) => {
	if (u < 0) return 0;
	if (u < 0.15) return easeOut(u / 0.15);
	if (u < 0.35) return 1;
	return clamp(1 - easeOut((u - 0.35) / 1.1));
};
export const drawLight = (g: Ctx, x: number, y: number, t: number, tl: number, K = 1, scale = 1) => {
	const u = t - tl;
	if (u < 0 || u > 1.6) return;
	const k = lightK(u) * K;
	spr(g, x, y, 480 * scale, P.amber, 0.32 * k, 'soft');
	spr(g, x, y, 200 * scale, P.gold, 0.55 * k, 'soft');
	spr(g, x, y, 150 * scale, P.gold, 0.9 * k);
	spr(g, x, y, 60 * scale, P.goldCore, 0.9 * k);
	flare(g, x, y, 820 * scale, P.gold, 0.75 * k, 0.012);
	const su = u / 1.3;
	if (su < 1) {
		const d = (28 + 80 * easeOut(su)) * scale;
		const a = Math.pow(1 - su, 1.5) * Math.min(K, 1.2) * easeOut(u / 0.15);
		for (let j = 0; j < 30; j++) {
			const ang = (j / 30) * TAU + 0.37 * Math.sin(j * 12.9898);
			const dd = d * (0.7 + 0.6 * (((j * 7) % 11) / 11));
			spr(g, x + Math.cos(ang) * dd, y + Math.sin(ang) * dd, 11 * scale, P.goldCore, a * 0.9, 'spark');
		}
	}
};

/** 虚影（脑子替它亮了一下）：暖金色的柔光盘，没有硬边的环；正弦淡入淡出，不呼吸、不出火花 */
export const drawGhost = (g: Ctx, x: number, y: number, t: number, t0: number, t1: number) => {
	if (t < t0 || t > t1) return;
	const a = Math.sin((Math.PI * (t - t0)) / (t1 - t0));
	spr(g, x, y, 260, P.amber, 0.16 * a, 'soft');
	spr(g, x, y, 110, P.gold, 0.3 * a, 'soft');
	spr(g, x, y, 80, P.gold, 0.22 * a);
};

/** 小型放电（不出声）：一圈小声波环 */
export const drawFireRing = (g: Ctx, x: number, y: number, t: number, tf: number, color: string, R = 110, w = 1.4) => {
	const u = (t - tf) / 0.8;
	if (u < 0 || u > 1) return;
	gring(g, x, y, lerp(18, R, easeOut(u)), color, w, 0.6 * Math.pow(1 - u, 1.5));
};
