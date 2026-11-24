/** 02 峰（87.5–122.5）：计时线 → 19 格胶片（手风琴压扁又弹回，亮度不变）→ 烧掉只剩两格（峰、终）
 *  → 两颗记忆光点（90 秒那颗先和 60 秒一样亮，多出的 30 秒流进去，它在眼前变暗）→ 1996 年两根光丝 → 峰和最后三分钟飞成两颗记忆光点。 */
import {clamp, easeInOut, easeOut, hash2, lerp, prog, smooth} from '../../kit/util';
import type {Assets} from '../assets';
import type {Data} from '../data';
import {beam, beamX, blit, comet, type Ctx, EMBER, glow, glowRect, GOLD, GOLD_C, haze, ICE, ICE_W, memDot, mixc, type P, qbez, rgba, type RGB, rrect, WHITE} from '../fx';
import {LO_Y, timerK} from './s1';

// 审片修改：格子 46×34 → 56×42，整条胶片放到 y 470；上下加齿孔
const FW = 56;
const FH = 42;
export const FY = 470;
const EDGE = 36;
const HOLE = 29;
const lowPt = (s: number): P => [420 + 12 * s, LO_Y];
const P60: P = [760, FY];
const P90: P = [1160, FY];

/** 胶片第 j 格烧掉的起始时刻（跳过第 12、18 格），从左往右 */
const burnStart = (j: number) => {
	if (j === 12 || j === 18) return Infinity;
	const rank = j < 12 ? j : j - 1;
	return 94.75 + 0.065 * rank;
};

// 1996 光丝上「变金」的权重：峰值那几点 + 最后三分钟
const goldW = (arr: number[], x: number) => {
	const mx = Math.max(...arr);
	let w = 0;
	arr.forEach((p, i) => {
		if (p === mx) w = Math.max(w, Math.exp(-(((x - (360 + 63 * i)) / 24) ** 2)));
	});
	w = Math.max(w, smooth((x - (360 + 63 * 17 - 18)) / 22));
	return w;
};

/** 一格胶片：由内往外的发光渐变 + 发光圆角边 */
const drawCell = (g: Ctx, x: number, y: number, ww: number, hh: number, k: number, c: RGB, bb: number, gold: number, t: number) => {
	if (ww < 0.8 || k <= 0.003) return;
	const R = Math.max(ww, hh) * 0.78;
	rrect(g, x, y, ww, hh, 5);
	const gr = g.createRadialGradient(x, y, 0, x, y, R);
	const boost = 1 + 0.9 * gold;
	gr.addColorStop(0, rgba(mixc(c, WHITE, 0.4 + 0.3 * gold), Math.min(1, (0.1 + 0.6 * bb) * k * boost)));
	gr.addColorStop(0.5, rgba(c, (0.05 + 0.28 * bb) * k * boost));
	gr.addColorStop(1, rgba(c, 0.025 * k));
	g.fillStyle = gr;
	g.fill();
	haze(g, x, y, R * 1.7, c, 0.3 * bb * k * boost);
	glowRect(g, x, y, ww, hh, 5, c, 1.2 + 0.5 * gold, (0.3 + 0.6 * bb) * k * boost);
	if (gold > 0) {
		// 亮帧：内部 bloom 呼吸
		const br = 0.85 + 0.15 * Math.sin(t * 2.2 + x * 0.01);
		haze(g, x, y, R * 2.6, GOLD, 0.16 * gold * k * br);
		glow(g, x, y, R * 0.55, GOLD_C, 0.55 * gold * k * br, 0.3);
	}
};

export const drawS2 = (g: Ctx, t: number, frame: number, D: Data, A: Assets) => {
	if (t < 87.5 || t > 122.6) return;
	const ff = D.num.film_frames;
	// ---------- A：下面那根计时线（90 秒那一次）的影子亮回来，每 5 秒落下一颗点 ----------
	const toFilm = easeInOut(prog(t, 88.7, 89.9, (x) => x));
	if (t < 90.0) {
		const kL = lerp(0.6, 0.9, prog(t, 87.5, 88.6)) * (1 - toFilm);
		const pts: P[] = [];
		for (let s = 0; s <= 90; s += 0.5) pts.push(lowPt(s));
		beamX(g, pts, 2.8, (x) => [ICE, timerK(clamp((x - 420) / 12, 0, 90)) * kL], 80);
		// 边线：同一条线上下分开，成为胶片的两条边
		if (toFilm > 0) {
			for (const yy of [FY - EDGE, FY + EDGE]) {
				const e: P[] = pts.map(([x, y]) => [lerp(x, 960 + (x - 960) * 1.06, toFilm), lerp(y, yy, toFilm)]);
				beam(g, e, ICE, 1.2, 0.5 * toFilm, false, 0.35);
			}
		}
	}
	// ---------- 胶片 ----------
	if (t >= 87.6 && t < 103.6) {
		// 手风琴
		let f = 1;
		if (t >= 90.3 && t < 91.8) f = 1 - 0.65 * easeInOut((t - 90.3) / 1.5);
		else if (t >= 91.8 && t < 93.3) f = 0.35 + 0.65 * easeInOut((t - 91.8) / 1.5);
		const X = (x: number) => 960 + (x - 960) * f;
		const front = lerp(380, 1580, prog(t, 94.75, 96.25, (x) => x));
		const edgeK = (x: number) => (t > 94.75 ? smooth((x - X(front)) / 18) : 1) * smooth((t - 89.7) / 0.4);
		// 两条边线 + 齿孔（形变完成后）
		if (t >= 89.9) {
			for (const yy of [FY - EDGE, FY + EDGE]) {
				const e: P[] = [];
				for (let x = 960 - 540 * 1.06; x <= 960 + 540 * 1.06 + 0.1; x += 12) e.push([X(x), yy]);
				beamX(g, e, 1.2, (x) => [mixc(ICE, EMBER, t > 94.75 ? Math.exp(-(((x - X(front)) / 30) ** 2)) : 0), 0.5 * edgeK(x)], 64, 0.35);
			}
			for (let q = 0; q < 76; q++) {
				const x0 = 960 - 570 + 15 * q + 7.5;
				const x = X(x0);
				const kk = edgeK(x) * 0.5;
				if (kk <= 0.01) continue;
				for (const yy of [FY - HOLE, FY + HOLE]) glowRect(g, x, yy, 7 * Math.max(0.5, f), 5, 1.5, ICE, 0.8, kk);
			}
		}
		for (let j = 0; j < 19; j++) {
			const fr = ff[j];
			const tj = 87.6 + 0.055 * j;
			if (t < tj) continue;
			const [lx, ly] = lowPt(fr.t);
			const drop = easeOut(clamp((t - tj) / 0.35));
			const tb = burnStart(j);
			// 烧
			let kb = 1;
			let cb = 0;
			if (t >= tb) {
				const u = (t - tb) / 0.4;
				cb = smooth(u / 0.4);
				kb = 1 - smooth((u - 0.25) / 0.75);
				// 火星：五六颗往上飘
				for (let q = 0; q < 6; q++) {
					const su = (t - tb - 0.05 * q) / 1.4;
					if (su <= 0 || su >= 1) continue;
					const sx = X(fr.x) + (hash2(j, q, 77) - 0.5) * 40 + Math.sin(su * 5 + q) * 6;
					const sy = FY - 10 - (40 + 90 * hash2(j, q, 78)) * easeOut(su);
					blit(g, A.spr.ember, sx, sy, 6, 0.75 * (1 - su));
				}
				g.globalAlpha = 1;
			}
			if (kb <= 0.003) continue;
			// 剩下两格在 96.1 变金
			const goldOn = j === 12 || j === 18 ? smooth((t - 96.1) / 0.4) : 0;
			const col: RGB = mixc(mixc(ICE, EMBER, cb), GOLD, goldOn);
			const gs = 1 + 0.35 * (j === 12 || j === 18 ? smooth((t - 96.3) / 1.2) : 0); // 留下的两帧慢慢放大
			let cx = X(fr.x);
			let w = FW * f * gs;
			let hh = FH * gs;
			let cy = FY;
			if (t < 89.9) {
				// 点 → 格
				cx = lerp(lx, fr.x, toFilm);
				cy = lerp(lerp(ly - 60, ly, drop), FY, toFilm);
				w = FW * toFilm;
				hh = FH * toFilm;
				glow(g, cx, cy, lerp(11, 5, toFilm), ICE_W, (0.85 + 0.6 * Math.exp(-(((t - tj - 0.35) / 0.12) ** 2))) * (1 - 0.7 * toFilm), 0.3);
			}
			const bb = Math.pow(fr.b, 2.4);
			// 102.0–103.0：第 12 格一分为二，各自合成记忆光点；最后一格 103.3 起化成一股粒子流进 90 秒那颗
			const split = easeInOut(prog(t, 102.0, 103.0, (x) => x));
			if (j === 12 && split > 0) {
				const sh = 1 - split;
				drawCell(g, lerp(cx, P60[0], split), FY, w * sh, hh * sh, kb, col, bb, goldOn, t);
				drawCell(g, lerp(cx, P90[0], split), FY, w * sh, hh * sh, kb, col, bb, goldOn, t);
				continue;
			}
			if (j === 18 && t > 103.2) {
				drawCell(g, cx, cy, w, hh, kb * (1 - smooth((t - 103.2) / 0.35)), col, bb, goldOn, t);
				continue;
			}
			drawCell(g, cx, cy, w, hh, kb, col, bb, goldOn, t);
			if (j === 12 && goldOn > 0) glowRect(g, cx, cy, w + 14, hh + 14, 8, GOLD, 1.0, 0.35 * goldOn);
			// 2026-10-12 审铃声：96.1 的 bell 落在「只剩两帧」变金的那一刻 —— 两格同时闪一下，让这一下看得见
			if ((j === 12 || j === 18) && t > 95.95 && t < 96.8) haze(g, cx, cy, 120, GOLD, 0.32 * Math.exp(-(((t - 96.15) / 0.18) ** 2)));
		}
	}
	// ---------- 两颗记忆光点（冷水） ----------
	const mc = D.num.mem_cold;
	if (t >= 102.0 && t < 108.8) {
		const e = smooth((t - 102.4) / 0.7);
		const dimK = lerp(1, 0.55, prog(t, 106.5, 107.7));
		const go = easeInOut(prog(t, 107.7, 108.7, (x) => x));
		// 多出的 30 秒（最后一格，b = 0.765，没那么冷）化成 16 颗粒子，103.3–104.9 依次流进 90 秒那颗
		let arrived = 0;
		const NQ = 16;
		const src: P = [1500, FY];
		for (let q = 0; q < NQ; q++) {
			const st = 103.3 + 0.07 * q;
			const u = clamp((t - st) / 0.9);
			if (u >= 1) {
				arrived++;
				continue;
			}
			if (u <= 0) continue;
			const c: P = [lerp(src[0], P90[0], 0.5), FY - 60 - 50 * hash2(q, 1, 104)];
			const [x, y] = qbez([src[0] + (hash2(q, 2, 104) - 0.5) * 40, FY + (hash2(q, 3, 104) - 0.5) * 30], c, P90, easeInOut(u));
			blit(g, A.spr.warm, x, y, 7, 0.8 * Math.sin(Math.PI * Math.min(1, u * 1.15 + 0.1)));
		}
		g.globalAlpha = 1;
		const arr = smooth(arrived / NQ);
		const breath = (ph: number) => (t > 104.9 ? 1 + 0.1 * Math.sin((t - 104.9) * 2.4 + ph) : 1);
		const pos = (a: P, b: P, u: number) => qbez(a, [lerp(a[0], b[0], 0.5), Math.min(a[1], b[1]) - 40], b, easeInOut(u));
		const draw = (a: P, b: P, r0: number, k0: number, ph: number) => {
			const [x, y] = pos(a, b, go);
			if (go > 0 && go < 1) {
				const tail: P[] = [];
				for (let q = 0; q <= 14; q++) tail.push(pos(a, b, Math.max(0, go - 0.02 * q)));
				tail.reverse();
				comet(g, tail, 160, GOLD, 2.6, 0.9 * k0);
			}
			const r = lerp(r0, 14, go);
			memDot(g, x, y, r, k0 * e * dimK * lerp(1, 1.3, go) * breath(ph));
		};
		draw(P60, D.spike[0], mc.short.r, mc.short.k, 0);
		draw(P90, D.flat[0], lerp(mc.short.r, mc.long.r, arr), lerp(mc.short.k, mc.long.k, arr), Math.PI);
	}
	// ---------- 1996：两根光丝 ----------
	if (t >= 108.7 && t < 122.6) {
		const u = prog(t, 108.7, 113.5, (x) => x);
		const xp = 360 + 1197 * u;
		const hi = prog(t, 115.8, 117.3);
		const flyOut = prog(t, 117.3, 118.7);
		const fade = 1 - smooth((t - 121.6) / 0.9);
		const lines: [P[], P[], number[], number][] = [
			[D.spikeC, D.spike, D.num.y1996.spike.arr, 470],
			[D.flatC, D.flat, D.num.y1996.flat.arr, 740],
		];
		for (const [C, raw, arr, base] of lines) {
			const pts = C.filter((p) => p[0] <= xp);
			if (pts.length >= 2 && xp > pts[pts.length - 1][0]) {
				const last = pts[pts.length - 1];
				const nxt = C[pts.length] ?? last;
				const fx = nxt[0] > last[0] ? (xp - last[0]) / (nxt[0] - last[0]) : 0;
				pts.push([lerp(last[0], nxt[0], fx), lerp(last[1], nxt[1], fx)]);
			}
			if (pts.length < 2) continue;
			// 疼的总量：曲线下面一层光（审片修改：0.075 → 0.17，平的那根面积明显更大）
			const area = g.createLinearGradient(0, base - 160, 0, base);
			area.addColorStop(0, rgba(ICE, 0.17 * fade * (1 - 0.5 * hi)));
			area.addColorStop(1, rgba(ICE, 0.035 * fade * (1 - 0.5 * hi)));
			g.fillStyle = area;
			g.beginPath();
			g.moveTo(pts[0][0], base);
			for (const p of pts) g.lineTo(p[0], p[1]);
			g.lineTo(pts[pts.length - 1][0], base);
			g.closePath();
			g.fill();
			beamX(
				g,
				pts,
				2.6,
				(x) => {
					const w = goldW(arr, x) * hi;
					const k = lerp(0.85, lerp(0.15, lerp(1.05, 0.3, flyOut), goldW(arr, x)), hi);
					return [mixc(ICE, GOLD, w), k * fade];
				},
				140,
			);
			// 每分钟一颗点
			raw.forEach(([x, y]) => {
				if (x > xp + 0.5) return;
				const tin = 108.7 + ((x - 360) / 1197) * 4.8;
				const fl = Math.exp(-(((t - tin) / 0.12) ** 2));
				const w = goldW(arr, x) * hi;
				const kk = lerp(0.7, lerp(0.12, lerp(1, 0.25, flyOut), goldW(arr, x)), hi) * fade;
				glow(g, x, y, 8 + 8 * fl, mixc(ICE_W, GOLD, w), kk + 0.6 * fl, 0.3);
			});
			if (u > 0 && u < 1) {
				const hp = pts[pts.length - 1];
				comet(g, pts, 90, ICE_W, 2.6, 0.9);
				haze(g, hp[0], hp[1], 70, ICE_W, 0.18);
				glow(g, hp[0], hp[1], 16, ICE_W, 0.95, 0.3);
			}
		}
		// 117.3–118.8：金色部分飞到右端，各合成一颗记忆光点
		const m96 = D.num.mem_1996;
		const targets: [P, {k: number; r: number}, P[], number[]][] = [
			[[1650, 440], m96.spike, D.spikeC, D.num.y1996.spike.arr],
			[[1650, 710], m96.flat, D.flatC, D.num.y1996.flat.arr],
		];
		for (const [dst, m, C, arr] of targets) {
			if (t < 117.3) continue;
			let arrived = 0;
			let total = 0;
			for (let i = 0; i < C.length; i += 2) {
				const p = C[i];
				const w = goldW(arr, p[0]);
				if (w < 0.5) continue;
				total++;
				const d = hash2(i, arr.length, 91);
				const uu = easeInOut(clamp((t - 117.3 - 0.4 * d) / 1.0));
				if (uu >= 1) {
					arrived++;
					continue;
				}
				const c: P = [lerp(p[0], dst[0], 0.55), Math.min(p[1], dst[1]) - 40 - 50 * hash2(i, 3, 91)];
				const [x, y] = qbez(p, c, dst, uu);
				blit(g, A.spr.gold, x, y, 6, (0.45 + 0.55 * uu) * fade);
			}
			g.globalAlpha = 1;
			const fr = total ? arrived / total : 0;
			const kk = m.k * smooth(fr * 1.2) * fade * (t > 118.8 ? 1 + 0.08 * Math.sin((t - 118.8) * 2.3) : 1);
			memDot(g, dst[0], dst[1], m.r, kk);
		}
	}
	void frame;
};
