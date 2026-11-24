/** 2022 · 你可能认识的人：领英的倒 U（按共同好友算），强关系的网兜。219.4–247.4 s。
 *  审片（第二轮）：原来是 9 根刻度短线 + 点线倒 U，像一张去掉坐标轴的点图；而且全片「线」都表示关系，
 *  这里的竖线却表示人。现在：
 *  · 9 个人是一排横贯画面的发光节点，共同好友是围在身边的小星，越多越亮越大；
 *  · 每个人和「你」之间连一根线，线的粗细、亮度就是共同好友多少（线仍然是关系）；
 *  · 倒 U 是一道完整的琥珀光丘（粗细、亮度沿弧渐变，带光晕），左右两边都落回到底；
 *  · 亮点爬到峰顶时，那个人和「你」之间的线变成琥珀色（最能帮上忙的，是稍强一点的那根线）。
 *  用户反馈（2026-10-12）：「稍强一点的」会被听成强关系，和下一句「接住你的，常常是强关系」撞在一起。现在：
 *  · 共同好友改成 0、2、5、10、15、22、30、40、50，峰（10 个）落在第 4 个人上，在一排的左半边（偏「生」那一侧）；
 *  · 「约 10 个共同好友」贴在峰下面那个人头上，峰和人之间一根竖的虚线；
 *  · S32b「不算熟，也不算生。」：最右那根粗线（熟）亮一下、行尾出「熟」，最左那根虚线（生）亮一下、行首出「生」，
 *    最后中间那根琥珀线再亮一下。这三下按真实时间走（RAW.k2022），不跟着放慢的故事时间。
 *  · 峰顶之后故事时间放慢（见 time.ts / ties_timeline.py），所以闪烁、呼吸、镜头漂移都改用真实时间。 */
import {clamp, easeInOut, lerp, mulberry32} from '../../kit/util';
import {AMBER, AMBER_CORE, arcPts, bezC, cam, drawYou, drift, glow, glowLines, hairLines, ID, lerpXY, mixHex, P, samp, SILVER, type Ctx, type View} from '../draw';
import type {XY} from '../model';
import {ez, lin, pulse, RAW, real, sm, vis} from '../time';

const YOU0: XY = [960, 400];
const YOU_LOW: XY = [960, 790];
export const MUTUAL = [0, 2, 5, 10, 15, 22, 30, 40, 50];
const MAX_M = MUTUAL[MUTUAL.length - 1];
const ROW_Y = 520;
const slotX = (k: number) => 300 + 165 * k;
export const PEAK_K = MUTUAL.indexOf(10); // 第 4 个人（左半边：还是弱关系）
// 9 个「你可能认识的人」：先在「你」四周一颗接一颗冒出来
const PYMK = (() => {
	const r = mulberry32(2022);
	const pts = Array.from({length: 9}, (_, k) => {
		const a = ((-160 + k * 40 + (r() - 0.5) * 16) * Math.PI) / 180;
		return {p: [YOU0[0] + Math.cos(a) * 330, YOU0[1] + Math.sin(a) * 200] as XY, t0: 220.2 + k * 0.27};
	});
	// 按 x 排好，落到对应的位置上（左边的落到左边）
	const order = pts.map((_, i) => i).sort((a, b) => pts[a].p[0] - pts[b].p[0]);
	return order.map((i, k) => ({...pts[i], slot: k, appearOrder: i}));
})();
// 每个人身边的共同好友
const FRIENDS = MUTUAL.map((n, k) => {
	const r = mulberry32(100 + k);
	return Array.from({length: n}, (_, j) => {
		const a = r() * Math.PI * 2;
		// 最多 50 个：按 30 个时的大小缩放，最大那团和原来一样大，只是更密
		const rr = 14 + 6 * Math.sqrt(((j + 1) * 30) / MAX_M) * (0.7 + 0.5 * r());
		return {o: [Math.cos(a) * rr, Math.sin(a) * rr * 1.1] as XY, ph: r() * 6.28};
	});
});
// 倒 U 光丘：从最左的人上方起，峰在第 4 个人（10 个共同好友）上方，落到最右的人上方
const X0 = slotX(0);
const X1 = slotX(8);
const XP = slotX(PEAK_K);
const BASE = ROW_Y - 58;
const HILL_H = 290;
const bump = (x: number) =>
	x <= XP ? Math.pow(Math.sin((Math.PI / 2) * clamp((x - X0) / (XP - X0))), 2) : Math.pow(Math.cos((Math.PI / 2) * clamp((x - XP) / (X1 - XP))), 2);
const hillY = (x: number) => BASE - HILL_H * bump(x);
const PEAK: XY = [XP, hillY(XP)];
/** 「约 10 个共同好友」：贴在峰下面那个人头上（不再挂在画面顶上的峰尖） */
export const peakLabelAt = (t: number): XY => P(view22(t), [XP, ROW_Y - 74]);
/** 一排两端的「生」「熟」 */
export const rowEndsAt = (t: number): [XY, XY] => [P(view22(t), [slotX(0) - 64, ROW_Y]), P(view22(t), [slotX(8) + 84, ROW_Y])];
export const arcEndAt = (t: number): XY => P(view22(t), [X1 + 30, BASE - 10]);
const youAt = (t: number): XY => lerpXY(YOU0, YOU_LOW, ez(t, 223.0, 225.0));

// 网兜
// 审片：网兜太小（原来宽 340 px）→ 以 (960, 478) 为中心放大到约 1.6 倍宽、1.5 倍深
const NET: XY[] = (
	[
		[790, 478],
		[1130, 478],
		[866, 534],
		[1054, 534],
		[920, 568],
		[1000, 568],
	] as XY[]
).map(([x, y]) => [960 + (x - 960) * 1.6, 478 + (y - 478) * 1.5] as XY);
const NET_E: [number, number][] = [
	[0, 2], [2, 4], [4, 5], [5, 3], [3, 1], [0, 4], [1, 5], [2, 5], [3, 4],
];
const CATCH = 237.3;
const ARC_A: XY = [110, 170];
const ARC_B: XY = [1810, 170];
const ARC_C: XY = [960, 2 * 330 - 170];
const arcFn = bezC(ARC_A, ARC_C, ARC_B);

export const view22 = (t: number): View => {
	const [dx, dy] = drift(real(t), 4);
	return cam(1 + 0.03 * lin(t, 219.4, 233.5) + 0.03 * lin(t, 234, 247.4), 960 - dx, 540 - dy);
};

const node = (g: Ctx, v: View, p: XY, r: number, k: number, t: number, i: number, color = SILVER) => {
	if (k <= 0.003) return;
	const tw = 0.8 + 0.2 * Math.sin(t * (1.4 + (i % 5) * 0.3) + i * 2.1);
	glow(g, v, p, r * 2.8, color, 0.16 * k * tw, 'soft');
	glow(g, v, p, r, color, 0.85 * k * tw, 'dot');
};

export const draw2022 = (g: Ctx, t: number) => {
	if (t < 219.3 || t > 247.5) return;
	const v = view22(t);
	const tr = real(t); // 真实时间：闪烁、呼吸用它（峰顶之后故事时间放慢）
	const K = RAW.k2022;
	const shuP = pulse(tr, K.shu, 1.3); // 熟：最右那根粗线亮一下
	const shengP = pulse(tr, K.sheng, 1.3); // 生：最左那根虚线亮一下
	const midP = pulse(tr, K.mid, 1.5); // 中间：峰下那根琥珀线再亮一下
	// ---------- 3:39.9–3:53.5
	if (t < 234.2) {
		const gone = 1 - sm(t, 233.2, 233.9);
		const you = youAt(t);
		const youA = sm(t, 219.5, 220.3) * gone;
		const fall = (k: number) => ez(t, 223.0 + k * 0.12, 224.6 + k * 0.12);
		const helped = sm(t, 230.1, 230.6); // 峰顶那个人的线变成琥珀
		// 你和 9 个人之间的线：粗细、亮度 = 共同好友多少
		const tieA = sm(t, 224.6, 225.8) * gone;
		if (tieA > 0)
			PYMK.forEach((q) => {
				const m = MUTUAL[q.slot] / MAX_M;
				const dst: XY = [slotX(q.slot), ROW_Y];
				const line = samp(bezC(you, [lerp(you[0], dst[0], 0.5), lerp(you[1], dst[1], 0.62)], dst), 24, 0, ez(t, 224.6 + 0.08 * q.slot, 225.6 + 0.08 * q.slot));
				const amb = q.slot === PEAK_K ? helped : 0;
				const k = (0.14 + 0.5 * m) * (1 - 0.35 * sm(t, 225.6, 226.6)) * tieA;
				const hi = q.slot === 8 ? 0.55 * shuP : q.slot === PEAK_K ? 0.8 * midP : 0;
				if (m === 0) hairLines(g, v, [line], SILVER, 1 + 0.6 * shengP, (0.3 + 0.55 * shengP) * tieA, [3, 6]);
				else glowLines(g, v, [line], mixHex(SILVER, AMBER, amb), 0.6 + 1.6 * m + 1.2 * amb, k + 0.75 * amb * tieA + hi * tieA, true);
			});
		for (const q of PYMK) {
			const a = sm(t, q.t0, q.t0 + 0.35) * gone;
			if (a <= 0) continue;
			const f = fall(q.slot);
			const dst: XY = [slotX(q.slot), ROW_Y];
			const p = lerpXY(q.p, dst, f);
			const m = MUTUAL[q.slot] / MAX_M;
			// 虚线小环（像推荐卡片里的人）→ 一颗发光的人，共同好友越多越亮越大
			const sp = P(v, p);
			const rr = 22 * (1 - f) + 6;
			if (f < 0.98) hairLines(g, ID, [arcPts(sp[0], sp[1], rr * Math.sqrt(v.s), 0, Math.PI * 2, 40)], SILVER, 1.2, 0.65 * a * (1 - f), [3, 4]);
			const amb = q.slot === PEAK_K ? helped : 0;
			const hiN = q.slot === 8 ? shuP : q.slot === 0 ? shengP : q.slot === PEAK_K ? midP : 0;
			node(g, v, p, 9 + 9 * Math.sqrt(m) * f, (0.55 + 0.45 * f) * a * (1 + 0.6 * amb) * (1 + 0.7 * hiN), tr, q.slot, mixHex(SILVER, AMBER, amb));
			// 共同好友
			const fa = sm(t, 224.6 + q.slot * 0.1, 225.8) * gone;
			if (fa > 0) {
				const fr = FRIENDS[q.slot];
				for (let j = 0; j < fr.length; j++) glow(g, v, [dst[0] + fr[j].o[0], dst[1] + fr[j].o[1]], 6, SILVER, 0.6 * fa * (0.75 + 0.25 * Math.sin(tr * 2 + fr[j].ph)) * (1 + 0.5 * (q.slot === 8 ? shuP : 0)), 'star');
			}
		}
		if (youA > 0) drawYou(g, v, you, youA, tr);
		// 倒 U：一道琥珀光丘，从左往右长出来（225.4–227.6），两边都落回到底
		const grow = ez(t, 225.4, 227.6);
		if (grow > 0) {
			const n = 48;
			const xEnd = lerp(X0, X1, grow);
			for (let s = 0; s < n; s++) {
				const xa = X0 + ((X1 - X0) * s) / n;
				const xb = X0 + ((X1 - X0) * (s + 1)) / n;
				if (xa >= xEnd) break;
				const b = bump((xa + xb) / 2);
				const seg: XY[] = [
					[xa, hillY(xa)],
					[Math.min(xb, xEnd), hillY(Math.min(xb, xEnd))],
				];
				glowLines(g, v, [seg], mixHex('#d9c7a4', AMBER, 0.4 + 0.6 * b), 1.3 + 1.7 * b, (0.32 + 0.6 * b) * gone, true);
			}
			// 峰顶附近一团柔光
			glow(g, v, PEAK, 160, AMBER, 0.12 * sm(t, 226.6, 227.6) * gone, 'soft');
		}
		// 一颗亮琥珀点从左端沿弧爬到峰顶，停住
		const cl = clamp((t - 228.3) / 2.0);
		if (t >= 228.3) {
			const x = lerp(X0, XP, easeInOut(cl));
			const p: XY = [x, hillY(x)];
			const k = gone * (cl < 1 ? 1 : 0.85 + 0.15 * Math.sin((tr - real(230.3)) * 3));
			glow(g, v, p, 24, AMBER, k, 'dot');
			glow(g, v, p, 70, AMBER, 0.22 * k, 'soft');
			glow(g, v, p, 9, AMBER_CORE, 0.9 * k, 'star');
		}
		// 峰和峰下那个人之间一根竖的虚线（和「约 10 个共同好友」同时出现）：看得出峰对的是哪个人
		const drop = Math.min(vis(t, 230.3, 240, 0.5, 0), vis(tr, 0, K.hold_end - 0.4, 0, 0.6)) * gone;
		if (drop > 0) hairLines(g, v, [[[XP, PEAK[1] + 34], [XP, ROW_Y - 100]]], AMBER, 1, 0.45 * drop, [4, 7]);
	}
	// ---------- 3:54.3–4:06.2 强关系的网兜
	if (t >= 233.8) {
		const end = 1 - sm(t, 246.2, 246.8);
		const netEnd = 1 - sm(t, 246.6, 247.35);
		const sink = ez(t, 234.8, CATCH);
		const youP: XY = [960, lerp(380, 520, sink)];
		// 接住以后网兜往下一沉，再弹回（阻尼）
		const e = t - CATCH;
		const bounce = e > 0 ? 14 * Math.exp(-e * 3.2) * Math.sin(e * 9) : 0;
		const yAdj = (i: number) => (i >= 4 ? 1 : i >= 2 ? 0.6 : 0.15) * bounce;
		const rise = (i: number) => ez(t, 235.2 + i * 0.12, 236.9 + i * 0.06);
		const net = NET.map((p, i) => [p[0], lerp(p[1] + 300, p[1], rise(i)) + yAdj(i)] as XY);
		const youY = youP[1] + (e > 0 ? bounce * 0.9 : 0);
		const lineA = sm(t, 236.2, 237.0) * netEnd;
		const glowNet = pulse(t, 244.0, 1.0);
		glowLines(g, v, NET_E.map(([a, b]) => [net[a], net[b]]), SILVER, 1.2, (0.42 + 0.3 * glowNet + 0.3 * pulse(t, CATCH, 0.8)) * lineA, true);
		net.forEach((p, i) => node(g, v, p, 12, sm(t, 235.2 + i * 0.12, 235.8 + i * 0.12) * netEnd, t, i));
		// 「你」：慢慢变暗、往下沉，237.3 被接住后重新亮起
		const youK = sm(t, 233.9, 234.6) * lerp(1, 0.35, sm(t, 234.8, 236.8)) * (t > CATCH ? lerp(0.35, 1, sm(t, CATCH, CATCH + 0.6)) / 0.35 : 1) * end;
		drawYou(g, v, [youP[0], youY], youK, t, 0);
		// 上方一根琥珀长弦从最左划到最右，弯成一道弧（241.2–242.6）；242.8 一颗小琥珀光沿弧滑下来，落进「你」
		const arcP = clamp((t - 241.2) / 1.4);
		if (arcP > 0) {
			const k = (0.65 + 0.4 * pulse(t, 244.0, 1.0)) * end;
			glowLines(g, v, [samp(arcFn, 70, 0, easeInOut(arcP))], AMBER, 2.2, k);
		}
		if (t >= 242.8 && t < 244.4) {
			const at = (tt: number): XY => {
				if (tt < 243.6) return arcFn(0.5 * easeInOut(clamp((tt - 242.8) / 0.8)));
				return lerpXY(ARC_C.map((c, i) => (i === 1 ? 330 : c)) as XY, [youP[0], youY], easeInOut(clamp((tt - 243.6) / 0.4)));
			};
			const tail: XY[] = [];
			for (let j = 12; j >= 0; j--) tail.push(at(Math.max(242.8, t - j * 0.022)));
			glowLines(g, v, [tail], AMBER, 2.2, 0.6, false);
			glow(g, v, tail[tail.length - 1], 16, AMBER_CORE, 0.9 * (1 - sm(t, 243.95, 244.3)), 'star');
		}
		if (t >= 243.9) glow(g, v, [youP[0], youY], 34, AMBER, 0.6 * pulse(t, 243.95, 1.0), 'dot');
	}
};
export {vis};
