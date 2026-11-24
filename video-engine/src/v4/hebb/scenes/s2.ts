/** II 痕 TRACE 1:17.3–1:47.8：金线拉直成时间轴 → 轻敲、回应峰 → 猛敲一阵 → 回应变高 → 论文卡
 *  → 0 h / 5 h / 10 h 金色包络 → 缩放到「1 年」（10 小时只剩 1.6 px）→ 包络浮起。 */
import {clamp, easeInOut, inv, lerp, mix, smooth} from '../../kit';
import {meta, P} from '../data';
import {AXIS_W, HOURS_PER_YEAR, PEAK_AFTER, PEAK_BASE} from '../numbers';
import {type Cam, type Ctx, type Pt, cam, camSet, flare, gline, hairl, pulse, spr} from '../lib/core';
import {FONT_EN, FONT_ZH} from '../../kit';
import {wireEnds} from './s1';

const II = meta.II;
export const AX_Y = 600;
export const AX_X0 = 260;
export const AX_X1 = AX_X0 + AXIS_W; // 1660
const V = 50; // 电极尖每秒走 50 px
const X_START = 300;
const tipX = (t: number) => X_START + V * (t - II.taps_from);
const PRE = Array.from({length: 9}, (_, k) => II.taps_from + II.tap_every * k); // 78.6 … 85.8
const [B0, B1] = II.burst; // 86.6, 87.4
const BURST = Array.from({length: 24}, (_, j) => B0 + (j * (B1 - B0)) / 24);
const POST: number[] = [];
for (let tt = 88.0; tt <= 94.5; tt += II.tap_every) POST.push(tt);
const XB = tipX(B0); // 700
const XE = tipX(94.6); // 1100
const PXH0 = 92; // 刻度 0 h → 10 h 的像素/小时（示意）
const X0H = 640; // 压缩后 0 h 的位置
const PXH_YEAR = AXIS_W / HOURS_PER_YEAR; // 1 年刻度下的像素/小时
export const ENV_Y = AX_Y - PEAK_AFTER; // 499.2

export const camII = (t: number): Cam => cam(1 + 0.05 * smooth(inv(78.5, 107.8, t)), 960, 540);

const sqz = (xr: number) => (xr <= XB ? lerp(AX_X0 + 2, X0H, (xr - X_START) / (XB - X_START)) : lerp(X0H, X0H + 60, (xr - XB) / (XE - XB)));

/** 记录坐标 → 当前屏幕上的 x（压缩、再缩放到一年） */
/** 压缩：1.0 s，起步和收尾都缓（smootherstep）。审片：1:34.9 压缩起步那一帧会跳 */
const sqzE = (t: number) => {
	const u = inv(94.6, 95.6, t);
	return u * u * u * (u * (u * 6 - 15) + 10);
};
const mapX = (xr: number, t: number) => {
	const sq = sqzE(t);
	const x1 = lerp(xr, sqz(xr), sq);
	const z = easeInOut(inv(II.year_zoom_out[0], II.year_zoom_out[1], t));
	if (z <= 0) return x1;
	const pxh = Math.exp(lerp(Math.log(PXH0), Math.log(PXH_YEAR), z));
	const x0 = lerp(X0H, AX_X0, z);
	return x0 + (x1 - X0H) * (pxh / PXH0);
};
const hourX = (h: number, t: number) => {
	const z = easeInOut(inv(II.year_zoom_out[0], II.year_zoom_out[1], t));
	const pxh = Math.exp(lerp(Math.log(PXH0), Math.log(PXH_YEAR), z));
	return lerp(X0H, AX_X0, z) + h * pxh;
};

const peakPts = (xr: number, h: number, t: number, grow: number): Pt[] => {
	const pts: Pt[] = [];
	for (let i = 0; i <= 12; i++) {
		const u = i / 12;
		pts.push([mapX(xr + 18 * (u - 0.5), t), AX_Y - h * grow * Math.sin(Math.PI * u)]);
	}
	return pts;
};

const text = (g: Ctx, s: string, x: number, y: number, font: string, color: string, a: number, align: CanvasTextAlign = 'center') => {
	if (a <= 0.003) return;
	g.globalCompositeOperation = 'source-over';
	g.font = font;
	g.textAlign = align;
	g.textBaseline = 'middle';
	g.fillStyle = color;
	g.globalAlpha = clamp(a);
	g.fillText(s, x, y);
	g.globalAlpha = 1;
	g.globalCompositeOperation = 'lighter';
};

export const drawTrace = (g: Ctx, t: number) => {
	if (t < 77.3 || t > 108.6) return;
	const c = camII(t);
	camSet(g, c);
	const inv1 = 1 / c.s;
	const lift = easeInOut(inv(106.6, 107.8, t));
	const axisA = 1 - smooth(inv(106.6, 107.4, t));
	// ---- 形变 4：金线 → 时间轴
	const m = easeInOut(inv(77.3, 78.5, t));
	if (m < 1) {
		const [a, b] = wireEnds(77.3);
		const p0: Pt = [lerp(a[0], AX_X0, m), lerp(a[1], AX_Y, m)];
		const p1: Pt = [lerp(b[0], AX_X1, m), lerp(b[1], AX_Y, m)];
		gline(g, [p0, p1], mix(P.gold, P.leaf, m), null, lerp(3.2, 1, m), lerp(0.85, 0.3, m));
		hairl(g, [p0, p1], P.leaf, 1, 0.4 * smooth(m));
	}
	if (m >= 1) {
		// 审片：金线落定之后它本身就是时间轴；之前屏上始终只有那一根在变形的线（不再和时间轴叠成两条平行线）
		hairl(g, [[AX_X0, AX_Y], [AX_X1, AX_Y]], P.leaf, 1 * inv1, 0.4 * axisA);
		gline(g, [[AX_X0, AX_Y], [AX_X1, AX_Y]], P.leaf, null, 1 * inv1, 0.3 * axisA, false);
	}
	if (t > 108.4) return;
	const handoff = 1 - smooth(inv(107.8, 108.3, t)); // 浮起的包络在 107.8–108.3 交给 III 章的声波
	// ---- 环境光：轴上方一层扁平的暖光（峰越高越亮）
	if (m > 0.3 && t < 107.6) {
		const post = smooth(inv(B0, B1 + 1, t));
		const zz = easeInOut(inv(II.year_zoom_out[0], II.year_zoom_out[1], t));
		const xr = Math.max(420, t < 94.9 ? tipX(clamp(t, II.taps_from, 94.6)) : zz > 0 ? lerp(1560, AX_X1, zz) : X0H + 10 * PXH0 * easeInOut(inv(94.9, 97.3, t)));
		const xc = (AX_X0 + xr) / 2;
		flare(g, xc, AX_Y - 45, (xr - AX_X0) / 2 + 220, P.amber, (0.16 + 0.14 * post) * axisA * smooth(inv(78.6, 80.4, t)), 0.2);
		flare(g, 960, AX_Y, 1000, P.leafDeep, 0.18 * axisA, 0.05);
	}
	// ---- 电极尖
	const tipA = smooth(inv(78.1, 78.6, t)) * (1 - smooth(inv(94.4, 95.0, t)));
	if (tipA > 0) {
		const all = [...PRE, ...BURST, ...POST];
		let f = 0;
		for (const tt of all) f = Math.max(f, pulse(t, tt, 0.03, 0.12));
		const x = tipX(clamp(t, II.taps_from, 94.6));
		spr(g, x, AX_Y, 13, P.leaf, tipA * (0.7 + 0.8 * f));
		spr(g, x, AX_Y, 40, P.leaf, tipA * 0.12 * (1 + f), 'soft');
	}
	// 早于缩放到一年时，压缩前的记录要淡掉
	const preA = 1 - smooth(inv(II.year_zoom_out[0], II.year_zoom_out[0] + 0.8, t));
	// ---- 刻痕
	const tick = (tt: number, a: number) => {
		if (t < tt) return;
		const x = mapX(tipX(tt), t);
		const fl = pulse(t, tt, 0.02, 0.2);
		hairl(g, [[x, AX_Y - 7], [x, AX_Y + 7]], P.leaf, 1.1 * inv1, (0.5 + 0.5 * fl) * a);
		if (fl > 0.05) gline(g, [[x, AX_Y - 7], [x, AX_Y + 7]], P.leaf, null, 1, fl * a, false);
	};
	for (const tt of PRE) tick(tt, preA * axisA);
	for (const tt of BURST) tick(tt, preA * axisA * (1 - sqzE(t))); // 猛敲那 24 下的刻痕压缩后会挤成一小块亮块：随压缩淡掉
	for (const tt of POST) tick(tt, axisA * (1 - smooth(inv(103.0, 104.0, t))));
	// 猛敲一阵：上方金色一闪
	const bf = Math.max(0, Math.sin(Math.PI * clamp((t - B0) / (B1 - B0 + 0.3))));
	if (bf > 0) {
		spr(g, XB + 20, AX_Y - 40, 160, P.gold, 0.32 * bf, 'soft');
		spr(g, XB + 20, AX_Y, 60, P.leaf, 0.35 * bf, 'soft');
	}
	// ---- 回应峰
	const peak = (tt: number, h: number, a: number) => {
		const tp = tt + 0.1;
		if (t < tp) return;
		const grow = easeInOut(clamp((t - tp) / 0.14));
		const fl = pulse(t, tp, 0.05, 0.3);
		// 审片：压缩后峰挤在一起，叠加饱和成一块白。按屏幕上的峰间距淡掉：间距 ≥ 18 px 原样，挤到 7 px 以下就没了（让给包络线：峰顶本来就是包络的高度）
		const xr = tipX(tt);
		const gap = Math.abs(mapX(xr + V * II.tap_every, t) - mapX(xr, t));
		const sp = clamp((gap - 7) / 11);
		gline(g, peakPts(xr, h, t, grow), P.gold, null, 2.0 * inv1, (0.8 + 0.5 * fl) * a * sp * sp);
	};
	for (const tt of PRE) peak(tt, PEAK_BASE, preA * axisA);
	for (const tt of POST) peak(tt, PEAK_AFTER, axisA * (1 - smooth(inv(103.0, 104.0, t))));
	// 峰顶的淡金虚线基准（y 544）
	if (t > PRE[0] + 0.2) {
		const xEnd = mapX(Math.min(tipX(Math.min(t, 94.6)), XE), t);
		g.setLineDash([6, 8]);
		hairl(g, [[mapX(X_START - 10, t), AX_Y - PEAK_BASE], [xEnd, AX_Y - PEAK_BASE]], P.gold, 1 * inv1, 0.25 * preA * axisA * smooth(inv(PRE[0] + 0.2, PRE[0] + 0.8, t)));
		g.setLineDash([]);
	}
	// ---- 小时刻度 + 金色包络
	const [h0, h5, h10] = II.hour_ticks; // 94.9 96.1 97.3
	const z = easeInOut(inv(II.year_zoom_out[0], II.year_zoom_out[1], t));
	const tickAt = (h: number, tt: number, label: string, fadeNear = false) => {
		const a0 = smooth(inv(tt, tt + 0.4, t)) * axisA;
		if (a0 <= 0) return;
		const x = hourX(h, t);
		const near = fadeNear ? clamp((x - hourX(0, t)) / 50) : 1;
		const a = a0 * near;
		hairl(g, [[x, AX_Y - 6], [x, AX_Y + 6]], P.gold, 1.2 * inv1, 0.7 * a);
		text(g, label, x, AX_Y + 30, `400 16px "${FONT_EN}"`, P.gold, 0.85 * a);
	};
	// 审片：刻度只留「10 h」和「1 年」（0 h / 5 h 让它像柱状图的坐标轴）
	void h5;
	tickAt(10, h10, '10 h', true);
	// 「1 年」
	const ya = smooth(inv(103.6, 104.4, t)) * axisA;
	if (ya > 0) {
		hairl(g, [[AX_X1, AX_Y - 6], [AX_X1, AX_Y + 6]], P.gold, 1.2 * inv1, 0.7 * ya);
		text(g, '1 年', AX_X1, AX_Y + 30, `400 16px "${FONT_ZH}"`, P.gold, 0.85 * ya);
	}
	// 包络
	if (t >= h0) {
		const ex = z > 0 ? lerp(hourX(0, t) + 10 * (hourX(1, t) - hourX(0, t)), AX_X1, smooth(inv(0.15, 1, z))) : X0H + 10 * PXH0 * easeInOut(inv(h0, h10, t));
		const x0 = hourX(0, t);
		const y = lerp(ENV_Y, 430, lift);
		const ka = smooth(inv(h0, h0 + 0.3, t));
		if (ex > x0 + 0.5) {
			// 审片：去掉包络下面的填色（像进度条），只留发光的包络线；线上有金色粒子慢慢流，停住的那几秒也在动
			gline(g, [[x0, y], [ex, y]], P.gold, null, 2.6 * inv1, 0.95 * ka * handoff);
			const L = ex - x0;
			if (L > 40) {
				const n = Math.floor((L / 100) * 5);
				for (let j = 0; j < n; j++) {
					const u = (j / n + (t * 24) / L) % 1;
					spr(g, x0 + u * L, y + Math.sin(j * 2.3 + t * 1.7) * 1.2, 7 * inv1, P.goldCore, 0.6 * ka * handoff);
				}
			}
		}
		// 10 h 处的金点（在呼吸）；缩到一年时并入左端
		const da = smooth(inv(h10, h10 + 0.2, t)) * (1 - smooth(inv(0.4, 0.9, z)));
		if (da > 0 && t < 106.6) {
			const br = 0.85 + 0.15 * Math.sin((t - h10) * 2.4);
			const x10 = hourX(10, t);
			spr(g, x10, ENV_Y, 22, P.gold, da * br);
			spr(g, x10, ENV_Y, 70, P.amber, 0.18 * da * br, 'soft');
		}
		// 「1 年」刻度下的 0–10 h：左端那一小截（代码算的宽度）
		if (z > 0.6 && t < 107.0) {
			const a = smooth(inv(0.6, 1, z)) * (1 - lift);
			gline(g, [[x0, ENV_Y], [hourX(10, t), ENV_Y]], P.goldCore, null, 3, 0.9 * a, false);
			spr(g, x0 + 0.8, ENV_Y, 10, P.goldCore, 0.5 * a);
			// 审片：一年轴上 0–10 h 那 1.6 px 一小截要闪一下
			const fl = pulse(t, II.ten_h_flash, 0.08, 0.6);
			if (fl > 0.003) {
				spr(g, x0 + 0.8, ENV_Y, 70, P.goldCore, 1.1 * fl * a);
				spr(g, x0 + 0.8, ENV_Y, 200, P.amber, 0.3 * fl * a, 'soft');
				flare(g, x0 + 0.8, ENV_Y, 300, P.gold, 0.5 * fl * a, 0.012);
			}
		}
	}
};

/** 示意标签的位置（HTML 层用） */
export const traceNotes = {peak: [985, 486] as Pt, year: [1600, 472] as Pt};
export const yearZoom = (t: number) => easeInOut(inv(II.year_zoom_out[0], II.year_zoom_out[1], t));
