/** 3:20–3:39：一个概念的很多个化身。一次只有一张网，每张都是「很多抱团的小圈 + 几根琥珀长线」，
 *  星带 → 线虫神经网 → 美国西部电网 → 演员网 → 一颗点阵球（脸书 2016，平均 3.57 人）。全部是形变。 */
import {clamp, easeInOut, lerp, mulberry32} from '../../kit/util';
import {FACTS} from '../data.gen';
import {AMBER, AMBER_CORE, arcPts, bez, cam, comet, drift, ENGRAVE, glow, glowLines, hairLines, hairSegs, ID, lerpXY, P, samp, SILVER, type Ctx, type View} from '../draw';
import {BAND, type XY} from '../model';
import {ez, lin, sm, vis} from '../time';
import {ENGRAVE_HI} from './s1929';
import {lcc, US_LL} from './s1967';

const M = 300;
const AVI = Array.from({length: M}, (_, k) => Math.round((k * 2000) / M) % 2000);
const STAG = (() => {
	const r = mulberry32(300);
	return AVI.map(() => r() * 0.3);
})();
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(Math.max(1e-9, r()))) * Math.cos(2 * Math.PI * r());

type Net = {pos: XY[]; local: number[]; long: [number, number, number][]; outline: XY[][]};
/** 每个点连同组里最近的 k 个 */
const knn = (pos: XY[], groups: number[][], k: number): number[] => {
	const out: number[] = [];
	const seen = new Set<number>();
	for (const grp of groups)
		for (const i of grp) {
			const near = grp
				.filter((j) => j !== i)
				.map((j) => ({j, d: Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1])}))
				.sort((a, b) => a.d - b.d)
				.slice(0, k);
			for (const o of near) {
				const key = Math.min(i, o.j) * 1000 + Math.max(i, o.j);
				if (seen.has(key)) continue;
				seen.add(key);
				out.push(i, o.j);
			}
		}
	return out;
};
const nearestPair = (pos: XY[], A: number[], B: number[]): [number, number] => {
	let best: [number, number] = [A[0], B[0]];
	let bd = 1e18;
	for (const a of A)
		for (const b of B) {
			const d = (pos[a][0] - pos[b][0]) ** 2 + (pos[a][1] - pos[b][1]) ** 2;
			if (d < bd) {
				bd = d;
				best = [a, b];
			}
		}
	return best;
};

// ---------------------------------------------------------------- 线虫（C. elegans）
const WORM: Net = (() => {
	const r = mulberry32(302);
	const c = (u: number): XY => [530 + 860 * u, 430 + 54 * Math.sin(2 * Math.PI * 0.85 * u + 0.5) - 14 * u];
	const nrm = (u: number): XY => {
		const a = c(Math.max(0, u - 0.002));
		const b = c(Math.min(1, u + 0.002));
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const L = Math.hypot(dx, dy);
		return [-dy / L, dx / L];
	};
	const w = (u: number) => (5 + 38 * Math.pow(Math.sin(Math.PI * clamp(u * 0.97 + 0.02)), 0.55)) * (1 - 0.3 * u);
	const at = (u: number, s: number): XY => {
		const p = c(u);
		const n = nrm(u);
		return [p[0] + n[0] * s * w(u), p[1] + n[1] * s * w(u)];
	};
	const clusters: {u: number; n: number; su: number}[] = [
		{u: 0.035, n: 20, su: 0.012},
		{u: 0.075, n: 60, su: 0.014},
		...[0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78].map((u) => ({u, n: 22, su: 0.016})),
		{u: 0.905, n: 36, su: 0.016},
	];
	const pos: XY[] = [];
	const groups: number[][] = [];
	for (const cl of clusters) {
		const grp: number[] = [];
		for (let k = 0; k < cl.n; k++) {
			grp.push(pos.length);
			pos.push(at(clamp(cl.u + gauss(r) * cl.su, 0.01, 0.99), clamp(gauss(r) * 0.38, -0.8, 0.8)));
		}
		groups.push(grp);
	}
	while (pos.length < M) {
		const grp = groups[2 + Math.floor(r() * 7)];
		grp.push(pos.length);
		pos.push(at(0.12 + 0.75 * r(), (r() - 0.5) * 1.3));
	}
	const local = knn(pos, groups, 2);
	for (let k = 2; k < groups.length; k++) {
		const [a, b] = nearestPair(pos, groups[k - 1], groups[k]);
		local.push(a, b);
	}
	const g = (k: number) => groups[k][0];
	const long: [number, number, number][] = [
		[g(1), g(9), -0.14],
		[g(1), g(5), 0.22],
		[g(3), g(8), -0.2],
		[g(0), g(7), 0.18],
	];
	const left: XY[] = [];
	const right: XY[] = [];
	for (let s = 0; s <= 80; s++) {
		const u = s / 80;
		left.push(at(u, 1));
		right.push(at(u, -1));
	}
	return {pos, local, long, outline: [[...left, ...right.reverse(), left[0]]]};
})();

// ---------------------------------------------------------------- 美国西部电网
const WEST_LL: [number, number][] = [
	[49.0, -123.3],
	...US_LL.slice(0, 18),
	[31.33, -111.07], [31.33, -108.21], [31.78, -108.21], [31.78, -106.53], [32.0, -103.06], [37.0, -103.0], [37.0, -102.04], [41.0, -102.05],
	[41.0, -104.05], [45.0, -104.05], [49.0, -104.05], [49.0, -114.0], [49.0, -123.3],
];
const GRID: Net = (() => {
	const raw = WEST_LL.map(([a, b]) => lcc(a, b));
	const x0 = Math.min(...raw.map((p) => p[0]));
	const x1 = Math.max(...raw.map((p) => p[0]));
	const y0 = Math.min(...raw.map((p) => p[1]));
	const y1 = Math.max(...raw.map((p) => p[1]));
	const sc = Math.min(700 / (x1 - x0), 560 / (y1 - y0));
	const mp = (lat: number, lon: number): XY => {
		const [x, y] = lcc(lat, lon);
		return [960 + (x - (x0 + x1) / 2) * sc, 440 + (y - (y0 + y1) / 2) * sc];
	};
	const outline = [WEST_LL.map(([a, b]) => mp(a, b))];
	const cities: [number, number, number][] = [
		[47.6, -122.33, 26], [45.52, -122.68, 18], [47.66, -117.43, 10], [43.62, -116.2, 10], [46.6, -112.0, 6], [45.78, -108.5, 9],
		[39.53, -119.81, 8], [38.58, -121.49, 14], [37.77, -122.42, 26], [36.74, -119.79, 11], [34.05, -118.24, 34], [32.72, -117.16, 13],
		[36.17, -115.14, 13], [33.45, -112.07, 22], [32.22, -110.97, 9], [40.76, -111.89, 17], [39.74, -104.99, 22], [35.08, -106.65, 12],
		[41.14, -104.82, 6], [31.76, -106.49, 6],
	];
	const r = mulberry32(1996);
	const pos: XY[] = [];
	const groups: number[][] = [];
	const cen: XY[] = [];
	for (const [la, lo, n] of cities) {
		const c = mp(la, lo);
		cen.push(c);
		const sg = 6 + 2.2 * Math.sqrt(n);
		const grp: number[] = [];
		for (let k = 0; k < n; k++) {
			grp.push(pos.length);
			pos.push([c[0] + gauss(r) * sg, c[1] + gauss(r) * sg * 0.85]);
		}
		groups.push(grp);
	}
	while (pos.length < M) {
		const k = Math.floor(r() * cities.length);
		groups[k].push(pos.length);
		pos.push([cen[k][0] + (r() - 0.5) * 120, cen[k][1] + (r() - 0.5) * 100]);
	}
	const local = knn(pos, groups, 2);
	// 城市之间的输电线：每个城市连最近的 2 个城市
	const seen = new Set<string>();
	cen.forEach((c, i) => {
		const near = cen
			.map((d, j) => ({j, d: Math.hypot(c[0] - d[0], c[1] - d[1])}))
			.filter((o) => o.j !== i)
			.sort((a, b) => a.d - b.d)
			.slice(0, 2);
		for (const o of near) {
			const key = `${Math.min(i, o.j)}-${Math.max(i, o.j)}`;
			if (seen.has(key)) continue;
			seen.add(key);
			const [a, b] = nearestPair(pos, groups[i], groups[o.j]);
			local.push(a, b);
		}
	});
	const g = (k: number) => groups[k][0];
	const long: [number, number, number][] = [
		[g(1), g(10), -0.12], // 太平洋直流联络线：俄勒冈 → 洛杉矶
		[g(5), g(0), 0.1], // 蒙大拿 → 西雅图
		[g(15), g(10), 0.1], // 犹他 → 洛杉矶
		[g(16), g(13), -0.1], // 丹佛 → 凤凰城
		[g(3), g(8), 0.12], // 博伊西 → 旧金山湾
	];
	return {pos, local, long, outline};
})();

// ---------------------------------------------------------------- 合演过电影的演员
const ACTORS: Net = (() => {
	const r = mulberry32(2001);
	const sizes = [60, 45, 35, 30, 25, 22, 20, 18, 15, 12, 10, 8];
	const pos: XY[] = [];
	const groups: number[][] = [];
	const cen: XY[] = [];
	for (const n of sizes) {
		let c: XY = [960, 440];
		for (let tries = 0; tries < 200; tries++) {
			const a = r() * Math.PI * 2;
			const rr = Math.sqrt(r());
			c = [960 + Math.cos(a) * rr * 440, 440 + Math.sin(a) * rr * 250];
			if (cen.every((d) => Math.hypot(d[0] - c[0], d[1] - c[1]) > 120)) break;
		}
		cen.push(c);
		const sg = 8 + 2.6 * Math.sqrt(n);
		const grp: number[] = [];
		for (let k = 0; k < n; k++) {
			grp.push(pos.length);
			pos.push([c[0] + gauss(r) * sg, c[1] + gauss(r) * sg]);
		}
		groups.push(grp);
	}
	const local = knn(pos, groups, 3);
	const long: [number, number, number][] = [];
	const pairs = [
		[0, 3], [1, 6], [2, 9], [4, 0], [5, 10], [7, 1], [8, 11],
	];
	for (const [a, b] of pairs) long.push([groups[a][1], groups[b][0], (r() - 0.5) * 0.3]);
	return {pos, local, long, outline: []};
})();

// ---------------------------------------------------------------- 点阵球（脸书 2016）
const SN = 2400;
const SR = 300;
const SC0: XY = [960, 450];
const STILT = (15 * Math.PI) / 180;
const SPH: [number, number, number][] = Array.from({length: SN}, (_, i) => {
	const y = 1 - (2 * (i + 0.5)) / SN;
	const rr = Math.sqrt(1 - y * y);
	const a = i * 2.399963;
	return [Math.cos(a) * rr, y, Math.sin(a) * rr];
});
const sRot = (t: number) => ((3.5 * (t - 210.6)) * Math.PI) / 180;
const sProj = (p: [number, number, number], t: number): [number, number, number] => {
	const a = sRot(t);
	const x = p[0] * Math.cos(a) + p[2] * Math.sin(a);
	const z0 = -p[0] * Math.sin(a) + p[2] * Math.cos(a);
	const y = p[1] * Math.cos(STILT) - z0 * Math.sin(STILT);
	const z = p[1] * Math.sin(STILT) + z0 * Math.cos(STILT);
	return [SC0[0] + SR * x, SC0[1] - SR * y, z];
};
/** 视线坐标（212.4 时朝前的经纬） → 球上最近的点 */
const T_PATH = 212.4;
const fromView = (lat: number, lon: number): [number, number, number] => {
	const φ = (lat * Math.PI) / 180;
	const λ = (lon * Math.PI) / 180;
	// 视线坐标里的单位向量（z 朝向观众）
	const vx = Math.cos(φ) * Math.sin(λ);
	const vy = Math.sin(φ);
	const vz = Math.cos(φ) * Math.cos(λ);
	// 逆变换：先逆倾斜，再逆自转
	const y0 = vy * Math.cos(STILT) + vz * Math.sin(STILT);
	const z0 = -vy * Math.sin(STILT) + vz * Math.cos(STILT);
	const a = sRot(T_PATH);
	return [vx * Math.cos(a) - z0 * Math.sin(a), y0, vx * Math.sin(a) + z0 * Math.cos(a)];
};
const nearestSph = (v: [number, number, number]) => {
	let best = 0;
	let bd = -2;
	for (let i = 0; i < SN; i++) {
		const d = SPH[i][0] * v[0] + SPH[i][1] * v[1] + SPH[i][2] * v[2];
		if (d > bd) {
			bd = d;
			best = i;
		}
	}
	return best;
};
const PA = nearestSph(fromView(10, -60));
const PB = nearestSph(fromView(-8, 56));
const pathVia = (offs: [number, number][]) => [PA, ...offs.map(([la, lo]) => nearestSph(fromView(la, lo))), PB];
const PATH1 = pathVia([
	[16, -30],
	[6, -2],
	[4, 28],
]);
const PATH2 = pathVia([
	[-14, -36],
	[-24, -12],
	[-22, 12],
	[-16, 34],
]);
const gcArc = (a: [number, number, number], b: [number, number, number], u: number): [number, number, number] => {
	const p = [a[0] * (1 - u) + b[0] * u, a[1] * (1 - u) + b[1] * u, a[2] * (1 - u) + b[2] * u];
	const L = Math.hypot(p[0], p[1], p[2]) || 1;
	return [p[0] / L, p[1] / L, p[2] / L];
};
const SPH_OF_AV = AVI.map((_, k) => (k * 8 + 3) % SN);

// ---------------------------------------------------------------- 时间表
const STAGES: {net: Net | 'band' | 'sphere'; t0: number; t1: number}[] = [
	{net: 'band', t0: 0, t1: 200.3},
	{net: WORM, t0: 200.3, t1: 202.0},
	{net: GRID, t0: 203.4, t1: 205.0},
	{net: ACTORS, t0: 206.7, t1: 207.6},
	{net: 'sphere', t0: 210.6, t1: 211.4},
];
const layoutPos = (net: Net | 'band' | 'sphere', k: number, t: number): XY => {
	if (net === 'band') return BAND[AVI[k]];
	if (net === 'sphere') {
		const [x, y] = sProj(SPH[SPH_OF_AV[k]], t);
		return [x, y];
	}
	return net.pos[k];
};
const nodePos = (k: number, t: number): XY => {
	let cur: XY = layoutPos('band', k, t);
	for (let s = 1; s < STAGES.length; s++) {
		const st = STAGES[s];
		if (t < st.t0) break;
		const u = easeInOut(clamp((t - st.t0 - STAG[k] * (st.t1 - st.t0) * 0.5) / ((st.t1 - st.t0) * 0.8)));
		cur = lerpXY(cur, layoutPos(st.net, k, t), u);
	}
	return cur;
};

export const avView = (t: number): View => {
	const [dx0, dy0] = drift(t, 4);
	const dx = dx0 * sm(t, 200.3, 202);
	const dy = dy0 * sm(t, 200.3, 202);
	return cam(1 + 0.025 * lin(t, 200.3, 210.6) - 0.025 * ez(t, 210.6, 211.6) + 0.02 * lin(t, 211.6, 219.4), 960 - dx, 540 - dy);
};

const netA = (t: number, i: number) => {
	// 第 i 张网（1 线虫、2 电网、3 演员）的线：形变完成后亮起，下一次形变开始时退场
	const st = STAGES[i];
	const nx = STAGES[i + 1];
	return sm(t, st.t1 - 0.4, st.t1 + 0.3) * (1 - sm(t, nx.t0, nx.t0 + 0.45));
};

export const drawAvatars = (g: Ctx, t: number) => {
	if (t < 200.2 || t > 219.6) return;
	const v = avView(t);
	const pos = Array.from({length: M}, (_, k) => nodePos(k, t));
	const out = 1 - sm(t, 218.2, 219.4);
	// 轮廓
	const wo = vis(t, 201.0, 203.9, 1.2, 0.5);
	if (wo > 0) {
		const n = WORM.outline[0].length;
		const p = clamp((t - 201.0) / 1.3);
		hairLines(g, v, [WORM.outline[0].slice(0, Math.max(2, Math.floor(n * p)))], ENGRAVE_HI, 1.2, 0.6 * wo);
		hairLines(g, v, WORM.outline, ENGRAVE, 4, 0.12 * wo);
	}
	const go = vis(t, 204.0, 207.0, 1.0, 0.4);
	if (go > 0) {
		const n = GRID.outline[0].length;
		const p = clamp((t - 204.0) / 1.2);
		hairLines(g, v, [GRID.outline[0].slice(0, Math.max(2, Math.floor(n * p)))], ENGRAVE_HI, 1.2, 0.65 * go, [1.5, 5]);
	}
	// 线
	([WORM, GRID, ACTORS] as Net[]).forEach((net, q) => {
		const a = netA(t, q + 1);
		if (a <= 0) return;
		const flat: number[] = [];
		for (let k = 0; k < net.local.length; k += 2) {
			const p = pos[net.local[k]];
			const r = pos[net.local[k + 1]];
			flat.push(p[0], p[1], r[0], r[1]);
		}
		hairSegs(g, v, flat, SILVER, 1.0, (net === ACTORS ? 0.26 : 0.36) * a);
		const longs = net.long.map(([i, j, b]) => samp(bez(pos[i], pos[j], b), 40, 0, ez(t, STAGES[q + 1].t1 - 0.2 + 0.08 * (i % 5), STAGES[q + 1].t1 + 0.7)));
		glowLines(g, v, longs, AMBER, 2.0, 0.85 * a);
		for (const [i, j] of net.long) {
			glow(g, v, pos[i], 15, AMBER, 0.6 * a, 'dot');
			glow(g, v, pos[j], 15, AMBER, 0.6 * a, 'dot');
		}
	});
	// 点
	const bandIn = t < 201 ? 1 : 1;
	for (let k = 0; k < M; k++) {
		let z = 1;
		if (t > 210.6) {
			const [, , zz] = sProj(SPH[SPH_OF_AV[k]], t);
			z = lerp(1, zz > 0 ? 0.35 + 0.65 * zz : 0.12, ez(t, 210.6, 211.4));
		}
		const tw = 0.8 + 0.2 * Math.sin(t * 1.6 + k * 2.1);
		glow(g, v, pos[k], 8, SILVER, 0.7 * tw * z * bandIn * out, 'star');
	}
	// 点阵球
	const sA = sm(t, 210.9, 211.9) * out;
	if (sA > 0) {
		const used = new Set(SPH_OF_AV);
		for (let i = 0; i < SN; i++) {
			if (used.has(i)) continue;
			const [x, y, z] = sProj(SPH[i], t);
			const k = z > 0 ? 0.12 + 0.36 * z : 0.05;
			glow(g, v, [x, y], z > 0 ? 5 : 3.5, SILVER, k * sA * (0.8 + 0.2 * Math.sin(t * 1.3 + i)), 'star');
		}
		glowLines(g, v, [arcPts(SC0[0], SC0[1], SR, 0, Math.PI * 2, 160)], '#7d8fc4', 1.5, 0.08 * sA, false);
		// 两条路
		const drawPath = (path: number[], t0: number, dur: number, k: number, ring: boolean) => {
			if (t < t0) return;
			const hops = path.length - 1;
			const prog = clamp((t - t0) / dur) * hops;
			const polys: XY[][] = [];
			let head: XY | null = null;
			for (let h = 0; h < hops; h++) {
				const u = clamp(prog - h);
				if (u <= 0) break;
				const pts: XY[] = [];
				for (let s = 0; s <= 24; s++) {
					const q = gcArc(SPH[path[h]], SPH[path[h + 1]], (s / 24) * easeInOut(u));
					const [x, y, z] = sProj([q[0] * 1.012, q[1] * 1.012, q[2] * 1.012], t);
					if (z < 0) break;
					pts.push([x, y]);
				}
				polys.push(pts);
				if (u < 1 && pts.length) head = pts[pts.length - 1];
			}
			glowLines(g, v, polys, AMBER, 2.0, k * out);
			path.forEach((pi, idx) => {
				if (idx > Math.ceil(prog) && idx > 0) return;
				const [x, y, z] = sProj(SPH[pi], t);
				if (z < 0) return;
				const end = idx === 0 || idx === path.length - 1;
				if (end && ring) {
					const sp = P(v, [x, y]);
					glowLines(g, ID, [arcPts(sp[0], sp[1], 13 * Math.sqrt(v.s), 0, Math.PI * 2, 40)], SILVER, 1.2, 0.5 * out, false);
					glow(g, v, [x, y], 12, SILVER, 0.9 * out, 'dot');
				} else if (!end) glow(g, v, [x, y], 13, AMBER, 0.8 * (k / 0.9) * out, 'dot');
			});
			if (head) glow(g, v, head, 12, AMBER_CORE, 0.9 * out, 'star');
		};
		const endsA = sm(t, 212.4, 212.8);
		if (endsA > 0)
			[PA, PB].forEach((pi) => {
				const [x, y] = sProj(SPH[pi], t);
				const sp = P(v, [x, y]);
				glowLines(g, ID, [arcPts(sp[0], sp[1], 13 * Math.sqrt(v.s), 0, Math.PI * 2, 40)], SILVER, 1.2, 0.5 * endsA * out, false);
				glow(g, v, [x, y], 12, SILVER, 0.9 * endsA * out, 'dot');
			});
		drawPath(PATH1, 212.6, 1.3, 0.9, true);
		drawPath(PATH2, 213.9, 1.5, 0.35, false);
	}
};

/** 「平均 3.57 人」标签的位置：第一条路中段的上方 */
export const fbLabelAt = (t: number): XY => {
	const v = avView(t);
	const [x, y] = sProj(SPH[PATH1[2]], t);
	return P(v, [x, y - 56]);
};
export const FB_DEGREES = FACTS.fbDegrees;
export {comet};
