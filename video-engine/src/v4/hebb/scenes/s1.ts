/** I 连 WIRE 0:32.5–1:17.3：回放四次配对（轴突一截一截长过去）→ 第五次只有声音 → 巴甫洛夫（声波和水滴）
 *  → 1949 → 推近到一个突触 → 一次次放电，缝里长出金色 → 拉回全景 → 一起亮起的，会连在一起。 */
import {clamp, easeIn, easeInOut, easeOut, inv, lerp, mix, mulberry32, smooth, win} from '../../kit';
import {AN, BN, meta, P} from '../data';
import {type Cam, type Ctx, type Pt, TAU, cam, camSet, flare, gline, gring, hairl, pulse, spr, toScr} from '../lib/core';
import {drawFireRing} from '../lib/fx';
import {type Neuron, drawNeuron, makeNeuron} from '../lib/neuron';
import type {Assets} from '../lib/title';
import {camP} from './s0';

const I = meta.I;
export const SYN = {x: 960, y: 430};
const AX0: Pt = [AN[0] + 18, AN[1]];
const AX1: Pt = [BN[0] - 18, BN[1]];
const TERM: Pt = [922, 430]; // 轴突末端（直径约 40 px）
const SPINE: Pt = [996, 430]; // 树突棘头
const TERM_R = 18;
const SPINE_R = 16;
const GAP0 = TERM[0] + TERM_R + 2; // 缝左缘 942
const GAP1 = SPINE[0] - SPINE_R - 2; // 缝右缘 978

/** I 章的镜头（对数插值的缩放）：慢 → 推向连线中段 1.35 → 推进突触 3.0 → 拉回 0.92 */
// 整体比剧本的数字大 1.2 倍（序结尾镜头推到 1.2），相对运动照剧本：1.0→1.35 推进、拉回到 0.92
const KS: [number, number][] = [
	[32.5, 1.2],
	[52.5, 1.224],
	[57.3, 1.62],
	[58.5, 3.4],
	[70.3, 3.57],
	[71.8, 1.104],
	[77.3, 1.14],
];
export const camI = (t: number): Cam => {
	if (t < 32.5) return camP(t);
	let s = KS[KS.length - 1][1];
	for (let i = 1; i < KS.length; i++)
		if (t <= KS[i][0]) {
			const [ta, a] = KS[i - 1];
			const [tb, b] = KS[i];
			s = Math.exp(lerp(Math.log(a), Math.log(b), easeInOut((t - ta) / (tb - ta))));
			break;
		}
	return cam(s, SYN.x, SYN.y);
};

type W1 = {
	nA: Neuron;
	nB: Neuron;
	axon: {u: number; j: number; r: number; b: number; ph: number}[];
	term: {x: number; y: number; r: number; b: number; ph: number}[];
	spine: {x: number; y: number; r: number; b: number; ph: number}[];
	vesicles: Pt[];
	tx: {y0: number; y1: number; d: number}[];
};
let W: W1 | null = null;
const world = (): W1 => {
	if (W) return W;
	const R = mulberry32(111);
	const axon = Array.from({length: 130}, (_, i) => ({u: (i + R()) / 130, j: (R() - 0.5) * 3, r: 1.2 + R() * 1.0, b: 0.5 + 0.5 * R(), ph: R() * TAU}));
	const term: W1['term'] = [];
	for (let i = 0; i < 150; i++) {
		const onM = i < 105;
		const a = R() * TAU;
		const rr = onM ? TERM_R + (R() - 0.5) * 1.6 : TERM_R * Math.sqrt(R()) * 0.85;
		term.push({x: TERM[0] + Math.cos(a) * rr, y: TERM[1] + Math.sin(a) * rr, r: onM ? 0.9 + 0.5 * R() : 0.6 + 0.4 * R(), b: onM ? 0.7 + 0.3 * R() : 0.3 + 0.3 * R(), ph: R() * TAU});
	}
	const spine: W1['spine'] = [];
	for (let i = 0; i < 120; i++) {
		const onM = i < 90;
		const a = R() * TAU;
		const rr = onM ? SPINE_R + (R() - 0.5) * 1.4 : SPINE_R * Math.sqrt(R()) * 0.8;
		spine.push({x: SPINE[0] + Math.cos(a) * rr, y: SPINE[1] + Math.sin(a) * rr, r: onM ? 0.9 + 0.5 * R() : 0.6 + 0.4 * R(), b: onM ? 0.7 + 0.3 * R() : 0.3 + 0.3 * R(), ph: R() * TAU});
	}
	const vesicles: Pt[] = Array.from({length: 11}, () => {
		const a = R() * TAU;
		const rr = 4 + R() * 9;
		return [TERM[0] - 2 + Math.cos(a) * rr, TERM[1] + Math.sin(a) * rr] as Pt;
	});
	const tx = Array.from({length: 22}, () => ({y0: TERM[1] + (R() - 0.5) * 22, y1: SPINE[1] + (R() - 0.5) * 20, d: R() * 0.04}));
	W = {nA: makeNeuron(101, 0), nB: makeNeuron(202, Math.PI), axon, term, spine, vesicles, tx};
	return W;
};

// ---- 时间表
const REPLAY = I.replay_A; // 33.3 34.1 34.9 35.7
const RD = I.replay_B_delay; // 0.2
const T_CONNECT = REPLAY[3] + RD; // 35.9
const SYN_FIRES = I.synapse_fires; // 58.5 60.5 62.5
const GROW_FIRES = I.growth_fires; // 65.1 67.1 69.1
const GROW_DELAY = [0.15, 0.1, 0.06];
const SYNC = [71.0, ...I.slogan_sync_fires]; // 拉回全景时一次 + 口号三次

/** 轴突长度：每次 A 放电长 25%（0.2 s 内长出来） */
const axonLen = (t: number) => REPLAY.reduce((a, tf) => a + 0.25 * easeOut(inv(tf, tf + RD, t)), 0);
/** 缝里金色芯线的宽度（屏幕像素）和亮度 */
const bridgeW = (t: number) => {
	let w = 1.5 * easeOut(inv(SYN_FIRES[2] + 0.2, SYN_FIRES[2] + 0.8, t));
	GROW_FIRES.forEach((tf, i) => (w += 1.5 * easeOut(inv(tf + GROW_DELAY[i], tf + GROW_DELAY[i] + 0.6, t))));
	return w; // 0 → 1.5 → 3 → 4.5 → 6
};
const bridgeK = (t: number) => 0.5 + 0.5 * ((bridgeW(t) - 1.5) / 4.5);

const fireA = (t: number) => {
	let f = 0;
	for (const tf of [...REPLAY, I.fifth_A_alone, ...SYNC]) f = Math.max(f, pulse(t, tf, 0.05, 0.3));
	return f;
};
const fireB = (t: number) => {
	let f = 0;
	for (const tf of REPLAY) f = Math.max(f, pulse(t, tf + RD, 0.05, 0.3));
	for (const tf of SYNC) f = Math.max(f, pulse(t, tf, 0.05, 0.3));
	return f;
};

/** 片名节点 → 神经元粒子的起点（形变 2） */
let fromCache: {A: Pt[]; B: Pt[]; dA: number[]; dB: number[]} | null = null;
const fromOf = (As: Assets, w: W1) => {
	if (fromCache) return fromCache;
	const R = mulberry32(55);
	const n0 = As.nodes.filter((_, i) => As.charOf[i] === 0);
	const n1 = As.nodes.filter((_, i) => As.charOf[i] === 1);
	const pick = (arr: Pt[], n: number) => Array.from({length: n}, () => arr[Math.floor(R() * arr.length)]);
	fromCache = {
		A: pick(n0, w.nA.parts.length),
		B: pick(n1, w.nB.parts.length),
		dA: w.nA.parts.map(() => R() * 0.4),
		dB: w.nB.parts.map(() => R() * 0.4),
	};
	return fromCache;
};

/** 水滴（巴甫洛夫）：一颗金色泪滴，e 是拉长，k 亮度 */
const drop = (g: Ctx, x: number, y: number, e: number, k: number, inv1: number) => {
	if (k <= 0.003) return;
	const r = 9;
	const h = r * (1.5 + 1.2 * e);
	const pts: Pt[] = [];
	for (let i = 0; i <= 40; i++) {
		const a = (i / 40) * TAU;
		// 下半是圆，上半收成尖
		const s = Math.sin(a);
		const cx = Math.cos(a);
		const yy = s > 0 ? s * r : s * h;
		const xx = cx * r * (s > 0 ? 1 : Math.pow(1 + s, 0.9));
		pts.push([x + xx, y + yy]);
	}
	gline(g, pts, P.gold, null, 1.1 * inv1, 0.55 * k);
	spr(g, x, y + r * 0.2, r * 2.6, P.gold, 0.5 * k);
	spr(g, x, y, 30, P.amber, 0.15 * k, 'soft');
};

export const drawWire = (g: Ctx, t: number, As: Assets | null) => {
	if (t < 30.9 || t > 78.6) return;
	const w = world();
	const c = camI(t);
	const inv1 = 1 / c.s;
	camSet(g, c);
	// 可见度：全景神经元在推进突触时隐去，拉回时出现；章尾 76.3–77.1 熄掉（金线留到最后）
	const wide = (1 - smooth(inv(57.4, 58.2, t))) + smooth(inv(70.5, 71.3, t));
	const endFade = 1 - smooth(inv(76.3, 77.1, t));
	const close = smooth(inv(57.7, 58.4, t)) * (1 - smooth(inv(70.3, 71.0, t)));
	// 巴甫洛夫：神经元收拢成一点和一颗水滴
	const pav = smooth(inv(46.5, 47.2, t)) * (1 - smooth(inv(52.0, 52.9, t)));
	const settle = t < 32.5 ? 1 : 1 - 0.25 * Math.sin(Math.PI * clamp((t - 32.1) / 0.8));
	const nVis = clamp(wide) * endFade * (t < 32.5 ? smooth(inv(31.0, 31.35, t)) : 1);
	// ---- 环境光（两团大而淡的光，随神经元一起出现、隐去）
	if (nVis > 0.003) {
		spr(g, AN[0], AN[1], 430, P.leafDeep, 0.1 * nVis * (1 - 0.5 * pav), 'soft');
		spr(g, BN[0], BN[1], 400, P.amber, 0.07 * nVis * (t < 70 ? 0.7 : 1.1), 'soft');
	}
	// ---- 两个神经元
	if (nVis > 0.003) {
		const fA = fireA(t);
		const fB = fireB(t);
		const bBase = t < 70 ? 0.42 : 0.6;
		let fromA: Pt[] | undefined;
		let fromB: Pt[] | undefined;
		let uA: number[] | undefined;
		let uB: number[] | undefined;
		if (t < 32.2 && As) {
			const f = fromOf(As, w);
			fromA = f.A;
			fromB = f.B;
			uA = f.dA.map((d) => easeInOut(inv(31.1 + d, 31.75 + d, t)));
			uB = f.dB.map((d) => easeInOut(inv(31.1 + d, 31.75 + d, t)));
		} else if (t < 32.2) return;
		const ghostB = 0.9 * pulse(t, I.fifth_B_ghost, 0.15, 0.5);
		drawNeuron(g, w.nA, AN[0], AN[1], t, {color: P.leaf, k: nVis * settle * (1 - 0.35 * pav), contract: pav, fire: fA, from: fromA, fromU: uA});
		drawNeuron(g, w.nB, BN[0], BN[1], t, {color: P.gold, k: nVis * settle * bBase * (1 - 0.3 * pav), contract: pav, fire: fB * 1.6 + ghostB, from: fromB, fromU: uB});
		for (const tf of REPLAY) drawFireRing(g, AN[0], AN[1], t, tf, P.chime, 100, 1.3 * inv1);
		drawFireRing(g, AN[0], AN[1], t, I.fifth_A_alone, P.chime, 110, 1.4 * inv1);
		for (const tf of SYNC) {
			drawFireRing(g, AN[0], AN[1], t, tf, P.chime, 100, 1.3 * inv1);
			drawFireRing(g, BN[0], BN[1], t, tf, P.gold, 100, 1.3 * inv1);
		}
	}
	// ---- 巴甫洛夫：A 发声波环，B 滴下水滴
	if (pav > 0.003) {
		for (const tr of I.pavlov_rings) {
			drawFireRing(g, AN[0], AN[1], t, tr, P.chime, 130, 1.6 * inv1);
			spr(g, AN[0], AN[1], 40, P.leaf, 0.8 * pulse(t, tr, 0.05, 0.3) * pav);
		}
		// 水滴的生命周期：环后 0.6 s 拉长，下坠 60 px，消失；再慢慢重新凝出一颗
		let e = 0;
		let fall = 0;
		let a = 1;
		for (const tr of I.pavlov_rings) {
			const u = t - (tr + 0.6);
			if (u >= 0 && u < 1.4) {
				e = easeInOut(clamp(u / 0.35));
				fall = 60 * easeIn(clamp((u - 0.3) / 1.0));
				a = 1 - smooth(clamp((u - 0.8) / 0.5));
			}
		}
		drop(g, BN[0], BN[1] + 4 + fall, e, a * pav, inv1);
		// 重新凝出的那颗
		for (const tr of I.pavlov_rings) {
			const u = t - (tr + 1.5);
			if (u >= 0 && u < 0.8) drop(g, BN[0], BN[1] + 4, 0, smooth(u / 0.8) * pav * 0.9, inv1);
		}
	}
	// ---- 连接：轴突粒子（萤绿）→ 接通后的细线 → 强化后的金线
	const L = axonLen(t);
	const goldness = smooth(inv(70.4, 71.4, t)); // 拉回全景时，连线已经是金的
	if (L > 0.002 && nVis > 0.003) {
		const midHide = close; // 推进突触时中段由近景接手
		const ax0x = lerp(AX0[0], AN[0] + 4, pav);
		const ax1x = lerp(AX1[0], BN[0] - 4, pav);
		const k = nVis * (1 - goldness);
		for (const p of w.axon) {
			if (p.u > L) continue;
			const x = lerp(ax0x, ax1x, p.u);
			if (midHide > 0.01 && x > 820 && x < 1100) continue;
			const tip = Math.exp(-(L - p.u) * 18) * (L < 1 ? 1 : 0);
			const tw = 0.8 + 0.2 * Math.sin(t * 2.5 + p.ph);
			spr(g, x, AX0[1] + p.j * (1 - pav), p.r * 2.4, P.leaf, k * (0.38 * p.b * tw + 0.9 * tip));
		}
		if (t >= T_CONNECT) {
			const on = smooth(inv(T_CONNECT, T_CONNECT + 0.4, t));
			gline(g, [[ax0x, AX0[1]], [ax1x, AX1[1]]], P.leaf, null, 0.9 * inv1, 0.42 * on * k * (1 - 0.6 * midHide));
		}
		if (L < 1) spr(g, lerp(AX0[0], AX1[0], L), AX0[1], 12, P.leaf, 0.8 * nVis);
	}
	// ---- 第五次：彗星到了 B，B 亮到「光」的 0.35，停 0.4 s 再落（审片：「可那根线，已经通了」要有画面回应）
	{
		const gu = t - I.fifth_B_ghost;
		if (gu >= 0 && gu < 1.6 && nVis > 0.003) {
			const e = gu < 0.15 ? easeOut(gu / 0.15) : gu < 0.55 ? 1 : 1 - easeOut(clamp((gu - 0.55) / 1.0));
			const k = 0.35 * e * nVis;
			spr(g, BN[0], BN[1], 330, P.amber, 0.32 * k, 'soft');
			spr(g, BN[0], BN[1], 120, P.gold, 0.9 * k);
			spr(g, BN[0], BN[1], 46, P.goldCore, 0.9 * k);
			flare(g, BN[0], BN[1], 560, P.gold, 0.7 * k, 0.012);
		}
	}
	// ---- 第五次：一颗萤绿小彗星沿轴突跑过去
	const cu = inv(I.fifth_A_alone, I.fifth_B_ghost, t);
	if (cu > 0 && cu < 1) {
		const tail: Pt[] = [];
		for (let j = 0; j < 12; j++) {
			const uu = easeInOut(clamp(cu - j * 0.025));
			tail.unshift([lerp(AX0[0], AX1[0], uu), AX0[1]]);
		}
		for (let j = 1; j < tail.length; j++) gline(g, [tail[j - 1], tail[j]], P.leaf, null, 1.6 * (j / 12), 0.9 * (j / 12) ** 2, false);
		spr(g, tail[11][0], tail[11][1], 20, P.leaf, 1);
	}
	// ---- 金线（拉回全景之后）：芯线 + 沿线流动的金色粒子
	if (goldness > 0.003 && t < 77.3) {
		let pul = 0;
		for (const tf of SYNC) pul = Math.max(pul, Math.sin(Math.PI * clamp((t - tf) / 0.6)));
		const kk = goldness * (1 + 0.4 * pul) * (t < 76.3 ? 1 : 1 - 0.3 * smooth(inv(76.3, 77.3, t)));
		gline(g, [AX0, AX1], P.gold, null, 3.2 * inv1 * (1 + 0.15 * pul), 0.9 * kk);
		const len = AX1[0] - AX0[0];
		const n = Math.round((len / 100) * 6);
		for (let j = 0; j < n; j++) {
			const u = (j / n + (t * 20) / len) % 1;
			spr(g, lerp(AX0[0], AX1[0], u), AX0[1] + Math.sin(j * 2.1 + t * 1.3) * 1.2, 6 * inv1, P.goldCore, 0.55 * kk);
		}
	}
	// ---- 近景：一个突触
	if (close > 0.003) {
		spr(g, TERM[0], TERM[1], 150, P.leafDeep, 0.12 * close, 'soft');
		spr(g, SPINE[0], SPINE[1], 140, P.amber, 0.1 * close * (0.6 + 0.4 * bridgeK(t)), 'soft');
		drawSynapse(g, t, w, close, inv1);
	}
};

const drawSynapse = (g: Ctx, t: number, w: W1, k: number, inv1: number) => {
	const allF = [...SYN_FIRES, ...GROW_FIRES];
	const delays = [0.15, 0.15, 0.15, ...GROW_DELAY];
	let fA = 0;
	let fB = 0;
	allF.forEach((tf, i) => {
		fA = Math.max(fA, pulse(t, tf, 0.04, 0.3));
		fB = Math.max(fB, pulse(t, tf + delays[i], 0.04, 0.35));
	});
	// 进来的轴突（萤绿）和出去的树突（金）
	gline(g, [[640, 430], [TERM[0] - TERM_R + 2, 430]], P.leaf, null, 2.2 * inv1, 0.45 * k);
	gline(g, [[SPINE[0] + SPINE_R - 2, 430], [1290, 430]], P.gold, null, 2.0 * inv1, 0.35 * k);
	const flowN = 14;
	for (let j = 0; j < flowN; j++) {
		const u = (j / flowN + t * 0.06) % 1;
		spr(g, lerp(640, TERM[0] - TERM_R, u), 430 + Math.sin(j * 1.7 + t) * 1.5, 5 * inv1, P.leaf, 0.4 * k);
	}
	// 末端膨大（萤绿粒子）+ 囊泡
	spr(g, TERM[0], TERM[1], TERM_R * 2.2, P.leaf, (0.16 + 0.5 * fA) * k, 'soft');
	for (const p of w.term) {
		const tw = 0.8 + 0.2 * Math.sin(t * 2.1 + p.ph);
		spr(g, p.x + Math.sin(t * 1.1 + p.ph) * 0.4, p.y + Math.cos(t * 0.9 + p.ph) * 0.4, p.r * 2.4, P.leaf, k * p.b * tw * (0.5 + 0.7 * fA));
	}
	for (const v of w.vesicles) gring(g, v[0], v[1], 2.2, P.leaf, 0.8 * inv1, 0.32 * k);
	// 树突棘（金）+ 面向缝的那一层致密带
	spr(g, SPINE[0], SPINE[1], SPINE_R * 2.4, P.gold, (0.12 + 0.9 * fB) * k, 'soft');
	for (const p of w.spine) {
		const tw = 0.8 + 0.2 * Math.sin(t * 1.9 + p.ph);
		spr(g, p.x + Math.sin(t * 1.3 + p.ph) * 0.4, p.y + Math.cos(t * 1.0 + p.ph) * 0.4, p.r * 2.4, P.gold, k * p.b * tw * (0.42 + 1.1 * fB));
	}
	gring(g, SPINE[0], SPINE[1], SPINE_R + 0.5, P.gold, 2.4 * inv1, (0.35 + 0.6 * fB) * k, Math.PI * 0.78, Math.PI * 1.22);
	if (fB > 0.02) spr(g, SPINE[0], SPINE[1], 70, P.amber, 0.25 * fB * k, 'soft');
	// 递质：萤绿粒子跳过缝隙（0.13 s）
	for (const tf of allF) {
		const u0 = t - tf;
		if (u0 < 0 || u0 > 0.6) continue;
		for (const p of w.tx) {
			const u = clamp((u0 - p.d) / 0.13);
			const fade = 1 - smooth(clamp((u0 - 0.15) / 0.4));
			const x = lerp(GAP0, GAP1, easeOut(u));
			const y = lerp(p.y0, p.y1, u) - Math.sin(Math.PI * u) * 3;
			if (u > 0 && u < 1) gline(g, [[x - 6 * (1 - u * 0.5), y], [x, y]], P.leaf, null, 1.1 * inv1, 0.6 * k * fade, false);
			spr(g, x, y, 2.2, P.leaf, 0.9 * k * fade * (u > 0 ? 1 : 0));
		}
	}
	// 缝里长出来的金色：芯线 + 粒子层
	const bw = bridgeW(t);
	if (bw > 0.05) {
		const bk = bridgeK(t);
		gline(g, [[GAP0, 430], [GAP1, 430]], P.gold, null, bw * inv1, 0.9 * bk * k);
		const lanes = Math.round(bw / 1.5);
		for (let l = 0; l < lanes; l++) {
			const yy = 430 + (l - (lanes - 1) / 2) * 3.2;
			for (let j = 0; j < 6; j++) {
				const u = (j / 6 + t * 0.35 + l * 0.17) % 1;
				spr(g, lerp(GAP0, GAP1, u), yy, 2.4, P.goldCore, 0.6 * bk * k);
			}
		}
	}
	void hairl;
	void mix;
	void win;
	void toScr;
};

/** 「突触」标签在屏幕上的位置（缝下方） */
export const synLabelPos = (t: number): Pt => toScr(camI(t), (GAP0 + GAP1) / 2, 430 + 34);
export const wireEnds = (t: number): [Pt, Pt] => {
	const c = camI(t);
	return [toScr(c, AX0[0], AX0[1]), toScr(c, AX1[0], AX1[1])];
};
