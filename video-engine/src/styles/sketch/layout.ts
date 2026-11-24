// 标题/片尾等短文本的排版（测宽全部以 100px 字号为基准，线性缩放）
import {wordInside} from './words';

export type Measure100 = (text: string) => number;

const glyphs = (s: string) => Array.from(s).length;
const TRAIL = /[，,、；;：:\s]+$/u;
const LEAD_BAD = /^[，。、；：！？》」』”’）)】…]/u;
const NATURAL = /[\s，。、；：！？,.!?…]$/u;

/** 折成最多 maxLines 行，尽量均衡、优先断在标点/空格；返回行与字号 */
export const wrapFit = (
	text: string,
	measure: Measure100,
	o: {maxW: number; maxSize: number; minSize: number; maxLines: number; maxChars?: number},
): {lines: string[]; size: number} => {
	const clean = text.replace(/\s+/g, ' ').trim();
	if (!clean) return {lines: [], size: o.maxSize};
	const cs = Array.from(clean);
	const inside = wordInside(clean);
	const sizeFor = (ls: string[]) => Math.min(o.maxSize, (o.maxW / Math.max(1, ...ls.map(measure))) * 100);
	const okChars = (ls: string[]) => !o.maxChars || ls.every((l) => glyphs(l) <= o.maxChars!);

	const single = [clean];
	if ((okChars(single) && sizeFor(single) >= o.maxSize * 0.98) || o.maxLines <= 1 || cs.length < 4) {
		return {lines: single, size: Math.floor(Math.max(o.minSize, sizeFor(single)))};
	}
	type Cand = {lines: string[]; score: number; size: number};
	let best: Cand | null = null;
	const tryCuts = (cuts: number[]) => {
		const b = [0, ...cuts, cs.length];
		const raw: string[] = [];
		for (let i = 0; i < b.length - 1; i++) raw.push(cs.slice(b[i], b[i + 1]).join(''));
		if (raw.some((l, i) => i > 0 && LEAD_BAD.test(l))) return;
		const ls = raw.map((l) => l.replace(TRAIL, '').trim());
		if (ls.some((l) => !l)) return;
		const size = sizeFor(ls);
		const ws = ls.map(measure);
		let score = size;
		score -= ((Math.max(...ws) - Math.min(...ws)) / Math.max(...ws)) * 30;
		raw.slice(0, -1).forEach((l) => {
			if (!NATURAL.test(l)) score -= 10;
		});
		// 别把一个词劈成两半（“忍 / 不住”）
		cuts.forEach((c) => {
			if (inside[c]) score -= 24;
		});
		if (!okChars(ls)) score -= 200;
		if (!best || score > best.score) best = {lines: ls, score, size};
	};
	for (let k = 2; k <= o.maxLines; k++) {
		const rec = (from: number, left: number, acc: number[]) => {
			if (left === 0) return tryCuts(acc);
			for (let p = from; p <= cs.length - left; p++) rec(p + 1, left - 1, [...acc, p]);
		};
		rec(1, k - 1, []);
		const b = best as Cand | null;
		if (b && b.size >= o.minSize && okChars(b.lines)) break;
	}
	const b = best as Cand | null;
	if (!b) return {lines: single, size: Math.floor(Math.max(o.minSize, sizeFor(single)))};
	return {lines: b.lines, size: Math.floor(Math.max(o.minSize, b.size))};
};
