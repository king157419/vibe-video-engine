/** 03 终（122.5–163.95）：682 颗病人点落下、一分为二 → 两颗记忆光点（4.9 / 4.4，论文原值）→ 回来复查的沿弧线回到左边
 *  → 片头旋律原样再画一遍 → 卷成一张唱片 → 唱针走到最内圈，同一道粉红裂痕 → 粉红渗过整张唱片，褪成灰。 */
import {clamp, easeInOut, easeOut, hash2, lerp, prog, smooth} from '../../kit/util';
import type {Assets} from '../assets';
import type {Data} from '../data';
import {arc, beam, blit, comet, type Ctx, DIM, glow, GOLD, GREY, haze, ICE, ICE_W, memDot, mixc, type P, PINK, qbez, resample, morph, type RGB, SILVER} from '../fx';
import {crackPts, drawMelody, MEL_W, noteSwell} from './s0';

// 审片修改：两颗记忆光点从右三分之一挪到画面中线两侧
export const M3A: P = [860, 400];
export const M3B: P = [1060, 660];

export const REC: P = [960, 470];
export const ringR = (i: number) => 90 + (210 * i) / 25; // 26 圈，90→300
const SEEP0 = 151.6;
const seepT = (r: number) => SEEP0 + (3 * (r - 90)) / 220;
export const needleR = (t: number) => lerp(300, 90, prog(t, 144.9, 150.85, (x) => x));
export const needleTip = (r: number): P => [REC[0] + r * Math.cos((-50 * Math.PI) / 180), REC[1] + r * Math.sin((-50 * Math.PI) / 180)];

/** 转盘角度：0.56 圈/秒，151.6 起 3 秒内平滑停下 */
export const recRot = (t: number) => {
	const w = 2 * Math.PI * 0.56;
	if (t < SEEP0) return w * (t - 144);
	const X = Math.min(3, t - SEEP0);
	const U = X / 3;
	return w * (SEEP0 - 144) + w * (X - 3 * (U ** 3 - U ** 4 / 2));
};

export type RecOpts = {k: number; scale?: number; toIce?: number; needle?: number; crackK?: number; centerK?: number; clear?: number};

/** 唱片：26 圈纹路 + 外沿 + 随转盘转的高光弧 + 唱臂 */
export const drawRecord = (g: Ctx, t: number, D: Data, o: RecOpts) => {
	const sc = o.scale ?? 1;
	const rot = recRot(t);
	const toIce = o.toIce ?? 0;
	const nr = o.needle;
	for (let i = 0; i < 26; i++) {
		const r = ringR(i) * sc;
		if (r < 0.6) continue;
		let c: RGB = mixc(ICE, SILVER, 0.35);
		// 光晕加强之后 26 圈纹路太密太亮：底亮度 0.35 → 0.26，放过的 0.6 → 0.48
		let k = 0.26;
		if (nr !== undefined && ringR(i) > nr) k = 0.48;
		const ts = seepT(ringR(i));
		if (t >= ts) {
			const u = smooth((t - ts) / 0.55);
			c = mixc(PINK, GREY, u);
			k = lerp(0.85, 0.2, u);
		}
		c = mixc(c, ICE, toIce);
		k *= o.k;
		// 卡尼曼原话那几秒：署名（y 505，半宽约 170）后面的内圈纹路再压掉七成
		if (o.clear) k *= 1 - 0.7 * o.clear * smooth((200 - ringR(i)) / 40);
		arc(g, REC[0], REC[1], r, c, 1.0, k, 0, Math.PI * 2, 0.3);
		// 高光弧（两道，随转盘转）
		const hk = 0.32 * o.k * (t >= ts ? 1 - smooth((t - ts) / 0.4) : 1);
		if (hk > 0.01) {
			arc(g, REC[0], REC[1], r, ICE_W, 0.8, hk, rot - 0.28, rot + 0.28, 0.5);
			arc(g, REC[0], REC[1], r, ICE_W, 0.8, hk * 0.6, rot + Math.PI - 0.2, rot + Math.PI + 0.2, 0.5);
		}
	}
	const rimC = t >= seepT(300) ? mixc(PINK, GREY, smooth((t - seepT(300) - 0.2) / 0.55)) : ICE;
	arc(g, REC[0], REC[1], 310 * sc, mixc(rimC, ICE, toIce), 1.1, 0.6 * o.k, 0, Math.PI * 2, 0.35);
	const cK = o.centerK ?? 1;
	glow(g, REC[0], REC[1], 10 * Math.max(sc, 0.4), mixc(ICE, ICE_W, toIce), (0.5 * o.k + toIce * 0.6) * cK, 0.3);
	arc(g, REC[0], REC[1], 62 * sc, DIM, 0.8, 0.35 * o.k * cK, 0, Math.PI * 2, 0.2);
	if (o.crackK && o.crackK > 0) {
		const tip = needleTip(90);
		const at: P = [REC[0] + (tip[0] - 4 - REC[0]) * sc, REC[1] + (tip[1] - REC[1]) * sc];
		beam(g, crackPts(D, at, 1.2 * Math.max(sc, 0.15)), PINK, 1.8, o.crackK, false, 0.5);
	}
};

/** 唱臂：支点 (1400,170) → 针尖；arm 0→1 是落下 */
export const drawArm = (g: Ctx, nr: number, arm: number) => {
	if (arm <= 0.003) return;
	const tip = needleTip(nr);
	const pivot: P = [1400, 170];
	const lift = 1 - arm;
	const tip2: P = [lerp(tip[0], 1330, lift), lerp(tip[1], 120, lift)];
	const mid: P = [lerp(pivot[0], tip2[0], 0.55) + 18, lerp(pivot[1], tip2[1], 0.55) - 10];
	beam(g, [pivot, mid, tip2], SILVER, 1.1, 0.45 * arm, false, 0.3);
	arc(g, pivot[0], pivot[1], 9, SILVER, 0.9, 0.45 * arm);
	glow(g, tip2[0], tip2[1], 9, ICE_W, 0.8 * arm, 0.3);
};

export const drawS3 = (g: Ctx, t: number, frame: number, D: Data, A: Assets) => {
	if (t < 122.5 || t > 163.96) return;
	// ---------- 682 颗病人点 ----------
	if (t >= 123.0 && t < 131.6) {
		const sp = (x: number) => clamp((t - 125.4 - 0.25 * ((x - 420) / 960)) / 1.15);
		for (let i = 0; i < D.patients.length; i++) {
			const p = D.patients[i];
			const ts = 123.0 + 1.1 * p.d;
			if (t < ts) continue;
			const u = clamp((t - ts) / 1.3);
			let x = p.x + 16 * Math.sin(u * Math.PI * 2 + p.sway * 6.283) * (1 - u);
			let y = lerp(p.y0, p.band, easeOut(u));
			const e = easeInOut(sp(p.x));
			y = lerp(y, p.y, e);
			let a = 0.8 * smooth(u * 3);
			// 130.2–131.4：每排收成一颗记忆光点
			const dst: P = p.top ? M3A : M3B;
			const cu = easeInOut(clamp((t - 130.2 - 0.45 * ((p.x - 420) / 960)) / 0.75));
			if (cu > 0) {
				const c: P = [lerp(x, dst[0], 0.6), lerp(y, dst[1], 0.6) + (p.top ? -30 : 30) * (1 - Math.abs(0.5 - p.sway))];
				[x, y] = qbez([x, y], c, dst, cu);
				a *= 1 - smooth((cu - 0.85) / 0.15);
			}
			blit(g, p.top ? A.spr.iceW : A.spr.ice, x, y, 4.2, a);
		}
		g.globalAlpha = 1;
		// 下排多出的尾巴：更暗、更柔
		const tg = prog(t, 126.8, 128.4);
		if (tg > 0) {
			const cu = easeInOut(prog(t, 130.4, 131.2, (x) => x));
			const x1 = lerp(1380, 1560, tg);
			const x0 = lerp(1380, M3B[0], cu);
			const xe = lerp(x1, M3B[0], cu);
			if (xe - x0 > 2) {
				beam(g, [[x0, 660], [xe, 660]], ICE, 6, 0.16 * (1 - cu), false, 0);
				beam(g, [[x0, 660], [xe, 660]], ICE, 1.2, 0.22 * (1 - cu), false, 0.2);
			}
			for (let q = 0; q < 26; q++) {
				const xx = 1380 + 180 * hash2(q, 1, 33);
				if (xx > x1) continue;
				const yy = 660 + (hash2(q, 2, 33) - 0.5) * 22;
				blit(g, A.spr.ice, lerp(xx, M3B[0], cu), lerp(yy, 660, cu), 3.2, 0.35 * (1 - cu));
			}
			g.globalAlpha = 1;
		}
	}
	// ---------- 两颗记忆光点 ----------
	const m3 = D.num.mem_2003;
	if (t >= 130.3 && t < 140.4) {
		const drift = easeInOut(prog(t, 137.0, 138.2, (x) => x));
		const fade = 1 - smooth((t - 139.6) / 0.7);
		const k = smooth((t - 130.5) / 0.9) * lerp(1, 0.5, drift) * fade;
		const P1: P = [M3A[0] - 140 * drift, M3A[1]];
		const P2: P = [M3B[0] - 140 * drift, M3B[1]];
		const br = (ph: number) => 1 + 0.07 * Math.sin((t - 130.5) * 2.2 + ph);
		memDot(g, P1[0], P1[1], m3.std.r, m3.std.k * k * br(0));
		memDot(g, P2[0], P2[1], m3.ext.r, m3.ext.k * k * br(Math.PI));
		// 131.2–137.6：两排的余光还在一颗颗流进各自的光点（画面不停）
		if (t > 131.2 && t < 137.6) {
			const ta = Math.min(smooth((t - 131.2) / 0.8), 1 - smooth((t - 136.6) / 0.9));
			for (let q = 0; q < 44; q++) {
				const top = q % 2 === 0;
				const per = 2.2 + 0.9 * hash2(q, 1, 131);
				const cyc = (t - 131.2) / per + hash2(q, 2, 131);
				const ph = cyc - Math.floor(cyc);
				const sx = 420 + (top ? 960 : 1140) * hash2(q, Math.floor(cyc), 132);
				const sy = (top ? 400 : 660) + (hash2(q, 3, 131) - 0.5) * 30;
				const dst = top ? P1 : P2;
				const [x, y] = qbez([sx, sy], [lerp(sx, dst[0], 0.5), sy + (top ? -40 : 40)], dst, easeInOut(ph));
				blit(g, top ? A.spr.iceW : A.spr.ice, x, y, 4, 0.5 * ta * Math.sin(Math.PI * ph));
			}
			g.globalAlpha = 1;
		}
		// 137.4–139.6：回来复查的，沿弧线飞回左边（上排 157、下排 186）
		if (t >= 137.4) {
			for (let i = 0; i < D.patients.length; i++) {
				const p = D.patients[i];
				const back = p.top ? D.backTop.has(i) : D.backBot.has(i);
				if (!back) continue;
				const st = 137.4 + 1.0 * clamp(p.back / (p.top ? 0.46 : 0.55));
				const u = clamp((t - st) / 1.1);
				if (u <= 0) continue;
				const src = p.top ? P1 : P2;
				const dst: P = [420 + 330 * p.sway, p.y];
				const c: P = [lerp(src[0], dst[0], 0.5), (p.top ? 400 - 150 : 660 + 150) + (p.d - 0.5) * 60];
				const [x, y] = qbez(src, c, dst, easeInOut(u));
				blit(g, A.spr.iceW, x, y, 3.6, (u < 1 ? 0.85 : 0.45) * fade);
			}
			g.globalAlpha = 1;
		}
	}
	// ---------- 片头旋律原样再画一遍 → 卷成唱片 ----------
	const roll = easeInOut(prog(t, 143.0, 144.6, (x) => x));
	if (t >= 139.6 && t < 145.2) {
		const tau = Math.min(t - 138.6, 4.75);
		const vis = smooth((t - 139.6) / 0.3) * (1 - smooth((t - 144.5) / 0.6));
		if (roll <= 0) {
			const pts = drawMelody(g, D, {tauEnd: tau, k: 0.6 * vis, pinkOn: 0, swell: noteSwell(D, t, 138.6, 0.5)});
			if (t < 143.2) comet(g, pts, 60, ICE_W, MEL_W, 0.8 * vis);
		} else {
			const n = Math.max(2, Math.round((tau - 1) / 0.01) + 1);
			const src = resample(D.melPts.slice(0, n), 220);
			const rot = -1.2 + recRot(t) * 0.0 - roll * 2.2;
			const dst: P[] = src.map((_, i) => {
				const v = i / 219;
				const r = 300 - 70 * v;
				const a = rot + Math.PI + v * Math.PI * 2 * 2.6;
				return [REC[0] + r * Math.cos(a), REC[1] + r * Math.sin(a)];
			});
			beam(g, morph(src, dst, roll), ICE, lerp(MEL_W, 1.0, roll), 0.6 * vis, false, 0.45);
		}
		// 笔尖
		if (t < 143.4) {
			const [x, y] = D.melAt(tau);
			const k = smooth((t - 139.6) / 0.3) * (1 - smooth((t - 143.0) / 0.4));
			haze(g, x, y, 60, ICE_W, 0.1 * k);
			glow(g, x, y, 13, ICE_W, 0.85 * k, 0.3);
		}
	}
	// ---------- 唱片 ----------
	if (t >= 144.0 && t < 163.96) {
		const appear = smooth((t - 144.1) / 0.9);
		const dimTo = lerp(1, 0.6, prog(t, 156.85, 157.8));
		const arm = smooth((t - 144.4) / 0.5) * (1 - smooth((t - 155.2) / 1.2));
		// 卡尼曼原话那几秒，裂痕退到 0.15，不和字打架
		const quoteOff = prog(t, 156.3, 157.2);
		const crackK = (t >= 150.85 ? (t < 151.15 ? lerp(1.8, 0.6, (t - 150.85) / 0.3) : 0.6) : 0) * (1 - quoteOff);
		// 纹路由外向内一圈圈出现
		g.save();
		const rin = lerp(320, 0, appear);
		g.beginPath();
		g.arc(REC[0], REC[1], 330, 0, Math.PI * 2);
		g.arc(REC[0], REC[1], Math.max(0, rin), 0, Math.PI * 2, true);
		g.clip();
		drawRecord(g, t, D, {k: appear * dimTo, needle: needleR(t), crackK, centerK: 1 - quoteOff, clear: quoteOff * (1 - smooth((t - 162.6) / 0.6))});
		g.restore();
		drawArm(g, needleR(t), arm);
		if (t >= 150.85 && t < 152.2) {
			const tip = needleTip(90);
			const p = (t - 150.85) / 1.2;
			haze(g, tip[0], tip[1], 200, PINK, 0.35 * (1 - p));
			if (p < 1) arc(g, tip[0], tip[1], 20 + 120 * easeOut(p), PINK, 1.0, 0.5 * (1 - p), 0, Math.PI * 2, 0.3);
		}
	}
	void frame;
	void GOLD;
};
