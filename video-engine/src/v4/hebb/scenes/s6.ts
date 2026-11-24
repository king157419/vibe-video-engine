/** VI 成 BECOMING 4:12.3–4:50.6（场景时间）：低机位夜草地，金点沿熟路疾走 → 旧路长回荒草 → 镜头升高：上百条路
 *  → 回到序的构图，重新配对三次（同一个叮、同样 2.0 s 的节奏、同一种光，只是更大更亮）→ 最后一声，光不来 → 片名卡 → Opus 5.5。
 *  草地是一个真的透视地面（X 左右，Z 向前，Y 向上），镜头升高时所有东西重新投影。 */
import {clamp, easeInOut, inv, lerp, mulberry32, smooth} from '../../kit';
import {A0, B0, meta, P} from '../data';
import {type Ctx, type Pt, TAU, along, camReset, camSet, cam, cumlen, gline, spr, toScr} from '../lib/core';
import {drawA, drawDing, drawLight, lightK} from '../lib/fx';

const VI = meta.VI;

// ---------------------------------------------------------------- 透视镜头
export type Cam3 = {x: number; h: number; z: number; th: number; f: number};
const TH_LOW = Math.atan(0.02); // 地平线 y = 540 − 20 = 520（审片：主角全在下半部、上方 57% 纯黑 → 镜头略微俯一点）
export const CAM_LOW: Cam3 = {x: 0, h: 0.13, z: 0, th: TH_LOW, f: 1000};
const CAM_HIGH: Cam3 = {x: 0.7, h: 1.5, z: -0.6, th: (30 * Math.PI) / 180, f: 1000};
export const cam6 = (t: number): Cam3 => {
	const [r0, r1] = [264.1, VI.fade_to_prologue[0]]; // 264.1–269.4 升高拉远
	const e = easeInOut(inv(r0, r1, t));
	const drift = clamp((t - 252.5) / 11.6) * (1 - e);
	return {
		x: lerp(CAM_LOW.x + 0.03 * drift, CAM_HIGH.x, e),
		h: Math.exp(lerp(Math.log(CAM_LOW.h), Math.log(CAM_HIGH.h), e)),
		z: lerp(CAM_LOW.z + 0.05 * drift, CAM_HIGH.z, e),
		th: lerp(CAM_LOW.th, CAM_HIGH.th, easeInOut(inv(r0 + 0.2, r1, t))),
		f: 1000,
	};
};
export const proj6 = (c: Cam3, X: number, Y: number, Z: number): [number, number, number] => {
	const dx = X - c.x;
	const dy = Y - c.h;
	const dz = Z - c.z;
	const cs = Math.cos(c.th);
	const sn = Math.sin(c.th);
	const yc = dy * cs + dz * sn;
	const zc = -dy * sn + dz * cs;
	if (zc < 0.04) return [NaN, NaN, zc];
	return [960 + (c.f * dx) / zc, 540 - (c.f * yc) / zc, zc];
};

// ---------------------------------------------------------------- 地面上的东西
/** 熟路：从近处（屏幕左下）弯到地平线（屏幕右上，鲁迅引文的光标正下方） */
// 审片：小弯在透视压缩下会在远端叠成横向亮折线。弯曲只留在近处（Z 2.2 → 3.5 收到 0：屏幕上每个周期 ≥ 40 px）
const roadR = (Z: number) => -0.2 + 0.74 * (1 - Math.exp(-(Z - 0.3) / 2.2)) + 0.035 * Math.sin(2.3 * Z) * (1 - smooth(clamp((Z - 2.2) / 1.3)));
export const ROAD_Z = Array.from({length: 90}, (_, i) => 0.35 * Math.pow(16 / 0.35, i / 89)); // 近端 y≈889，在字幕带之上
export const roadG: Pt[] = ROAD_Z.map((Z) => [roadR(Z) * Z, Z]); // [X, Z]
const oldRoads: Pt[][] = [
	Array.from({length: 40}, (_, i) => {
		const Z = 0.75 + (3.6 * i) / 39;
		return [roadR(Z) * Z + 0.42 * (Z - 0.75), Z] as Pt;
	}),
	Array.from({length: 40}, (_, i) => {
		const Z = 1.1 + (3.4 * i) / 39;
		return [roadR(Z) * Z - 0.36 * (Z - 1.1) - 0.05 * Math.sin(Z * 1.7), Z] as Pt;
	}),
	Array.from({length: 40}, (_, i) => {
		const Z = 1.6 + (4.4 * i) / 39;
		return [roadR(Z) * Z + 0.55 + 0.25 * (Z - 1.6) + 0.06 * Math.sin(Z * 2), Z] as Pt;
	}),
];
/** V 章末尾：路走到一半分出的那条极淡的小路 */
export const branchG: Pt[] = Array.from({length: 30}, (_, i) => {
	const u = i / 29;
	const Z0 = 2.6;
	const Z = Z0 + 4.5 * u;
	return [roadR(Z0) * Z0 + 1.6 * u * u + 0.2 * u, Z] as Pt;
});

type Blade = {X: number; Z: number; h: number; a: number; ph: number; lean: number; dR: number; dOld: number; oldIdx: number; wide: boolean; grow: number; rise: number};
type Wide = {pts: Pt[]; k: number; fade: boolean};
type W6 = {blades: Blade[]; wide: Wide[]};
let W: W6 | null = null;

const dPoly = (X: number, Z: number, poly: Pt[]) => {
	let d = 1e9;
	for (let i = 1; i < poly.length; i++) {
		const [ax, az] = poly[i - 1];
		const [bx, bz] = poly[i];
		const dx = bx - ax;
		const dz = bz - az;
		const u = clamp(((X - ax) * dx + (Z - az) * dz) / (dx * dx + dz * dz || 1));
		d = Math.min(d, Math.hypot(X - ax - u * dx, Z - az - u * dz));
	}
	return d;
};

export const world6 = (): W6 => {
	if (W) return W;
	const R = mulberry32(606);
	const blades: Blade[] = [];
	for (let i = 0; i < 4000; i++) {
		const wide = i >= 2500;
		let X: number;
		let Z: number;
		if (!wide) {
			Z = 0.3 * Math.pow(9 / 0.3, R());
			X = (R() * 2 - 1) * (0.98 * Z + 0.04);
		} else {
			Z = 0.2 + 13 * Math.pow(R(), 1.3);
			X = -5 + 12.5 * R();
		}
		const dR = dPoly(X, Z, roadG);
		let dOld = 1e9;
		let oldIdx = -1;
		oldRoads.forEach((r, k) => {
			const d = dPoly(X, Z, r);
			if (d < dOld) {
				dOld = d;
				oldIdx = k;
			}
		});
		blades.push({X, Z, h: Z < 0.6 ? 0.005 + 0.007 * R() : 0.006 + 0.011 * R(), a: 0.13 + 0.17 * R(), ph: R() * TAU, lean: (R() - 0.5) * 0.7, dR, dOld, oldIdx, wide, grow: R(), rise: R()});
	}
	// 升高之后看到的上百条路：亮度不一，有的正在被草收回
	const wide: Wide[] = [];
	const places: Pt[] = [];
	for (let i = 0; i < 70; i++) {
		const Z = 0.1 + 24 * Math.pow(R(), 1.5);
		places.push([-2 - 0.35 * Z + (4 + 1.1 * Z) * R(), Z]);
	}
	const seen = new Set<string>();
	places.forEach((p, i) => {
		const ds = places.map((q, j) => [Math.hypot((q[0] - p[0]) * 1.0, q[1] - p[1]), j] as [number, number]).sort((a, b) => a[0] - b[0]);
		for (let q = 1; q <= 3; q++) {
			const j = ds[q][1];
			const key = i < j ? `${i}_${j}` : `${j}_${i}`;
			if (seen.has(key)) continue;
			seen.add(key);
			const a = places[i];
			const b = places[j];
			const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
			const nx = -(b[1] - a[1]) / L;
			const nz = (b[0] - a[0]) / L;
			const amp = (R() - 0.5) * 0.25 * L;
			const ph = R() * TAU;
			const pts: Pt[] = [];
			for (let k = 0; k <= 20; k++) {
				const u = k / 20;
				const m = amp * Math.sin(Math.PI * u) + 0.04 * L * Math.sin(u * 9 + ph) * Math.sin(Math.PI * u);
				pts.push([a[0] + (b[0] - a[0]) * u + nx * m, a[1] + (b[1] - a[1]) * u + nz * m]);
			}
			const k = Math.pow(R(), 1.8);
			wide.push({pts, k: 0.1 + 0.9 * k, fade: R() < 0.35});
		}
	});
	W = {blades, wide};
	return W;
};

const projPoly = (c: Cam3, poly: Pt[]): Pt[] => {
	const out: Pt[] = [];
	for (const [X, Z] of poly) {
		const [x, y] = proj6(c, X, 0, Z);
		if (!Number.isNaN(x)) out.push([x, y]);
	}
	return out;
};
/** 熟路的屏幕折线（V 章末尾的形变要用） */
export const roadScreen = (t: number) => projPoly(cam6(t), roadG);
export const branchScreen = (t: number) => projPoly(cam6(t), branchG);

/** 草地本体。grassT：每根草冒出来的时间（V 章末尾按离路远近）；pathK：熟路亮度；roadP：熟路从远往近展开的进度 */
export const drawMeadow = (g: Ctx, t: number, o: {K: number; ambK?: number; roadP: number; roadFromFar: boolean; grassOn: (b: Blade) => number; branchK: number; oldK: number; wideK: number; runner: boolean}) => {
	const w = world6();
	const c = cam6(t);
	camReset(g);
	const K = o.K;
	if (K <= 0.003) return;
	const KA = K * (o.ambK ?? 1);
	// 环境光：熟路一带的暖光 + 草地上的萤绿
	{
		const [rx, ry] = proj6(c, roadG[30][0], 0, roadG[30][1]);
		if (!Number.isNaN(rx)) spr(g, rx, ry, 560, P.amber, 0.08 * KA * clamp(o.roadP * 1.5), 'soft');
		const [gx, gy] = proj6(c, 0.6, 0, 2.5);
		if (!Number.isNaN(gx)) {
			g.save();
			g.translate(960, gy + 120);
			g.scale(1, 0.4);
			spr(g, 0, 0, 1100, P.leafDeep, 0.13 * KA, 'soft');
			g.restore();
		}
	}
	// 远处的薄雾
	const [hx, hy] = proj6(c, 2, 0, 60);
	if (!Number.isNaN(hy)) {
		g.save();
		g.translate(960, hy + 8);
		g.scale(1, 0.08);
		spr(g, 0, 0, 1300, P.leafDeep, 0.22 * KA, 'soft');
		g.restore();
	}
	void hx;
	// 草叶：按深度分三档线宽
	const buckets: [Pt, Pt][][] = [[], [], [], [], [], []];
	const tips: [number, number, number, number][] = [];
	for (const b of w.blades) {
		const on = o.grassOn(b);
		if (on <= 0.003) continue;
		const [sx, sy, zc] = proj6(c, b.X, 0, b.Z);
		if (Number.isNaN(sx) || sx < -60 || sx > 1980 || sy < -40 || sy > 1150) continue;
		// 被路压倒：熟路两侧 18 px 内
		let flat = 1;
		let flatA = 1;
		const band = (18 * zc) / c.f;
		if (b.dR < band) {
			const fv = o.roadFromFar ? clamp(o.roadP * 1.2 - (1 - b.Z / 16)) : o.roadP;
			flat = lerp(1, 0.3, fv);
			flatA = lerp(1, 0.4, fv);
		}
		if (b.dOld < band) {
			// 旧路：起初压着，258.8 之后一根根直起来
			const up = smooth(inv(258.8 + 3.6 * b.rise, 259.6 + 3.6 * b.rise, t));
			flat = Math.min(flat, lerp(0.3, 1, up));
			flatA = Math.min(flatA, lerp(0.4, 1, up));
		}
		const hb = b.h * flat * smooth(clamp(on * 1.4));
		const sway = 0.052 * Math.sin(t * 1.25 + b.X * 2.1 + b.Z * 0.6) * (0.6 + 0.4 * Math.sin(t * 0.41 + b.ph));
		const ang = b.lean + sway;
		const [mx, my] = proj6(c, b.X + 0.5 * hb * Math.sin(ang * 0.4), 0.5 * hb * Math.cos(ang * 0.4), b.Z);
		const [tx, ty] = proj6(c, b.X + hb * Math.sin(ang), hb * Math.cos(ang), b.Z);
		if (Number.isNaN(tx) || Number.isNaN(mx)) continue;
		const near = clamp(1.2 / Math.pow(zc, 0.7), 0, 1);
		const a = b.a * flatA * on * K * (0.55 + 0.45 * near) * (sy > 960 ? 0.6 : 1);
		const wc = zc < 0.8 ? 0 : zc < 2.5 ? 1 : 2;
		buckets[wc * 2 + (a > 0.2 ? 1 : 0)].push([[sx, sy], [mx, my]], [[mx, my], [tx, ty]]);
		tips.push([tx, ty, near, a]);
	}
	const widths = [1.8, 1.8, 1.1, 1.1, 0.8, 0.8];
	buckets.forEach((bk, i) => {
		if (!bk.length) return;
		g.strokeStyle = `rgba(159,227,166,${i % 2 ? 0.36 : 0.22})`;
		g.lineWidth = widths[i];
		g.lineCap = 'round';
		g.beginPath();
		for (const [p, q] of bk) {
			g.moveTo(p[0], p[1]);
			g.lineTo(q[0], q[1]);
		}
		g.stroke();
	});
	for (const [x, y, near, a] of tips) spr(g, x, y, 1.6 + 2.6 * near, P.leaf, a * 1.3);
	// 升高后看到的上百条路
	if (o.wideK > 0.003) {
		for (const wr of w.wide) {
			const pts = projPoly(c, wr.pts);
			if (pts.length < 2) continue;
			const [, , zc] = proj6(c, wr.pts[10][0], 0, wr.pts[10][1]);
			const far = clamp(2.2 / Math.pow(Math.max(0.3, zc), 0.8), 0, 1);
			const k = wr.k * far * (wr.fade ? lerp(1, 0.12, smooth(inv(265.8, 269.4, t))) : 1) * o.wideK * K;
			gline(g, pts, P.gold, null, (0.6 + 1.3 * wr.k) * (0.5 + 0.5 * far), 0.75 * k, wr.k > 0.5);
		}
	}
	// 旧路：金色从 0.4 退到 0
	if (o.oldK > 0.003) for (const r of oldRoads) gline(g, projPoly(c, r), P.gold, null, 1.4, o.oldK * K, false);
	// 分出去的第二条小路（极淡）
	if (o.branchK > 0.003) {
		const bp = projPoly(c, branchG);
		gline(g, bp, P.gold, null, 1.2, o.branchK * K, false);
	}
	// 熟路
	if (o.roadP > 0.002) {
		const all = projPoly(c, roadG);
		const n = all.length;
		const m = Math.max(2, Math.round(o.roadP * (n - 1)) + 1);
		const pts = o.roadFromFar ? all.slice(n - m) : all.slice(0, m);
		// 近处粗、远处细：分段画
		for (let j = 0; j < pts.length - 1; j += 4) {
			const seg = pts.slice(j, Math.min(pts.length, j + 5));
			const idx = (o.roadFromFar ? n - m : 0) + j;
			const Z = ROAD_Z[Math.min(ROAD_Z.length - 1, idx)];
			const [, , zc] = proj6(c, roadG[Math.min(roadG.length - 1, idx)][0], 0, Z);
			const endF = 1 - smooth(clamp((idx / (n - 1) - 0.88) / 0.12));
			const wd = clamp(3.4 * Math.pow(0.9 / Math.max(0.3, zc), 0.6), 0.7, 3.6) * (0.35 + 0.65 * endF);
			gline(g, seg, P.gold, null, wd, 0.95 * K * endF, true);
		}
		{
			const q = all[Math.round((n - 1) * 0.9)];
			if (q && (!o.roadFromFar || o.roadP > 0.05)) spr(g, q[0], q[1], 18, P.gold, 0.45 * K);
		}
		// 流动的金色粒子
		if (pts.length > 3) {
			const cum = cumlen(pts);
			const L = cum[cum.length - 1];
			const cnt = Math.floor((L / 100) * 6);
			for (let j = 0; j < cnt; j++) {
				const s = (j / cnt + (t * 20) / L) % 1;
				const [x, y] = along(pts, cum, s);
				spr(g, x, y, 4.5 * (1.3 - s), P.goldCore, 0.55 * K);
			}
		}
		// 一颗金点沿熟路从近处疾走到地平线，约 300 px/s，到头再从近处出发
		if (o.runner) {
			const scr = all.filter((p) => p[1] < 935);
			if (scr.length > 3) {
				const cum = cumlen(scr);
				const L = cum[cum.length - 1];
				const t0 = VI.familiar_road_run[0];
				const ra = smooth(inv(t0, t0 + 0.4, t)) * (1 - smooth(inv(VI.familiar_road_run[1], VI.familiar_road_run[1] + 0.6, t)));
				const s = ((t - t0) * 300) % L;
				// 跑到远端前就淡掉（审片：金点每次都跑进地平线那团亮折线）
				const farF = 1 - smooth(clamp((s / L - 0.8) / 0.15));
				const nearF = smooth(clamp(s / L / 0.05));
				for (let j = 10; j >= 0; j--) {
					const sj = s - j * 9;
					if (sj < 0) continue;
					const [x, y] = along(scr, cum, sj / L);
					const f = 1 - j / 10;
					spr(g, x, y, (j === 0 ? 26 : 10) * (1.2 - 0.6 * (sj / L)), j === 0 ? P.goldCore : P.gold, ra * K * f * f * farF * nearF);
				}
				const [x, y] = along(scr, cum, s / L);
				spr(g, x, y, 90, P.amber, 0.28 * ra * K * farF * nearF, 'soft');
			}
		}
	}
};

export const drawBecoming = (g: Ctx, t: number) => {
	if (t < 252.3 || t > 270.5) return;
	const K = 1 - smooth(inv(VI.fade_to_prologue[0], VI.fade_to_prologue[1] - 0.1, t));
	const oldK = 0.4 * (1 - smooth(inv(258.8, 263.3, t)));
	const wideK = smooth(inv(264.6, 266.8, t));
	drawMeadow(g, t, {
		K,
		roadP: 1,
		roadFromFar: false,
		grassOn: (b) => (b.wide ? smooth(inv(264.5, 266.5, t)) : 1),
		branchK: 0.4 * (1 - smooth(inv(253, 258, t))),
		oldK,
		wideK,
		runner: t < 264.3,
	});
};

// ---------------------------------------------------------------- 片尾（用户 2026-10-12：片尾的「等光」没成立）
// 原来片尾只有一声叮，离上一次配对四分钟，联想早就淡了，观众并没有等光。现在回到片头构图后先重新配对三次：
// 叮和片头是同一个（同一个 drawDing、同一个音色），间隔一样是 2.0 s，叮后 0.6 s 来光；光还是片头那个 drawLight，
// 只是亮度 ×1.5、尺寸 ×1.45，外面再托一层大暖光，一眼认得出、又比片头更强。第四声叮之后 B 处什么都没有，
// 星尘也和片头一样从 B 那一块拿掉；2.0 s 后才出 #38「四分钟了，你还在等那道光。」
const RB = VI.fade_to_prologue[0]; // 269.4：草地开始暗下去
const PAIRS = VI.coda_pairs as [number, number][]; // [叮, 光]（场景时间）
const D_LAST = VI.ding7; // 最后一声（不来光）
const STILL0 = VI.still_sub[0]; // #38 出现
const TITLE_IN = meta.end_title.in[0];
const CL = VI.coda_light;

/** 片尾镜头：和片头第一个画面一样（中心 960, 450），极慢推近 */
const camCoda = (t: number) => cam(1 + 0.03 * inv(RB + 0.6, TITLE_IN + 0.5, t), 960, 450);

/** 最后一声之后，B 那一块和片头一样「完全是黑的」：拿掉星尘（交给 Backdrop 的 mask，屏幕坐标） */
export const codaMask = (t: number) => {
	const k = Math.min(smooth((t - (D_LAST + 0.1)) / 0.3), smooth((TITLE_IN - t) / 0.5));
	if (k <= 0) return null;
	const [x, y] = toScr(camCoda(t), B0[0], B0[1]);
	return {x, y, r: 300, k: 1 - k};
};

/** 片尾：回到序的构图。A 亮起，三次「叮 → 光」，最后一声叮，B 空着；A 慢慢暗下去 */
export const drawCoda = (g: Ctx, t: number) => {
	if (t < RB + 0.5 || t > TITLE_IN + 0.7) return;
	camSet(g, camCoda(t));
	const appear = smooth(inv(RB + 0.6, RB + 1.0, t));
	const dd = smooth(inv(STILL0, TITLE_IN - 0.3, t));
	const dim = lerp(0.9, 0.3, dd);
	const out = 1 - smooth(inv(TITLE_IN - 0.3, TITLE_IN + 0.6, t));
	drawA(g, A0[0], A0[1], t, appear * dim * out, 0, lerp(1, 0.7, dd));
	spr(g, A0[0], A0[1], 620 * lerp(1, 0.7, dd), P.leafDeep, 0.09 * appear * dim * out, 'soft');
	for (const [d, l] of PAIRS) {
		drawDing(g, A0[0], A0[1], t, d);
		drawLight(g, B0[0], B0[1], t, l, CL.K, CL.scale);
		const k = lightK(t - l);
		if (k > 0.003) {
			spr(g, B0[0], B0[1], 1250, P.amber, 0.12 * k, 'soft');
			spr(g, 960, 450, 1400, P.gold, 0.05 * k, 'soft');
		}
	}
	drawDing(g, A0[0], A0[1], t, D_LAST);
};
