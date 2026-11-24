import {groupOf} from '../../lib/load';
import type {Captions} from '../../lib/types';

export type Scene = {
	img: string; // 相对 public 的路径
	startMs: number; // 该镜头开始（交叉溶解的中点）
	endMs: number;
	/** Ken Burns 预设序号 */
	move: number;
	/** 亮图时额外压暗底部（0~1），保证字幕对比度 */
	lift: number;
	/** 亮图时额外压暗顶部（0~1），保证顶部标签 / 钩子标题的对比度 */
	topLift: number;
	/** 镜头中途的一次「推近」（ms）：开场长镜头里给眼睛一个新东西看 */
	beat?: number;
	/** 推近时对准的点（0~1，相对画面） */
	focus: [number, number];
};

const DIR = 'styles/illustration';
// 01~05 + 07 是正文，06（拥抱）固定留给结尾那一两句 + 片尾卡
export const DEFAULT_IMAGES = ['01', '02', '03', '04', '05', '07', '06'].map((n) => `${DIR}/${n}.jpg`);

const base = (img: string) => img.split('/').pop() ?? '';
// 底部偏亮、需要给字幕额外压暗的图（按文件名）
const BRIGHT: Record<string, number> = {'05.jpg': 1};
// 顶部偏亮（天空 / 窗帘 / 台灯）的图
const TOP_BRIGHT: Record<string, number> = {'03.jpg': 0.8, '04.jpg': 0.5, '05.jpg': 1};
// 画面主体的位置（推近时对准它）
const FOCUS: Record<string, [number, number]> = {'01.jpg': [0.36, 0.4]};

export type Move = {s0: number; s1: number; x0: number; x1: number; y0: number; y1: number};

// 每张图不同的镜头运动方向（推近为主，偶尔拉远）；位移单位 px（1080 宽画面）
// 约束：|x| ≤ 540·(s-1)、|y| ≤ 960·(s-1)，否则会露出图片边缘
export const MOVES: Move[] = [
	{s0: 1.05, s1: 1.11, x0: 0, x1: -10, y0: 18, y1: -22}, // 缓推 + 上摇（开场镜头另有一次推近，见 beat）
	{s0: 1.06, s1: 1.15, x0: 26, x1: -26, y0: 0, y1: -8}, // 推近 + 右→左
	{s0: 1.15, s1: 1.06, x0: -12, x1: 12, y0: -22, y1: 14}, // 拉远 + 下摇
	{s0: 1.05, s1: 1.14, x0: -24, x1: 22, y0: 10, y1: -6}, // 推近 + 左→右
	{s0: 1.14, s1: 1.05, x0: 18, x1: -8, y0: 20, y1: -16}, // 拉远 + 上摇
	{s0: 1.06, s1: 1.14, x0: 20, x1: -14, y0: -16, y1: 14}, // 推近 + 左摇下摇
	{s0: 1.04, s1: 1.15, x0: 0, x1: 0, y0: 14, y1: -64}, // 结尾：正中慢推 + 微微下摇（给片尾卡让出位置）
];
const FINAL_MOVE = MOVES.length - 1;

const MIN_SEG = 3500;
// 长视频每张图大约停这么久（图不够时循环复用中间的图、换一个镜头方向）
const SEG_TARGET = 7500;
// 结尾镜头：从最后一两句开始（离念完约 5s 的句首），一直延续到片尾卡
const FINALE_TARGET = 5000;
const FINALE_MIN = 2200;
const FINALE_MAX = 9000;
// 开场镜头超过这个长度时，在 1.2~3.6s 内的一个句首（没有就用行首）推近一次
const BEAT_IF_LONGER = 5000;
const BEAT_WINDOW: [number, number] = [1200, 3600];

type Cand = {t: number; group: boolean; gap: number};
// 切点优先落在句首；落在句中（逗号处）也可以，但要付一点代价，停顿太短的地方代价更大
const MID_SENTENCE_COST = 0.12;
const SHORT_GAP_COST = 0.25;
const SHORT_GAP = 150;

/**
 * 在 [0, end) 内选 segCount-1 个切点（动态规划）：各段时长尽量接近平均值，
 * 不短于 MIN_SEG，尽量切在句首。句子很长（一句跨 3~4 行）时也能在句中停顿处换图。
 */
const cut = (cands: Cand[], end: number, segCount: number): number[] => {
	const pts: Cand[] = [{t: 0, group: true, gap: Infinity}, ...cands.filter((c) => c.t > 0 && c.t < end)];
	const n = pts.length;
	const segs = Math.max(1, Math.min(segCount, n));
	const ideal = end / segs;
	const segCost = (a: number, b: number) => {
		const d = (b - a - ideal) / ideal;
		return d * d + (b - a < MIN_SEG ? 4 : 0);
	};
	const cutCost = (c: Cand) => (c.group ? 0 : MID_SENTENCE_COST + (c.gap < SHORT_GAP ? SHORT_GAP_COST : 0));
	// dp[j][i]：前 j+1 段已放好、第 j 段从 pts[i] 开始时的最小代价
	const dp: number[][] = Array.from({length: segs}, () => new Array<number>(n).fill(Infinity));
	const from: number[][] = Array.from({length: segs}, () => new Array<number>(n).fill(-1));
	dp[0][0] = 0;
	for (let j = 1; j < segs; j++) {
		for (let i = 1; i < n; i++) {
			for (let q = 0; q < i; q++) {
				if (!Number.isFinite(dp[j - 1][q])) continue;
				const c = dp[j - 1][q] + segCost(pts[q].t, pts[i].t) + cutCost(pts[i]);
				if (c < dp[j][i]) {
					dp[j][i] = c;
					from[j][i] = q;
				}
			}
		}
	}
	let best = -1;
	let bestCost = Infinity;
	for (let i = 0; i < n; i++) {
		if (!Number.isFinite(dp[segs - 1][i])) continue;
		const c = dp[segs - 1][i] + segCost(pts[i].t, end);
		if (c < bestCost) {
			bestCost = c;
			best = i;
		}
	}
	if (best < 0) return [0];
	const bounds: number[] = [];
	for (let j = segs - 1, i = best; j >= 0 && i >= 0; i = from[j][i], j--) bounds.unshift(pts[i].t);
	return bounds;
};

/**
 * 把图片分配到句子组上：镜头只在句子组开头切换，每段时长尽量均匀。
 * 最后一张图单独留给结尾（最后约 5s 的句子 + 片尾卡），其余图均分正文；
 * 段比图多（长视频）时，中间的图循环复用、换一个镜头方向。
 */
export const planScenes = (captions: Captions, images: string[], totalMs: number): Scene[] => {
	const lines = captions.lines;
	const imgs = images.length ? images : DEFAULT_IMAGES;
	const scene = (img: string, startMs: number, endMs: number, move: number): Scene => ({
		img,
		startMs,
		endMs,
		move,
		lift: BRIGHT[base(img)] ?? 0,
		topLift: TOP_BRIGHT[base(img)] ?? 0,
		focus: FOCUS[base(img)] ?? [0.5, 0.45],
	});
	if (!lines.length) return [scene(imgs[0], 0, totalMs, 0)];

	const groups = groupOf(captions);
	const groupStarts: number[] = [];
	lines.forEach((l, i) => {
		if (i === 0 || groups[i] !== groups[i - 1]) groupStarts.push(l.startMs);
	});
	const speechEnd = lines[lines.length - 1].endMs;

	// 1) 结尾镜头
	let finale: number | null = null;
	if (imgs.length >= 2) {
		for (const g of groupStarts) {
			const d = speechEnd - g;
			if (g < MIN_SEG || d < FINALE_MIN || d > FINALE_MAX) continue;
			if (finale === null || Math.abs(d - FINALE_TARGET) < Math.abs(speechEnd - finale - FINALE_TARGET)) finale = g;
		}
	}

	// 2) 正文镜头
	const body = finale !== null ? imgs.slice(0, -1) : imgs;
	const bodyEnd = finale ?? speechEnd;
	const cands: Cand[] = lines.map((l, i) => ({
		t: l.startMs,
		group: i === 0 || groups[i] !== groups[i - 1],
		gap: i === 0 ? Infinity : l.startMs - lines[i - 1].endMs,
	}));
	const usable = cands.filter((c) => c.t < bodyEnd).length;
	const segCount = Math.max(1, Math.min(Math.max(body.length, Math.round(bodyEnd / SEG_TARGET)), usable));
	const bounds = cut(cands, bodyEnd, segCount);
	const middle = body.length > 1 ? body.slice(1) : body;
	const out: Scene[] = bounds.map((b, k) => {
		const img = k === 0 ? body[0] : middle[(k - 1) % middle.length];
		const end = k + 1 < bounds.length ? bounds[k + 1] : finale ?? totalMs;
		return scene(img, b, end, k % FINAL_MOVE);
	});
	if (finale !== null) out.push(scene(imgs[imgs.length - 1], finale, totalMs, FINAL_MOVE));

	// 3) 开场镜头太长（抖音前 3 秒决定去留）：第 2 句开口时推近一次
	const first = out[0];
	if (first && first.endMs - first.startMs > BEAT_IF_LONGER) {
		const ok = (c: Cand) => c.t >= BEAT_WINDOW[0] && c.t <= BEAT_WINDOW[1] && c.t < first.endMs - 1500;
		const beat = cands.find((c) => ok(c) && c.group) ?? cands.find(ok);
		if (beat) first.beat = beat.t;
	}
	return out;
};
