/** 00 序（0–38.1）：一支笔尖跟着钢琴画出旋律线 → 最后一个音弹错 → 重放 → 暗影扫过只留两颗金点 → 炸成片名「峰 终」。 */
import {clamp, easeOut, hash2, lerp, prog, smooth, win} from '../../kit/util';
import type {Assets} from '../assets';
import type {Data} from '../data';
import {arc, beam, beamX, bell, blit, comet, type Ctx, glow, GOLD, haze, ICE, ICE_W, mdot, mixc, type P, PINK, type RGB, WARM, WHITE} from '../fx';
import {drawTitle} from './title';

/** 主角线的粗细（审片修改：2.2 → 3.2） */
export const MEL_W = 3.2;

/** 旋律线的一帧（00 序、03 章唱片前、05 章都会用）。opts 控制粉红尾段、重放光、暗影扫过 */
export type MelOpts = {
	tauEnd: number; // 画到哪（1–13）
	k: number; // 整体亮度
	pinkOn: number; // 尾段变粉的程度（0–1）
	replayX?: number; // 重放光团所在 x
	replayK?: number;
	shadeX?: number; // 暗影扫到的 x（左边熄到 floor）
	floor?: number;
	stopAt?: number; // 重放光走到这里停
	w?: number;
	tailK?: number; // 粉红尾段单独的亮度倍数（05 章回到旋律线时 0.35）
	swell?: (x: number) => number; // 额外的亮度（每个音起头那一段鼓一下、沿线走的光脉冲）
};

export const drawMelody = (g: Ctx, D: Data, o: MelOpts) => {
	const n = Math.max(2, Math.round((clamp(o.tauEnd, 1, 13) - 1) / 0.01) + 1);
	const pts = D.melPts.slice(0, n);
	const floor = o.floor ?? 0.06;
	const notes = D.num.melody;
	/** 每个音像琴弦被拨了一下：起头亮、往后慢慢暗下去（一直保留，不只是画的那一刻）——读起来是一串被弹响的音，不是一张台阶图 */
	const env = (x: number) => {
		let xs = notes[0].x;
		for (const nt of notes) if (nt.x <= x) xs = nt.x;
		return 0.74 + 0.5 * Math.exp(-(x - xs) / 120);
	};
	const f = (x: number): [RGB, number] => {
		let c: RGB = ICE;
		let k = o.k * env(x);
		const tail = smooth((x - 1520) / 84);
		if (o.pinkOn > 0 && x > 1500) c = mixc(ICE, PINK, tail * o.pinkOn);
		if (o.tailK !== undefined && x > 1500) k *= lerp(1, o.tailK, tail);
		if (o.swell) k += o.swell(x) * (1 - 0.6 * tail * o.pinkOn);
		if (o.replayK && o.replayX !== undefined && x < (o.stopAt ?? 1520) + 30) {
			const b = o.replayK * Math.exp(-(((x - o.replayX) / 75) ** 2));
			k += 0.9 * b;
			c = mixc(c, WARM, 0.7 * b);
		}
		if (o.shadeX !== undefined) {
			const s = smooth((o.shadeX - x) / 110);
			k = k * (1 - s) + floor * s;
		}
		return [c, k];
	};
	beamX(g, pts, o.w ?? MEL_W, f, 240);
	return pts;
};

export const crackPts = (D: Data, at: P, scale = 1): P[] => D.crack.map(([dx, dy]) => [at[0] + dx * scale, at[1] + dy * scale]);

/** 每个音起头，刚画出的那一段亮度鼓一下再回落（0.35 s 衰减） */
export const noteSwell = (D: Data, t: number, t0 = 0, amp = 0.75) => (x: number) => {
	let s = 0;
	for (const nt of D.num.melody) {
		const ot = nt.t + t0;
		if (t < ot || t > ot + 1.6) continue;
		const xs = nt.x - 24;
		const xe = nt.x + 112 * (t - ot) + 8;
		if (x < xs || x > xe) continue;
		s += amp * Math.exp(-(t - ot) / 0.35) * smooth((x - xs) / 24) * smooth((xe - x) / 30);
	}
	return s;
};

export const drawS0 = (g: Ctx, t: number, frame: number, D: Data, A: Assets) => {
	if (t > 38.2) return;
	const notes = D.num.melody;
	const lineVis = 1 - smooth((t - 31.1) / 1.2);
	const breath = t > 13.6 ? 0.925 + 0.075 * Math.cos((2 * Math.PI * (t - 13.6)) / 3) : 1;
	const pinkOn = smooth((t - 12.25) / 0.2);
	const shadeX = t < 25.9 ? undefined : lerp(180, 1720, prog(t, 25.9, 28.7, (x) => x));
	const replayP = prog(t, 19.6, 23.6);
	const replayK = win(t, 19.5, 23.9, 0.4, 0.5);
	// 13.6–19.4 的余味里：一道很淡的光沿线来回流动（画面一直在动，不靠镜头漂移）
	const flowK = win(t, 13.8, 19.6, 0.8, 0.6);
	const flowX = 260 + 1300 * ((t - 13.8) / 2.9 - Math.floor((t - 13.8) / 2.9));
	const swellN = noteSwell(D, t);
	const swell = (x: number) => swellN(x) + 0.32 * flowK * Math.exp(-(((x - flowX) / 110) ** 2));
	if (t >= 1.0 && lineVis > 0) {
		const pts = drawMelody(g, D, {
			tauEnd: t,
			k: breath * lineVis,
			pinkOn,
			replayX: lerp(260, 1520, replayP),
			replayK,
			shadeX,
			floor: 0.06 * lineVis,
			swell,
		});
		// 笔尖的彗星尾巴（约 0.4 s 的路程）
		if (t < 13.4) comet(g, pts, 60, mixc(ICE_W, PINK, pinkOn), MEL_W, smooth((t - 1.0) / 0.3) * (1 - smooth((t - 12.9) / 0.5)));
		// 重放光团本身
		if (replayK > 0) {
			const x = lerp(260, 1520, replayP);
			const tau = 1 + (x - 260) / 112;
			const [, y] = D.melAt(tau);
			haze(g, x, y, 120, WARM, 0.26 * replayK);
			glow(g, x, y, 26, WARM, 0.6 * replayK);
		}
	}
	// 每个音起头，笔尖放出一圈很淡的小环（环心跟着笔尖走：音高现在是 0.42 s 滑上去的）
	for (let i = 0; i < notes.length; i++) {
		const ot = notes[i].t;
		if (t < ot || t > ot + 0.8) continue;
		const p = (t - ot) / 0.8;
		const [x, y] = D.melAt(Math.min(13, ot + 0.6 * (t - ot)));
		arc(g, x, y, 6 + 24 * easeOut(p), i === notes.length - 1 ? PINK : ICE, 1.1, 0.5 * (1 - p), 0, Math.PI * 2, 0.3);
	}
	// 笔尖
	if (t >= 0.9 && t < 14.6) {
		const tau = clamp(t, 1, 13);
		let [x, y] = D.melAt(tau);
		if (t >= 12.25 && t < 12.65) {
			x += (hash2(frame, 1, 3) - 0.5) * 6;
			y += (hash2(frame, 2, 3) - 0.5) * 6;
		}
		const pc = mixc(ICE_W, PINK, pinkOn);
		const k = smooth((t - 0.9) / 0.35) * (1 - smooth((t - 13.0) / 1.4));
		haze(g, x, y, 110, pc, 0.16 * k);
		glow(g, x, y, 18, pc, k, 0.3);
		glow(g, x, y, 5.5, mixc(pc, WHITE, 0.6), k, 0.5);
	}
	// 裂痕：13.0 出现，闪 0.3 s，然后保持 0.7；被暗影扫过后留 0.5
	if (t >= 13.0) {
		let k = t < 13.3 ? lerp(1.7, 0.7, (t - 13.0) / 0.3) : 0.7 + 0.12 * Math.sin(t * 5.3) * (t < 25.9 ? 1 : 0);
		if (shadeX !== undefined) k = lerp(k, 0.5, smooth((shadeX - 1604) / 110));
		k *= lineVis;
		const cp = crackPts(D, D.endPt);
		beam(g, cp, PINK, 2.2, k, false, 0.5);
		if (t < 13.6) haze(g, D.endPt[0] + 20, D.endPt[1], 140, PINK, 0.3 * (1 - (t - 13.0) / 0.6));
		// 裂痕上一直往上飘的几颗粉红火星（13.3–25.9）
		if (t > 13.3 && t < 26.4) {
			const sa = smooth((t - 13.3) / 0.6) * (1 - smooth((t - 25.6) / 0.8)) * lineVis;
			for (let q = 0; q < 10; q++) {
				const per = 2.4 + 1.2 * hash2(q, 1, 13);
				const ph = (t - 13.3) / per + hash2(q, 2, 13);
				const cyc = Math.floor(ph);
				const u = ph - cyc;
				const sx = D.endPt[0] + 4 + 40 * hash2(q, cyc, 14) + 10 * Math.sin(u * 4 + q);
				const sy = D.endPt[1] + 10 - 120 * u;
				blit(g, A.spr.pink, sx, sy, 5 + 3 * (1 - u), 0.55 * sa * Math.sin(Math.PI * u));
			}
			g.globalAlpha = 1;
		}
	}
	// 暗影扫过：峰点和终点各留一颗金点
	if (shadeX !== undefined) {
		const mk = (x: number, y: number) => {
			const tp = 25.9 + (2.8 * (x - 180)) / 1540;
			if (t < tp) return;
			let k = smooth((t - tp) / 0.35) * (0.9 + 0.7 * bell(t, tp + 0.2, 0.25)) * (0.9 + 0.1 * Math.sin((t - tp) * 2.6));
			let r = 22;
			if (t > 30.6) {
				const b = smooth((t - 30.6) / 0.5);
				k *= 1 + 0.5 * b;
				r = 22 + 8 * b;
			}
			k *= 1 - smooth((t - 31.1) / 0.22);
			mdot(g, x, y, r, GOLD, k);
		};
		mk(D.peakPt[0], D.peakPt[1]);
		mk(D.endPt[0], D.endPt[1]);
	}
	// 31.1：两颗金点炸开（冲击环 + 一团光 + 以两点为中心的径向闪光），粒子聚成「峰」「终」
	if (t >= 31.1 && t < 33.5) {
		const p = (t - 31.1) / 1.2;
		for (const [x, y] of [D.peakPt, D.endPt]) {
			if (p < 1) {
				arc(g, x, y, 10 + 220 * easeOut(p), GOLD, 1.4, 0.6 * (1 - p), 0, Math.PI * 2, 0.4);
				arc(g, x, y, 6 + 130 * easeOut(p * 1.3), WARM, 1.0, 0.4 * (1 - p), 0, Math.PI * 2, 0.3);
			}
			haze(g, x, y, 340, GOLD, 0.34 * bell(t, 31.15, 0.25));
		}
		const fl = Math.exp(-(((t - 31.13) / 0.07) ** 2));
		if (fl > 0.01) haze(g, (D.peakPt[0] + D.endPt[0]) / 2, (D.peakPt[1] + D.endPt[1]) / 2, 1100, WARM, 0.22 * fl);
	}
	drawTitle(g, t, D, A, {t0: 31.1, from: [D.peakPt, D.endPt], glyphIn: 33.1, out0: 36.9, out1: 37.9, mini: 33.6});
};
