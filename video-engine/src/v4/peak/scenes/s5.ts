/** 05 我（204.45–244.65）：推近 B 的尾巴（3.2×）→ 一个很小的粉红折角（吵散了）→ 灰从折角往回渗 → 一天一天点亮 300 颗
 *  → 尾巴拉直成片头那条旋律线（这次是亮的）→ 两个自己：冰蓝点过日子，金点讲故事，只在峰和终俯冲 → 诗（DOM）。 */
import {clamp, easeInOut, hash2, lerp, prog, smooth, win} from '../../kit/util';
import type {Assets} from '../assets';
import {B_OFF, type Data} from '../data';
import {arc, beam, beamX, bell, blit, comet, type Ctx, glow, GOLD, GREY, haze, ICE, ICE_W, mdot, mixc, morph, type P, PINK, resample, type RGB, WARM} from '../fx';
import {crackPts, drawMelody, MEL_W} from './s0';

const FOLD: P[] = [
	[1560, 430 + B_OFF],
	[1567, 421 + B_OFF],
	[1575, 441 + B_OFF],
];
const TAU_PEAK = 1 + (837.5 - 260) / 112;
/** 两个自己：冰蓝点沿旋律走的 τ（12 秒的旋律压成 6 秒） */
export const selfTau = (t: number) => clamp(1 + 2 * (t - 224.6), 1, 13);
/** 金点的俯冲量（0 = 在上方 150 px，1 = 落到线上） */
export const swoop = (tau: number) => Math.max(bell(tau, TAU_PEAK, 0.42), tau > 12.4 ? bell(Math.min(tau, 13), 13, 0.42) : 0);
export const goldSelfPos = (D: Data, t: number): P => {
	const tau = selfTau(t);
	const [x, y] = D.melAt(tau);
	let s = swoop(tau);
	if (t > 230.6) s *= 1 - smooth((t - 230.6) / 0.8); // 到终点后升回去，停在上方
	return [x, y - 150 * (1 - s)];
};

export const drawS5 = (g: Ctx, t: number, frame: number, D: Data, A: Assets) => {
	if (t < 204.45 || t > 244.7) return;
	const ext = D.lifeBExtPts;
	// ---------- 尾巴 ----------
	if (t < 219.6) {
		const kUp = lerp(0.3, 0.85, smooth((t - 204.45) / 0.9));
		const fold = smooth((t - 207.2) / 0.25);
		const greyX = lerp(1575, 1295, prog(t, 208.4, 210.6, (x) => x));
		const greyOn = t >= 208.4;
		const mo = easeInOut(prog(t, 218.3, 219.5, (x) => x));
		const f = (x: number): [RGB, number] => {
			if (!greyOn) return [mixc(ICE, ICE_W, 0.2), kUp];
			const s = smooth((x - greyX) / 18);
			return [mixc(mixc(ICE, ICE_W, 0.2), GREY, s), lerp(kUp, 0.2, s)];
		};
		if (mo <= 0) beamX(g, ext, 1.6, f, 80, 0.4);
		// 灰往回渗的前沿：一小团粉灰的光沿尾巴往左扫（看得见的横扫）
		if (greyOn && t < 211.0) {
			const fk = win(t, 208.4, 210.9, 0.2, 0.4);
			const v = clamp((greyX - 1300) / 260);
			const [gx, gy] = ext[Math.round(v * (ext.length - 1))];
			haze(g, gx, gy, 26, mixc(PINK, GREY, 0.4), 0.35 * fk);
			glow(g, gx, gy, 6, mixc(PINK, GREY, 0.5), 0.6 * fk, 0.3);
		}
		// 粉红折角
		if (fold > 0 && mo < 1) {
			const fk = t < 207.6 ? lerp(1.5, 0.9, (t - 207.2) / 0.4) : lerp(0.9, 0.4, prog(t, 210.0, 211.5));
			beam(g, FOLD, PINK, 1.4, fk * fold * (1 - mo), false, 0.45);
			if (t < 208.2) haze(g, FOLD[1][0], FOLD[1][1], 40, PINK, 0.35 * (1 - (t - 207.2)));
		}
		// 一天一天：300 颗冰蓝小点，每秒 60 颗；每颗点亮时闪一下
		const n = Math.floor(clamp((t - 212.2) * 60, 0, 300));
		const src = resample(ext, 300);
		const dst = resample(D.melPts, 300);
		const pos = mo > 0 ? morph(src, dst, mo) : src;
		if (mo > 0 && t < 219.55) {
			// 尾巴拉直、展开成片头的旋律线（灰 → 亮的冰蓝）
			beam(g, pos, mixc(GREY, ICE, mo), lerp(1.6, MEL_W, mo), lerp(0.25, 1.0, mo) * (1 - smooth((t - 219.4) / 0.15)), false, 0.5);
		}
		const dotFade = 1 - smooth((t - 219.3) / 1.0);
		for (let i = 0; i < n; i++) {
			const [x, y] = pos[i];
			const age = t - (212.2 + i / 60);
			const fl = age < 0.35 ? 1 - age / 0.35 : 0;
			const tw = 0.7 + 0.3 * Math.sin(t * 3 + 6.283 * hash2(i, 2, 9));
			const jy = (hash2(i, 1, 9) - 0.5) * 9 * (1 - mo);
			blit(g, A.spr.iceW, x + (hash2(i, 3, 9) - 0.5) * 1.5, y + jy, 1.6 + 3.2 * fl, (0.6 * tw + 0.5 * fl) * dotFade);
		}
		g.globalAlpha = 1;
		// 点亮的那一头：一颗小笔尖
		if (n > 0 && n < 300 && mo <= 0) {
			const [hx, hy] = pos[n - 1];
			glow(g, hx, hy, 6, ICE_W, 0.9, 0.35);
		}
	}
	// ---------- 回到旋律线 ----------
	if (t >= 219.4 && t < 237.9) {
		const a = smooth((t - 219.4) / 0.15) * (1 - smooth((t - 237.05) / 0.8));
		const replayP = prog(t, 219.5, 223.3);
		const replayK = clamp(Math.min((t - 219.5) / 0.4, (223.6 - t) / 0.5));
		// 231.6–237.0：整条线保持全亮（这一次不熄灭），一道很淡的光沿线一直往前走
		const flowK = win(t, 231.4, 237.4, 0.6, 0.6);
		const flowX = 260 + 1400 * ((t - 231.4) / 2.6 - Math.floor((t - 231.4) / 2.6));
		drawMelody(g, D, {
			tauEnd: 13,
			k: a,
			pinkOn: 1,
			tailK: 0.35,
			replayX: lerp(260, 1520, replayP),
			replayK: replayK * 0.8,
			swell: (x) => 0.35 * flowK * Math.exp(-(((x - flowX) / 120) ** 2)),
		});
		beam(g, crackPts(D, D.endPt), PINK, 2.0, 0.35 * a, false, 0.4);
		if (replayK > 0) {
			const x = lerp(260, 1520, replayP);
			const [, y] = D.melAt(1 + (x - 260) / 112);
			haze(g, x, y, 110, WARM, 0.24 * replayK);
		}
		// 两个自己
		if (t >= 224.4) {
			const sa = smooth((t - 224.4) / 0.4) * a;
			const tau = selfTau(t);
			const [ix, iy] = D.melAt(tau);
			const iceK = sa * (1 - smooth((t - 230.8) / 0.8));
			// 冰蓝点走过的那一小段带彗星尾巴
			const n = Math.max(2, Math.round((tau - 1) / 0.01) + 1);
			comet(g, D.melPts.slice(0, n), 80, ICE_W, MEL_W, 0.8 * iceK);
			haze(g, ix, iy, 60, ICE, 0.2 * iceK);
			glow(g, ix, iy, 16, ICE_W, iceK, 0.3);
			// 每个音都踩到：踩到的那一下放一圈小环
			for (const nt of D.num.melody) {
				const tn = 224.6 + (nt.t - 1) / 2;
				if (t < tn || t > tn + 0.6) continue;
				const p = (t - tn) / 0.6;
				arc(g, D.melAt(nt.t + 0.12)[0], nt.y, 6 + 22 * p, ICE, 1.0, 0.45 * (1 - p) * sa, 0, Math.PI * 2, 0.3);
			}
			const [gx, gy] = goldSelfPos(D, t);
			let s = swoop(tau);
			if (t > 230.6) s *= 1 - smooth((t - 230.6) / 0.8);
			mdot(g, gx, gy, 12 + 6 * s, GOLD, sa * (0.45 + 0.75 * s) * (t > 231.4 ? 0.9 + 0.1 * Math.sin((t - 231.4) * 2.2) : 1));
			// 金印记：俯冲到底时留下
			const marks: [number, P][] = [
				[224.6 + (TAU_PEAK - 1) / 2, D.peakPt],
				[230.6, D.endPt],
			];
			for (const [tm, p] of marks) {
				if (t < tm) continue;
				const fl = Math.exp(-(((t - tm - 0.05) / 0.18) ** 2));
				mdot(g, p[0], p[1], 10 + 10 * fl, GOLD, a * (0.9 + 0.8 * fl));
			}
		}
	}
	// ---------- 诗：「追忆」升起几颗金色的光尘，「当时」几颗冰蓝的 ----------
	if (t >= 239.4 && t < 244.7) {
		const pa = win(t, 239.4, 244.6, 1.0, 0.8);
		const emit = (pts: {p: P; ci: number}[], lo: number, hi: number, y0: number, spr: HTMLCanvasElement, seed: number) => {
			const sel = pts.filter((q) => q.ci >= lo && q.ci < hi);
			for (let q = 0; q < 16; q++) {
				const per = 2.6 + 1.2 * hash2(q, 1, seed);
				const cyc = (t - 239.4) / per + hash2(q, 2, seed);
				const ph = cyc - Math.floor(cyc);
				const s = sel[Math.floor(hash2(q, Math.floor(cyc), seed + 1) * sel.length)];
				const x = 960 + s.p[0] + 8 * Math.sin(ph * 3 + q);
				const y = y0 + s.p[1] - 70 * ph;
				blit(g, spr, x, y, 4.5, 0.55 * pa * Math.sin(Math.PI * ph));
			}
		};
		emit(A.poem1, 5, 7, 400, A.spr.gold, 241);
		emit(A.poem2, 2, 4, 480, A.spr.ice, 242);
		g.globalAlpha = 1;
	}
	void frame;
};
