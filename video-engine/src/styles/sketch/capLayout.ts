import {groupOf} from '../../lib/load';
import type {Captions} from '../../lib/types';
import type {Geo} from './rough';
import {R} from './rough';
import {CAP} from './theme';
import {wordInside} from './words';

// 字幕排版：每个句组只显示自己的行；一行最多 12 字、一屏最多 2 行，放不下就折行/分屏，
// 实在太长才缩字号（不低于 CAP.min）。宽度全部用 measureText 实测。

export type CTok = {
	core: string; // 可见文字（去掉尾部空白）
	gap: boolean; // 尾部带空白 = 口播停顿
	s: number;
	e: number;
	hl: boolean;
	run: number; // 关键词段编号，-1 = 普通字
	w: number; // 100px 字号下的宽度
};

export type ULine = {x: number; w: number; t0: number; t1: number; geo: Geo};
export type CRow = {toks: CTok[]; w100: number; lines: ULine[]; width: number};
export type CPage = {rows: CRow[]; size: number; start: number; group: number};

export type Measure100 = (text: string) => number;

const glyphs = (s: string) => Array.from(s).length;
const OPEN = /[《「『“‘（(【〈]$/;
const CLOSE = /^[》」』”’）)】〉，。、；：！？,.;:!?…]/;
const SOFT_END = /[，。、；：！？,.;:!?…》」』”’）)】]$/;

/** 没有任何 hl 标记时，用关键词文本匹配兜底 */
const keywordMask = (captions: Captions): boolean[][] => {
	const anyHl = captions.lines.some((l) => l.chars.some((c) => c.hl));
	if (anyHl || captions.keywords.length === 0) return captions.lines.map((l) => l.chars.map((c) => c.hl));
	const kws = [...captions.keywords].filter(Boolean).sort((a, b) => b.length - a.length);
	return captions.lines.map((l) => {
		const cores = l.chars.map((c) => c.t.replace(/\s+$/u, ''));
		const owner: number[] = [];
		cores.forEach((c, i) => Array.from(c).forEach(() => owner.push(i)));
		const str = cores.join('');
		const glyphArr = Array.from(str);
		const mask = l.chars.map(() => false);
		const claimed = glyphArr.map(() => false);
		for (const kw of kws) {
			const k = Array.from(kw);
			for (let i = 0; i + k.length <= glyphArr.length; i++) {
				if (k.every((ch, j) => glyphArr[i + j] === ch) && !claimed.slice(i, i + k.length).some(Boolean)) {
					for (let j = 0; j < k.length; j++) {
						claimed[i + j] = true;
						mask[owner[i + j]] = true;
					}
				}
			}
		}
		return mask;
	});
};

export const buildPages = (captions: Captions, measure: Measure100): CPage[] => {
	const groups = groupOf(captions);
	const mask = keywordMask(captions);
	let runId = 0;
	const lineToks: CTok[][] = captions.lines.map((line, li) => {
		const toks: CTok[] = [];
		line.chars.forEach((c, ci) => {
			const m = /^(.*?)(\s*)$/su.exec(c.t);
			const core = m ? m[1] : c.t;
			const gap = m ? m[2].length > 0 : false;
			if (!core) {
				if (toks.length) toks[toks.length - 1].gap = true;
				return;
			}
			toks.push({core, gap, s: c.s, e: c.e, hl: mask[li][ci], run: -1, w: measure(core)});
		});
		// 关键词段：连续 hl，遇到停顿断开
		toks.forEach((t, i) => {
			if (!t.hl) return;
			const prev = i > 0 ? toks[i - 1] : null;
			t.run = prev && prev.hl && !prev.gap ? prev.run : runId++;
		});
		return toks;
	});

	const w100 = (toks: CTok[]) =>
		toks.reduce((acc, t, i) => acc + t.w + (t.gap && i < toks.length - 1 ? CAP.gapEm * 100 : 0), 0);
	const count = (toks: CTok[]) => toks.reduce((a, t) => a + glyphs(t.core), 0);
	const fitSize = (toks: CTok[]) => Math.min(CAP.base, (CAP.width / Math.max(1, w100(toks))) * 100);
	const rowOk = (toks: CTok[]) => count(toks) <= CAP.maxChars;

	const split = (toks: CTok[]): CTok[][] => {
		const n = toks.length;
		if (n <= 1 || (rowOk(toks) && fitSize(toks) >= CAP.base * 0.97)) return [toks];
		const inBook: boolean[] = [];
		let depth = 0;
		toks.forEach((t) => {
			inBook.push(depth > 0);
			for (const ch of t.core) {
				if (ch === '《') depth++;
				if (ch === '》') depth = Math.max(0, depth - 1);
			}
		});
		// 分词：token p 前断行是否劈开一个词
		const joined = toks.map((t) => t.core).join('');
		const inside = wordInside(joined);
		const glyphAt: number[] = [];
		let gpos = 0;
		toks.forEach((t) => {
			glyphAt.push(gpos);
			gpos += glyphs(t.core);
		});
		const pen: (number | null)[] = [null];
		for (let p = 1; p < n; p++) {
			const a = toks[p - 1];
			const b = toks[p];
			if (a.run >= 0 && a.run === b.run) {
				pen.push(null);
				continue;
			}
			let c = a.gap || SOFT_END.test(a.core) ? 0 : 3;
			if (!a.gap && inside[glyphAt[p]]) c += 8;
			if (inBook[p]) c += 6;
			if (OPEN.test(a.core) || CLOSE.test(b.core)) c += 40;
			pen.push(c);
		}
		type Cand = {parts: CTok[][]; size: number; score: number; ok: boolean};
		const evalCuts = (cuts: number[]): Cand => {
			const b = [0, ...cuts, n];
			const parts: CTok[][] = [];
			for (let i = 0; i < b.length - 1; i++) parts.push(toks.slice(b[i], b[i + 1]));
			const size = Math.min(...parts.map(fitSize));
			const ws = parts.map(w100);
			let score = size - cuts.reduce((a, p) => a + (pen[p] ?? 999), 0);
			score -= ((Math.max(...ws) - Math.min(...ws)) / Math.max(...ws)) * 4;
			if (parts.some((pt) => count(pt) <= 2)) score -= 12;
			return {parts, size, score, ok: parts.every(rowOk)};
		};
		let fallback: Cand | null = null;
		for (let k = 2; k <= 4; k++) {
			let best: Cand | null = null;
			const choose = (from: number, left: number, acc: number[]) => {
				if (left === 0) {
					const r = evalCuts(acc);
					if (!r.ok) return;
					if (!best || r.score > best.score) best = r;
					return;
				}
				for (let p = from; p <= n - left; p++) {
					if (pen[p] === null) continue;
					choose(p + 1, left - 1, [...acc, p]);
				}
			};
			choose(1, k - 1, []);
			const b = best as Cand | null;
			if (b && b.size >= CAP.min) return b.parts;
			if (b && (!fallback || b.size > fallback.size)) fallback = b;
		}
		if (fallback) return fallback.parts;
		// 实在没有合法断点（例如一整段关键词）：按字数硬切
		const out: CTok[][] = [];
		let cur: CTok[] = [];
		toks.forEach((t) => {
			if (cur.length && count([...cur, t]) > CAP.maxChars) {
				out.push(cur);
				cur = [];
			}
			cur.push(t);
		});
		if (cur.length) out.push(cur);
		return out;
	};

	// 分屏：同一句组里整行尽量合在一屏（≤2 行），单行折成 >2 行时两行一屏
	const pages: CPage[] = [];
	let cur: CTok[][] = [];
	let curGroup = -1;
	const flush = () => {
		if (!cur.length) return;
		const size = Math.floor(Math.max(CAP.min, Math.min(...cur.map(fitSize))));
		const rows: CRow[] = cur.map((toks) => ({toks, w100: w100(toks), lines: [], width: (w100(toks) / 100) * size}));
		pages.push({rows, size, start: cur[0][0].s, group: curGroup});
		cur = [];
	};
	captions.lines.forEach((_line, li) => {
		const toks = lineToks[li];
		if (!toks.length) return;
		if (groups[li] !== curGroup) {
			flush();
			curGroup = groups[li];
		}
		const rows = split(toks);
		if (rows.length > 2) {
			flush();
			for (let i = 0; i < rows.length; i += 2) {
				cur = rows.slice(i, i + 2);
				flush();
			}
			return;
		}
		if (cur.length + rows.length > 2) flush();
		cur.push(...rows);
	});
	flush();

	pages.forEach((p, i) => {
		if (i > 0) p.start = Math.max(p.start, pages[i - 1].start + 1);
	});

	// 关键词下划线的几何（按该屏字号的实际像素）
	let seed = 1;
	pages.forEach((p) => {
		p.rows.forEach((row) => {
			let x = 0;
			const runs = new Map<number, {x: number; w: number; t0: number; t1: number}>();
			row.toks.forEach((t, i) => {
				const w = (t.w / 100) * p.size;
				if (t.run >= 0) {
					const r = runs.get(t.run);
					if (r) {
						r.w = x + w - r.x;
						r.t1 = t.e;
					} else runs.set(t.run, {x, w, t0: t.s, t1: t.e});
				}
				x += w + (t.gap && i < row.toks.length - 1 ? CAP.gapEm * p.size : 0);
			});
			row.lines = [...runs.values()].map((r) => {
				const s = seed++;
				const w = r.w + 12;
				return {
					x: r.x - 6,
					w,
					t0: r.t0 - 40,
					t1: Math.max(r.t0 + 260, Math.min(r.t1, r.t0 + 700)),
					geo: R.curve(
						[
							[0, 4],
							[w * 0.5, 7 + (s % 3) - 1],
							[w, 3 + (s % 2) * 2],
						],
						{seed: 900 + s, roughness: 1.3, bowing: 1.2, strokeWidth: 7},
					),
				};
			});
		});
	});
	return pages;
};

/** ms 时刻应显示的屏（-1 = 还没开始） */
export const pageAt = (pages: CPage[], ms: number, lead = 80): number => {
	let idx = -1;
	for (let i = 0; i < pages.length; i++) {
		if (pages[i].start - lead <= ms) idx = i;
		else break;
	}
	return idx;
};
