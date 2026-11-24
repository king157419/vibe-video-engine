import type {ReactNode} from 'react';
import {Easing} from 'remotion';
import type {Geo, Pt} from './rough';
import {C, textW} from './theme';
import type {CapLine, Captions} from './types';

// 「分镜板」：稿子里每一个画面动作都是一条带时间的数据（display list）。
// 分段（section）只负责往板子上加条目；渲染器逐帧把条目画出来。全部由时间驱动、可复现。

export type Box = [number, number, number, number]; // 世界坐标 x0,y0,x1,y1
/** SVG 仿射矩阵 [a b c d e f]：x' = a x + c y + e, y' = b x + d y + f */
export type Mat = [number, number, number, number, number, number];
export const IDENT: Mat = [1, 0, 0, 1, 0, 0];

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const moveEase = Easing.bezier(0.55, 0.05, 0.2, 1);

export const applyMat = (m: Mat, p: Pt): Pt => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
export const mulMat = (m: Mat, n: Mat): Mat => [
	m[0] * n[0] + m[2] * n[1],
	m[1] * n[0] + m[3] * n[1],
	m[0] * n[2] + m[2] * n[3],
	m[1] * n[2] + m[3] * n[3],
	m[0] * n[4] + m[2] * n[5] + m[4],
	m[1] * n[4] + m[3] * n[5] + m[5],
];
export const matStr = (m: Mat) => `matrix(${m.map((v) => +v.toFixed(5)).join(' ')})`;
export const isIdent = (m: Mat) => m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0;
export const rotMat = (deg: number, cx: number, cy: number): Mat => {
	const a = (deg * Math.PI) / 180;
	const c = Math.cos(a);
	const s = Math.sin(a);
	return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy];
};
export const boxMat = (m: Mat, b: Box): Box => {
	const ps = [applyMat(m, [b[0], b[1]]), applyMat(m, [b[2], b[1]]), applyMat(m, [b[0], b[3]]), applyMat(m, [b[2], b[3]])];
	return [Math.min(...ps.map((p) => p[0])), Math.min(...ps.map((p) => p[1])), Math.max(...ps.map((p) => p[0])), Math.max(...ps.map((p) => p[1]))];
};
export const boxUnion = (a: Box, b: Box): Box => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
export const boxHit = (a: Box, b: Box) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
export const boxPad = (b: Box, p: number): Box => [b[0] - p, b[1] - p, b[2] + p, b[3] + p];
export const boxCenter = (b: Box): Pt => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
export const boxW = (b: Box) => b[2] - b[0];
export const boxH = (b: Box) => b[3] - b[1];

export const geoBox = (g: Geo): Box | undefined => {
	let x0 = Infinity;
	let y0 = Infinity;
	let x1 = -Infinity;
	let y1 = -Infinity;
	for (const s of g.subs) {
		for (let i = 0; i < s.pts.length; i += 2) {
			const x = s.pts[i];
			const y = s.pts[i + 1];
			if (x < x0) x0 = x;
			if (x > x1) x1 = x;
			if (y < y0) y0 = y;
			if (y > y1) y1 = y;
		}
	}
	return x0 === Infinity ? undefined : [x0, y0, x1, y1];
};

type Base = {
	t0: number; // 开始画（ms）
	out?: number; // 擦掉（ms）
	outDur?: number;
	g?: string; // 所属变换组（道具整体移动/淡出）
	pen?: boolean; // 笔要不要跟着画（默认 true；node 默认 false）
	opacity?: number;
	/** 世界坐标包围盒（用于视野裁剪和 lint）；node 可选 */
	bb?: Box;
	/** 由哪个 section 加入（自动填） */
	sec?: string;
	/** lint 时忽略字号/出框检查 */
	nolint?: boolean;
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
	dur: number; // 写完用时；0 = 直接出现（「印好的」）
	weight?: number;
};

export type NodeItem = Base & {
	k: 'node';
	render: (ms: number, frame: number) => ReactNode;
	/** 文字类 node（write 生成）登记字号和字数，给 lint 用 */
	textSize?: number;
	textLen?: number;
	dur?: number;
};

export type Item = StrokeItem | FillItem | TextItem | NodeItem;

export type CamKey = {t: number; box: Box; dur: number; sec?: string};

/** 笔的一次落笔：[t0,t1] 之间笔尖在 tip(p)（世界坐标，g 组变换之前） */
export type PenEvent = {t0: number; t1: number; tip: (p: number) => Pt; g?: string; hover?: boolean};

export type Sfx = {t: number; src: string; vol: number; dur?: number};

// ---------------- 逐字时间 → 画面提示点 ----------------
export type CueOpt = number | {after?: number; nth?: number};

export type Cues = {
	/** 旁白念到 phrase 第一个字的时刻（ms）。opt: 数字 = after(ms)；{nth} = 本段内第 n 次出现（0 起） */
	at: (phrase: string, opt?: CueOpt) => number;
	/** phrase 最后一个字念完的时刻 */
	end: (phrase: string, opt?: CueOpt) => number;
	/** phrase 里第 k 个字（从 0 数，不计标点）开始的时刻 */
	ch: (phrase: string, k: number, opt?: CueOpt) => number;
	/** phrase 在窗口内是否出现 */
	has: (phrase: string, opt?: CueOpt) => boolean;
	/** 本窗口内出现了几次 */
	count: (phrase: string) => number;
	/** 本窗口里的字幕行 */
	lines: CapLine[];
	/** 本窗口的纯文本（去掉空白和标点），方便查词 */
	text: string;
	from: number;
	to: number;
};

const PUNCT = /[\s，。、；：？！“”‘’「」『』《》（）()…—\-·~～,.;:?!"'【】[\]]/g;
export const normCue = (s: string) => s.replace(PUNCT, '');

/** 在 [from, to) 窗口里找词。跨窗口的同一个词不会被找到。 */
export const makeCues = (captions: Captions, from = -Infinity, to = Infinity, label = ''): Cues => {
	const entries = captions.lines.flatMap((l) => l.chars.map((c) => ({t: normCue(c.t), s: c.s, e: c.e}))).filter((e) => e.s >= from && e.s < to);
	let joined = '';
	const owner: number[] = [];
	entries.forEach((e, i) => {
		for (const ch of Array.from(e.t)) {
			joined += ch;
			owner.push(i);
		}
	});
	// joined 是按 code point 拼的；indexOf 返回的是 UTF-16 下标，这里只有 BMP 字符，二者一致
	const all = (p: string): number[] => {
		const out: number[] = [];
		let i = joined.indexOf(p);
		while (i >= 0) {
			out.push(i);
			i = joined.indexOf(p, i + 1);
		}
		return out;
	};
	const find = (phrase: string, opt?: CueOpt): number => {
		const p = normCue(phrase);
		if (!p) throw new Error(`[cue${label ? ' ' + label : ''}] empty phrase "${phrase}"`);
		const after = typeof opt === 'number' ? opt : (opt?.after ?? -Infinity);
		const nth = typeof opt === 'object' ? (opt.nth ?? 0) : 0;
		const hits = all(p).filter((i) => entries[owner[i]].s >= after);
		if (hits.length <= nth) {
			const where = label ? ` in ${label} [${Math.round(from)}–${Math.round(to)}ms]` : '';
			throw new Error(`[cue] "${phrase}" not found${where}${nth ? ` (nth=${nth})` : ''}${typeof opt === 'number' ? ` after ${opt}` : ''}`);
		}
		return hits[nth];
	};
	const lines = captions.lines.filter((l) => l.startMs >= from && l.startMs < to);
	return {
		at: (p, o) => entries[owner[find(p, o)]].s,
		end: (p, o) => {
			const idx = find(p, o);
			return entries[owner[idx + Array.from(normCue(p)).length - 1]].e;
		},
		ch: (p, k, o) => {
			const idx = find(p, o);
			const n = Array.from(normCue(p)).length;
			return entries[owner[idx + Math.max(0, Math.min(n - 1, k))]].s;
		},
		has: (p, o) => {
			try {
				find(p, o);
				return true;
			} catch {
				return false;
			}
		},
		count: (p) => all(normCue(p)).length,
		lines,
		text: joined,
		from,
		to,
	};
};

// ---------------- 变换组：道具整体移动/缩放/淡出（按时间关键帧） ----------------
/** 组的摆放：把组的锚点 origin 移到 (x,y)，并以它为中心缩放 s */
export type Place = {x: number; y: number; s: number};
type TrackKey = {t: number; dur: number; to: Place};
type FadeKey = {t: number; dur: number; to: number};

export class Track {
	keys: TrackKey[] = [];
	fades: FadeKey[] = [];
	constructor(
		public id: string,
		public origin: Pt,
	) {}
	private home(): Place {
		return {x: this.origin[0], y: this.origin[1], s: 1};
	}
	/** t 时开始，用 dur 毫秒移到 place（缺省字段保持 origin / 1） */
	to(t: number, dur: number, p: Partial<Place>) {
		this.keys.push({t, dur: Math.max(1, dur), to: {...this.home(), ...p}});
		this.keys.sort((a, b) => a.t - b.t);
		return this;
	}
	/** 把「家」里的 from 框整体放进 target 框（等比，居中） */
	fit(t: number, dur: number, from: Box, target: Box) {
		const s = Math.min(boxW(target) / boxW(from), boxH(target) / boxH(from));
		const fc = boxCenter(from);
		const tc = boxCenter(target);
		// origin 经过变换后的位置：tc + s*(origin - fc)
		return this.to(t, dur, {x: tc[0] + s * (this.origin[0] - fc[0]), y: tc[1] + s * (this.origin[1] - fc[1]), s});
	}
	/** 回到原位 */
	back(t: number, dur: number) {
		return this.to(t, dur, {});
	}
	fade(t: number, dur: number, to: number) {
		this.fades.push({t, dur: Math.max(1, dur), to});
		this.fades.sort((a, b) => a.t - b.t);
		return this;
	}
	place(ms: number): Place {
		let cur = this.home();
		for (const k of this.keys) {
			if (k.t > ms) break;
			const u = moveEase(clamp01((ms - k.t) / k.dur));
			cur = {x: lerp(cur.x, k.to.x, u), y: lerp(cur.y, k.to.y, u), s: Math.exp(lerp(Math.log(cur.s), Math.log(k.to.s), u))};
		}
		return cur;
	}
	alpha(ms: number): number {
		let a = 1;
		for (const f of this.fades) {
			if (f.t > ms) break;
			a = lerp(a, f.to, clamp01((ms - f.t) / f.dur));
		}
		return a;
	}
	mat(ms: number): Mat {
		const p = this.place(ms);
		const [ox, oy] = this.origin;
		return [p.s, 0, 0, p.s, p.x - p.s * ox, p.y - p.s * oy];
	}
}

export type GroupFn = (ms: number) => {m: Mat; o: number};

// ---------------- 构建器 ----------------
export type StrokeOpts = Partial<Pick<StrokeItem, 'color' | 'w' | 'dash' | 'boil' | 'lag' | 'g' | 'out' | 'outDur' | 'pen' | 'opacity' | 'nolint'>>;
export type TextOpts = Partial<Pick<TextItem, 'color' | 'font' | 'anchor' | 'dur' | 'weight' | 'g' | 'out' | 'outDur' | 'pen' | 'opacity' | 'nolint'>>;
export type NodeOpts = Partial<Pick<NodeItem, 'out' | 'outDur' | 'g' | 'pen' | 'opacity' | 'bb' | 'nolint' | 'textSize' | 'textLen' | 'dur'>>;

export const SFX = {
	pencil: 'wb/pencil.wav',
	tick: 'wb/tick.wav',
	whoosh: 'wb/whoosh.wav',
	pop: 'wb/pop.wav',
	stamp: 'wb/stamp.wav',
	erase: 'wb/erase.wav',
	page: 'wb/page.wav',
} as const;
export type SfxName = keyof typeof SFX;

export class Board {
	items: Item[] = [];
	cams: CamKey[] = [];
	/** 变换组。一般用 track(id) 建；也可以直接写函数（旋转的指针等） */
	groups: Record<string, GroupFn> = {};
	tracks: Record<string, Track> = {};
	whoosh: number[] = [];
	/** 额外的落笔事件（逐笔写字这类不走 item 的组件用） */
	extraPen: PenEvent[] = [];
	sfx: Sfx[] = [];
	/** 当前正在构建的 section（自动记到每个条目上） */
	curSec = '';
	/** inGroup() 期间的默认变换组 */
	curG: string | undefined = undefined;
	private seed = 1;

	/** make(seed) 生成一笔；自动生成 2 个版本做线条呼吸 */
	stroke(make: (seed: number) => Geo, t0: number, dur: number, o: StrokeOpts = {}): StrokeItem {
		const s = (this.seed += 7);
		const geos = [make(s), make(s + 3)];
		const gb = geoBox(geos[0]);
		const w = o.w ?? 3.6;
		const it: StrokeItem = {k: 'stroke', geos, t0, dur, color: C.ink, w, boil: true, ...o, g: o.g ?? this.curG, bb: gb ? boxPad(gb, w * 2) : undefined, sec: this.curSec};
		this.items.push(it);
		return it;
	}

	fill(make: (seed: number) => Geo, t0: number, dur: number, o: Partial<Omit<FillItem, 'k' | 'geos' | 't0' | 'dur'>> = {}): FillItem {
		const s = (this.seed += 7);
		const n = o.flicker ? 3 : 2;
		const geos = Array.from({length: n}, (_, k) => make(s + k * 3));
		const gb = geoBox(geos[0]);
		const it: FillItem = {k: 'fill', geos, t0, dur, color: C.pencil, w: 3, ...o, g: o.g ?? this.curG, bb: gb ? boxPad(gb, 6) : undefined, sec: this.curSec};
		this.items.push(it);
		return it;
	}

	/** 手写体一句话（字体），从左往右擦出，笔跟着写。dur: 0 = 直接出现 */
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
			g: o.g ?? this.curG,
			sec: this.curSec,
		};
		const w = textW(s, size);
		const x0 = it.anchor === 'start' ? x : it.anchor === 'middle' ? x - w / 2 : x - w;
		it.bb = [x0, y - size * 0.95, x0 + w, y + size * 0.28];
		if (it.dur <= 0) it.pen = false;
		this.items.push(it);
		return it;
	}

	node(t0: number, render: NodeItem['render'], o: NodeOpts = {}): NodeItem {
		const it: NodeItem = {k: 'node', t0, render, pen: false, ...o, g: o.g ?? this.curG, sec: this.curSec};
		this.items.push(it);
		return it;
	}

	/** 镜头：t 时开始，用 dur 毫秒把 box 装进画面内容区 */
	cam(t: number, box: Box, dur = 900, whoosh = false) {
		this.cams.push({t, box, dur, sec: this.curSec});
		if (whoosh) this.whoosh.push(t);
	}

	/** 取/建一个变换组轨道。origin 是缩放的锚点（一般取道具的中心） */
	track(id: string, origin: Pt = [0, 0]): Track {
		if (!this.tracks[id]) {
			const tr = new Track(id, origin);
			this.tracks[id] = tr;
			this.groups[id] = (ms) => ({m: tr.mat(ms), o: tr.alpha(ms)});
		}
		return this.tracks[id];
	}

	groupAt(g: string | undefined, ms: number): {m: Mat; o: number} {
		if (!g) return {m: IDENT, o: 1};
		const f = this.groups[g];
		return f ? f(ms) : {m: IDENT, o: 1};
	}

	sound(t: number, name: SfxName, vol = 0.3) {
		this.sfx.push({t, src: SFX[name], vol});
	}

	/** 把一批已加入的条目统一设为 t 时擦掉（淡出 dur） */
	eraseAll(items: Item[], t: number, dur = 450) {
		for (const it of items) {
			if (it.out !== undefined && it.out < t) continue; // 已经更早擦掉的不动
			it.out = t;
			it.outDur = dur;
		}
	}

	since(from: number): Item[] {
		return this.items.slice(from);
	}
	/** 运行 fn，返回它加进来的所有条目（方便整体擦掉/淡出） */
	collect(fn: () => void): Item[] {
		const m = this.items.length;
		fn();
		return this.items.slice(m);
	}
	/** 在 fn 里加进来的条目（含 write/freehand 的落笔）默认都挂到变换组 g（道具整体移动用） */
	inGroup<T>(g: string, fn: () => T): T {
		const prev = this.curG;
		this.curG = g;
		try {
			return fn();
		} finally {
			this.curG = prev;
		}
	}
	/** 笔尖悬停：[t0, t1] 之间笔停在 pt 上方轻轻抖（不出声，不画）——「笔尖悬在横线上方」 */
	hover(pt: Pt, t0: number, t1: number, g?: string) {
		this.extraPen.push({t0, t1, tip: () => pt, g: g ?? this.curG, hover: true});
	}
	/** 登记一次额外落笔（verbs 用） */
	addPen(e: PenEvent) {
		this.extraPen.push({...e, g: e.g ?? this.curG});
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
				if (it.dur <= 0) continue;
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
