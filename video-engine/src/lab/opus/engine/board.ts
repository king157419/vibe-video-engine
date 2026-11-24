import type {ReactNode} from 'react';
import type {Captions} from '../../../lib/types';
import type {Geo, Pt} from './rough';
import {C, textW} from './theme';

// 「分镜板」：稿子里每一个画面动作都是一条带时间的数据（display list）。
// 场景组件只负责往板子上加条目；渲染器逐帧把条目画出来。全部由时间驱动、可复现。

export type Box = [number, number, number, number]; // 世界坐标 x0,y0,x1,y1

type Base = {
	t0: number; // 开始画（ms）
	out?: number; // 擦掉（ms）
	outDur?: number;
	g?: string; // 所属变换组（手机拿起放下之类）
	pen?: boolean; // 笔要不要跟着画（默认 true）
	opacity?: number;
};

export type StrokeItem = Base & {
	k: 'stroke';
	geos: Geo[]; // 线条「呼吸」用的几个版本；[0] 用来画
	dur: number;
	color: string;
	w: number;
	dash?: string;
	boil?: boolean;
	lag?: number;
};

export type FillItem = Base & {
	k: 'fill';
	geos: Geo[];
	dur: number;
	color: string;
	w: number;
	flicker?: number; // 每几帧换一版（火苗）
};

export type TextItem = Base & {
	k: 'text';
	s: string;
	x: number;
	y: number; // 基线
	size: number;
	color: string;
	font: 'hand' | 'sans';
	anchor: 'start' | 'middle' | 'end';
	dur: number; // 写完用时
	weight?: number;
};

export type NodeItem = Base & {
	k: 'node';
	render: (ms: number, frame: number) => ReactNode;
};

export type Item = StrokeItem | FillItem | TextItem | NodeItem;

export type CamKey = {t: number; box: Box; dur: number};

/** 笔的一次落笔：[t0,t1] 之间笔尖在 tip(p) */
export type PenEvent = {t0: number; t1: number; tip: (p: number) => Pt; g?: string};

// ---------------- 逐字时间 → 画面提示点 ----------------
export type Cues = {
	/** 旁白念到 phrase 第一个字的时刻（after 之后第一次出现） */
	at: (phrase: string, after?: number) => number;
	/** phrase 最后一个字念完的时刻 */
	end: (phrase: string, after?: number) => number;
	/** phrase 里第 k 个字（从 0 数）开始的时刻 */
	ch: (phrase: string, k: number, after?: number) => number;
};

export const makeCues = (captions: Captions): Cues => {
	const entries = captions.lines.flatMap((l) => l.chars.map((c) => ({t: c.t.replace(/\s/g, ''), s: c.s, e: c.e})));
	let joined = '';
	const owner: number[] = [];
	entries.forEach((e, i) => {
		for (const ch of Array.from(e.t)) {
			joined += ch;
			owner.push(i);
		}
	});
	const find = (phrase: string, after = -1): number => {
		let from = 0;
		for (;;) {
			const idx = joined.indexOf(phrase, from);
			if (idx < 0) throw new Error(`cue not found: ${phrase} after ${after}`);
			if (entries[owner[idx]].s >= after) return idx;
			from = idx + 1;
		}
	};
	return {
		at: (p, after) => entries[owner[find(p, after)]].s,
		end: (p, after) => {
			const idx = find(p, after);
			return entries[owner[idx + Array.from(p).length - 1]].e;
		},
		ch: (p, k, after) => {
			const idx = find(p, after);
			return entries[owner[idx + k]].s;
		},
	};
};

// ---------------- 构建器 ----------------
export type StrokeOpts = Partial<Pick<StrokeItem, 'color' | 'w' | 'dash' | 'boil' | 'lag' | 'g' | 'out' | 'outDur' | 'pen' | 'opacity'>>;
export type TextOpts = Partial<Pick<TextItem, 'color' | 'font' | 'anchor' | 'dur' | 'weight' | 'g' | 'out' | 'outDur' | 'pen' | 'opacity'>>;

export class Board {
	items: Item[] = [];
	cams: CamKey[] = [];
	groups: Record<string, (ms: number) => string> = {};
	whoosh: number[] = [];
	/** 额外的落笔事件（逐笔写字这类不走 item 的组件用） */
	extraPen: PenEvent[] = [];
	/** 音效提示：t 毫秒时播放 src */
	sfx: {t: number; src: string; vol: number}[] = [];
	private seed = 1;
	constructor(public cue: Cues) {}

	/** make(seed) 生成一笔；自动生成 2 个版本做线条呼吸 */
	stroke(make: (seed: number) => Geo, t0: number, dur: number, o: StrokeOpts = {}): StrokeItem {
		const s = (this.seed += 7);
		const it: StrokeItem = {k: 'stroke', geos: [make(s), make(s + 3)], t0, dur, color: C.ink, w: 3.6, boil: true, ...o};
		this.items.push(it);
		return it;
	}

	fill(make: (seed: number) => Geo, t0: number, dur: number, o: Partial<FillItem> = {}): FillItem {
		const s = (this.seed += 7);
		const n = o.flicker ? 3 : 2;
		const geos = Array.from({length: n}, (_, k) => make(s + k * 3));
		const it: FillItem = {k: 'fill', geos, t0, dur, color: C.amber, w: 3, ...o};
		this.items.push(it);
		return it;
	}

	text(s: string, x: number, y: number, size: number, t0: number, o: TextOpts = {}): TextItem {
		const it: TextItem = {
			k: 'text',
			s,
			x,
			y,
			size,
			t0,
			color: C.ink,
			font: 'hand',
			anchor: 'start',
			dur: Math.min(900, 70 + Array.from(s).length * 85),
			...o,
		};
		this.items.push(it);
		return it;
	}

	node(t0: number, render: NodeItem['render'], o: Partial<Base> = {}): NodeItem {
		const it: NodeItem = {k: 'node', t0, render, pen: false, ...o};
		this.items.push(it);
		return it;
	}

	cam(t: number, box: Box, dur = 900, whoosh = false) {
		this.cams.push({t, box, dur});
		if (whoosh) this.whoosh.push(t);
	}

	/** 把一批已加入的条目统一设为 t 时擦掉 */
	eraseAll(items: Item[], t: number, dur = 450) {
		for (const it of items) {
			it.out = t;
			it.outDur = dur;
		}
	}

	/** 从第 from 条开始到现在加入的所有条目 */
	since(from: number): Item[] {
		return this.items.slice(from);
	}
	mark(): number {
		return this.items.length;
	}

	penEvents(): PenEvent[] {
		const ev: PenEvent[] = [];
		for (const it of this.items) {
			if (it.pen === false) continue;
			if (it.k === 'stroke' || it.k === 'fill') {
				const g = it.geos[0];
				if (!g.subs.length) continue;
				ev.push({t0: it.t0, t1: it.t0 + it.dur, tip: (p) => tipOf(g, p, it.k === 'fill'), g: it.g});
			} else if (it.k === 'text') {
				const w = textW(it.s, it.size);
				const x0 = it.anchor === 'start' ? it.x : it.anchor === 'middle' ? it.x - w / 2 : it.x - w;
				const sz = it.size;
				ev.push({
					t0: it.t0,
					t1: it.t0 + it.dur,
					tip: (p) => [x0 + w * p, it.y - sz * 0.35 + Math.sin(p * Math.PI * Array.from(it.s).length * 2) * sz * 0.22],
					g: it.g,
				});
			}
		}
		ev.push(...this.extraPen);
		return ev.sort((a, b) => a.t0 - b.t0);
	}
}

const tipOf = (g: Geo, p: number, seq: boolean): Pt => {
	if (seq) {
		const target = g.total * p;
		let acc = 0;
		for (const s of g.subs) {
			if (acc + s.len >= target) {
				const u = (target - acc) / (s.len || 1);
				const k = Math.min(s.cum.length - 1, Math.floor(u * (s.cum.length - 1)));
				return [s.pts[k * 2], s.pts[k * 2 + 1]];
			}
			acc += s.len;
		}
		const l = g.subs[g.subs.length - 1];
		return [l.pts[l.pts.length - 2], l.pts[l.pts.length - 1]];
	}
	const s = g.subs[0];
	const target = s.len * Math.min(1, p / Math.max(0.5, 1 - 0.1 * (g.subs.length - 1)));
	for (let k = 1; k < s.cum.length; k++) {
		if (s.cum[k] >= target) {
			const u = (target - s.cum[k - 1]) / (s.cum[k] - s.cum[k - 1] || 1);
			return [s.pts[k * 2 - 2] + (s.pts[k * 2] - s.pts[k * 2 - 2]) * u, s.pts[k * 2 - 1] + (s.pts[k * 2 + 1] - s.pts[k * 2 - 1]) * u];
		}
	}
	return g.end;
};
