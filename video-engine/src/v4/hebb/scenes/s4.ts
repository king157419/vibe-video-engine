/** IV 剪 PRUNING：俯视草地和 6 条金路 → 新线指数增多 → 乱网顶点 6000 条（满屏奇观 1）
 *  → 硬静音：声音切断的同一帧画面淡到近黑（星尘照常飘），1 s 后网淡回来 → 一道发光的光墙扫过，最远的 2000 条当帧变成灰烬、碎成余烬落下（满屏奇观 2）
 *  → 镜头拉远到 0.8：剩下的收成 6 条干净的主干 → 暗场 → r / l。
 *
 *  审片修改（第二轮）：
 *  - 乱网分两种线：4000 条「近路的」（端点按离金路的距离加权，长在路两边），2000 条「远线」（端点在路与路之间、
 *    长 70–240 px，横跨各束之间）。远线越到顶点越多，把整屏铺满；剪掉的正好是它们（仍按「到最近金路的距离」排序）。
 *  - 顶点：线从萤绿推到暖白、加粗，镜头 1.00 → 1.20；剪后拉到 0.80，非路线压到 0.3，露出 6 条主干和草地。
 *  - 扫光：约 30 px 宽的光墙 + 两层光雾；被剪的线当帧变灰烬色（没有白闪），碎成 2–4 段 + 3 颗余烬，加速下落。
 *  - 字幕带（y > 900）里的光擦掉 75%；HUTTENLOCHER 路标背后擦一个羽化椭圆（不再是整宽的暗条）。 */
import {clamp, easeInOut, easeOut, hash2, inv, lerp, mix, mulberry32, smooth} from '../../kit';
import {meta, P} from '../data';
import {GOLD_EVERY, RL, TANGLE_CUT, TANGLE_PEAK} from '../numbers';
import {type Cam, type Ctx, type Pt, TAU, along, cam, camSet, cumlen, flare, gline, gring, keys, poisson, qpt, qsub, spr} from '../lib/core';
import {eraseBand, eraseEllipse} from '../lib/grain';

const IV = meta.IV;
const [G0, G1] = IV.tangle_grow; // 171.8, 190.4
const [S0, S1] = IV.silence; // 190.4, 191.9
const [W0, W1] = IV.prune_sweep; // 191.9, 194.9
const ASH_END = IV.ash_until; // 196.4
const ZOOM_PEAK = 1.2;
const ZOOM_AFTER = 0.8;

export const camIV = (t: number): Cam =>
	cam(
		keys(
			t,
			[
				[172.2, 1.0],
				[176.0, 1.0],
				[S0, ZOOM_PEAK],
				[W1, ZOOM_PEAK],
				[200.4, ZOOM_AFTER],
				[206.8, ZOOM_AFTER * 0.985],
				[207.7, 1.0],
				[223.2, 1.04],
			],
			easeInOut,
		),
		960,
		540,
	);

// ---------------------------------------------------------------- 数据
type Piece = {u0: number; u1: number; v: number; w: number; dx: number};
type Line = {a: Pt; c: Pt; b: Pt; t0: number; gold: boolean; grp: number; dRoad: number; far: boolean; cut: boolean; tc: number; near: boolean; pieces: Piece[]; embers: {u: number; v: number; dx: number; r: number}[]};
type W4 = {roads: Pt[][]; roadCum: number[][]; blades: {x: number; y: number; mx: number; my: number; tx: number; ty: number; a: number; d: number}[]; lines: Line[]; k: number; hubs: {p: Pt; deg: number; first: number; ph: number; nearRoad: boolean}[]};
let W: W4 | null = null;

/** 俯视的 6 条路：和 III 章透视里那 6 条同一个走向（从近处向远处略微散开），俯视时就是从下往上 */
const ROAD_X0 = [-1.45, -0.85, -0.3, 0.22, 0.78, 1.38];

/** 新线条数 N(t) = 3(e^{k(t−G0)} − 1)/k，k 取到 N(G1) = 6000（起步每秒 3 条） */
const solveK = () => {
	let lo = 0.01;
	let hi = 1;
	for (let i = 0; i < 60; i++) {
		const m = (lo + hi) / 2;
		if ((3 * (Math.exp(m * (G1 - G0)) - 1)) / m < TANGLE_PEAK) lo = m;
		else hi = m;
	}
	return (lo + hi) / 2;
};
/** 硬静音的画面（用户 2026-10-12：3:08「卡了一下」——原来声音一停，画面在同一帧跳暗 30% 并定格两帧，像播放器卡住）。
 *  现在：声音切断的那一帧（S0 = 190.4，播放 188.6）整幅网开始线性淡到 5%，7 帧（0.23 s）到底，每帧变化量一样；
 *  近黑里网的闪烁、草叶、路上的光粒和星尘都照常在动（不定格）；修剪的光扫过之前 0.45 s 网淡回来（到 0.7），
 *  扫光开始后 0.75 s 回到 1。声音在 S1 = 191.9 回来，boom 落在 191.95 的光墙上。 */
const F1 = 1 / 30;
export const blackoutK = (t: number) => {
	if (t < S0 - 0.5 * F1 || t > S1 + 0.8) return 1;
	if (t < S1 - 0.45) return lerp(1, 0.05, clamp((t - S0 + F1) / (7 * F1)));
	return 0.05 + 0.65 * smooth(inv(S1 - 0.45, S1 + 0.15, t)) + 0.3 * smooth(inv(S1 + 0.15, S1 + 0.75, t));
};

/** 扫光位置（屏幕 x） */
const sweepX = (t: number) => {
	const u = clamp((t - W0) / (W1 - W0));
	return -60 + 2040 * (0.35 * u + 0.65 * easeInOut(u));
};

const world = (): W4 => {
	if (W) return W;
	const R = mulberry32(404);
	// 世界比画面大一圈：剪后镜头拉到 0.8 时四边也有草和路
	const roads = ROAD_X0.map((X0, k) => {
		const ph = R() * TAU;
		const amp = 38 + 22 * R();
		const pts: Pt[] = [];
		for (let i = 0; i <= 120; i++) {
			const y = lerp(1330, -250, i / 120);
			const u = (1110 - y) / 1140;
			const x = 960 + lerp(560, 860, u) * (X0 / 1.45) + amp * Math.sin(u * Math.PI * 2.6 + ph + k * 1.9);
			pts.push([x, y]);
		}
		return pts;
	});
	const roadCum = roads.map(cumlen);
	const rp: Pt[] = roads.flat();
	const dRoad = (x: number, y: number) => {
		let d = 1e9;
		for (const p of rp) d = Math.min(d, (p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y));
		return Math.sqrt(d);
	};
	const pts = poisson(405, -320, -260, 2240, 1340, 26, 26000);
	const blades = pts.map(([x, y]) => {
		const a = -Math.PI / 2 + (R() - 0.5) * 2.4;
		const len = 9 + 9 * R();
		const bend = (R() - 0.5) * 0.5;
		const tx = x + Math.cos(a) * len;
		const ty = y + Math.sin(a) * len * 0.85;
		return {x, y, mx: x + Math.cos(a - bend) * len * 0.5, my: y + Math.sin(a - bend) * len * 0.42, tx, ty, a: 0.15 + 0.2 * R(), d: dRoad(x, y)};
	});
	// 只在画面附近长线（镜头 1.0–1.2 时看得见的范围）
	const inView = (i: number) => blades[i].tx > -60 && blades[i].tx < 1980 && blades[i].ty > -60 && blades[i].ty < 1140;
	const wNear = blades.map((b, i) => (inView(i) ? Math.exp(-b.d / 55) + 0.05 : 0));
	const wFar = blades.map((b, i) => (inView(i) ? Math.pow(clamp((b.d - 40) / 140), 1.5) + 0.002 : 0));
	const cdf = (w: number[]) => {
		const c: number[] = [];
		let s = 0;
		for (const v of w) c.push((s += v));
		return c;
	};
	const cNear = cdf(wNear);
	const cFar = cdf(wFar);
	const pickBy = (c: number[]) => {
		const v = R() * c[c.length - 1];
		let lo = 0;
		let hi = c.length - 1;
		while (lo < hi) {
			const m = (lo + hi) >> 1;
			if (c[m] < v) lo = m + 1;
			else hi = m;
		}
		return lo;
	};
	const cs = 60;
	const gw = Math.ceil(2700 / cs);
	const grid = new Map<number, number[]>();
	const cell = (x: number, y: number) => Math.floor((x + 400) / cs) + gw * Math.floor((y + 400) / cs);
	blades.forEach((b, i) => {
		const k = cell(b.x, b.y);
		(grid.get(k) ?? grid.set(k, []).get(k)!).push(i);
	});
	const near = (i: number, d0: number, d1: number) => {
		const b = blades[i];
		const gx = Math.floor((b.x + 400) / cs);
		const gy = Math.floor((b.y + 400) / cs);
		const r = Math.ceil(d1 / cs);
		const out: number[] = [];
		for (let y = gy - r; y <= gy + r; y++)
			for (let x = gx - r; x <= gx + r; x++)
				for (const j of grid.get(x + gw * y) ?? []) {
					if (!inView(j)) continue;
					const d = Math.hypot(blades[j].x - b.x, blades[j].y - b.y);
					if (d > d0 && d < d1) out.push(j);
				}
		return out;
	};
	const k = solveK();
	const lines: Line[] = [];
	const deg = new Int32Array(blades.length);
	const first = new Float64Array(blades.length).fill(Infinity);
	for (let i = 0; i < TANGLE_PEAK; i++) {
		// 远线越到后面越多：顶点前它们把各束之间铺满
		const far = R() < 0.12 + 0.46 * (i / TANGLE_PEAK);
		const ia = far ? pickBy(cFar) : pickBy(cNear);
		const cand = far ? near(ia, 70, 240) : near(ia, 35, 170);
		const wts = far ? wFar : wNear;
		let ib = cand[0] ?? ((ia + 1) % blades.length);
		if (cand.length) {
			let tot = 0;
			for (const j of cand) tot += wts[j];
			let v = R() * tot;
			for (const j of cand) {
				v -= wts[j];
				if (v <= 0) {
					ib = j;
					break;
				}
			}
		}
		const a: Pt = [blades[ia].tx, blades[ia].ty];
		const b: Pt = [blades[ib].tx, blades[ib].ty];
		const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
		const off = (R() - 0.5) * 0.5 * len;
		const c: Pt = [(a[0] + b[0]) / 2 - ((b[1] - a[1]) / len) * off, (a[1] + b[1]) / 2 + ((b[0] - a[0]) / len) * off];
		const mid = qpt(a, c, b, 0.5);
		const nP = 2 + Math.floor(R() * 3);
		const pieces = Array.from({length: nP}, (_, j) => ({u0: j / nP + 0.04, u1: (j + 1) / nP - 0.04, v: 30 + 50 * R(), w: (R() - 0.5) * 1.6, dx: (R() - 0.5) * 16}));
		const embers = Array.from({length: 3}, () => ({u: R(), v: 60 + 90 * R(), dx: (R() - 0.5) * 30, r: 2 + R()}));
		lines.push({a, c, b, t0: G0 + Math.log(1 + (i * k) / 3) / k, gold: i % GOLD_EVERY === 0, grp: i % 6, dRoad: dRoad(mid[0], mid[1]), far, cut: false, tc: Infinity, near: false, pieces, embers});
		deg[ia]++;
		deg[ib]++;
		first[ia] = Math.min(first[ia], lines[lines.length - 1].t0);
		first[ib] = Math.min(first[ib], lines[lines.length - 1].t0);
	}
	// 连得最多的草尖：顶点时一闪一闪的「突触」
	const hubs = blades
		.map((b, i) => ({p: [b.tx, b.ty] as Pt, deg: deg[i], first: first[i], ph: R() * TAU, nearRoad: b.d < 70}))
		.filter((h) => h.deg >= 4)
		.sort((x, y) => y.deg - x.deg)
		.slice(0, 1500);
	// 剪哪些：按到最近金路的距离排序，最远的 2000 条（6000 − 6000/1.5）
	const order = lines.map((l, i) => [l.dRoad, i] as [number, number]).sort((x, y) => y[0] - x[0]);
	order.slice(0, TANGLE_CUT).forEach(([, i]) => (lines[i].cut = true));
	const kept = order.slice(TANGLE_CUT).reverse(); // 近 → 远
	kept.slice(0, Math.round(kept.length * 0.4)).forEach(([, i]) => (lines[i].near = true));
	// 光墙经过中点（屏幕坐标，扫光时镜头固定在 ZOOM_PEAK）的时刻
	for (const l of lines) {
		if (!l.cut) continue;
		const mx = 960 + ZOOM_PEAK * (qpt(l.a, l.c, l.b, 0.5)[0] - 960);
		let lo = W0;
		let hi = W1;
		for (let it = 0; it < 30; it++) {
			const m = (lo + hi) / 2;
			if (sweepX(m) < mx) lo = m;
			else hi = m;
		}
		l.tc = (lo + hi) / 2;
	}
	console.log(
		`[hebb] tangle: ${lines.length} lines (far ${lines.filter((l) => l.far).length}), k=${k.toFixed(4)}, cut ${lines.filter((l) => l.cut).length} (of which far ${lines.filter((l) => l.cut && l.far).length}), kept ${lines.filter((l) => !l.cut).length}, blades ${blades.length}`,
	);
	W = {roads, roadCum, blades, lines, k, hubs};
	return W;
};

const rgbOf = (hex: string) => `${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)}`;
const RGB = {leaf: rgbOf(P.leaf), gold: rgbOf(P.gold), ash: rgbOf(P.ash), core: '255,250,235', amber: rgbOf(P.amber)};

const quadPath = (g: Ctx, ls: Line[]) => {
	g.beginPath();
	for (const l of ls) {
		g.moveTo(l.a[0], l.a[1]);
		g.quadraticCurveTo(l.c[0], l.c[1], l.b[0], l.b[1]);
	}
};

export const tangleCount = (t: number) => {
	const k = world().k;
	if (t < G0) return 0;
	return Math.min(TANGLE_PEAK, Math.floor((3 * (Math.exp(k * (Math.min(t, G1) - G0)) - 1)) / k));
};

export const drawPrune = (g: Ctx, t: number, frame: number) => {
	if (t < 171.4 || t > 207.9) return;
	const w = world();
	const c = camIV(t);
	camSet(g, c);
	const inv1 = 1 / c.s;
	const appear = smooth(inv(172.2, 172.9, t)); // III 章收掉之后留约 0.8 s 暗场再出现
	const end = 1 - smooth(inv(206.6, 207.6, t));
	// 硬静音：整幅网在声音切断的那一帧开始淡到近黑，修剪的光到之前再淡回来（见 blackoutK）
	const K = appear * end * blackoutK(t);
	if (K <= 0.003) return;
	const tf = t; // 不再定格（用户 2026-10-12：定格两帧像播放器卡了）
	const n = tangleCount(Math.min(t, G1));
	// 静音之后：暖白退回萤绿、闪烁收小（在近黑里完成，网淡回来时已经是平静的）
	const settle = t < S0 ? 0 : clamp((t - S0) / 0.25);
	const climax = smooth(inv(182.5, 188.5, tf)) * lerp(1, 0.75, settle) * (1 - smooth(inv(S1, S1 + 1.2, t)));
	const fl = 0.08 + 0.45 * climax * lerp(1, 0.4, settle);
	const after = smooth(inv(195.2, 199.5, t));
	// ---- 草（两段折线的草叶 + 草尖的小光点）
	const bl = w.blades;
	g.lineCap = 'round';
	g.lineJoin = 'round';
	const grassK = K * (1 + 0.5 * after);
	for (let q = 0; q < 3; q++) {
		g.strokeStyle = `rgba(${RGB.leaf},${clamp((0.15 + 0.08 * q) * grassK)})`;
		g.lineWidth = 1.1 * inv1;
		g.beginPath();
		for (let i = q; i < bl.length; i += 3) {
			const b = bl[i];
			const sw = Math.sin(t * 1.2 + b.x * 0.01 + b.y * 0.013) * 1.6;
			g.moveTo(b.x, b.y);
			g.quadraticCurveTo(b.mx + sw * 0.4, b.my, b.tx + sw, b.ty);
		}
		g.stroke();
	}
	for (let i = 0; i < bl.length; i += 2) spr(g, bl[i].tx, bl[i].ty, 3.4, P.leaf, 0.24 * grassK * bl[i].a * 2);
	// ---- 新线（乱网）
	const L = w.lines;
	type B = {hair: Line[]; gold: Line[]};
	const mk = (): B[] => Array.from({length: 6}, () => ({hair: [], gold: []}));
	const live = {near: mk(), rest: mk()};
	const young: Line[] = [];
	const ash: {l: Line; age: number}[] = [];
	for (let i = 0; i < n; i++) {
		const l = L[i];
		if (l.cut && t >= l.tc) {
			const age = t - l.tc;
			if (age < 2.6) ash.push({l, age});
			continue;
		}
		if (tf - l.t0 < 0.45) young.push(l);
		else {
			const bucket = (after > 0 && l.near ? live.near : live.rest)[l.grp];
			(l.gold ? bucket.gold : bucket.hair).push(l);
		}
	}
	const grpF = (gi: number) => {
		const h = hash2(Math.floor(tf * 30), gi, 77);
		const s = Math.sin(tf * (9 + gi * 1.6) + gi * 2.1);
		return clamp(1 + fl * (0.6 * s + 0.8 * (h - 0.5)), 0.2, 1.8);
	};
	// 顶点：萤绿 → 暖白、加粗；剪后：近路的 ×1.4，其余 ×0.3
	const hairCol = rgbOf(mix(P.leaf, P.warmWhite, 0.65 * climax));
	const hairA = 0.2 + 0.05 * climax;
	const hairW = 1 + 0.25 * climax;
	for (const [set, nb, wb] of [
		[live.rest, lerp(1, 0.3, after), 1],
		[live.near, lerp(1, 1.2, after), 1 + 0.2 * after],
	] as [B[], number, number][]) {
		for (let gi = 0; gi < 6; gi++) {
			const f = grpF(gi) * K * nb;
			const {hair, gold} = set[gi];
			if (hair.length) {
				g.strokeStyle = `rgba(${hairCol},${clamp(hairA * f)})`;
				g.lineWidth = hairW * wb * inv1;
				quadPath(g, hair);
				g.stroke();
			}
			if (gold.length) {
				for (const [lw, a] of [
					[7, 0.04],
					[3, 0.11],
					[1.2, 0.66],
				] as [number, number][]) {
					g.strokeStyle = `rgba(${RGB.gold},${clamp(a * f)})`;
					g.lineWidth = lw * wb * inv1;
					quadPath(g, gold);
					g.stroke();
				}
				g.strokeStyle = `rgba(${RGB.core},${clamp((0.3 + 0.25 * climax) * f)})`;
				g.lineWidth = 0.5 * inv1;
				quadPath(g, gold);
				g.stroke();
			}
		}
	}
	// 刚长出来的：从一端长到另一端，出生时闪一下
	for (const l of young) {
		const age = t - l.t0;
		const p = easeOut(age / 0.35);
		const [a, cc, b] = qsub(l.a, l.c, l.b, p);
		const fla = 1 + 1.6 * Math.exp(-age / 0.2);
		if (l.gold) {
			const pts: Pt[] = Array.from({length: 9}, (_, j) => qpt(a, cc, b, j / 8));
			gline(g, pts, P.gold, null, 1.1 * inv1, 0.62 * fla * K);
		} else {
			g.strokeStyle = `rgba(${hairCol},${clamp(hairA * fla * K)})`;
			g.lineWidth = hairW * inv1;
			g.beginPath();
			g.moveTo(a[0], a[1]);
			g.quadraticCurveTo(cc[0], cc[1], b[0], b[1]);
			g.stroke();
		}
		if (age < 0.25) spr(g, l.a[0], l.a[1], 8, l.gold ? P.goldCore : P.leaf, 0.7 * (1 - age / 0.25) * K);
	}
	// ---- 连线最多的草尖：一起亮的点（越到顶点越亮、越闪）
	const hubK = smooth(inv(176.0, 186.0, tf)) * K * (1 - 0.5 * smooth(inv(W0, W1, t)));
	if (hubK > 0.003) {
		for (const h of w.hubs) {
			if (h.first > tf) continue;
			const pruned = t > W0 ? (h.nearRoad ? 1 : lerp(1, 0.2, smooth(inv(W0, W1 + 0.5, t)))) : 1;
			const tw = 0.5 + 0.5 * Math.sin(tf * (5 + (h.ph % 3)) + h.ph) * (0.4 + 0.6 * climax);
			const kk = Math.min(1, h.deg / 14) * hubK * tw * pruned;
			spr(g, h.p[0], h.p[1], 6 + 6 * Math.min(1, h.deg / 14), h.deg > 9 ? P.goldCore : P.leaf, (0.7 + 0.25 * climax) * kk);
		}
	}
	// ---- 顶点：整屏泛起暖光（几团大而柔的光，不是平涂）
	if (climax > 0.003) {
		camSet(g, cam(1));
		const br = 0.85 + 0.15 * Math.sin(tf * 7.3);
		spr(g, 960, 470, 1250, P.gold, 0.06 * climax * K * br, 'soft');
		spr(g, 520, 380, 700, P.amber, 0.04 * climax * K, 'soft');
		spr(g, 1420, 600, 760, P.amber, 0.04 * climax * K, 'soft');
		camSet(g, c);
	}
	// ---- 6 条金路 + 沿路流动的金色粒子
	const roadK = (0.75 + 0.45 * after) * K;
	{
		camSet(g, cam(1));
		const amb = K * (0.5 + 0.5 * smooth(inv(177, 186, tf))) * (t > ASH_END ? lerp(1, 0.8, smooth(inv(ASH_END, 200, t))) : 1);
		spr(g, 960, 520, 1000, P.amber, 0.05 * amb, 'soft');
		spr(g, 960, 540, 760, P.leafDeep, 0.07 * amb, 'soft');
		camSet(g, c);
	}
	w.roads.forEach((pts, k) => {
		gline(g, pts, P.gold, null, (2.0 + 1.2 * after) * inv1, roadK);
		const cum = w.roadCum[k];
		const Lr = cum[cum.length - 1];
		const cnt = Math.floor((Lr / 100) * 6);
		const v = t;
		for (let j = 0; j < cnt; j++) {
			const s = (j / cnt + ((v - 171.6) * 20) / Lr) % 1;
			const [x, y] = along(pts, cum, s);
			spr(g, x, y, 5 * inv1, P.goldCore, 0.6 * roadK);
		}
	});
	// ---- 修剪：灰烬（当帧变灰，碎成几段 + 余烬，加速下落）
	if (ash.length) {
		const buckets: Pt[][][] = Array.from({length: 6}, () => []);
		for (const {l, age} of ash) {
			const life = clamp(1 - age / 2.4);
			if (life <= 0) continue;
			for (const p of l.pieces) {
				const dy = p.v * age + 110 * age * age;
				const mid = qpt(l.a, l.c, l.b, (p.u0 + p.u1) / 2);
				const ang = p.w * age;
				const ca = Math.cos(ang);
				const sa = Math.sin(ang);
				const pts: Pt[] = [];
				for (let j = 0; j <= 3; j++) {
					const q = qpt(l.a, l.c, l.b, lerp(p.u0, p.u1, j / 3));
					const rx = (q[0] - mid[0]) * lerp(1, 0.5, 1 - life);
					const ry = (q[1] - mid[1]) * lerp(1, 0.5, 1 - life);
					pts.push([mid[0] + rx * ca - ry * sa + p.dx * age, mid[1] + rx * sa + ry * ca + dy]);
				}
				buckets[Math.min(5, Math.floor(life * 6))].push(pts);
			}
			// 余烬：刚断开时带一点琥珀色，越落越灰
			for (const e of l.embers) {
				const q = qpt(l.a, l.c, l.b, e.u);
				const ex = q[0] + e.dx * age;
				const ey = q[1] + e.v * age + 140 * age * age;
				const hot = Math.exp(-age / 0.35);
				spr(g, ex, ey, e.r * 2.6, hot > 0.3 ? P.amber : P.ash, (0.5 * hot + 0.35) * life * K);
			}
		}
		buckets.forEach((b, bi) => {
			if (!b.length) return;
			g.strokeStyle = `rgba(${RGB.ash},${clamp(0.8 * ((bi + 0.5) / 6) * K)})`;
			g.lineWidth = 1.3 * inv1;
			g.beginPath();
			for (const pts of b) {
				g.moveTo(pts[0][0], pts[0][1]);
				for (let j = 1; j < pts.length; j++) g.lineTo(pts[j][0], pts[j][1]);
			}
			g.stroke();
		});
	}
	// ---- 光墙（屏幕坐标）：约 30 px 宽的亮带 + 两层光雾 + 一根白热的芯
	if (t >= W0 - 0.1 && t <= W1 + 0.4) {
		const x = sweepX(t);
		const a = smooth(inv(W0 - 0.1, W0 + 0.15, t)) * (1 - smooth(inv(W1 - 0.1, W1 + 0.4, t)));
		camSet(g, cam(1));
		g.save();
		g.translate(x, 540);
		g.scale(0.035, 1);
		spr(g, 0, 0, 900, P.warmWhite, 0.55 * a, 'soft');
		g.restore();
		g.save();
		g.translate(x, 540);
		g.scale(0.22, 1);
		spr(g, 0, 0, 1000, P.gold, 0.2 * a, 'soft');
		g.restore();
		gline(g, [[x, -20], [x, 1100]], P.goldCore, null, 3, 1.0 * a);
		flare(g, x, 540, 380, P.goldCore, 0.3 * a, 0.45);
		camSet(g, c);
	}
	// ---- 字幕带和路标背后：让线让开（擦掉发光层，不压暗底）
	eraseBand(g, 880, 960, 0.75 * K);
	const sa = Math.min(smooth(inv(184.2, 184.8, t)), 1 - smooth(inv(189.9, 190.5, t)));
	eraseEllipse(g, 960, 158, 380, 40, 0.85 * sa * K);
	camSet(g, c);
	void frame;
	void gring;
};

// ---------------------------------------------------------------- r / l
const [RL0, RL1] = IV.rl_scene; // 207.8, 222.2
export const BABY_L: Pt = [640, 650];
export const BABY_R: Pt = [1280, 650];
export const RL_LETTER_Y = 405;
export const rlState = (t: number) => {
	const sep = easeInOut(inv(216.0, 220.0, t));
	return {
		vis: smooth(inv(RL0, RL0 + 0.8, t)) * (1 - smooth(inv(RL1, RL1 + 1.0, t))),
		gapL: lerp(RL.gap0, RL.gapUS, sep),
		gapR: lerp(RL.gap0, RL.gapJP, sep),
		blurR: RL.blurJP * sep,
		fadeR: lerp(1, 0.6, sep),
		sep,
		grow: 1 + 0.25 * sep,
		rise: 1 - easeOut(inv(RL0, RL0 + 1.2, t)),
	};
};
/** 「听」：每 1.6 s 一次，从字母那一行往下扩散到婴儿光点的弧（两组同时，日本那一组分开后越来越淡） */
const HEAR = Array.from({length: 9}, (_, i) => RL0 + 0.9 + 1.6 * i);
export const drawRL = (g: Ctx, t: number) => {
	if (t < RL0 || t > RL1 + 1.1) return;
	const s = rlState(t);
	camSet(g, camIV(t));
	const br = 0.88 + 0.12 * Math.sin(t * 1.7);
	for (const [p, col, side] of [
		[BABY_L, P.gold, 0],
		[BABY_R, P.leaf, 1],
	] as [Pt, string, number][]) {
		const y = p[1] + 40 * s.rise;
		let hit = 0;
		for (const th of HEAR) {
			const u = (t - th) / 1.3;
			if (u < 0 || u > 1.25) continue;
			const ka = (side === 1 ? lerp(1, 0.35, s.sep) : 1) * s.vis;
			if (u <= 1) {
				const r = lerp(30, y - RL_LETTER_Y - 10, easeOut(u));
				gring(g, p[0], RL_LETTER_Y + 30, r, col, 1.6, 0.42 * Math.pow(1 - u, 1.2) * ka, Math.PI * 0.32, Math.PI * 0.68);
			}
			hit = Math.max(hit, Math.exp(-Math.abs(u - 0.95) * 9) * ka);
		}
		spr(g, p[0], y, 64 * s.grow * (1 + 0.15 * hit), col, (0.85 + 0.5 * hit) * s.vis * br);
		spr(g, p[0], y, 170 * s.grow, col, (0.14 + 0.1 * hit) * s.vis * br, 'soft');
		spr(g, p[0], (y + 420) / 2, 380, col === P.gold ? P.amber : P.leafDeep, 0.08 * s.vis, 'soft');
		flare(g, p[0], y, 260 * s.grow, col, 0.24 * s.vis * br, 0.016);
	}
};
