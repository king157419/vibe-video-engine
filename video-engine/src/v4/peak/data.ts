/** 《峰终》的数据：全部从 public/v4/peak/{cue,numbers,subs}.json 读进来，再按剧本 §2.4 的公式一次算好。
 *  画面里出现的所有读数、点数、亮度都来自这里，不手写。 */
import {hash2, mulberry32, smooth} from '../kit/util';
import type {Sub} from '../kit/theme';
import {catmull, inPoly, type P, resample} from './fx';

export const HAND_N = 240;

export type Note = {t: number; midi: number; x: number; y: number};
type Mem = {m: number; k: number; r: number};
export type Numbers = {
	melody: Note[];
	melody_peak: {x: number; y: number};
	melody_end: {x: number; y: number; expected_y: number};
	today: Note[];
	cold_p60: number;
	cold_p90: number;
	film_frames: {j: number; t: number; p: number; x: number; b: number}[];
	mem_cold: {short: Mem; long: Mem};
	y1996: {spike: {arr: number[]; total: number; peak: number; last3: number; m: number}; flat: {arr: number[]; total: number; peak: number; last3: number; m: number}};
	mem_1996: {spike: Mem; flat: Mem};
	y2003: {top: number; bottom: number; rate_std: number; rate_ext: number; back_top: number; back_bottom: number};
	mem_2003: {std: Mem; ext: Mem};
	life: {years: number; days: number; rings: number; r_max: number; plateau_days: number};
	film_curve: {first_top: number; peak: {t: number; F: number; x: number; y: number}; end: {t: number; F: number; x: number; y: number}; max: number};
	marks: Record<string, number>;
	dur: number;
};
export type Cue = {
	dur: number;
	ramp: number;
	fade_in: number;
	fade_out: number;
	sections: {t0: number; intensity?: number}[];
	silences: [number, number][];
};
export type PeakProps = {subs: Sub[] | null; cue: Cue | null; num: Numbers | null};

/** 旋律线的 y：每个音起头用 glide 秒的 smoothstep 滑到新高度。
 *  审片修改：0.12 → 0.42 s，台阶变成 S 形的升降（拐角自然圆滑），读起来是「唱出来的光」，不是阶梯图 */
export const GLIDE = 0.42;
/** 终版复看后再加两样「唱」的东西（台阶读起来仍像天际线）：
 *  ① 滑音冲过头 12% 再回落（像人声的滑音，约 0.6 s 落稳）；② 长音 0.7 s 后起一点很慢的颤音（±3 px，1.1 Hz）。 */
const OVER = 0.12;
const VIB_A = 3;
export const noteY = (notes: Note[], tau: number, glide = GLIDE) => {
	let y = notes[0].y;
	let t0 = notes[0].t;
	for (let i = 1; i < notes.length; i++) {
		if (tau < notes[i].t) break;
		const prev = notes[i - 1].y;
		const u = tau - notes[i].t;
		const over = OVER * Math.sin(Math.PI * Math.min(1, Math.max(0, (u - 0.45 * glide) / glide)));
		y = prev + (notes[i].y - prev) * (smooth(u / glide) + over);
		t0 = notes[i].t;
	}
	const v = tau - t0 - 0.7;
	if (v > 0) y += VIB_A * Math.sin(2 * Math.PI * 1.1 * v) * smooth(v / 0.8);
	return y;
};

/** 冷水难受程度（示意）p(s)，剧本 §2.4 */
export const coldP = (s: number) => (s <= 60 ? 8 * (1 - Math.exp(-s / 22)) : 7.48 - 2.2 * Math.pow(Math.max(0, s - 60) / 30, 0.8));

export const lifeA = (u: number): P => [200 + 1100 * u, 640 - 290 * smooth(u / 0.45) + 14 * Math.sin(8 * Math.PI * u)];
/** 审片修改（声音 P1 / 画面 P2）：B 不再只往下偏 6 px（叠成一根双线管子），而是放在 A 下方 100 px 的平行轨道上，形状完全相同 */
export const B_OFF = 100;
export const WOW_T0 = 183.75;
export const lifeBext = (v: number): P => [1300 + 260 * v, 350 + B_OFF + 80 * smooth(v) + 8 * Math.sin(4 * Math.PI * v)];

/** 本片曲线 F(t)：和 build_timeline.py 的 intensity_curve()、score.py 的总增益同一套算法 */
export const filmCurve = (cue: Cue, fs = 100) => {
	const n = Math.round(cue.dur * fs);
	const gArr = new Float64Array(n);
	const pts = cue.sections.map((s) => [s.t0, s.intensity ?? 0.7] as [number, number]);
	for (let i = 0; i < pts.length; i++) {
		const a = Math.floor(pts[i][0] * fs);
		const b = i + 1 < pts.length ? Math.floor(pts[i + 1][0] * fs) : n;
		for (let j = a; j < b && j < n; j++) gArr[j] = pts[i][1];
	}
	const k = Math.floor(cue.ramp * fs);
	const M = 2 * k + 1;
	const w = new Float64Array(M);
	let ws = 0;
	for (let j = 0; j < M; j++) {
		w[j] = 0.5 - 0.5 * Math.cos((2 * Math.PI * j) / (M - 1));
		ws += w[j];
	}
	for (let j = 0; j < M; j++) w[j] /= ws;
	const F = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		let s = 0;
		for (let j = 0; j < M; j++) {
			const q = i + j - k;
			if (q >= 0 && q < n) s += gArr[q] * w[j];
		}
		const t = i / fs;
		F[i] = s * Math.min(1, Math.max(0, t / cue.fade_in)) * Math.min(1, Math.max(0, (cue.dur - t) / cue.fade_out));
	}
	for (const [a, b] of cue.silences) for (let i = Math.floor(a * fs); i < Math.floor(b * fs) && i < n; i++) F[i] = 0;
	return {F, fs, at: (t: number) => F[Math.max(0, Math.min(n - 1, Math.round(t * fs)))]};
};

/** 手（手背朝观众、手指朝下、手腕在 (0,0)）：审片修改，按真实比例重描 ——
 *  手掌宽约 130、手长（腕→中指尖）约 306；四指宽 22–32、指间有指蹼；拇指从掌侧斜出。约 60 个控制点。 */
const HAND_RAW: P[] = [
	[-50, 0], [-53, 30], [-58, 56], [-68, 78], [-82, 98], [-96, 120], [-106, 143], [-111, 164], [-109, 182], [-101, 193],
	[-91, 192], [-84, 180], [-78, 163], [-71, 148], [-67, 158], [-67, 190], [-65, 228], [-62, 258], [-57, 278], [-48, 289],
	[-39, 286], [-34, 272], [-33, 240], [-32, 200], [-30, 176], [-28, 194], [-28, 236], [-26, 276], [-21, 299], [-12, 306],
	[-3, 300], [0, 280], [1, 238], [2, 194], [4, 176], [7, 192], [8, 232], [10, 266], [15, 284], [23, 290],
	[31, 283], [34, 264], [34, 226], [35, 186], [38, 170], [41, 184], [43, 212], [45, 236], [50, 250], [57, 252],
	[63, 244], [65, 226], [64, 196], [62, 160], [59, 116], [55, 64], [52, 30], [50, 0],
];

export const build = (num: Numbers, cue: Cue) => {
	const mel = num.melody;
	// 旋律线 M：τ 从 1.0 到 13.0，每 0.01 s 一点
	const melAt = (tau: number): P => [260 + 112 * (tau - 1), noteY(mel, tau)];
	const melPts: P[] = [];
	for (let i = 0; i <= 1200; i++) melPts.push(melAt(1 + i * 0.01));
	const crack: P[] = [[0, 0], [9, -30], [18, 26], [27, -36], [35, 30], [43, -10]];
	const peakPt: P = [num.melody_peak.x, num.melody_peak.y];
	const endPt: P = [num.melody_end.x, num.melody_end.y];

	// 今天这条线（片尾旋律）
	const td = num.today;
	// 审片复看：原来线只画到最后一个音的起点，再直接连到 (960,470)，末端是一根竖线；现在多画一段滑音，落稳在 G 上
	const tdEnd = td[td.length - 1].t + 0.65;
	const tdx = (tau: number) => 260 + ((tau - td[0].t) * (960 - 260)) / (tdEnd - td[0].t);
	const todayPts: P[] = [];
	for (let tau = td[0].t; tau <= tdEnd + 1e-6; tau += 0.01) todayPts.push([tdx(tau), noteY(td, Math.min(tau, td[td.length - 1].t + 0.6))]);
	todayPts.push([960, 470]);

	// 手：Catmull-Rom 平滑的轮廓（相对手腕），开口在手腕；再按弧长重采样成 HAND_N 颗霜点勾边（不用单笔线）
	const hand = catmull(HAND_RAW, 6, false);
	const handDots = resample(hand, HAND_N);
	// 换手：另一只手 = 以 x 0 为轴的镜像，点序倒过来配对（A_i ↔ B_{N−1−i}，拇指从一侧挪到另一侧，手不会塌成一根竖线）
	const handDotsB: P[] = handDots.map((_, i) => [-handDots[HAND_N - 1 - i][0], handDots[HAND_N - 1 - i][1]] as P);
	// 霜点：hash2(i,0,14) 落在手的轮廓里（水下和手背）
	const poly: P[] = [...HAND_RAW];
	const frost: {x: number; y: number; r: number; ph: number}[] = [];
	for (let i = 0; frost.length < 40 && i < 4000; i++) {
		const x = -112 + 180 * hash2(i, 0, 14);
		const y = 30 + 280 * hash2(i, 1, 14);
		if (inPoly(x, y, poly)) frost.push({x, y, r: 1.2 + hash2(i, 2, 14), ph: 6.283 * hash2(i, 3, 14)});
	}

	// 1996 两根光丝
	const fil = (arr: number[], base: number): P[] => arr.map((p, i) => [360 + 63 * i, base - 16 * p]);
	const spike = fil(num.y1996.spike.arr, 470);
	const flat = fil(num.y1996.flat.arr, 740);

	// 2003：682 颗病人点（mulberry32(682)，先 x 再 g，按 g 排序）
	const r682 = mulberry32(682);
	const raw = Array.from({length: 682}, (_, i) => ({i, x: 420 + 960 * r682(), g: r682()}));
	const sorted = [...raw].sort((a, b) => a.g - b.g);
	const nTop = num.y2003.top;
	const patients = sorted.map((p, idx) => {
		const top = idx < nTop;
		const row = top ? 400 : 660;
		return {
			x: p.x,
			top,
			y: row + (hash2(p.i, 5, 682) - 0.5) * 32,
			y0: -30 - 260 * hash2(p.i, 6, 682),
			band: 530 + (hash2(p.i, 7, 682) - 0.5) * 70,
			d: hash2(p.i, 8, 682),
			back: hash2(p.i, 9, 682),
			sway: hash2(p.i, 10, 682),
		};
	});
	// 回来复查的：上排 157 颗、下排 186 颗（按 back 从小到大挑）
	const pickBack = (top: boolean, n: number) => {
		const idx = patients.map((p, i) => ({i, b: p.back, top: p.top})).filter((p) => p.top === top).sort((a, b) => a.b - b.b);
		return new Set(idx.slice(0, n).map((p) => p.i));
	};
	const backTop = pickBack(true, num.y2003.back_top);
	const backBot = pickBack(false, num.y2003.back_bottom);

	// 一生的螺旋：79 圈 × 365 点；第 k 圈半径 30 + 5.3k（圈内连续过渡成真正的螺旋），角度 2πj/365 + 0.21k
	const days = num.life.days;
	const spiral = new Float32Array(days * 2);
	const spiralR = new Float32Array(days);
	for (let d = 0; d < days; d++) {
		const k = Math.floor(d / 365);
		const j = d % 365;
		const f = j / 365;
		const r = 30 + 5.3 * (k + f);
		const a = 2 * Math.PI * f + 0.21 * (k + f);
		spiral[2 * d] = 960 + r * Math.cos(a);
		spiral[2 * d + 1] = 470 + r * Math.sin(a);
		spiralR[d] = r;
	}
	const r36 = mulberry32(36);
	const golden: number[] = [];
	while (golden.length < 36) {
		const k = Math.floor(r36() * num.life.rings);
		const j = Math.floor(r36() * 365);
		const d = k * 365 + j;
		if (!golden.includes(d)) golden.push(d);
	}
	const goldenSet = new Set(golden);

	// 满屏奇观：第 k 个日子在人生线 A 上的位置、飞往的落点、出发时刻、飞行时长。
	// 审片修改：原来是「随机方向 × 900·√h」，起笔在 x 200，前 2.5 s 只有左三分之一亮、右侧和左上角最后才填上。
	// 现在用同一组 hash2(k,1,7)、hash2(k,2,7) 取一个均匀分布在整个可见画面（镜头拉远到 0.92 后）里的落点；
	// 已经画过的整段线都在持续往外喷（出发时刻 = 笔经过的时刻 + 一段随机延迟），大约 187 s 铺满。
	const wow = new Float32Array(days * 6);
	for (let k = 0; k < days; k++) {
		const u = (k + 0.5) / days;
		const [x, y] = lifeA(u);
		const tk = WOW_T0 + 5 * Math.sqrt(u);
		const delay = hash2(k, 5, 7) ** 2 * Math.max(0, 188.6 - tk) * 0.6;
		wow[6 * k] = x;
		wow[6 * k + 1] = y;
		wow[6 * k + 2] = -100 + 2120 * hash2(k, 1, 7);
		wow[6 * k + 3] = -80 + 1240 * hash2(k, 2, 7);
		wow[6 * k + 4] = tk + delay;
		wow[6 * k + 5] = 1.4 + 0.8 * hash2(k, 8, 7);
	}
	const lifeAPts: P[] = [];
	for (let i = 0; i <= 600; i++) lifeAPts.push(lifeA(i / 600));
	const lifeBPts: P[] = lifeAPts.map(([x, y]) => [x, y + B_OFF]);
	const lifeBExtPts: P[] = [];
	for (let i = 0; i <= 200; i++) lifeBExtPts.push(lifeBext(i / 200));

	// 本片曲线（审片修改）：
	// ① 只画 t ∈ [1.0, dur − fade_out]：fade_in / fade_out 那两截在画面上是一根从底到顶的竖线，像 y 轴，不画；
	// ② 硬静音不再画成落到底的尖缝，而是线上的一个断口（两段，两端各一点微光）；
	// ③ 用 01 章「用亮度不用高度」的语法：画成 y 470 的一条横向光带，亮度和粗细随 F 变。
	//    （试过把纵向拉开成 y = 620 − (F − 0.6)·700：±1.5 s 的过渡在 1600 px 宽里只有十几像素，画出来是一排方波，比原来更像图表。）
	const fc = filmCurve(cue);
	const fx = (t: number) => 160 + (1600 * t) / num.dur;
	const fy = (_F: number) => 470;
	/** 光带在 F 处的「响度」0–1（F 0.68 以下算 0） */
	const fq = (F: number) => Math.min(1, Math.max(0, (F - 0.68) / 0.32));
	const [s0, s1] = cue.silences[0];
	const CT0 = 1.0;
	const CT1 = num.dur - cue.fade_out;
	const curve: {t: number; x: number; y: number}[] = [];
	for (let i = Math.round(CT0 * 10); i <= Math.round(CT1 * 10); i++) {
		const t = i / 10;
		if (t > s0 - 1e-6 && t < s1 + 1e-6) continue;
		curve.push({t, x: fx(t), y: fy(fc.at(t))});
	}
	curve.push({t: s0 - 0.001, x: fx(s0), y: fy(fc.at(s0 - 0.01))});
	curve.push({t: s1 + 0.001, x: fx(s1), y: fy(fc.at(s1 + 0.01))});
	curve.sort((a, b) => a.t - b.t);

	return {
		num,
		cue,
		melAt,
		melPts,
		crack,
		peakPt,
		endPt,
		todayPts,
		hand,
		handDots,
		handDotsB,
		frost,
		CT0,
		CT1,
		gap: [s0, s1] as [number, number],
		spike,
		flat,
		spikeC: catmull(spike, 10),
		flatC: catmull(flat, 10),
		patients,
		backTop,
		backBot,
		spiral,
		spiralR,
		golden,
		goldenSet,
		wow,
		lifeAPts,
		lifeBPts,
		lifeBExtPts,
		fc,
		fx,
		fy,
		fq,
		curve,
	};
};
export type Data = ReturnType<typeof build>;

/** 秒 → 「分:秒」（向下取整），例如 188.95 → 3:08 */
export const mmss = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
/** 28835 → 「28 835」 */
export const thin = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
