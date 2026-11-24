/** 《弱关系》的网：两千人的 Watts–Strogatz 模型，TS 端从头重算，再和 ties_numbers.json 逐位核对。
 *  所有画面上的读数（100 步、5 步、洪水各层人数、97%）都从这里来。 */
import {mulberry32} from '../kit/util';
import {CHECK} from './data.gen';

export const N = 2000;
export const K = 20;
export const P = 0.01;
export const YOU = 0;
export const THEM = 1000;

export type XY = [number, number];

const ringAdj = (): Set<number>[] => {
	const adj = Array.from({length: N}, () => new Set<number>());
	for (let i = 0; i < N; i++)
		for (let j = 1; j <= K / 2; j++) {
			const b = (i + j) % N;
			adj[i].add(b);
			adj[b].add(i);
		}
	return adj;
};

/** 和 ties_numbers.py 的 rewire() 完全同序：外层 j，内层 i；撞自环、重边就再抽 */
const rewire = (seed: number) => {
	const adj = ringAdj();
	const r = mulberry32(seed);
	const chords: [number, number, number][] = [];
	for (let j = 1; j <= K / 2; j++)
		for (let i = 0; i < N; i++) {
			const b = (i + j) % N;
			if (!adj[i].has(b)) continue;
			if (r() < P) {
				let c: number;
				for (;;) {
					c = Math.floor(r() * N);
					if (c !== i && !adj[i].has(c)) break;
				}
				adj[i].delete(b);
				adj[b].delete(i);
				adj[i].add(c);
				adj[c].add(i);
				chords.push([i, b, c]);
			}
		}
	return {adj, chords};
};

const bfs = (adj: Set<number>[], s: number) => {
	const d = new Array<number>(adj.length).fill(-1);
	const pre = new Array<number>(adj.length).fill(-1);
	d[s] = 0;
	const q = [s];
	for (let h = 0; h < q.length; h++) {
		const u = q[h];
		for (const v of [...adj[u]].sort((a, b) => a - b))
			if (d[v] < 0) {
				d[v] = d[u] + 1;
				pre[v] = u;
				q.push(v);
			}
	}
	return {d, pre};
};

const clustering = (adj: Set<number>[]) => {
	let tot = 0;
	for (let u = 0; u < adj.length; u++) {
		const nb = [...adj[u]];
		const k = nb.length;
		if (k < 2) continue;
		let links = 0;
		for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) if (adj[nb[a]].has(nb[b])) links++;
		tot += links / ((k * (k - 1)) / 2);
	}
	return tot / adj.length;
};

const lattice = ringAdj();
const ws = rewire(15);
const bf = bfs(ws.adj, YOU);
const bl = bfs(lattice, YOU);

const pathTo = (pre: number[], t: number) => {
	const out = [t];
	while (pre[out[out.length - 1]] >= 0) out.push(pre[out[out.length - 1]]);
	return out.reverse();
};

export const ADJ = ws.adj;
export const CHORDS = ws.chords; // [i, 原来的邻居, 新接的远处那颗]
export const DIST = bf.d; // 重连后离「你」几步
export const LDIST = bl.d; // 纯环上离「你」几步
export const PATH = pathTo(bf.pre, THEM); // [0, 5, 15, 1016, 1006, 1000]
export const LATTICE_STEPS = bl.d[THEM]; // 100
export const STEPS = bf.d[THEM]; // 5
export const FLOOD: number[] = (() => {
	const c: number[] = [];
	for (const v of bf.d) c[v] = (c[v] ?? 0) + 1;
	return c;
})(); // [1,20,28,163,217,461,571,428,95,16]
export const C0 = clustering(lattice);
export const C1 = clustering(ws.adj);
export const KEPT_PCT = Math.round((100 * C1) / C0); // 97

/** 仍然是「邻居线」的边（重连后保留的环上短边），画编织带和星带刻纹用 */
export const LOCAL_EDGES: [number, number, number][] = (() => {
	const out: [number, number, number][] = [];
	for (let i = 0; i < N; i++)
		for (let j = 1; j <= K / 2; j++) {
			const b = (i + j) % N;
			if (ws.adj[i].has(b)) out.push([i, b, j]);
		}
	return out;
})();
/** 纯环上的全部邻居线（重连前） */
export const RING_EDGES: [number, number, number][] = (() => {
	const out: [number, number, number][] = [];
	for (let i = 0; i < N; i++) for (let j = 1; j <= K / 2; j++) out.push([i, (i + j) % N, j]);
	return out;
})();
/** 被重连换掉的旧边 (i, old) 的集合键 */
export const edgeKey = (a: number, b: number) => (a < b ? a * N + b : b * N + a);
export const REMOVED = new Set(CHORDS.map(([i, o]) => edgeKey(i, o)));
export const CHORD_KEY = new Set(CHORDS.map(([i, , c]) => edgeKey(i, c)));

// ---------------------------------------------------------------- 布局
export const BAND_C: XY = [960, 470];
const BAND_A = 700;
const BAND_B = 330;
const TH0 = 155;
const HAND_F: Record<number, number> = {5: 0.88, 15: 0.74, 1016: 0.74, 1006: 0.88};
export const theta = (i: number) => ((TH0 + (360 * i) / N) * Math.PI) / 180;
const bandXY = (i: number, f = 1, dth = 0): XY => {
	const th = ((TH0 + (360 * i) / N + dth) * Math.PI) / 180;
	return [BAND_C[0] + BAND_A * f * Math.cos(th), BAND_C[1] + BAND_B * f * Math.sin(th)];
};

/** 星带：mulberry32(2026)，第一遍每点抽 f、dθ；第二遍每点抽 半径、亮度、相位 */
export const STARS = (() => {
	const r = mulberry32(2026);
	const pos: XY[] = [];
	for (let i = 0; i < N; i++) {
		const f = 1 + 0.32 * (r() - 0.5);
		const dth = (r() - 0.5) * 1.2;
		pos.push(bandXY(i, f, dth));
	}
	pos[YOU] = bandXY(YOU);
	pos[THEM] = bandXY(THEM);
	for (const k of Object.keys(HAND_F)) pos[+k] = bandXY(+k, HAND_F[+k]);
	const rad: number[] = [];
	const lum: number[] = [];
	const ph: number[] = [];
	for (let i = 0; i < N; i++) {
		rad.push(1.6 + 1.6 * r());
		lum.push(0.25 + 0.35 * r());
		ph.push(r() * Math.PI * 2);
	}
	return {band: pos, rad, lum, ph};
})();
export const BAND = STARS.band;

/** 星盘：同样的角度，正圆，半径 360，不抖动 */
export const DISC_R = 360;
export const DISC: XY[] = Array.from({length: N}, (_, i) => [BAND_C[0] + DISC_R * Math.cos(theta(i)), BAND_C[1] + DISC_R * Math.sin(theta(i))] as XY);

// ---------------------------------------------------------------- 核对
export const MODEL_OK = (() => {
	const errs: string[] = [];
	const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
	if (!eq(PATH, CHECK.path)) errs.push(`path ${PATH} vs ${CHECK.path}`);
	if (!eq(CHORDS, CHECK.chords)) errs.push(`chords ${CHORDS.length} vs ${CHECK.chords.length}`);
	if (!eq(FLOOD, CHECK.flood)) errs.push(`flood ${FLOOD} vs ${CHECK.flood}`);
	if (!eq(DIST, CHECK.bfs)) errs.push('bfs dist differs');
	if (LATTICE_STEPS !== CHECK.latticeD) errs.push(`lattice ${LATTICE_STEPS}`);
	if (Math.abs(C0 - CHECK.C0) > 6e-5 || Math.abs(C1 - CHECK.C1) > 6e-5) errs.push(`clustering ${C0} ${C1}`);
	if (Math.round((1000 * C1) / C0) / 10 !== CHECK.keptPct) errs.push(`kept ${(100 * C1) / C0}`);
	for (const [k, xy] of Object.entries(CHECK.bandKey as Record<string, number[]>)) {
		const p = BAND[+k];
		if (Math.abs(p[0] - xy[0]) > 0.06 || Math.abs(p[1] - xy[1]) > 0.06) errs.push(`band ${k} ${p} vs ${xy}`);
	}
	if (errs.length) console.error('[ties] model mismatch', errs);
	return errs;
})();
