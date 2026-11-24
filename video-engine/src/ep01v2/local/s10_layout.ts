import type {Board, Box, Item, Pt} from '../../whiteboard';
import {mulMat, textW} from '../../whiteboard';
import {ISLANDS} from '../world';

// MEMO 岛（D11 备忘录「抓 · 追 · 加」）的共用版面：s10 画、s11 在同一条链上闪/换色、s12 前半段在旁边加改写栏。
// 所有坐标都是 MEMO 岛内局部坐标（岛左上角 = 0,0），用 MP / MB 换成世界坐标。
//
//   ┌ 迷你 D1 ┐  ( 思考泡：整句一闪 )        抓      ·      追      ·      加
//   └─────────┘                              [ ]            [ ]            [ ]
//   ┌ 备忘录 ─────────────────────────────────────────────────────┐ ┌ 改写栏 ┐
//   │[抓] 如果TA不回，就 (没戏了) →然后呢→ (得从头找) →然后呢→ (办不成事) │ │ 最可能 │
//   │   …  追问格 ☐☐☐ · 停牌 · 「我会很烦」✗ →「没办成」              │ │ 我可以 │
//   └──────────────────────────────────────────────────────────────┘ └────────┘
//   ▭▭▭▭▭ 迷你底座（从下方滑上来）                 ┈┈┈ 干等 ┈┈┈▶ 截止（旗）

const [X0, Y0] = ISLANDS.MEMO;
export const MP = (x: number, y: number): Pt => [X0 + x, Y0 + y];
export const MB = (x0: number, y0: number, x1: number, y1: number): Box => [X0 + x0, Y0 + y0, X0 + x1, Y0 + y1];

/** 句子条（备忘录第一行）字号与基线 */
export const LINE_SIZE = 60;
export const LINE_Y = 560;
export const LINE_X0 = 190;
export const LINE_HEAD = '如果TA不回，就';

type Seg = {x: number; w: number; text: string; kind: 'text' | 'arrow'};
const mkChain = (): Seg[] => {
	const out: Seg[] = [];
	let x = LINE_X0;
	const push = (text: string, kind: Seg['kind']) => {
		const w = kind === 'arrow' ? 150 : textW(text, LINE_SIZE);
		out.push({x, w, text, kind});
		x += w + 26;
	};
	push(LINE_HEAD, 'text');
	push('没戏了', 'text');
	push('→', 'arrow');
	push('得从头找', 'text');
	push('→', 'arrow');
	push('办不成事', 'text');
	return out;
};
/** 0 句头 · 1 没戏了(红) · 2 箭头 · 3 得从头找(橙) · 4 箭头 · 5 办不成事(蓝)；x 是局部坐标 */
export const CHAIN = mkChain();

/** 某一段的圈（局部坐标）：中心、宽、高 */
export const ringOf = (i: number) => {
	const s = CHAIN[i];
	return {cx: s.x + s.w / 2, cy: LINE_Y - LINE_SIZE * 0.34, w: s.w + 44, h: LINE_SIZE * 1.45};
};
/** 箭头所在的高度（局部） */
export const ARROW_Y = LINE_Y - LINE_SIZE * 0.32;

export const MEMO = {
	/** 迷你 D1（整个 OPEN 岛等比缩到这里：聊天框落在左上角） */
	d1Box: MB(30, 20, 30 + 2400 * 0.27, 20 + 1120 * 0.27),
	/** 「抓 · 追 · 加」三个大字的中心 x、字顶 y、字号，以及下面的空格 */
	title: {xs: [1300, 1700, 2100], y: 28, size: 120, slot: [178, 244] as [number, number]},
	/** 思考泡（整句一闪而过） */
	bubble: MB(600, 40, 1180, 320),
	/** 备忘录卡片 */
	card: MB(60, 330, 1790, 1000),
	/** 改写栏（s12） */
	rewrite: MB(1830, 330, 2370, 1000),
	/** 迷你底座（s10 从下方滑上来） */
	base: MB(150, 1012, 950, 1100),
	/** 字母卡（s11，左下） */
	cards: {xs: [250, 370, 490, 610], y: 880, s: 110},
};

/** s10 → s11/s12 的交接（同一个人做的三段；s10 构建时重置） */
export const reg = {
	/** s11 开头擦掉的辅助画（麦克风、追问格、「我会很烦」……） */
	aux: [] as Item[],
	/** 三个颜色圈（s11 闪、换色） */
	rings: {} as Partial<Record<'red' | 'orange' | 'blue', Item>>,
	ready: false,
};
export const resetReg = () => {
	reg.aux = [];
	reg.rings = {};
	reg.ready = false;
};

/**
 * D1 的钟针用的是自己的变换组（d1clock-h / d1clock-m），不跟着 d1 组走；s10 把 D1 缩到 MEMO 时针会留在原地。
 * 这里把这两个组包一层：先转针，再乘上 d1 组的矩阵（D1 在家时 d1 是单位阵，行为不变）。只包一次。
 */
export const chainClockHands = (b: Board) => {
	for (const id of ['d1clock-h', 'd1clock-m']) {
		const f = b.groups[id] as ((ms: number) => {m: ReturnType<typeof b.groupAt>['m']; o: number}) & {wrapped?: boolean};
		if (!f || f.wrapped) continue;
		const w = ((ms: number) => {
			const a = f(ms);
			const d = b.groupAt('d1', ms);
			return {m: mulMat(d.m, a.m), o: a.o * d.o};
		}) as typeof f;
		w.wrapped = true;
		b.groups[id] = w;
	}
};

/** 两个 #rrggbb 颜色插值 */
export const mixHex = (a: string, c: string, u: number) => {
	const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
	const A = h(a);
	const Z = h(c);
	return `rgb(${A.map((v, i) => Math.round(v + (Z[i] - v) * u)).join(',')})`;
};
