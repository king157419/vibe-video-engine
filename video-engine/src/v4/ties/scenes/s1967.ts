/** 1967 · 奥马哈：米尔格拉姆把卡林西的赌寄了出去。62.4–93.1 s。
 *  296 颗琥珀火星（约 2/3 在内布拉斯加、1/3 在波士顿）一跳一跳往波士顿走，232 颗半路熄灭，64 颗到达。 */
import {clamp, easeIn, easeInOut, inv, mulberry32} from '../../kit/util';
import {FACTS} from '../data.gen';
import {AMBER, AMBER_CORE, arcPts, bez, cam, camLerp, comet, drawStranger, drift, ENGRAVE, glow, glowLines, hairLines, hairSegs, haze, ID, lerpXY, P, samp, SILVER, type Ctx, type View} from '../draw';
import type {XY} from '../model';
import {ez, lin, pulse, sm, vis} from '../time';
import {ENGRAVE_HI, ringsScreen} from './s1929';

// ---------------------------------------------------------------- 投影：兰伯特等角圆锥（标准纬线 33°、45°，中央经线 −96°）
const D2R = Math.PI / 180;
const φ1 = 33 * D2R;
const φ2 = 45 * D2R;
const nL = Math.log(Math.cos(φ1) / Math.cos(φ2)) / Math.log(Math.tan(Math.PI / 4 + φ2 / 2) / Math.tan(Math.PI / 4 + φ1 / 2));
const FL = (Math.cos(φ1) * Math.pow(Math.tan(Math.PI / 4 + φ1 / 2), nL)) / nL;
const ρ0 = FL / Math.pow(Math.tan(Math.PI / 4 + (39 * D2R) / 2), nL);
export const lcc = (lat: number, lon: number): XY => {
	const ρ = FL / Math.pow(Math.tan(Math.PI / 4 + (lat * D2R) / 2), nL);
	const θ = nL * (lon + 96) * D2R;
	return [ρ * Math.sin(θ), -(ρ0 - ρ * Math.cos(θ))];
};

// 本土 48 州外轮廓（简化，顺时针，从华盛顿州西北角起）
export const US_LL: [number, number][] = [
	[48.38, -124.72], [47.9, -124.6], [46.9, -124.1], [46.25, -124.05], [45.0, -123.95], [43.4, -124.3], [42.0, -124.2], [40.44, -124.4],
	[39.0, -123.7], [37.8, -122.5], [36.95, -122.0], [36.6, -121.9], [35.6, -121.15], [34.45, -120.5], [34.0, -118.8], [33.7, -118.3],
	[32.55, -117.1], [32.72, -114.72], [31.33, -111.07], [31.33, -108.21], [31.78, -108.21], [31.78, -106.53], [30.6, -105.0], [29.5, -104.4],
	[29.2, -103.2], [29.8, -102.4], [29.6, -101.0], [28.0, -99.5], [26.4, -99.0], [25.95, -97.15], [27.0, -97.4], [28.4, -96.6],
	[29.3, -94.8], [29.7, -93.8], [29.55, -92.3], [29.1, -90.5], [29.0, -89.4], [30.2, -89.4], [30.4, -88.1], [30.4, -86.6],
	[29.7, -85.3], [30.0, -84.2], [29.1, -82.8], [27.8, -82.7], [26.5, -82.0], [25.15, -81.1], [25.5, -80.4], [26.7, -80.04],
	[28.6, -80.6], [30.4, -81.4], [32.0, -80.85], [33.0, -79.4], [33.85, -78.0], [34.7, -76.6], [35.25, -75.5], [36.9, -75.98],
	[38.4, -75.05], [38.93, -74.9], [39.6, -74.2], [40.5, -74.0], [40.65, -73.0], [41.25, -72.0], [41.5, -71.0], [41.6, -70.6],
	[41.75, -69.95], [42.05, -70.2], [42.6, -70.65], [43.6, -70.2], [44.3, -68.6], [44.8, -66.95], [45.9, -67.8], [47.1, -67.8],
	[47.45, -69.2], [46.4, -70.0], [45.3, -70.8], [45.0, -71.5], [45.0, -74.7], [44.1, -76.4], [43.6, -79.0], [42.85, -78.9],
	[42.3, -80.5], [41.9, -82.5], [42.3, -83.1], [42.9, -82.4], [44.5, -82.3], [45.6, -83.5], [46.1, -83.9], [46.5, -84.4],
	[47.9, -86.5], [48.2, -88.5], [48.0, -89.6], [48.6, -93.4], [49.0, -95.15], [49.0, -104.0], [49.0, -114.0], [49.0, -123.3],
	[48.4, -123.2],
];
// 拟合进 x 360–1560、y 220–760
const RAW = US_LL.map(([a, b]) => lcc(a, b));
const bx0 = Math.min(...RAW.map((p) => p[0]));
const bx1 = Math.max(...RAW.map((p) => p[0]));
const by0 = Math.min(...RAW.map((p) => p[1]));
const by1 = Math.max(...RAW.map((p) => p[1]));
const SC = Math.min(1200 / (bx1 - bx0), 540 / (by1 - by0));
const OX = 960 - ((bx0 + bx1) / 2) * SC;
const OY = 490 - ((by0 + by1) / 2) * SC;
export const map = (lat: number, lon: number): XY => {
	const [x, y] = lcc(lat, lon);
	return [OX + x * SC, OY + y * SC];
};
export const US: XY[] = US_LL.map(([a, b]) => map(a, b));
export const OMAHA = map(41.26, -95.94);
export const BOSTON = map(42.36, -71.06);

const inPoly = (p: XY, poly: XY[]) => {
	let c = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [xi, yi] = poly[i];
		const [xj, yj] = poly[j];
		if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c;
	}
	return c;
};
const NEB: XY[] = (
	[
		[43.0, -104.05], [43.0, -98.5], [42.8, -97.0], [42.5, -96.5], [41.5, -96.0], [40.0, -95.3], [40.0, -102.05], [41.0, -102.05], [41.0, -104.05],
	] as [number, number][]
).map(([a, b]) => map(a, b));

// ---------------------------------------------------------------- 人和信
const NS = FACTS.milgram.starters; // 296
const NA = FACTS.milgram.arrived; // 64
const NNEB = 196; // 约 2/3 在内布拉斯加（约 200 : 100，见事实核查 #6）
type Spark = {s: XY; neb: boolean; arrive: boolean; arr: number; die: number; route: (u: number) => XY; ring: number; lit: number; seed: number};
const SPARKS: Spark[] = (() => {
	const r = mulberry32(1967);
	const out: Spark[] = [];
	const xs = NEB.map((p) => p[0]);
	const ys = NEB.map((p) => p[1]);
	for (let i = 0; i < NS; i++) {
		const neb = i < NNEB;
		let s: XY;
		if (neb) {
			for (;;) {
				// 东边（奥马哈一带）更密
				const u = Math.pow(r(), 0.55);
				const x = Math.min(...xs) + (Math.max(...xs) - Math.min(...xs)) * u;
				const y = Math.min(...ys) + (Math.max(...ys) - Math.min(...ys)) * r();
				if (inPoly([x, y], NEB)) {
					s = [x, y];
					break;
				}
			}
		} else {
			// 审片：原来挤在半径 48 px 里，像一坨爆米花 → 撒开到约 80 px
			const a = r() * Math.PI * 2;
			const rr = 18 + 64 * Math.sqrt(r());
			s = [BOSTON[0] - 30 + Math.cos(a) * rr * 1.1, BOSTON[1] + 34 + Math.sin(a) * rr * 0.75];
		}
		out.push({s, neb, arrive: false, arr: 0, die: 0, route: (u) => s, ring: i % 5, lit: 64.5 + 2.0 * r(), seed: Math.floor(r() * 1e6)});
	}
	// 64 封到达：确定性洗牌挑出
	const idx = out.map((_, i) => i);
	for (let i = idx.length - 1; i > 0; i--) {
		const j = Math.floor(r() * (i + 1));
		[idx[i], idx[j]] = [idx[j], idx[i]];
	}
	idx.slice(0, NA).forEach((i) => (out[i].arrive = true));
	for (const sp of out) {
		if (sp.arrive) sp.arr = 84.6 + 1.0 * r();
		else sp.die = 83.4 + 1.4 * r();
		const dest: XY = sp.neb ? [BOSTON[0] + (r() - 0.5) * 6, BOSTON[1] + (r() - 0.5) * 6] : [BOSTON[0] + (r() - 0.5) * 50, BOSTON[1] + (r() - 0.2) * 40];
		const bend = sp.neb ? -0.1 - 0.12 * r() : (r() - 0.5) * 1.2;
		sp.route = sp.arrive ? bez(sp.s, sp.arrive && !sp.neb ? BOSTON : dest, bend) : bez(sp.s, dest, bend);
	}
	return out;
})();
const DEMO = (() => {
	// 奥马哈附近的一颗火星做示范：跳到身边 40 px 的一颗银白小点上
	let best = 0;
	let bd = 1e9;
	SPARKS.forEach((s, i) => {
		if (!s.neb) return;
		const d = Math.hypot(s.s[0] - (OMAHA[0] - 30), s.s[1] - OMAHA[1]);
		if (d < bd) {
			bd = d;
			best = i;
		}
	});
	const from = SPARKS[best].s;
	return {i: best, from, to: [from[0] + 34, from[1] - 21] as XY};
})();
const DEMO_T = 80.5; // 镜头推到 2.6 倍以后再示范
/** 每颗火星朝波士顿的方向 */
const DIR: XY[] = SPARKS.map((sp) => {
	const dx = BOSTON[0] - sp.s[0];
	const dy = BOSTON[1] - sp.s[1];
	const L = Math.hypot(dx, dy) || 1;
	return sp.neb ? [dx / L, dy / L] : [0.6, -0.2];
});
// 地图上的人（极淡的银点）
const PEOPLE: XY[] = (() => {
	const r = mulberry32(5);
	const out: XY[] = [DEMO.to];
	while (out.length < 240) {
		const p: XY = [360 + 1200 * r(), 220 + 540 * r()];
		if (inPoly(p, US)) out.push(p);
	}
	return out;
})();
// 俯冲的落点：最长那条到达弧上 45% 处
const DIVE: XY = (() => {
	let best = SPARKS[0];
	let bd = 0;
	for (const s of SPARKS)
		if (s.arrive && s.neb) {
			const d = Math.hypot(s.s[0] - BOSTON[0], s.s[1] - BOSTON[1]);
			if (d > bd) {
				bd = d;
				best = s;
			}
		}
	return best.route(0.45);
})();

/** 火星此刻的位置；返回 null 表示已熄灭 */
const HOP0 = 82.6;
const sparkAt = (sp: Spark, t: number, i: number): {p: XY; a: number} | null => {
	let base = sp.s;
	if (i === DEMO.i && t > DEMO_T) base = lerpXY(DEMO.from, DEMO.to, easeInOut(clamp((t - DEMO_T) / 0.45)));
	// 审片：70–82.6 所有火星开始轻轻朝东漂（朝波士顿），出发后这段偏移沿路慢慢收掉
	const dir = DIR[i];
	const offAt = (tt: number) => 30 * ez(tt, 70.6, 82.6);
	if (t < HOP0) return {p: [base[0] + dir[0] * offAt(t), base[1] + dir[1] * offAt(t)], a: 1};
	const end = sp.arrive ? sp.arr : HOP0 + 8 * 0.25;
	const hd = (end - HOP0) / 8;
	const k = Math.min(8, (t - HOP0) / hd);
	const kk = Math.floor(k);
	const u = kk >= 8 ? 1 : (kk + easeInOut(k - kk)) / 8;
	let p: XY;
	if (sp.neb || sp.arrive) p = sp.route(u);
	else {
		// 波士顿那些：在附近来回小跳
		const rr = mulberry32(sp.seed + kk);
		const q: XY = [sp.s[0] + (rr() - 0.5) * 60, sp.s[1] + (rr() - 0.5) * 40];
		const rr2 = mulberry32(sp.seed + kk - 1);
		const q0: XY = kk === 0 ? sp.s : [sp.s[0] + (rr2() - 0.5) * 60, sp.s[1] + (rr2() - 0.5) * 40];
		p = lerpXY(q0, q, easeInOut(k - kk));
	}
	if (i === DEMO.i) p = [p[0] + (DEMO.to[0] - DEMO.from[0]) * (1 - u), p[1] + (DEMO.to[1] - DEMO.from[1]) * (1 - u)];
	p = [p[0] + dir[0] * offAt(HOP0) * (1 - u), p[1] + dir[1] * offAt(HOP0) * (1 - u)];
	if (!sp.arrive) {
		const a = 1 - clamp((t - sp.die) / 0.35);
		if (a <= 0) return null;
		return {p, a};
	}
	return {p, a: 1};
};

// ---------------------------------------------------------------- 镜头
export const mapView = (t: number): View => {
	const [dx, dy] = drift(t, 3);
	// 审片：70–76 秒是低运动段 → 62.4–77 慢推 1.00 → 1.06（原来只推 1%），出发时拉回
	const base = cam(1 + 0.06 * ez(t, 62.4, 77) - 0.06 * ez(t, 82.6, 84.6) + 0.02 * lin(t, 84.6, 90.6), 960 - dx, 540 - dy);
	// 审片：1:19「只跳 40 px」在全图尺度下看不见 → 真的推到 2.6 倍再示范
	const om = cam(2.6, (DEMO.from[0] + DEMO.to[0]) / 2, (DEMO.from[1] + DEMO.to[1]) / 2 + 6, 960, 470);
	if (t < 77) return base;
	if (t < 82.6) return camLerp(base, om, ez(t, 77, 80.4));
	if (t < 84.6) return camLerp(om, base, ez(t, 82.6, 84.6));
	if (t < 90.6) return base;
	return camLerp(base, cam(3, DIVE[0], DIVE[1], 960, 450), ez(t, 90.6, 93.1));
};

let R0: XY[] | null = null;
let RF: XY[] | null = null;
const fallRings = (t: number): XY[] => {
	if (!R0) R0 = ringsScreen(62.4);
	const r0 = R0;
	const v = mapView(62.4);
	return r0.map((p, k) => {
		const w: XY = [(p[0] - v.ox) / v.s, (p[1] - v.oy) / v.s];
		const u = easeInOut(clamp((t - 62.4 - k * 0.12) / 1.9));
		const dst: XY = [OMAHA[0] + (BOSTON[0] - OMAHA[0]) * (k / 4), 470 + 40 * Math.sin(k)];
		return [w[0] + (dst[0] - w[0]) * 0.55 * u, w[1] + (dst[1] - w[1]) * 0.7 * u + 40 * easeIn(u)];
	});
};

export const draw1967 = (g: Ctx, t: number) => {
	if (t < 62.3 || t > 93.3) return;
	const v = mapView(t);
	const mapA = sm(t, 62.4, 63.6) * (1 - sm(t, 91.0, 92.6));
	// 极淡的地图经纬网（接上一幕变平的经纬线）
	{
		const grid: XY[][] = [];
		for (let lo = -125; lo <= -65; lo += 5) grid.push(samp((u) => map(24 + 26 * u, lo), 20));
		for (let la = 25; la <= 50; la += 5) grid.push(samp((u) => map(la, -126 + 62 * u), 40));
		hairLines(g, v, grid, ENGRAVE, 1, 0.22 * mapA);
	}
	// 本土轮廓：虚点刻线，62.4–64.0 一笔画出来
	{
		const n = Math.floor(US.length * clamp((t - 62.4) / 1.6));
		const pts = US.slice(0, Math.max(2, n + 1));
		if (n >= US.length) pts.push(US[0]);
		hairLines(g, v, [pts], ENGRAVE_HI, 1.3, 0.75 * mapA, [1.5, 5]);
		hairLines(g, v, [pts], ENGRAVE, 3, 0.18 * mapA);
	}
	// 地名小点
	const placeA = vis(t, 63.0, 84.8, 0.6, 0.6);
	glow(g, v, OMAHA, 7, SILVER, 0.5 * placeA, 'star');
	if (t < 70.2) glow(g, v, BOSTON, 7, SILVER, 0.5 * placeA, 'star');
	// 地图上的人
	const pplA = vis(t, 66.5, 85.2, 1.5, 0.6) * mapA;
	for (let i = 0; i < PEOPLE.length; i++) glow(g, v, PEOPLE[i], i === 0 ? 6 : 4, SILVER, (i === 0 ? 0.55 : 0.16) * pplA * (0.7 + 0.3 * Math.sin(t * 1.3 + i)), 'star');

	// 上一幕的五个链环落下来，散成 296 颗火星
	if (t < 65.2) {
		const rs = fallRings(t);
		rs.forEach((p, k) => {
			const a = 1 - sm(t, 64.3 + k * 0.08, 64.9 + k * 0.08);
			if (a <= 0) return;
			const sp = P(v, p);
			glowLines(g, ID, [arcPts(sp[0], sp[1], 9 * Math.sqrt(v.s), 0, Math.PI * 2, 36)], AMBER, 1.5, a, true);
			glow(g, ID, sp, 22, AMBER, 0.25 * a, 'soft');
		});
	}
	// 收信人：70.2 起波士顿那点变成银白收信人
	const recA = sm(t, 70.2, 71.2) * (1 - sm(t, 91.0, 92.4));
	if (recA > 0) drawStranger(g, v, BOSTON, recA * (0.85 + 0.15 * Math.sin(t * 1.6)) * (1 + 1.2 * pulse(t, 85.6, 1.2)), t, 0.45);

	// 到达的链留下的平滑琥珀弧
	if (t > HOP0) {
		const arcs: XY[][] = [];
		for (const sp of SPARKS) {
			if (!sp.arrive) continue;
			const u = clamp((t - HOP0) / (sp.arr - HOP0));
			arcs.push(samp(sp.route, 40, 0, u));
		}
		glowLines(g, v, arcs, AMBER, 0.8, 0.32 * (1 - sm(t, 90.8, 92.4)) * (1 + 0.8 * pulse(t, 85.6, 1.4)), false);
	}
	// 火星
	const sparksA = 1 - sm(t, 90.6, 91.6);
	const demoFocus = vis(t, 79.9, 82.6, 0.6, 0.6);
	for (let i = 0; i < SPARKS.length; i++) {
		const sp = SPARKS[i];
		let p: XY;
		let a: number;
		if (t < 64.5) continue;
		if (!RF) RF = fallRings(64.5);
		const ring = RF[sp.ring];
		const fu = easeInOut(clamp((t - sp.lit) / 0.7));
		if (fu <= 0) continue;
		const st = sparkAt(sp, t, i);
		if (!st) continue;
		p = fu < 1 ? lerpXY(ring, st.p, fu) : st.p;
		a = st.a * sparksA;
		if (sp.arrive && t > sp.arr) a *= 1 - sm(t, sp.arr, sp.arr + 0.4);
		if (a <= 0.01) continue;
		// 审片：实心黄点像爆米花 → 会闪烁、带呼吸光晕的小星
		const tw = 0.5 + 0.5 * Math.sin(t * (2.0 + (i % 7) * 0.33) + i * 2.3);
		const br = 0.8 + 0.2 * Math.sin(t * 1.1 + i * 0.7);
		// 示范的那几秒，其余火星压到 0.35，只看这一颗
		const demo = i === DEMO.i ? 2.0 : 1;
		if (i !== DEMO.i) a *= 1 - 0.65 * demoFocus;
		glow(g, v, p, 15 * demo, AMBER, 0.13 * a * br * (i === DEMO.i ? 2 : 1), 'soft');
		glow(g, v, p, 6.5 * demo, AMBER, (0.45 + 0.5 * tw) * a, 'star');
	}
	// 示范：两点之间亮一根短银线
	const demoA = vis(t, DEMO_T + 0.15, 82.6, 0.3, 0.5);
	if (demoA > 0) {
		glowLines(g, v, [[DEMO.from, DEMO.to]], SILVER, 1.6, 0.9 * demoA, true);
		glow(g, v, DEMO.to, 16, SILVER, 0.9 * demoA, 'dot');
		const sp = P(v, DEMO.to);
		glowLines(g, ID, [arcPts(sp[0], sp[1], 22, 0, Math.PI * 2, 40)], SILVER, 1.1, 0.5 * demoA, false);
	}
	// 俯冲的那个光点
	const diveA = sm(t, 89.6, 90.6) * (1 - sm(t, 92.7, 93.1));
	if (diveA > 0) {
		glow(g, v, DIVE, 14, '#fff3dc', 0.9 * diveA, 'dot');
		haze(g, v, DIVE, 30, AMBER, 0.25 * diveA);
	}
};

/** DOM 标签要用的屏幕坐标 */
export const mapScreen = (t: number, p: XY): XY => P(mapView(t), p);
export {comet};
