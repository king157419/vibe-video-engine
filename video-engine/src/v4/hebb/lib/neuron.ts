/** 萤火粒子神经元：220 颗胞体（高斯 σ=13）+ 6 根树突（每根 40 颗，沿二次曲线，越往外越暗）。 */
import {mulberry32} from '../../kit';
import {type Ctx, type Pt, TAU, gaussian, hairl, qpt, spr} from './core';

export type NPart = {ox: number; oy: number; r: number; b: number; ph: number; ph2: number; w1: number; w2: number; d: number};
export type Neuron = {parts: NPart[]; dend: Pt[][]};

export const makeNeuron = (seed: number, axonAng: number): Neuron => {
	const R = mulberry32(seed);
	const parts: NPart[] = [];
	const drift = () => ({ph: R() * TAU, ph2: R() * TAU, w1: 3 + 2 * R(), w2: 3 + 2 * R()});
	for (let i = 0; i < 220; i++) {
		const ox = 13 * gaussian(R);
		const oy = 13 * gaussian(R);
		parts.push({ox, oy, r: 1.6 + 1.4 * R(), b: 0.45 + 0.55 * R(), d: Math.min(1, Math.hypot(ox, oy) / 45), ...drift()});
	}
	const dend: Pt[][] = [];
	for (let k = 0; k < 6; k++) {
		const ang = axonAng + 0.6 + (k * (TAU - 1.2)) / 5 + (R() - 0.5) * 0.3;
		const L = 70 + 80 * R();
		const ca = Math.cos(ang);
		const sa = Math.sin(ang);
		const p0: Pt = [ca * 12, sa * 12];
		const p1: Pt = [ca * (12 + L), sa * (12 + L)];
		const bend = (R() - 0.5) * 0.7 * L;
		const c: Pt = [(p0[0] + p1[0]) / 2 - sa * bend, (p0[1] + p1[1]) / 2 + ca * bend];
		const main: Pt[] = [];
		for (let j = 0; j <= 20; j++) main.push(qpt(p0, c, p1, j / 20));
		dend.push(main);
		// 一根分叉：从 55% 处岔出去
		const fu = 0.5 + 0.15 * R();
		const fp = qpt(p0, c, p1, fu);
		const fa = ang + (R() < 0.5 ? -1 : 1) * (0.5 + 0.4 * R());
		const fl = L * (0.35 + 0.2 * R());
		const f1: Pt = [fp[0] + Math.cos(fa) * fl, fp[1] + Math.sin(fa) * fl];
		const fc: Pt = [(fp[0] + f1[0]) / 2 + (R() - 0.5) * 12, (fp[1] + f1[1]) / 2 + (R() - 0.5) * 12];
		dend.push(Array.from({length: 9}, (_, j) => qpt(fp, fc, f1, j / 8)));
		for (let j = 0; j < 40; j++) {
			const onFork = j >= 28;
			const u = onFork ? (j - 28 + 0.5 + (R() - 0.5) * 0.6) / 12 : (j + 0.5 + (R() - 0.5) * 0.6) / 28;
			const [x, y] = onFork ? qpt(fp, fc, f1, u) : qpt(p0, c, p1, u);
			const tip = onFork ? fu + (1 - fu) * u : u;
			const jit = (1 - tip * 0.5) * 2.2;
			parts.push({
				ox: x + (R() - 0.5) * jit,
				oy: y + (R() - 0.5) * jit,
				r: 1.5 - 0.7 * tip + 0.4 * R(),
				b: (0.85 - 0.6 * tip) * (0.75 + 0.25 * R()),
				d: 0.3 + 0.7 * tip,
				...drift(),
			});
		}
	}
	return {parts, dend};
};

export type NOpt = {
	color: string;
	k: number; // 整体亮度
	contract?: number; // 0 = 完整，1 = 缩成一点
	fire?: number; // 放电闪光 0–1+
	from?: Pt[]; // 形变：每颗粒子的起点（世界坐标）
	fromU?: number[]; // 每颗粒子的飞行进度 0–1
};

export const drawNeuron = (g: Ctx, n: Neuron, cx: number, cy: number, t: number, o: NOpt) => {
	const k = o.k;
	if (k <= 0.003) return;
	const sc = 1 - 0.92 * (o.contract ?? 0);
	const fire = o.fire ?? 0;
	// 树突的暗线（结构）
	if (!o.from && sc > 0.3) {
		g.save();
		g.translate(cx, cy);
		g.scale(sc, sc);
		for (const d of n.dend) hairl(g, d, o.color, 0.8 / sc, 0.1 * k * Math.min(1, (sc - 0.3) / 0.4));
		g.restore();
	}
	// 胞体光晕
	const flying = o.fromU ? o.fromU.reduce((a, b) => a + b, 0) / o.fromU.length : 1;
	spr(g, cx, cy, 85 * (0.6 + 0.4 * sc) * (1 + 0.5 * fire), o.color, (0.2 + 0.55 * fire) * k * flying, 'soft');
	spr(g, cx, cy, 22 * (0.5 + 0.5 * sc), o.color, (0.5 + 0.7 * fire) * k * flying);
	for (let i = 0; i < n.parts.length; i++) {
		const p = n.parts[i];
		const dx = 1.5 * Math.sin((TAU * t) / p.w1 + p.ph);
		const dy = 1.5 * Math.cos((TAU * t) / p.w2 + p.ph2);
		const br = p.b * (1 + 0.15 * Math.sin((TAU * t * 1.3) / p.w1 + p.ph2));
		let x = cx + p.ox * sc + dx;
		let y = cy + p.oy * sc + dy;
		let kk = br * k * (1 + fire * (1.4 * (1 - p.d) + 0.5));
		if (o.from && o.fromU) {
			const u = o.fromU[i];
			const [fx, fy] = o.from[i];
			if (u < 1) {
				const mx = (fx + x) / 2 + (hashish(i) - 0.5) * 120;
				const my = (fy + y) / 2 - 40 - hashish(i + 7) * 60;
				const a = (1 - u) * (1 - u);
				const b = 2 * (1 - u) * u;
				const c = u * u;
				x = a * fx + b * mx + c * x;
				y = a * fy + b * my + c * y;
				kk *= 0.8 + 0.6 * (1 - u);
			}
		}
		spr(g, x, y, p.r * 2.8, o.color, kk * 0.5);
	}
};

const hashish = (i: number) => {
	const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
	return s - Math.floor(s);
};
