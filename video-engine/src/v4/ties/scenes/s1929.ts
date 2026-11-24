/** 1929 · 布达佩斯：一只刻线地球。卡林西的赌：随便挑一个人，最多隔五个人就能连上。
 *  42.2–62.4 s。末尾地球推近、经纬线变平，五个琥珀链环留在画面上，交给 1967 的地图。 */
import {clamp, easeInOut, inv, lerp, mulberry32} from '../../kit/util';
import {AMBER, AMBER_CORE, arcPts, cam, camLerp, drawYou, drift, ENGRAVE, glow, glowLines, hairLines, haze, ID, P, SILVER, type Ctx, type View} from '../draw';
import type {XY} from '../model';
import {ez, pulse, sm} from '../time';

export const ENGRAVE_HI = '#56679e';
const C0: XY = [960, 450];
const R = 300;
const TILT = (20 * Math.PI) / 180;
const D2R = Math.PI / 180;

/** 自转角（度）：每秒 6°，50 s 后慢到每秒 2° */
const rotDeg = (t: number) => {
	const t0 = 42.2;
	if (t <= t0) return 0;
	const n = Math.ceil((t - t0) * 20);
	const dt = (t - t0) / n;
	let a = 0;
	for (let k = 0; k < n; k++) {
		const tt = t0 + (k + 0.5) * dt;
		const sp = 2 + 4 * (1 - clamp((tt - 49.5) / 3));
		a += sp * dt;
	}
	return a;
};

/** 正射投影：返回相对球心的 (x, y, z)，z > 0 是朝前的半球 */
const ortho = (lat: number, lon: number, rot: number): [number, number, number] => {
	const φ = lat * D2R;
	const dl = (lon + rot) * D2R;
	const x = Math.cos(φ) * Math.sin(dl);
	const y = Math.cos(TILT) * Math.sin(φ) - Math.sin(TILT) * Math.cos(φ) * Math.cos(dl);
	const z = Math.sin(TILT) * Math.sin(φ) + Math.cos(TILT) * Math.cos(φ) * Math.cos(dl);
	return [x, y, z];
};
/** 变平：经纬线摊成平面经纬网（m = 0 球面，1 平面） */
const project = (lat: number, lon: number, rot: number, m: number): [number, number, number] => {
	const [x, y, z] = ortho(lat, lon, rot);
	if (m <= 0) return [C0[0] + R * x, C0[1] - R * y, z];
	let dl = (lon + rot) % 360;
	if (dl > 180) dl -= 360;
	if (dl < -180) dl += 360;
	const fx = (dl * D2R) * 0.92;
	const fy = (lat - 20) * D2R;
	const X = lerp(x, fx, m);
	const Y = lerp(y, fy, m);
	return [C0[0] + R * X, C0[1] - R * Y, z];
};

// 斐波那契球面 600 点
const FIB: [number, number][] = Array.from({length: 600}, (_, i) => {
	const y = 1 - (2 * (i + 0.5)) / 600;
	const lat = Math.asin(y) / D2R;
	const lon = ((i * 137.508) % 360) - 180;
	return [lat, lon];
});
const TW = (() => {
	const r = mulberry32(1929);
	return FIB.map(() => r() * 6.28);
})();

// 「你」在球面左下正面，目标在右上边缘快转到背面（按 50.8 s 时的自转角摆）
const ROT508 = rotDeg(50.8);
const YOU_LL: [number, number] = [-24, -36 - ROT508];
const TGT_LL: [number, number] = [38, 64 - ROT508];
/** 大圆插值 */
const slerpLL = (a: [number, number], b: [number, number], u: number): [number, number] => {
	const v = (ll: [number, number]) => [Math.cos(ll[0] * D2R) * Math.cos(ll[1] * D2R), Math.cos(ll[0] * D2R) * Math.sin(ll[1] * D2R), Math.sin(ll[0] * D2R)];
	const A = v(a);
	const B = v(b);
	const dot = clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1);
	const w = Math.acos(dot);
	const s0 = Math.sin((1 - u) * w) / Math.sin(w);
	const s1 = Math.sin(u * w) / Math.sin(w);
	const p = [A[0] * s0 + B[0] * s1, A[1] * s0 + B[1] * s1, A[2] * s0 + B[2] * s1];
	return [Math.asin(p[2]) / D2R, Math.atan2(p[1], p[0]) / D2R];
};
const RING_T = [56.5, 57.1, 57.7, 58.3, 58.9];
const RING_U = [1, 2, 3, 4, 5].map((k) => k / 6);
const LINK_DONE = 59.5;

export const globeView = (t: number): View => {
	const [dx, dy] = drift(t, 3);
	const V0 = cam(1 + 0.015 * ez(t, 42.2, 60.4), 960 - dx, 540 - dy);
	if (t < 60.4) return V0;
	return camLerp(cam(1.015, 960, 540), cam(2.2, C0[0], C0[1] + 10, 960, 520), ez(t, 60.4, 62.4));
};
const flatM = (t: number) => ez(t, 60.4, 62.4);

/** 五个链环此刻在屏幕上的位置（交给 1967 用） */
export const ringsScreen = (t: number): XY[] => {
	const v = globeView(t);
	const rot = rotDeg(t);
	const m = flatM(t);
	return RING_U.map((u) => {
		const ll = slerpLL(YOU_LL, TGT_LL, u);
		const [x, y] = project(ll[0], ll[1], rot, m);
		return P(v, [x, y]);
	});
};

export const draw1929 = (g: Ctx, t: number) => {
	if (t < 42.0 || t > 62.6) return;
	const v = globeView(t);
	const rot = rotDeg(t);
	const m = flatM(t);
	const fin = ez(t, 42.2, 43.8);
	const dim = 1 - 0.8 * ez(t, 60.6, 62.4); // 推近时整体压到近黑（链环不压）
	const A = fin * dim;
	// 球体的体积感：一团极暗的蓝光 + 边缘的一圈大气
	haze(g, v, [C0[0] - 60, C0[1] - 70], 340, '#16213f', 0.55 * A * (1 - m));
	if (m < 1) {
		const limb = arcPts(C0[0], C0[1], R, 0, Math.PI * 2, 160);
		glowLines(g, v, [limb], '#7d8fc4', 2.6, 0.22 * A * (1 - m), false);
		hairLines(g, v, [limb], ENGRAVE_HI, 1, 0.55 * A * (1 - m));
	}
	// 经纬线：每 15° 一根
	const front: XY[][] = [];
	const back: XY[][] = [];
	const addLine = (pts: [number, number][]) => {
		let cur: XY[] = [];
		let curF = true;
		for (const [la, lo] of pts) {
			const [x, y, z] = project(la, lo, rot, m);
			const f = z > 0;
			if (cur.length && f !== curF) {
				(curF ? front : back).push(cur);
				cur = [cur[cur.length - 1]];
			}
			curF = f;
			cur.push([x, y]);
		}
		if (cur.length > 1) (curF ? front : back).push(cur);
	};
	for (let lo = -180; lo < 180; lo += 15) {
		const pts: [number, number][] = [];
		for (let la = -90; la <= 90; la += 3) pts.push([la, lo]);
		addLine(pts);
	}
	for (let la = -75; la <= 75; la += 15) {
		const pts: [number, number][] = [];
		for (let lo = -180; lo <= 180; lo += 3) pts.push([la, lo]);
		addLine(pts);
	}
	hairLines(g, v, back, ENGRAVE_HI, 1, 0.09 * A * (1 - m));
	hairLines(g, v, front, ENGRAVE_HI, 1, 0.42 * A);
	// 球面上的 600 个人
	for (let i = 0; i < FIB.length; i++) {
		const [x, y, z] = project(FIB[i][0], FIB[i][1], rot, m);
		if (z <= 0.02) continue;
		const k = (0.18 + 0.32 * z) * (0.75 + 0.25 * Math.sin(t * 1.7 + TW[i])) * A;
		glow(g, v, [x, y], 5, SILVER, k, 'star');
	}
	// 「你」：50.8 出现在球面左下正面
	const youOn = ez(t, 50.8, 51.6);
	const [yx, yy, yz] = project(YOU_LL[0], YOU_LL[1], rot, m);
	if (youOn > 0 && yz > 0) drawYou(g, v, [yx, yy], youOn * fin * (1 - 0.6 * ez(t, 60.6, 62.4)), t);
	// 目标：右上边缘那颗点亮起，像被随手点中
	const [tx, ty, tz] = project(TGT_LL[0], TGT_LL[1], rot, m);
	const tOn = ez(t, 49.5, 50.2); // 审片（声音 P2）：「随便挑一个」的那颗点提前到 S6 末尾亮起
	if (tOn > 0 && tz > -0.05) {
		const edge = clamp(tz * 6 + 0.3);
		const fl = pulse(t, LINK_DONE, 1.1);
		glow(g, v, [tx, ty], 12, SILVER, tOn * edge * fin * (1 + 1.5 * fl) * (1 - 0.6 * ez(t, 60.6, 62.4)), 'dot');
		glow(g, v, [tx, ty], 30 + 30 * fl, SILVER, 0.2 * tOn * edge + 0.5 * fl, 'soft');
		const sp = P(v, [tx, ty]);
		glowLines(g, ID, [arcPts(sp[0], sp[1], 13 * Math.sqrt(v.s), 0, Math.PI * 2, 40)], SILVER, 1.1, 0.4 * tOn * edge * fin * (1 - 0.6 * ez(t, 60.6, 62.4)), false);
	}
	// 链环：沿大圆弧依次长出 5 个琥珀小环，最后一跳接上目标
	if (t >= RING_T[0] - 0.4) {
		const prog = (u: number) => {
			// 线长到第 k 个环用掉 0.6 s
			const tt = t - (RING_T[0] - 0.6);
			return clamp(tt / (LINK_DONE - (RING_T[0] - 0.6))) >= u;
		};
		const pts: XY[] = [];
		const total = clamp((t - (RING_T[0] - 0.6)) / (LINK_DONE - (RING_T[0] - 0.6)));
		for (let s = 0; s <= 80; s++) {
			const u = s / 80;
			if (u > total) break;
			const ll = slerpLL(YOU_LL, TGT_LL, u);
			const [x, y, z] = project(ll[0], ll[1], rot, m);
			if (z < 0) break;
			pts.push([x, y]);
		}
		void prog;
		glowLines(g, v, [pts], AMBER, 1.6, 0.6 * (1 - 0.3 * ez(t, 60.6, 62.4)), true);
		RING_U.forEach((u, k) => {
			const a = ez(t, RING_T[k], RING_T[k] + 0.35);
			if (a <= 0) return;
			const ll = slerpLL(YOU_LL, TGT_LL, u);
			const [x, y] = project(ll[0], ll[1], rot, m);
			const sp = P(v, [x, y]);
			const rr = 9 * Math.pow(v.s, 0.35);
			glowLines(g, ID, [arcPts(sp[0], sp[1], rr, 0, Math.PI * 2, 36)], AMBER, 1.5, a * (1 + 0.8 * pulse(t, RING_T[k], 0.6)), true);
			glow(g, ID, sp, 22, AMBER, 0.25 * a, 'soft');
		});
		// 最后一跳的光点
		const hu = (t - 58.9) / 0.6;
		if (hu > 0 && hu < 1.2) {
			const ll = slerpLL(YOU_LL, TGT_LL, lerp(5 / 6, 1, easeInOut(clamp(hu))));
			const [x, y] = project(ll[0], ll[1], rot, m);
			glow(g, v, [x, y], 12, AMBER_CORE, (1 - inv(1, 1.2, hu)) * 0.9, 'star');
		}
	}
};
