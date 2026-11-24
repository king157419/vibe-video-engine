// 分裂树（方案 §3.13）：用固定种子一次算好每个菌的出生时刻、分裂时刻、位置；
// 每一帧只按“故事时间”查表，不依赖上一帧（渲染时帧可能乱序）。
// 坐标是视野内的单位坐标（视野半径 = 300）。
import {mulberry32} from './util';

export type Cell = {
	g: number; // 第几代
	tb: number; // 出生（小时）
	td: number; // 分裂（小时）；最后一代 = Infinity
	bx: number; // 出生位置
	by: number;
	fx: number; // 推开后的位置
	fy: number;
	a: number; // 朝向（弧度）
	col: number; // 属于哪个菌落
	px: number; // 母细胞的位置（分裂后两个子细胞往两边让开一点用）
	py: number;
};

export const CELL_W = 11;
export const CELL_L0 = 24; // 刚出生时长约 0.9×L0，分裂前长到 1.8×L0

export type Colony = {cx: number; cy: number};

export const buildTree = (opts: {seed: number; colonies: Colony[]; lagH: number; periodH: number; gMax: number}) => {
	const {seed, colonies, lagH, periodH, gMax} = opts;
	const rnd = mulberry32(seed);
	const all: Cell[] = [];
	let gen: Cell[] = colonies.map((c, i) => {
		const a = rnd() * Math.PI;
		return {g: 0, tb: lagH, td: lagH + periodH, bx: c.cx, by: c.cy, fx: c.cx, fy: c.cy, a, col: i, px: c.cx, py: c.cy};
	});
	all.push(...gen);
	for (let g = 0; g < gMax; g++) {
		const next: Cell[] = [];
		for (const p of gen) {
			const ax = Math.cos(p.a);
			const ay = Math.sin(p.a);
			const off = 0.45 * CELL_L0;
			for (const s of [-1, 1]) {
				const jitter = (rnd() - 0.5) * 0.26;
				const last = g + 1 >= gMax;
				next.push({
					g: g + 1,
					tb: p.td,
					td: last ? Infinity : p.td + periodH * (1 + jitter),
					bx: p.fx + s * ax * off,
					by: p.fy + s * ay * off,
					fx: p.fx + s * ax * off,
					fy: p.fy + s * ay * off,
					a: p.a + (rnd() - 0.5) * 0.9,
					col: p.col,
					px: p.fx,
					py: p.fy,
				});
			}
		}
		relax(next, colonies, 2 * 10.5, 14);
		all.push(...next);
		gen = next;
	}
	return all;
};

/** 把同一菌落里挤在一起的菌推开（只在预计算里跑，每代一次） */
const relax = (cells: Cell[], colonies: Colony[], minD: number, iters: number) => {
	const byCol = new Map<number, Cell[]>();
	for (const c of cells) {
		const arr = byCol.get(c.col) ?? [];
		arr.push(c);
		byCol.set(c.col, arr);
	}
	for (const [k, arr] of byCol) {
		const col = colonies[k];
		for (let it = 0; it < iters; it++) {
			for (let i = 0; i < arr.length; i++) {
				const A = arr[i];
				for (let j = i + 1; j < arr.length; j++) {
					const B = arr[j];
					let dx = B.fx - A.fx;
					let dy = B.fy - A.fy;
					let d = Math.hypot(dx, dy);
					if (d >= minD) continue;
					if (d < 1e-3) {
						dx = Math.cos(i * 2.4 + j);
						dy = Math.sin(i * 2.4 + j);
						d = 1;
					}
					const push = (minD - d) / 2;
					A.fx -= (dx / d) * push;
					A.fy -= (dy / d) * push;
					B.fx += (dx / d) * push;
					B.fy += (dy / d) * push;
				}
			}
			// 轻微往菌落中心收，保持团状
			for (const c of arr) {
				c.fx += (col.cx - c.fx) * 0.012;
				c.fy += (col.cy - c.fy) * 0.012;
			}
		}
	}
};

/**
 * 故事时间 h 时每个活着的菌：位置、长度、收腰程度。
 * 审片后 P1-2：第一代（慢放的那一次分裂）从出生起就开始收腰（先快速收到 0.4，再慢慢收紧，到分裂时刻正好断开），
 * 这样旁白一说“分裂”，画面上就看得见收腰；sepBoost（0..1）让刚分开的两个子细胞在秒表停住时也稍微分开一点。
 */
export const cellsAt = (cells: Cell[], h: number, periodH: number, opts: {firstGenPinch?: boolean; sepBoost?: number} = {}) => {
	const out: {x: number; y: number; a: number; len: number; pinch: number}[] = [];
	for (const c of cells) {
		if (h < c.tb || h >= c.td) continue;
		const life = c.td === Infinity ? periodH : c.td - c.tb;
		const u = Math.min(c.td === Infinity ? 0.55 : 1, (h - c.tb) / life);
		const slide = Math.min(1, (h - c.tb) / (0.45 * periodH));
		const s = 1 - Math.pow(1 - slide, 3);
		// 慢放那一次分裂：分开的瞬间两个子细胞各往外让 4 个单位，看得出“断开了”
		let gx = 0;
		let gy = 0;
		if (c.g === 1 && opts.sepBoost) {
			const dx = c.bx - c.px;
			const dy = c.by - c.py;
			const d = Math.hypot(dx, dy) || 1;
			gx = (dx / d) * 4 * opts.sepBoost;
			gy = (dy / d) * 4 * opts.sepBoost;
		}
		let pinch = u > 0.72 ? (u - 0.72) / 0.28 : -1;
		if (c.g === 0 && opts.firstGenPinch) pinch = u < 0.12 ? 0.4 * (u / 0.12) : 0.4 + 0.6 * ((u - 0.12) / 0.88);
		out.push({
			x: c.bx + (c.fx - c.bx) * s + gx,
			y: c.by + (c.fy - c.by) * s + gy,
			a: c.a,
			len: CELL_L0 * (0.9 + 0.9 * u),
			pinch,
		});
	}
	return out;
};

/** 菌落半径（单位坐标）：用最后一代的位置估计 */
export const colonyRadii = (cells: Cell[], colonies: Colony[]) => {
	const gMax = Math.max(...cells.map((c) => c.g));
	return colonies.map((col, k) => {
		const ds = cells.filter((c) => c.g === gMax && c.col === k).map((c) => Math.hypot(c.fx - col.cx, c.fy - col.cy));
		ds.sort((a, b) => a - b);
		return ds[Math.floor(ds.length * 0.85)] + 14;
	});
};
