/** 序 0:00–0:32.5：四次配对 + 一次测试；等；虚影；一根线；叮6 → 光点连线成「赫布」→ 片名卡 → 分成两个神经元。
 *  也负责片尾的片名卡（和 0:28 那张一样）。 */
import {clamp, easeInOut, easeOut, inv, lerp, mix, smooth} from '../../kit';
import {A0, B0, dings, meta, P} from '../data';
import {type Cam, type Ctx, type Pt, cam, camReset, camSet, gline, spr, toScr} from '../lib/core';
import {drawA, drawDing, drawGhost, drawLight} from '../lib/fx';
import {type Assets, TITLE, drawLine, drawTitleChars, enFont, subFont} from '../lib/title';

const PR = meta.prologue;
export const DING_T = dings.map((d) => d.t);
export const LIGHT_T = dings.filter((d) => d.light !== null).map((d) => d.light as number);
const T_BURST = PR.burst; // 25.9
const T_LAND = PR.nodes_settle[1]; // 26.5
const T_WIRE_END = PR.wiring[1]; // 28.1
const [T_HOLD0, T_HOLD1] = PR.title_card_hold; // 28.1, 30.9
const [T_SPLIT0, T_SPLIT1] = PR.split_to_neurons; // 30.9, 32.1

/** 序的镜头（审片 P0）：从第 0 帧起 1.00 → 1.12 慢推；等光的那 10 秒（11–21 s）镜头慢慢移向 B 的空位
 *  （B 仍然全黑，让「空」本身当主角），21.9–24.8 s 移回来接住那根线；片名分开时推到 I 章的 1.2 */
export const camP = (t: number): Cam => {
	let s = 1 + 0.12 * smooth(inv(1.3, 25.0, t));
	const pan = smooth(inv(11.0, 19.5, t)) * (1 - smooth(inv(21.9, 24.8, t)));
	let oy = 450;
	if (t > 30.9) {
		const e = easeInOut(inv(30.9, 32.5, t));
		s = lerp(1.12, 1.2, e);
		oy = lerp(450, 430, e);
	}
	return cam(s, 960, oy, -175 * pan, 0);
};

/** B 处保持全黑：那一块的星尘拿掉（交给 Backdrop 的 mask，屏幕坐标） */
export const prologueMask = (t: number) => {
	const k = Math.min(smooth((t - 9.9) / 0.3), smooth((meta.prologue.B_must_be_dark[1] - t) / 0.3));
	if (k <= 0) return null;
	const [x, y] = toScr(camP(t), B0[0], B0[1]);
	return {x, y, r: 300, k: 1 - k};
};

const hashf = (i: number, s = 0) => {
	const v = Math.sin(i * 91.345 + s * 47.13 + 3.1) * 43758.5453;
	return v - Math.floor(v);
};

/** 节点飞行的起点：沿 A→B 那根线按 x 排序分配 */
const sourceOf = (A: Assets) => {
	const order = A.nodes.map((p, i) => [p[0], i] as [number, number]).sort((a, b) => a[0] - b[0]);
	const src: Pt[] = new Array(A.nodes.length);
	order.forEach(([, i], r) => {
		const f = (r + 0.5) / order.length;
		src[i] = [lerp(A0[0], B0[0], f), A0[1] + (hashf(i, 1) - 0.5) * 6];
	});
	return src;
};
let srcCache: Pt[] | null = null;

/** 节点图（光点 + 金线）。cA 整体亮度；wiringT 用来决定哪些边已经连上（片尾传 Infinity 表示全连） */
const drawGraph = (g: Ctx, A: Assets, t: number, cA: number, inv: number, wiringT: number) => {
	if (cA <= 0.003) return;
	const {nodes, edges, edgeT, nodeFirst} = A;
	// 边
	for (let i = 0; i < edges.length; i++) {
		const ts = edgeT[i];
		if (wiringT < ts) continue;
		const p = wiringT === Infinity ? 1 : easeOut((wiringT - ts) / 0.2);
		const a = nodes[edges[i][0]];
		const b = nodes[edges[i][1]];
		const e: Pt = [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
		const flash = wiringT === Infinity ? 0 : Math.exp(-Math.max(0, wiringT - ts) / 0.25);
		const tw = 0.85 + 0.15 * Math.sin(t * 2.3 + i * 0.7);
		gline(g, [a, e], P.gold, null, 1.4 * inv, cA * (0.75 * tw + 0.8 * flash), true);
	}
	// 节点
	for (let i = 0; i < nodes.length; i++) {
		const f0 = nodeFirst[i];
		const lit = wiringT >= f0;
		const flash = lit && wiringT !== Infinity ? Math.exp(-(wiringT - f0) / 0.18) : 0;
		const tw = 0.8 + 0.2 * Math.sin(t * 3.1 + i * 1.7);
		spr(g, nodes[i][0], nodes[i][1], (5.5 + 6 * flash) * inv, P.goldCore, cA * ((lit ? 0.75 : 0.5) * tw + 1.1 * flash));
	}
};

let hlCv: HTMLCanvasElement | null = null;
/** 一道斜的高光从左扫到右，只落在字上（sw 0→1） */
const titleSweep = (g: Ctx, A: Assets, sw: number, k: number) => {
	if (sw <= 0 || sw >= 1 || k <= 0.003) return;
	const [bx, by] = A.glowBox;
	const w = A.glowWide.width;
	const h = A.glowWide.height;
	hlCv ??= document.createElement('canvas');
	if (hlCv.width !== w) {
		hlCv.width = w;
		hlCv.height = h;
	}
	const q = hlCv.getContext('2d')!;
	q.setTransform(1, 0, 0, 1, 0, 0);
	q.globalCompositeOperation = 'source-over';
	q.clearRect(0, 0, w, h);
	q.translate(-bx, -by);
	drawTitleChars(q, '#fff');
	q.setTransform(1, 0, 0, 1, 0, 0);
	q.globalCompositeOperation = 'source-in';
	const x = lerp(-0.25 * w, 1.25 * w, easeInOut(sw));
	const gr = q.createLinearGradient(x - 70, 0, x + 70, h * 0.35);
	gr.addColorStop(0, 'rgba(255,240,200,0)');
	gr.addColorStop(0.5, 'rgba(255,244,214,1)');
	gr.addColorStop(1, 'rgba(255,240,200,0)');
	q.fillStyle = gr;
	q.fillRect(0, 0, w, h);
	g.globalAlpha = clamp(0.75 * k);
	g.drawImage(hlCv, bx, by);
	g.globalAlpha = 1;
};

/** 片名卡：实字 + 光晕 + 金色小字 + 极小英文。ta 实字，ts 小字，te 英文；sw 扫光进度 */
export const drawTitleCard = (g: Ctx, A: Assets, ta: number, ts: number, te: number, sw = 0) => {
	if (ta > 0.003) {
		const [bx, by] = A.glowBox;
		g.globalAlpha = clamp(0.55 * ta);
		g.drawImage(A.glowWide, bx, by);
		g.globalAlpha = clamp(0.5 * ta);
		g.drawImage(A.glowTight, bx, by);
		g.globalAlpha = 1;
		spr(g, 960, 470, 520, P.amber, 0.09 * ta, 'soft');
		spr(g, 960, 480, 900, P.amber, 0.05 * ta, 'soft');
		g.globalCompositeOperation = 'source-over';
		drawTitleChars(g, `rgba(244,242,234,${clamp(ta)})`);
		g.globalCompositeOperation = 'lighter';
		titleSweep(g, A, sw, ta);
	}
	if (ts > 0.003) {
		g.globalCompositeOperation = 'source-over';
		drawLine(g, TITLE.sub, A.sub, subFont(), TITLE.subY, `rgba(240,210,140,${clamp(ts * 0.95)})`);
		g.globalCompositeOperation = 'lighter';
	}
	if (te > 0.003) {
		g.globalCompositeOperation = 'source-over';
		drawLine(g, TITLE.en, A.en, enFont(), TITLE.enY, `rgba(120,128,136,${clamp(te)})`);
		g.globalCompositeOperation = 'lighter';
	}
};

export const drawPrologue = (g: Ctx, t: number, A: Assets | null) => {
	if (t > 32.6) return;
	const c = camP(t);
	const inv1 = 1 / c.s;
	camSet(g, c);
	// ---- A：第 0 帧就亮着（k 0.9）；等光的那段跟着心跳一起一亮（k 0.55–0.9，半径 ±20%）
	const aVis = 1 - inv(T_BURST, T_BURST + 0.12, t);
	const aDim = 0.9 + 0.1 * smooth(inv(22.4, 23.4, t));
	const hb = smooth(inv(10.5, 11.5, t)) * (1 - smooth(inv(22.0, 23.2, t)));
	drawA(g, A0[0], A0[1], t, aVis * aDim, hb);
	// 环境光：A 周围一大团极淡的萤绿
	spr(g, A0[0], A0[1], 620, P.leafDeep, 0.09 * aVis * aDim, 'soft');
	for (const td of DING_T) if (td < 30) drawDing(g, A0[0], A0[1], t, td, 1, inv1);
	for (const tl of LIGHT_T) if (tl < 30) drawLight(g, B0[0], B0[1], t, tl, tl === T_BURST ? 1.3 : 1);
	// ---- 虚影（只一次）
	drawGhost(g, B0[0], B0[1], t, PR.ghost_flash[0], PR.ghost_flash[1]);
	// ---- 一根极细的线 A→B（萤绿渐变到金）
	const [g0, g1] = PR.thread_grow;
	if (t >= g0 && t < T_BURST + 0.15) {
		const p = easeInOut(inv(g0, g1, t));
		const kk = 1 - inv(T_BURST, T_BURST + 0.15, t);
		const pts: Pt[] = [
			[A0[0] + 24, A0[1]],
			[lerp(A0[0] + 24, B0[0], p), B0[1]],
		];
		gline(g, pts, P.leaf, mix(P.leaf, P.gold, p), 2.4 * inv1, 0.85 * kk);
		if (p < 1) {
			spr(g, pts[1][0], pts[1][1], 22, P.gold, 0.85 * kk);
			spr(g, pts[1][0], pts[1][1], 90, P.gold, 0.18 * kk, 'soft');
		}
	}
	if (!A || t < T_BURST) return;
	// ---- 散成光点，飞上去，落在笔画上
	if (!srcCache || srcCache.length !== A.nodes.length) srcCache = sourceOf(A);
	const src = srcCache;
	const {nodes} = A;
	if (t < T_LAND + 0.02) {
		for (let i = 0; i < nodes.length; i++) {
			const d = 0.1 * hashf(i, 2);
			const u = easeInOut(inv(T_BURST + d, T_LAND, t));
			const s = src[i];
			const e = nodes[i];
			const cx = (s[0] + e[0]) / 2 + (hashf(i, 3) - 0.5) * 140;
			const cy = Math.min(s[1], e[1]) - 120 - 90 * hashf(i, 4);
			const at = (v: number): Pt => {
				const a = (1 - v) * (1 - v);
				const b = 2 * (1 - v) * v;
				const q = v * v;
				return [a * s[0] + b * cx + q * e[0], a * s[1] + b * cy + q * e[1]];
			};
			const col = mix(mix(P.leaf, P.gold, (s[0] - A0[0]) / (B0[0] - A0[0])), P.goldCore, u);
			const p0 = at(u);
			if (u > 0.02 && u < 0.98) {
				const trail: Pt[] = [];
				for (let j = 6; j >= 0; j--) trail.push(at(Math.max(0, u - j * 0.025)));
				gline(g, trail, col, null, 1.2 * inv1, 0.5, false);
			}
			spr(g, p0[0], p0[1], 11 * inv1, col, 0.95);
		}
		return;
	}
	// ---- 连线成字 → 片名卡 → 变回节点图 → 飞成两个神经元（神经元在 I 章里画）
	const ta = smooth(inv(T_WIRE_END, T_WIRE_END + 0.8, t)) * (1 - smooth(inv(T_SPLIT0, T_SPLIT0 + 0.4, t)));
	const ts = smooth(inv(28.4, 29.0, t)) * (1 - smooth(inv(T_SPLIT0, T_SPLIT0 + 0.35, t)));
	const te = smooth(inv(28.9, 29.5, t)) * (1 - smooth(inv(T_SPLIT0, T_SPLIT0 + 0.3, t)));
	let cA = 1 - 0.72 * ta;
	cA *= 1 - smooth(inv(T_SPLIT0 + 0.25, T_SPLIT0 + 0.75, t)); // 节点让位给飞走的神经元粒子
	drawGraph(g, A, t, cA, inv1, t);
	drawTitleCard(g, A, ta, ts, te, inv(29.1, 30.5, t));
	void T_HOLD0;
	void T_HOLD1;
	void T_SPLIT1;
};

/** 片尾：叮7 之后的片名卡（和 0:28 那张一样，直接浮现） */
export const drawEndTitle = (g: Ctx, t: number, A: Assets | null) => {
	const [i0, i1] = meta.end_title.in;
	const [o0, o1] = meta.end_title.out;
	if (!A || t < i0 || t > o1 + 0.05) return;
	const a = smooth(inv(i0, i1, t)) * (1 - smooth(inv(o0, o1, t)));
	const c = cam(1 + 0.02 * inv(i0, o1, t), 960, 470);
	camSet(g, c);
	drawGraph(g, A, t, 0.28 * a, 1 / c.s, Infinity);
	drawTitleCard(g, A, a, smooth(inv(i0 + 0.3, i1 + 0.3, t)) * (1 - smooth(inv(o0, o1, t))), smooth(inv(i0 + 0.6, i1 + 0.6, t)) * (1 - smooth(inv(o0, o1, t))), inv(i1 + 0.2, i1 + 1.6, t));
};
