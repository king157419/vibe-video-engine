import type {Board, Box, Captions, Cues, Pt, SectionInfo, SfxName, TextItem, TextOpts, WriteOpts} from '../whiteboard';
import {C, CLAUSE, CLAUSES, makeCues, write} from '../whiteboard';
import type {Props} from './props';
import type {IslandId} from './world';
import {ISLANDS} from './world';

// section 拿到的全部上下文。section 文件只需要：export const build = (ctx: SectionCtx) => {...}

export type Island = {
	id: IslandId;
	/** 世界坐标框 */
	box: Box;
	x0: number;
	y0: number;
	w: number;
	h: number;
};

export type SectionCtx = {
	/** 's01' … 's15' */
	id: string;
	title: string;
	info: SectionInfo;
	/** 本段第一个字开始（ms） */
	t0: number;
	/** 本段最后一个字念完（ms） */
	tEnd: number;
	/** 下一段第一个字开始（ms）；s15 = 旁白总长 */
	tNext: number;
	/** 共享的分镜板 */
	b: Board;
	/** 只在本段窗口 [t0, tNext) 里找词的提示点：q.at('词') q.end('词') q.ch('词', k) q.at('词', {nth: 1}) */
	q: Cues;
	/** 本段的主岛 */
	island: Island;
	/** 岛内局部坐标 → 世界坐标（岛左上角 = 0,0） */
	P: (x: number, y: number) => Pt;
	/** 岛内局部框 → 世界框 */
	B: (x0: number, y0: number, x1: number, y1: number) => Box;
	/** 6×6 网格：第 col 列、第 row 行格子的中心（0..5，可以用小数，如 grid(2.5, 0)） */
	grid: (col: number, row: number) => Pt;
	/** 6×6 网格：从 (c0,r0) 到 (c1,r1) 这几格合起来的框（含两端） */
	cells: (c0: number, r0: number, c1?: number, r1?: number) => Box;
	/** 镜头：at 时开始，用 dur 毫秒把 box 装进内容区；box 省略 = 整个岛 */
	cam: (box: Box | null, at: number, dur?: number, o?: {whoosh?: boolean}) => void;
	/** 真实笔顺写字（绑定了 b）。新字要跑 tools/wb_hanzi.py；返回写完时刻 */
	write: (word: string, x: number, y: number, size: number, t0: number, dur: number, o?: WriteOpts) => number;
	/** 手写体一句话（字体，从左往右擦出） */
	text: (s: string, x: number, y: number, size: number, t0: number, o?: TextOpts) => TextItem;
	/** 音效：tick / pop / stamp / erase / whoosh / page */
	sfx: (t: number, name: SfxName, vol?: number) => void;
	/** 共享道具 */
	props: Props;
	/** 颜色 */
	C: typeof C;
	CLAUSES: typeof CLAUSES;
	CLAUSE: typeof CLAUSE;
	/** 其它岛（跨岛镜头、看邻居用） */
	islands: Record<IslandId, Box>;
	/** 全片字幕（极少用；一般用 q） */
	captions: Captions;
	/** 全部分段（看别的段的时间窗口用） */
	sections: SectionInfo[];
};

export const makeIsland = (id: IslandId): Island => {
	const box = ISLANDS[id];
	return {id, box, x0: box[0], y0: box[1], w: box[2] - box[0], h: box[3] - box[1]};
};

export const makeCtx = (o: {info: SectionInfo; island: IslandId; b: Board; captions: Captions; sections: SectionInfo[]; props: Props; durationMs: number}): SectionCtx => {
	const {info, b, captions, sections, props} = o;
	const island = makeIsland(o.island);
	const tNext = info.nextStartMs ?? o.durationMs;
	const q = makeCues(captions, info.startMs - 1, tNext, info.id);
	const P = (x: number, y: number): Pt => [island.x0 + x, island.y0 + y];
	const B = (x0: number, y0: number, x1: number, y1: number): Box => [island.x0 + x0, island.y0 + y0, island.x0 + x1, island.y0 + y1];
	const cw = island.w / 6;
	const ch = island.h / 6;
	return {
		id: info.id,
		title: info.title,
		info,
		t0: info.startMs,
		tEnd: info.endMs,
		tNext,
		b,
		q,
		island,
		P,
		B,
		grid: (c, r) => [island.x0 + (c + 0.5) * cw, island.y0 + (r + 0.5) * ch],
		cells: (c0, r0, c1 = c0, r1 = r0) => [island.x0 + Math.min(c0, c1) * cw, island.y0 + Math.min(r0, r1) * ch, island.x0 + (Math.max(c0, c1) + 1) * cw, island.y0 + (Math.max(r0, r1) + 1) * ch],
		cam: (box, at, dur = 900, co = {}) => b.cam(at, box ?? island.box, dur, co.whoosh ?? false),
		write: (word, x, y, size, t0, dur, wo) => write(b, word, x, y, size, t0, dur, wo),
		text: (s, x, y, size, t0, to) => b.text(s, x, y, size, t0, to),
		sfx: (t, name, vol) => b.sound(t, name, vol),
		props,
		C,
		CLAUSES,
		CLAUSE,
		islands: ISLANDS,
		captions,
		sections,
	};
};
