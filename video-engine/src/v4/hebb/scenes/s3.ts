/** III 路 PATHS 1:47.8–2:51.6：包络变成歌的声波 + 金点（人）→ 前奏两下，人回来 → 一根线长成伦敦街网，出租车跑熟
 *  → 街网卷成海马体，后部发金 → 一分为二（考上 / 没考上）→ 碎成粒子，拉远成 860 亿的萤火原野 → 粒子变草，6 条金路亮起。 */
import {clamp, easeInOut, easeOut, inv, lerp, mix, mulberry32, smooth} from '../../kit';
import {meta, P} from '../data';
import {FIELD_PARTICLES} from '../numbers';
import {type Cam, type Ctx, type Pt, TAU, along, cam, camReset, camSet, cumlen, flare, gaussian, gline, hairl, poisson, pulse, spr, toScr} from '../lib/core';

const III = meta.III;
const CTR: Pt = [960, 440];

/** III 章镜头：极慢的推；海马体对照那 13 秒再慢推 1.00 → 1.08（审片：最像幻灯片的一段），拉远时收回 */
export const camIII = (t: number): Cam =>
	cam(1.02 + 0.025 * inv(107.8, 149.7, t) + 0.08 * smooth(inv(136.6, 149.7, t)) * (1 - smooth(inv(149.7, 151.2, t))), 960, 440);

// ================================================================ 歌和人
const WAVE_X0 = 520;
const WAVE_X1 = 880;
const PERSON: Pt = [1260, 430];
const LINK0: Pt = [WAVE_X1 + 10, 430];
const LINK1: Pt = [PERSON[0] - 20, 430];
const PHRASES = [108.6, 110.1, 111.6, 113.1, 116.4, 117.9, 119.4];
const waveY = (x: number, t: number) => {
	const u = (x - WAVE_X0) / (WAVE_X1 - WAVE_X0);
	const taper = Math.pow(Math.sin(Math.PI * clamp(u)), 0.6);
	let pk = 0;
	for (const ph of PHRASES) {
		const v = inv(ph - 1.0, ph, t);
		if (v > 0 && v < 1) pk += Math.exp(-(((x - lerp(WAVE_X0, WAVE_X1, v)) / 48) ** 2));
	}
	// 前奏：只有两个波峰
	const quiet = smooth(inv(114.4, 114.9, t)) * (1 - smooth(inv(116.2, 116.6, t)));
	const e1 = Math.sin(Math.PI * clamp((t - III.prelude_note_E) / 0.6)) * Math.exp(-(((x - 690) / 34) ** 2));
	const e2 = Math.sin(Math.PI * clamp((t - III.prelude_note_D) / 0.6)) * Math.exp(-(((x - 760) / 34) ** 2));
	const amp = (1 - quiet) * (7 + 36 * pk) + quiet * 2;
	const carrier = Math.sin(0.085 * x - 7.5 * t) * (0.7 + 0.3 * Math.sin(0.031 * x + 3.1 * t));
	return 430 + taper * (amp * carrier) - 46 * (e1 + e2) * taper;
};
const wavePts = (t: number, n = 140): Pt[] => Array.from({length: n + 1}, (_, i) => {
	const x = lerp(WAVE_X0, WAVE_X1, i / n);
	return [x, waveY(x, t)] as Pt;
});

// ================================================================ 街网
type Edge = {a: number; b: number; main: boolean; len: number; tGrow: number; tGold: number};
type Net = {nodes: Pt[]; edges: Edge[]; adj: {e: number; o: number}[][]; trails: {t0: number; pts: Pt[]}[]; goldFrac: number; samples: {p: Pt; gold: boolean}[]};
let NET: Net | null = null;
const DT = 1 / 60;

const dijkstra = (nodes: Pt[], adj: Net['adj'], edges: Edge[], src: number, dst: number): number[] => {
	const n = nodes.length;
	const dist = new Float64Array(n).fill(Infinity);
	const prev = new Int32Array(n).fill(-1);
	const done = new Uint8Array(n);
	dist[src] = 0;
	// 简单二叉堆
	const heap: [number, number][] = [[0, src]];
	const push = (d: number, v: number) => {
		heap.push([d, v]);
		let i = heap.length - 1;
		while (i > 0) {
			const p = (i - 1) >> 1;
			if (heap[p][0] <= heap[i][0]) break;
			[heap[p], heap[i]] = [heap[i], heap[p]];
			i = p;
		}
	};
	const pop = () => {
		const top = heap[0];
		const last = heap.pop()!;
		if (heap.length) {
			heap[0] = last;
			let i = 0;
			for (;;) {
				const l = 2 * i + 1;
				const r = l + 1;
				let m = i;
				if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
				if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
				if (m === i) break;
				[heap[m], heap[i]] = [heap[i], heap[m]];
				i = m;
			}
		}
		return top;
	};
	while (heap.length) {
		const [d, v] = pop();
		if (done[v]) continue;
		done[v] = 1;
		if (v === dst) break;
		for (const {e, o} of adj[v]) {
			const nd = d + edges[e].len;
			if (nd < dist[o]) {
				dist[o] = nd;
				prev[o] = v;
				push(nd, o);
			}
		}
	}
	const path: number[] = [];
	for (let v = dst; v !== -1; v = prev[v]) path.unshift(v);
	return path[0] === src ? path : [src];
};

const buildNet = (): Net => {
	const R = mulberry32(303);
	const nodes: Pt[] = [CTR];
	const edges: Edge[] = [];
	const key = new Set<string>();
	const addE = (a: number, b: number, main: boolean) => {
		if (a === b) return;
		const k = a < b ? `${a}_${b}` : `${b}_${a}`;
		if (key.has(k)) return;
		key.add(k);
		edges.push({a, b, main, len: Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]), tGrow: 0, tGold: Infinity});
	};
	// 3 条环路
	const ringNodes: number[] = [];
	for (const Rr of [125, 245, 362]) {
		const n = Math.round((TAU * Rr) / 30);
		const p1 = R() * TAU;
		const p2 = R() * TAU;
		const i0 = nodes.length;
		for (let j = 0; j < n; j++) {
			const th = (j / n) * TAU;
			const r = Rr * (1 + 0.045 * Math.sin(3 * th + p1) + 0.025 * Math.sin(5 * th + p2));
			nodes.push([CTR[0] + r * Math.cos(th), CTR[1] + r * Math.sin(th)]);
			ringNodes.push(nodes.length - 1);
		}
		for (let j = 0; j < n; j++) addE(i0 + j, i0 + ((j + 1) % n), true);
	}
	// 10 条放射主路（与环路相交处并点）
	for (let k = 0; k < 10; k++) {
		const th0 = (k / 10) * TAU + (R() - 0.5) * 0.25;
		const ps = R() * TAU;
		let prev = 0;
		for (let r = 30; r <= 376; r += 28) {
			const th = th0 + 0.1 * Math.sin(r / 80 + ps);
			const p: Pt = [CTR[0] + r * Math.cos(th), CTR[1] + r * Math.sin(th)];
			let snap = -1;
			let bd = 15;
			for (const id of ringNodes) {
				const d = Math.hypot(nodes[id][0] - p[0], nodes[id][1] - p[1]);
				if (d < bd) {
					bd = d;
					snap = id;
				}
			}
			const cur = snap >= 0 ? snap : nodes.push(p) - 1;
			addE(prev, cur, true);
			prev = cur;
		}
	}
	const mainCount = nodes.length;
	const segD = (p: Pt, a: Pt, b: Pt) => {
		const dx = b[0] - a[0];
		const dy = b[1] - a[1];
		const u = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1));
		return Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dy);
	};
	const mainE = edges.slice();
	const pts = poisson(304, CTR[0] - 380, CTR[1] - 380, CTR[0] + 380, CTR[1] + 380, 30, 9000, (x, y) => {
		if (Math.hypot(x - CTR[0], y - CTR[1]) > 370) return false;
		for (const e of mainE) if (segD([x, y], nodes[e.a], nodes[e.b]) < 10) return false;
		return true;
	});
	for (const p of pts) nodes.push(p);
	for (let i = mainCount; i < nodes.length; i++) {
		const ds: [number, number][] = [];
		for (let j = 0; j < nodes.length; j++) if (j !== i) ds.push([Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]), j]);
		ds.sort((a, b) => a[0] - b[0]);
		const kk = R() < 0.2 ? 3 : 2;
		for (let q = 0; q < kk; q++) if (ds[q][0] < 58) addE(i, ds[q][1], false);
	}
	// 连通：并查集，把小块接到最近的主体上
	const par = nodes.map((_, i) => i);
	const find = (x: number): number => (par[x] === x ? x : (par[x] = find(par[x])));
	for (const e of edges) par[find(e.a)] = find(e.b);
	for (let guard = 0; guard < 50; guard++) {
		const root = find(0);
		let best: [number, number, number] | null = null;
		for (let i = 0; i < nodes.length; i++) {
			if (find(i) === root) continue;
			for (let j = 0; j < nodes.length; j++) {
				if (find(j) !== root) continue;
				const d = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]);
				if (!best || d < best[0]) best = [d, i, j];
			}
		}
		if (!best) break;
		addE(best[1], best[2], false);
		par[find(best[1])] = find(best[2]);
	}
	const adj: Net['adj'] = nodes.map(() => []);
	edges.forEach((e, i) => {
		adj[e.a].push({e: i, o: e.b});
		adj[e.b].push({e: i, o: e.a});
	});
	// 生长顺序：从原来那根连线（y≈430，x 890–1240）向外
	const dist = new Float64Array(nodes.length).fill(Infinity);
	const q: number[] = [];
	nodes.forEach((p, i) => {
		if (segD(p, LINK0, LINK1) < 26) {
			dist[i] = 0;
			q.push(i);
		}
	});
	// 用简单的 Bellman 松弛（节点不多）
	for (let it = 0; it < 60; it++) {
		let ch = false;
		for (const e of edges) {
			if (dist[e.a] + e.len < dist[e.b]) {
				dist[e.b] = dist[e.a] + e.len;
				ch = true;
			}
			if (dist[e.b] + e.len < dist[e.a]) {
				dist[e.a] = dist[e.b] + e.len;
				ch = true;
			}
		}
		if (!ch) break;
	}
	let dmax = 1;
	for (const d of dist) if (d < Infinity) dmax = Math.max(dmax, d);
	const [g0, g1] = III.street_net_grow;
	for (const e of edges) e.tGrow = g0 + (g1 - g0 - 0.3) * Math.pow(Math.min(dist[e.a], dist[e.b]) / dmax, 0.85);
	// ---- 出租车：按最短路跑，跑过的街变金；两端都到过的街也算认得了
	const sim = (mult: number) => {
		const Rr = mulberry32(305);
		const tGold = new Float64Array(edges.length).fill(Infinity);
		const seen = new Float64Array(nodes.length).fill(Infinity);
		const start = nodes.reduce((b, p, i) => (Math.hypot(p[0] - LINK1[0], p[1] - LINK1[1]) < Math.hypot(nodes[b][0] - LINK1[0], nodes[b][1] - LINK1[1]) ? i : b), 0);
		type Ag = {path: number[]; k: number; s: number; trail: Pt[]; t0: number};
		// 目的地：随机挑几个还没到过的路口，去最近的那个（像新手司机一片一片地认路）
		const pickDest = (from: number) => {
			let best = -1;
			let bd = Infinity;
			for (let tr = 0; tr < 40 && best < 0 || tr < 6; tr++) {
				const c = Math.floor(Rr() * nodes.length);
				if (seen[c] < Infinity || c === from) continue;
				const d = Math.hypot(nodes[c][0] - nodes[from][0], nodes[c][1] - nodes[from][1]) * (0.7 + 0.6 * Rr());
				if (d < bd) {
					bd = d;
					best = c;
				}
			}
			if (best < 0) best = Math.floor(Rr() * nodes.length);
			return dijkstra(nodes, adj, edges, from, best);
		};
		const T0 = 122.2;
		const T1 = 128.4;
		const speed = (t: number) => (t < 124 ? 160 : 480 * lerp(1, mult, smooth(inv(124, 127.6, t))));
		const visit = (v: number, t: number) => {
			if (seen[v] < Infinity) return;
			seen[v] = t;
			for (const {e, o} of adj[v]) if (seen[o] < t && tGold[e] === Infinity) tGold[e] = t + 0.15;
		};
		const ags: Ag[] = [{path: pickDest(start), k: 0, s: 0, trail: [], t0: T0}];
		visit(start, T0);
		let split = false;
		for (let t = T0; t < T1; t += DT) {
			if (!split && t >= 124.0) {
				split = true;
				const a = ags[0];
				for (let c = 0; c < 3; c++) {
					const cur = a.path[Math.min(a.k, a.path.length - 1)];
					ags.push({path: pickDest(cur), k: 0, s: 0, trail: a.trail.slice(), t0: a.t0});
				}
			}
			for (const a of ags) {
				let step = speed(t) * DT;
				while (step > 0) {
					if (a.k >= a.path.length - 1) {
						a.path = pickDest(a.path[a.path.length - 1]);
						a.k = 0;
						a.s = 0;
						if (a.path.length < 2) break;
					}
					const u = a.path[a.k];
					const v = a.path[a.k + 1];
					const L = Math.hypot(nodes[v][0] - nodes[u][0], nodes[v][1] - nodes[u][1]);
					const left = L - a.s;
					if (step < left) {
						a.s += step;
						step = 0;
					} else {
						step -= left;
						const eid = adj[u].find((x) => x.o === v)!.e;
						tGold[eid] = Math.min(tGold[eid], t);
						visit(v, t);
						a.k++;
						a.s = 0;
					}
				}
				const u = a.path[Math.min(a.k, a.path.length - 1)];
				const v = a.path[Math.min(a.k + 1, a.path.length - 1)];
				const L = Math.hypot(nodes[v][0] - nodes[u][0], nodes[v][1] - nodes[u][1]) || 1;
				const f = a.s / L;
				a.trail.push([lerp(nodes[u][0], nodes[v][0], f), lerp(nodes[u][1], nodes[v][1], f)]);
			}
		}
		let n = 0;
		for (const tg of tGold) if (tg <= 127.6) n++;
		return {tGold, frac: n / edges.length, trails: ags.map((a) => ({t0: a.t0, pts: a.trail}))};
	};
	// 速度倍数二分，让 127.6 s 时约 70% 的街段变金（示意）
	let lo = 1;
	let hi = 9;
	let res = sim(2);
	for (let it = 0; it < 7; it++) {
		const mid = (lo + hi) / 2;
		res = sim(mid);
		if (res.frac < 0.7) lo = mid;
		else hi = mid;
	}
	res = sim(hi);
	edges.forEach((e, i) => (e.tGold = res.tGold[i]));
	// 粒子：沿街采样（形变 7 的起点）
	const Rs = mulberry32(306);
	const total = edges.reduce((a, e) => a + e.len, 0);
	const samples: Net['samples'] = [];
	for (const e of edges) {
		const n = Math.round((e.len / total) * 1600);
		for (let j = 0; j < n; j++) {
			const f = Rs();
			samples.push({p: [lerp(nodes[e.a][0], nodes[e.b][0], f), lerp(nodes[e.a][1], nodes[e.b][1], f)], gold: e.tGold <= 128.2});
		}
	}
	while (samples.length < 1600) samples.push({...samples[samples.length % 50]});
	samples.length = 1600;
	console.log(`[hebb] street net: ${nodes.length} nodes, ${edges.length} edges (${edges.filter((e) => !e.main).length} small), gold@127.6 = ${(res.frac * 100).toFixed(1)}%`);
	return {nodes, edges, adj, trails: res.trails, goldFrac: res.frac, samples};
};
const net = () => (NET ??= buildNet());

/** 一组线段一次描边（同色同宽），多遍出光 */
const glowSegs = (g: Ctx, segs: [Pt, Pt][], color: string, w: number, k: number) => {
	if (!segs.length || k <= 0.003) return;
	const [r, gg, b] = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
	g.lineCap = 'round';
	for (const [lw, a] of [
		[w * 7, 0.045],
		[w * 3, 0.12],
		[w, 0.75],
	] as [number, number][]) {
		g.strokeStyle = `rgba(${r},${gg},${b},${clamp(a * k)})`;
		g.lineWidth = lw;
		g.beginPath();
		for (const [p, q] of segs) {
			g.moveTo(p[0], p[1]);
			g.lineTo(q[0], q[1]);
		}
		g.stroke();
	}
};
const hairSegs = (g: Ctx, segs: [Pt, Pt][], color: string, w: number, a: number) => {
	if (!segs.length || a <= 0.003) return;
	g.strokeStyle = `rgba(${parseInt(color.slice(1, 3), 16)},${parseInt(color.slice(3, 5), 16)},${parseInt(color.slice(5, 7), 16)},${clamp(a)})`;
	g.lineWidth = w;
	g.lineCap = 'round';
	g.beginPath();
	for (const [p, q] of segs) {
		g.moveTo(p[0], p[1]);
		g.lineTo(q[0], q[1]);
	}
	g.stroke();
};

// ================================================================ 海马体
// 审片修改：整体 ×1.4（中轴 520 → 728 px）；轮廓粒子沿弧线从头流向尾（约 40 px/s），内层反向慢流，实心粒子原地微动；
// 「考上」那一只的尾段在 144.2–147.9 s 真的长出来（以 u = 0.62 处为支点放大 1.26 倍：更长、更粗），同时由暗变金。
// 粒子数不变（1600 颗，剧本「不加粒子」），只是位置和亮度在变。
type Hip = {kind: Int8Array; u0: Float32Array; jit: Float32Array; fillF: Float32Array; capA: Float32Array; capJ: Float32Array; from: Pt[]; fromGold: boolean[]; delay: number[]; scatter: Pt[]; centroid: Pt; cl: Pt[]; cum: number[]};
let HIP: Hip | null = null;
const catmull = (cp: Pt[], n: number): Pt[] => {
	const out: Pt[] = [];
	for (let i = 0; i < cp.length - 1; i++) {
		const p0 = cp[Math.max(0, i - 1)];
		const p1 = cp[i];
		const p2 = cp[i + 1];
		const p3 = cp[Math.min(cp.length - 1, i + 2)];
		for (let j = 0; j < n; j++) {
			const s = j / n;
			const s2 = s * s;
			const s3 = s2 * s;
			out.push([
				0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3),
				0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3),
			]);
		}
	}
	out.push(cp[cp.length - 1]);
	return out;
};
const HIP_SC = 1.4;
const hipW = (v: number) => (14 + 80 * Math.pow(1 - v, 1.5)) * HIP_SC;
const buildHip = (): Hip => {
	const N = net();
	const R = mulberry32(307);
	const raw = catmull(
		[
			[690, 470],
			[760, 492],
			[850, 500],
			[950, 488],
			[1040, 455],
			[1105, 405],
			[1130, 345],
			[1105, 300],
		],
		24,
	);
	const L0 = cumlen(raw);
	const sc = (520 * HIP_SC) / L0[L0.length - 1];
	const cx0 = raw.reduce((a, p) => a + p[0], 0) / raw.length;
	const cy0 = raw.reduce((a, p) => a + p[1], 0) / raw.length;
	const cl: Pt[] = raw.map(([x, y]) => [CTR[0] + (x - cx0) * sc, CTR[1] + (y - cy0) * sc]);
	const cum = cumlen(cl);
	const n = 1600;
	const kind = new Int8Array(n);
	const u0 = new Float32Array(n);
	const jit = new Float32Array(n);
	const fillF = new Float32Array(n);
	const capA = new Float32Array(n);
	const capJ = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		const k = i % 20; // 0–8 轮廓，9–10 头部圆端，11–13 内层，14–19 实心
		kind[i] = k;
		u0[i] = k === 9 || k === 10 ? 0 : (i + R()) / n;
		jit[i] = gaussian(R) * (k <= 8 ? 1.4 : 1.1);
		fillF[i] = (R() * 2 - 1) * 0.44;
		capA[i] = Math.PI / 2 + R() * Math.PI;
		capJ[i] = gaussian(R) * 1.4;
	}
	const H0: Hip = {kind, u0, jit, fillF, capA, capJ, from: [], fromGold: [], delay: [], scatter: [], centroid: [CTR[0], CTR[1]], cl, cum};
	// 形变 7 的配对：街上的粒子按极角排序，对应海马体按 u 排序
	const pos0 = Array.from({length: n}, (_, i) => hipLocal(H0, i, 128.2));
	const order = N.samples.map((s_, i) => [Math.atan2(s_.p[1] - CTR[1], s_.p[0] - CTR[0]), i] as [number, number]).sort((a, b) => a[0] - b[0]);
	const tOrder = Array.from(u0).map((v, i) => [v, i] as [number, number]).sort((a, b) => a[0] - b[0]);
	const from: Pt[] = new Array(n);
	const fromGold: boolean[] = new Array(n);
	tOrder.forEach(([, ti], r) => {
		const s_ = N.samples[order[r][1]];
		from[ti] = s_.p;
		fromGold[ti] = s_.gold;
	});
	H0.from = from;
	H0.fromGold = fromGold;
	H0.delay = pos0.map(() => R() * 0.2);
	H0.scatter = pos0.map(() => [gaussian(R) * 16, gaussian(R) * 16] as Pt);
	H0.centroid = [pos0.reduce((a, p) => a + p[0], 0) / n, pos0.reduce((a, p) => a + p[1], 0) / n];
	return H0;
};
/** 粒子 i 此刻在中轴上的位置 u（轮廓向尾流、内层反向慢流、实心原地） */
const hipU = (H: Hip, i: number, t: number) => {
	const k = H.kind[i];
	const dt = t - 128.2;
	if (k <= 8) return (((H.u0[i] + 0.055 * dt) % 1) + 1) % 1;
	if (k === 9 || k === 10) return 0;
	if (k <= 13) return (((H.u0[i] - 0.022 * dt) % 1) + 1) % 1;
	return Math.min(0.999, Math.max(0, H.u0[i] + 0.004 * Math.sin(t * 0.7 + i)));
};
/** 海马体自身坐标里的位置（未分开、未拉远） */
const hipLocal = (H: Hip, i: number, t: number): Pt => {
	const k = H.kind[i];
	const u = hipU(H, i, t);
	const [x, y, tx, ty] = along(H.cl, H.cum, u);
	const w = hipW(u);
	if (k === 9 || k === 10) {
		const a = H.capA[i];
		const rr = w / 2 + H.capJ[i];
		return [x + (Math.cos(a) * tx - Math.sin(a) * ty) * rr * 0.9, y + (Math.cos(a) * ty + Math.sin(a) * tx) * rr];
	}
	let off: number;
	if (k <= 8) {
		const sgn = k % 2 === 0 ? 1 : -1;
		off = (sgn * w) / 2 + H.jit[i];
		if (sgn > 0 && u < 0.28) off += 9 * HIP_SC * Math.abs(Math.sin(u * Math.PI * 10)); // 头部下缘的指状突起
	} else if (k <= 13) off = -0.12 * w + Math.sin(u * 9) * 0.06 * w + H.jit[i];
	else off = H.fillF[i] * w;
	return [x - ty * off, y + tx * off];
};
/** 流动粒子在中轴两端的淡入淡出（绕回去那一下看不见） */
const hipEdgeK = (H: Hip, i: number, u: number) => {
	const k = H.kind[i];
	if (k === 9 || k === 10 || k >= 14) return 1;
	return smooth(clamp(u / 0.04)) * smooth(clamp((1 - u) / 0.04));
};
const hip = () => (HIP ??= buildHip());
const COPY_L: Pt = [600, 440];
const COPY_R: Pt = [1320, 440];
const COPY_S = 0.68;
export const hipCopyLabel = {L: [600, 615] as Pt, R: [1320, 615] as Pt, note: [960, 640] as Pt};

// ================================================================ 原野（透视地面）
const F3 = 1000;
const TH3 = Math.atan(0.24); // 地平线 y = 540 − 1000·0.24 = 300
const CS = Math.cos(TH3);
const SN = Math.sin(TH3);
const dolly = (t: number) => 0.008 * Math.max(0, t - 150);
/** 地面点 (X, Y, Z) → 屏幕。返回 [x, y, 深度] */
export const proj3 = (X: number, Y: number, Z: number, dz: number): [number, number, number] => {
	const dy = Y - 1;
	const zz = Z - dz;
	const yc = dy * CS + zz * SN;
	const zc = -dy * SN + zz * CS;
	if (zc < 0.05) return [NaN, NaN, zc];
	return [960 + (F3 * X) / zc, 540 - (F3 * yc) / zc, zc];
};
type Field = {X: Float32Array; Z: Float32Array; h: Float32Array; gold: Uint8Array; ph: Float32Array; om: Float32Array; rank: Int32Array; spawn: Float32Array; road: Int8Array; roadU: Float32Array; growD: Float32Array};
let FIELD: Field | null = null;
/** 6 条路：从近处各自的起点出发，蜿蜒着伸向远处（近处起点在字幕带之上 y≈875） */
const ROAD_X0 = [-1.45, -0.85, -0.3, 0.22, 0.78, 1.38];
const ROAD_Z0 = 1.85;
// 审片：正弦弯曲在透视压缩下会在地平线附近折成几道横向亮线。弯曲只留在近处（Z 6 → 11 收到 0，
// 屏幕上每个周期都 ≥ 40 px），路只画到 Z = 24，最后 10% 的深度里线宽和亮度收到 0，用一颗柔光点收尾，不画到消失点。
const ROAD_ZMAX = 24;
const roadWob = (Z: number) => 1 - smooth(clamp((Z - 6) / 5));
const roadX = (k: number, Z: number) =>
	ROAD_X0[k] * (1 + 0.16 * (Z - ROAD_Z0)) + (0.16 + 0.03 * k) * Math.sin(1.25 * Z + k * 1.9) * Math.min(1, (Z - ROAD_Z0) / 1.5) * roadWob(Z);
const ROAD_ZS = Array.from({length: 72}, (_, i) => ROAD_Z0 * Math.pow(ROAD_ZMAX / ROAD_Z0, i / 71));
const buildField = (): Field => {
	const n = FIELD_PARTICLES;
	const R = mulberry32(308);
	const X = new Float32Array(n);
	const Z = new Float32Array(n);
	const h = new Float32Array(n);
	const gold = new Uint8Array(n);
	const ph = new Float32Array(n);
	const om = new Float32Array(n);
	const road = new Int8Array(n).fill(-1);
	const roadU = new Float32Array(n);
	const growD = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		const z = 1.15 * Math.pow(40 / 1.15, R());
		const zc = 0.233 + 0.972 * z;
		X[i] = (R() * 2 - 1) * zc * 1.04;
		Z[i] = z;
		h[i] = 0.008 + 0.01 * R();
		gold[i] = R() < 0.08 ? 1 : 0;
		ph[i] = R() * TAU;
		om[i] = 1 + 2.5 * R();
		growD[i] = R();
		// 离哪条路近（18 px 以内的草会被压倒）
		if (z >= ROAD_Z0 && z <= ROAD_ZMAX) {
			for (let k = 0; k < 6; k++) {
				const d = Math.abs(X[i] - roadX(k, z));
				if (d < (18 * zc) / F3) {
					road[i] = k;
					roadU[i] = Math.log(z / ROAD_Z0) / Math.log(ROAD_ZMAX / ROAD_Z0);
				}
			}
		}
	}
	// 屏幕上离画面中心近的 1600 颗给海马体粒子落脚，其余按距离向外「复制」出来
	const d = Array.from({length: n}, (_, i) => {
		const [sx, sy] = proj3(X[i], 0, Z[i], dolly(151));
		return [Math.hypot(sx - CTR[0], (sy - CTR[1]) * 1.4), i] as [number, number];
	}).sort((a, b) => a[0] - b[0]);
	const rank = new Int32Array(n);
	const spawn = new Float32Array(n);
	d.forEach(([, i], r) => (rank[i] = r));
	// 审片：按距离一圈圈复制，前沿会排成一个清楚的椭圆环（像碗）。复制顺序改成「距离 × 随机系数」，前沿毛糙
	const rest = d.slice(1600).map(([dd, i]) => [dd * (0.35 + 1.3 * R()), i] as [number, number]).sort((a, b) => a[0] - b[0]);
	rest.forEach(([, i], q) => (spawn[i] = 151.2 + 1.5 * Math.pow(q / rest.length, 0.8)));
	return {X, Z, h, gold, ph, om, rank, spawn, road, roadU, growD};
};
const field = () => (FIELD ??= buildField());

// ================================================================ 绘制
export const drawPaths = (g: Ctx, t: number) => {
	if (t < 106.6 || t > 172.2) return;
	const c = camIII(t);
	const inv1 = 1 / c.s;
	// ---------------- 歌和人（107.8–121）
	if (t < 121.2 && t >= 107.8) {
		camSet(g, c);
		const outA = 1 - smooth(inv(120.4, 121.1, t));
		const m = easeInOut(inv(107.8, 109.0, t));
		// 形变 5：浮起的包络（y 430 的直线）→ 声波
		const wv = wavePts(t);
		const pts: Pt[] =
			m < 1
				? wv.map(([x, y], i) => {
						const fx = lerp(260, 1660, i / (wv.length - 1));
						return [lerp(fx, x, m), lerp(430, y, m)] as Pt;
					})
				: wv;
		gline(g, pts, mix(P.gold, P.leaf, m), null, 2.2 * inv1, 1.0 * outA * smooth(inv(107.8, 108.3, t)));
		if (m > 0.5) for (const hx of [600, 700, 800]) spr(g, hx, 430, 150, P.leaf, 0.05 * outA * m, 'soft');
		// 人：右边一颗金点
		let pf = 0;
		for (const ph of PHRASES) pf = Math.max(pf, pulse(t, ph, 0.05, 0.4));
		const dimmed = smooth(inv(114.4, 114.8, t)) * (1 - smooth(inv(116.4, 116.55, t)));
		const back = pulse(t, III.person_returns, 0.08, 1.2);
		const pk = smooth(inv(108.2, 109.0, t)) * outA * lerp(1, 0.05, dimmed) * (0.7 + 0.5 * pf);
		spr(g, PERSON[0], PERSON[1], 34, P.gold, pk);
		spr(g, PERSON[0], PERSON[1], 130, P.amber, 0.2 * pk, 'soft');
		flare(g, PERSON[0], PERSON[1], 200, P.gold, 0.25 * pk, 0.016);
		if (back > 0.003) {
			spr(g, PERSON[0], PERSON[1], 200, P.amber, 0.3 * back * outA, 'soft');
			spr(g, PERSON[0], PERSON[1], 60, P.gold, 0.8 * back * outA);
			flare(g, PERSON[0], PERSON[1], 300, P.gold, 0.5 * back * outA);
		}
		// 连线：随乐句变粗 1 → 4 px
		const grow = easeOut(inv(108.4, 109.2, t));
		let wl = 1;
		for (const ph of PHRASES.slice(0, 4)) wl += 0.75 * easeOut(inv(ph, ph + 0.4, t));
		const kl = (0.35 + 0.45 * pf) * lerp(1, 0.4, dimmed);
		if (grow > 0) gline(g, [LINK0, [lerp(LINK0[0], LINK1[0], grow), 430]], P.leaf, mix(P.leaf, P.gold, 0.5), wl * inv1 * 0.6, kl * (t < 120.4 ? 1 : outA));
		// 前奏之后：一颗萤绿小彗星沿连线过去
		const cu = inv(115.95, 116.4, t);
		if (cu > 0 && cu < 1) {
			const x = lerp(LINK0[0], LINK1[0], easeInOut(cu));
			gline(g, [[x - 60, 430], [x, 430]], P.leaf, null, 1.5 * inv1, 0.7);
			spr(g, x, 430, 18, P.leaf, 1);
		}
	}
	// ---------------- 环境光
	{
		camSet(g, c);
		const songA = smooth(inv(107.8, 109.0, t)) * (1 - smooth(inv(120.4, 121.2, t)));
		if (songA > 0) {
			spr(g, 700, 430, 420, P.leafDeep, 0.1 * songA, 'soft');
			spr(g, PERSON[0], PERSON[1], 360, P.amber, 0.08 * songA, 'soft');
		}
		const mapA = smooth(inv(120.6, 122.4, t)) * (1 - smooth(inv(149.7, 151.5, t)));
		if (mapA > 0) {
			const gold = smooth(inv(122.5, 128, t)) * (1 - smooth(inv(136.6, 144, t))) + 0.6 * smooth(inv(144.2, 147.9, t));
			spr(g, CTR[0], CTR[1], 620, P.leafDeep, 0.11 * mapA, 'soft');
			spr(g, CTR[0], CTR[1], 520, P.amber, 0.07 * mapA * gold, 'soft');
		}
	}
	// ---------------- 伦敦街网（120.4–128.8）
	if (t >= 120.4 && t < 128.9) {
		camSet(g, c);
		const N = net();
		const fade = 1 - smooth(inv(128.2, 128.8, t));
		const green: [Pt, Pt][] = [];
		const mains: [Pt, Pt][] = [];
		const gold: [Pt, Pt][] = [];
		for (const e of N.edges) {
			if (t < e.tGrow) continue;
			const p = easeOut((t - e.tGrow) / 0.35);
			const a = N.nodes[e.a];
			const b = N.nodes[e.b];
			const q: Pt = p < 1 ? [lerp(a[0], b[0], p), lerp(a[1], b[1], p)] : b;
			(e.main ? mains : green).push([a, q]);
			if (t >= e.tGold) gold.push([a, b]);
		}
		hairSegs(g, green, P.leaf, 1 * inv1, 0.3 * fade);
		hairSegs(g, mains, P.leaf, 1.4 * inv1, 0.45 * fade);
		glowSegs(g, gold, P.gold, 1.1 * inv1, 0.6 * fade);
		// 出租车（金色彗星）
		for (const tr of N.trails) {
			const idx = Math.floor((t - tr.t0) / DT);
			if (idx < 1 || idx >= tr.pts.length) continue;
			const tail: Pt[] = [];
			for (let j = 22; j >= 0; j -= 2) tail.push(tr.pts[Math.max(0, idx - j)]);
			for (let j = 1; j < tail.length; j++) gline(g, [tail[j - 1], tail[j]], P.gold, null, 1.8 * inv1 * (j / tail.length), fade * (j / tail.length) ** 2, false);
			const hd = tail[tail.length - 1];
			spr(g, hd[0], hd[1], 16, P.goldCore, fade);
			spr(g, hd[0], hd[1], 46, P.amber, 0.2 * fade, 'soft');
		}
	}
	// ---------------- 海马体（128.2–152.7）
	if (t >= 128.2 && t < 152.7) {
		const H = hip();
		const z = Math.exp(Math.log(0.25) * easeInOut(inv(149.7, 152.7, t)));
		const F = field();
		const split = easeInOut(inv(136.6, 137.7, t));
		const tailGold1 = smooth(inv(129.5, 130.6, t)) * (1 - split);
		const grow = smooth(inv(III.passed_glow[0], III.passed_glow[1], t)); // 「考上」那一只的尾段长出来
		const toField = t > 151.0;
		const piv = along(H.cl, H.cum, 0.62);
		camReset(g);
		for (let i = 0; i < 1600; i++) {
			const fu = easeInOut(inv(128.2 + H.delay[i], 129.6 + H.delay[i], t));
			const uNow = hipU(H, i, t);
			let [x, y] = hipLocal(H, i, t);
			const left = i % 2 === 0;
			if (split > 0) {
				if (left && grow > 0) {
					const f = 1 + 0.26 * grow * smooth(clamp((uNow - 0.55) / 0.25));
					x = piv[0] + (x - piv[0]) * f;
					y = piv[1] + (y - piv[1]) * f;
				}
				const cc = left ? COPY_L : COPY_R;
				const tx = cc[0] + COPY_S * (x - H.centroid[0]);
				const ty = cc[1] + COPY_S * (y - H.centroid[1]);
				x = lerp(x, tx, split);
				y = lerp(y, ty, split);
			}
			if (fu < 1) {
				const [fx, fy] = H.from[i];
				const ang = 1.1;
				const rx = fx - CTR[0];
				const ry = fy - CTR[1];
				const mx = CTR[0] + 0.55 * (rx * Math.cos(ang) - ry * Math.sin(ang));
				const my = CTR[1] + 0.55 * (rx * Math.sin(ang) + ry * Math.cos(ang));
				const a = (1 - fu) * (1 - fu);
				const b = 2 * (1 - fu) * fu;
				const cq = fu * fu;
				x = a * fx + b * mx + cq * x;
				y = a * fy + b * my + cq * y;
			}
			// 碎开 + 拉远
			const sc = smooth(inv(149.7, 150.8, t));
			x += H.scatter[i][0] * sc;
			y += H.scatter[i][1] * sc;
			x = CTR[0] + (x - CTR[0]) * z;
			y = CTR[1] + (y - CTR[1]) * z;
			let [sx, sy] = toScr(c, x, y);
			// 落进原野
			let kf = 1;
			if (toField) {
				const j = rankToIdx()[i];
				const [fx, fy, zc] = proj3(F.X[j], 0, F.Z[j], dolly(t));
				const v = easeInOut(inv(151.0 + H.delay[i] * 3, 152.4 + H.delay[i], t));
				sx = lerp(sx, fx, v);
				sy = lerp(sy, fy, v);
				kf = lerp(1, fieldK(zc), v);
			}
			const outline = H.kind[i] <= 13;
			const isTail = uNow > 0.65;
			let col = P.leaf;
			let k = outline ? 0.78 : 0.34;
			if (fu < 1 && H.fromGold[i]) col = mix(P.gold, P.leaf, fu);
			if (isTail) {
				if (split <= 0) {
					col = mix(P.leaf, P.gold, tailGold1);
					k *= 1 + 0.6 * tailGold1;
				} else if (left && t >= III.passed_glow[0]) {
					col = mix(P.leaf, P.gold, grow);
					k *= lerp(0.45, 1.7, grow);
				} else {
					col = P.leaf;
					k *= lerp(1 + 0.6 * tailGold1, 0.45, split);
				}
			}
			// 拉远开始后不再沿轮廓流（边缘淡入淡出也收掉）
			const edge = lerp(hipEdgeK(H, i, uNow), 1, smooth(inv(149.7, 150.4, t)));
			const tw = 0.85 + 0.15 * Math.sin(t * 2 + i);
			spr(g, sx, sy, (outline ? 7.4 : 5.8) * lerp(1, 0.75, split) * Math.max(0.5, Math.sqrt(z)), col, k * tw * kf * edge);
		}
		// 后部的金色光晕
		camSet(g, c);
		if (tailGold1 > 0.01) {
			const [tx, ty] = H.cl[Math.floor(H.cl.length * 0.83)];
			spr(g, tx, ty, 180, P.amber, 0.24 * tailGold1, 'soft');
		}
		if (split > 0.5 && t >= III.passed_glow[0] && t < 150.5) {
			const [tx0, ty0] = H.cl[Math.floor(H.cl.length * 0.83)];
			const f = 1 + 0.26 * grow;
			const tx = piv[0] + (tx0 - piv[0]) * f;
			const ty = piv[1] + (ty0 - piv[1]) * f;
			const lx = COPY_L[0] + COPY_S * (tx - H.centroid[0]);
			const ly = COPY_L[1] + COPY_S * (ty - H.centroid[1]);
			const ga = grow * (1 - smooth(inv(149.7, 150.4, t)));
			spr(g, lx, ly, 190, P.amber, 0.28 * ga, 'soft');
			spr(g, lx, ly, 90, P.gold, 0.22 * ga, 'soft');
		}
	}
	// ---------------- 原野（151.2–171.9）：860 亿 → 草 → 6 条金路
	if (t >= 151.0) drawField(g, t);
};

let R2I: Int32Array | null = null;
const rankToIdx = () => {
	if (R2I) return R2I;
	const F = field();
	R2I = new Int32Array(F.rank.length);
	for (let i = 0; i < F.rank.length; i++) R2I[F.rank[i]] = i;
	return R2I;
};
const fieldK = (zc: number) => clamp(0.22 + 0.9 / Math.pow(zc, 0.65), 0, 1);

const drawField = (g: Ctx, t: number) => {
	const F = field();
	camReset(g);
	const dz = dolly(t);
	const out = 1 - smooth(inv(170.3, 171.2, t)); // 审片：III → IV 不交叉叠印，中间留约 0.8 s 暗场
	const dimEnd = 1 - 0.35 * smooth(inv(170.0, 170.9, t));
	const K = out * dimEnd;
	if (K <= 0.003) return;
	// 地平线上的远处密度（haze 铺）
	const hz = smooth(inv(151.6, 153.0, t)) * K;
	flare(g, 960, 312, 1150, P.leaf, 0.09 * hz, 0.05);
	// 地面泛起的一层萤绿（近处更亮）
	g.save();
	g.translate(960, 760);
	g.scale(1, 0.42);
	spr(g, 0, 0, 1150, P.leafDeep, 0.13 * hz, 'soft');
	g.restore();
	flare(g, 960, 326, 1000, P.leafDeep, 0.13 * hz, 0.1);
	const grass = smooth(inv(164.8, 165.8, t));
	const roadsOn = III.roads_lit;
	// 草叶分桶描边
	const buckets: [Pt, Pt][][] = [[], [], [], []];
	const n = F.X.length;
	for (let i = 0; i < n; i++) {
		const r = F.rank[i];
		if (r < 1600 && t < 152.7) continue; // 还是海马体粒子（上面画过了）
		let a = 1;
		let [sx, sy, zc] = proj3(F.X[i], 0, F.Z[i], dz);
		if (Number.isNaN(sx) || sy > 1100 || sx < -20 || sx > 1940) continue;
		if (r >= 1600) {
			const u = clamp((t - F.spawn[i]) / 0.45);
			if (u <= 0) continue;
			const e = easeOut(u);
			const q = 0.5 + 0.42 * F.growD[(i * 7919) % n];
			sx = lerp(CTR[0] + (sx - CTR[0]) * q, sx, e);
			sy = lerp(CTR[1] + (sy - CTR[1]) * q, sy, e);
			a = e;
		}
		const nearK = fieldK(zc);
		const bottomFade = sy > 930 ? 0.55 : 1;
		const tw = 0.72 + 0.28 * Math.sin(t * F.om[i] + F.ph[i]);
		const col = F.gold[i] ? P.gold : P.leaf;
		// 草：粒子拉长成草叶，光收成草尖上的小点
		const gv = grass > 0 ? smooth(clamp((grass - F.growD[i] * 0.4) / 0.6)) : 0;
		let flat = 1;
		let flatA = 1;
		if (F.road[i] >= 0) {
			const tr = roadsOn[F.road[i]] + 0.8 * F.roadU[i];
			const fv = smooth(inv(tr, tr + 0.35, t));
			flat = lerp(1, 0.3, fv);
			flatA = lerp(1, 0.4, fv);
		}
		if (gv > 0.01) {
			const hb = F.h[i] * gv * flat;
			const sway = 0.052 * Math.sin(t * 1.3 + F.X[i] * 3 + F.Z[i] * 0.7) * (0.6 + 0.4 * Math.sin(t * 0.37 + F.ph[i]));
			const [tx, ty] = proj3(F.X[i] + hb * Math.sin(sway), hb * Math.cos(sway), F.Z[i], dz);
			const ab = clamp(0.15 + 0.2 * nearK) * a * flatA * bottomFade;
			buckets[Math.min(3, Math.floor(ab / 0.1))].push([[sx, sy], [tx, ty]]);
			if (zc < 24) spr(g, tx, ty, lerp(1.3 + 11 * nearK * nearK, 2.2 * Math.min(1.3, nearK + 0.4), gv), col, lerp((0.25 + 0.85 * nearK) * nearK * tw, 0.42 * nearK * tw + 0.1, gv) * a * K * flatA * bottomFade);
		} else spr(g, sx, sy, 1.3 + 11 * nearK * nearK, col, (0.25 + 0.85 * nearK) * nearK * tw * a * K * bottomFade);
	}
	if (grass > 0) buckets.forEach((b, i) => hairSegs(g, b, P.leaf, 1, (0.05 + 0.1 * i) * K * 1.6));
	// 6 条金路：从近往远 0.8 s 画完
	for (let k = 0; k < 6; k++) {
		const p = easeInOut(inv(roadsOn[k], roadsOn[k] + 0.8, t));
		if (p <= 0) continue;
		const pts: [number, number, number][] = ROAD_ZS.map((Z) => proj3(roadX(k, Z), 0, Z, dz));
		const nShow = Math.max(2, Math.floor(p * (pts.length - 1)) + 1);
		const NP = pts.length - 1;
		for (let j = 0; j < nShow - 1; j += 3) {
			const seg = pts.slice(j, Math.min(nShow, j + 4)).filter((q) => !Number.isNaN(q[0]));
			if (seg.length < 2) continue;
			const zc = seg[0][2];
			const endF = 1 - smooth(clamp((j / NP - 0.88) / 0.12)); // 最后 12% 的深度收到 0
			const w = clamp(2.8 * Math.pow(1.8 / zc, 0.8), 0.5, 3.2) * (0.35 + 0.65 * endF);
			gline(g, seg.map((q) => [q[0], q[1]] as Pt), P.gold, null, w, 0.85 * Math.pow(1.8 / zc, 0.25) * K * endF, true);
		}
		if (p > 0.9) {
			const q = pts[Math.round(NP * 0.9)];
			if (!Number.isNaN(q[0])) spr(g, q[0], q[1], 16, P.gold, 0.4 * K * smooth(inv(0.9, 1, p)));
		}
		// 沿路流动的金色粒子（每 100 px 约 6 颗，20 px/s）
		const sp: Pt[] = pts.slice(0, nShow).filter((q) => !Number.isNaN(q[0])).map((q) => [q[0], q[1]]);
		if (sp.length > 2 && p > 0.95) {
			const cum = cumlen(sp);
			const L = cum[cum.length - 1];
			const cnt = Math.floor((L / 100) * 6);
			for (let j = 0; j < cnt; j++) {
				const s = (j / cnt + (t * 20) / L) % 1;
				const [x, y] = along(sp, cum, 1 - s);
				const dep = 1 - s;
				spr(g, x, y, 3.5 * (1.2 - dep), P.goldCore, 0.5 * K * (1 - 0.6 * dep));
			}
		}
	}
};
