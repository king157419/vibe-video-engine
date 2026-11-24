import {measureText} from '@remotion/layout-utils';
import type {CapLine} from '../../lib/types';

/** 字幕中的一个可渲染单元（对应 captions.chars 的一项，空格折算成 gapAfter） */
export type Cell = {t: string; ci: number; hl: boolean; gapAfter: boolean};
export type LineLayout = {rows: Cell[][]; fontSize: number};

export type FontSpec = {family: string; weight: number; letterSpacingEm: number};

/** 词间停顿（原文里的空格）渲染成的空隙宽度，单位 em */
export const GAP_EM = 0.42;

const OPENERS = '《「『（(“‘【〈';
const CLOSERS = '》」』）)”’】〉';
const NO_LINE_START = CLOSERS + '，。、！？；：,.!?;:…—%';
const SOFT_END = '，。、！？；：,.!?;:…';
// 助词/语气词放在行首很别扭（「的《养育……」），尽量别让它们起行
const WEAK_START = '的了着过吗呢吧啊呀地得们么嘛';
// 代词起行会拆开动宾（「我想陪 / 你把……」），除非恰好在原文停顿处
const PRONOUN_START = ['自己', '你', '我', '他', '她', '它'];
// 介词/能愿动词/量词/指示词留在行尾会把短语拆开（「小时候没被 / 好好…」「我想 / 陪你…」「那个 / 小孩」）
const WEAK_END = '把被让给对跟和与从向往想要会能将个这那';

const isWide = (ch: string) => /[⺀-鿿豈-﫿＀-￯　-〿《》「」『』（）“”‘’【】〈〉…—]/.test(ch);

/** 不依赖字体的宽度估算（em），用于断行打分与字体未就绪时的回退 */
export const estimateEm = (s: string, letterSpacingEm: number): number => {
	let w = 0;
	for (const ch of s) {
		if (/\s/.test(ch)) w += 0.3;
		else w += (isWide(ch) ? 1 : 0.58) + letterSpacingEm;
	}
	return w;
};

/** 单行文字在 100px 下的宽度（像素）。字体未就绪时不调用 measureText（避免污染其缓存） */
export const width100 = (text: string, font: FontSpec, fontsReady: boolean): number => {
	if (!text) return 0;
	if (!fontsReady) return estimateEm(text, font.letterSpacingEm) * 100;
	return measureText({
		text,
		fontFamily: font.family,
		fontSize: 100,
		fontWeight: font.weight,
		letterSpacing: `${font.letterSpacingEm}em`,
	}).width;
};

export const toCells = (line: CapLine): Cell[] => {
	const cells: Cell[] = [];
	line.chars.forEach((c, ci) => {
		const raw = c.t ?? '';
		const t = raw.replace(/\s+/g, '');
		if (/^\s/.test(raw) && cells.length) cells[cells.length - 1].gapAfter = true;
		if (!t) {
			if (cells.length) cells[cells.length - 1].gapAfter = true;
			return;
		}
		cells.push({t, ci, hl: !!c.hl, gapAfter: /\s$/.test(raw)});
	});
	if (cells.length) cells[cells.length - 1].gapAfter = false;
	return cells;
};

const rowText = (row: Cell[]) => row.map((c) => c.t).join('');
const rowGaps = (row: Cell[]) => row.slice(0, -1).filter((c) => c.gapAfter).length;

/** 该行在 maxW 内能用的最大字号 */
export const fitRow = (row: Cell[], maxW: number, font: FontSpec, fontsReady: boolean): number => {
	const per1px = width100(rowText(row), font, fontsReady) / 100 + rowGaps(row) * GAP_EM;
	return per1px > 0 ? maxW / per1px : 999;
};

const segmenter: {segment: (s: string) => Iterable<{index: number}>} | null = (() => {
	try {
		const I = Intl as unknown as {Segmenter?: new (l: string, o: {granularity: string}) => {segment: (s: string) => Iterable<{index: number}>}};
		return I.Segmenter ? new I.Segmenter('zh-CN', {granularity: 'word'}) : null;
	} catch {
		return null;
	}
})();

type BreakInfo = {allowed: boolean; penalty: number};

/** breaks[k] 描述「在第 k 个单元之后断行」的可行性与代价 */
const analyzeBreaks = (cells: Cell[]): BreakInfo[] => {
	const joined = rowText(cells);
	const wordBounds = new Set<number>();
	if (segmenter) {
		for (const s of segmenter.segment(joined)) wordBounds.add(s.index);
	}
	const out: BreakInfo[] = [];
	let offset = 0;
	let depth = 0; // 书名号/引号嵌套深度
	for (let k = 0; k < cells.length - 1; k++) {
		const a = cells[k];
		const b = cells[k + 1];
		offset += a.t.length;
		for (const ch of a.t) {
			if (OPENERS.includes(ch)) depth++;
			if (CLOSERS.includes(ch)) depth = Math.max(0, depth - 1);
		}
		const lastA = a.t[a.t.length - 1];
		let allowed = true;
		if (depth > 0) allowed = false; // 不拆《书名》
		if (NO_LINE_START.includes(b.t[0])) allowed = false; // 标点不放行首
		if (OPENERS.includes(lastA)) allowed = false; // 开引号不留行尾
		if (a.hl && b.hl && !a.gapAfter) allowed = false; // 不拆关键词
		let penalty = 0;
		const atPause = a.gapAfter || SOFT_END.includes(lastA);
		if (a.gapAfter) penalty -= 2.2; // 原文的停顿处最适合断
		else if (SOFT_END.includes(lastA)) penalty -= 1.0;
		else if (segmenter && !wordBounds.has(offset)) penalty += 2.2; // 词中间断，代价大
		if (WEAK_START.includes(b.t[0])) penalty += 1.6;
		if (!atPause && PRONOUN_START.some((p) => joined.startsWith(p, offset))) penalty += 1.8;
		if (!atPause && WEAK_END.includes(lastA)) penalty += 1.2;
		// 指示词 + 数词/量词是一个整体：「这|五种」「那|个」
		if (!atPause && '这那哪每'.includes(lastA) && '一二两三四五六七八九十几百千万个种些样位件次'.includes(b.t[0])) penalty += 3;
		if (!atPause) {
			// 叠词是一个整体，也不和后面的动词分开：「好好|满足」「慢慢|来」「一遍一遍|地」
			const t = (j: number) => cells[j]?.t;
			if (a.t === b.t) penalty += 3; // A|A
			if (k >= 1 && t(k - 1) === a.t) penalty += 3; // AA|B
			if (k >= 1 && t(k - 1) === b.t && t(k + 2) === a.t) penalty += 3; // AB|AB
			if (k >= 3 && t(k - 3) === t(k - 1) && t(k - 2) === a.t) penalty += 3; // ABAB|C
		}
		out.push({allowed, penalty});
	}
	return out;
};

const rowEm = (row: Cell[], ls: number) => estimateEm(rowText(row), ls) + rowGaps(row) * GAP_EM;

/**
 * 在 nRows 行内找最均衡、最自然的断法。
 * measure: 一行在 1px 字号下的宽度（em）；给了 maxEm 时，超宽的断法会被重罚（固定字号排版用）。
 */
const splitRows = (
	cells: Cell[],
	nRows: 2 | 3,
	ls: number,
	measure: (row: Cell[]) => number = (r) => rowEm(r, ls),
	maxEm = Infinity,
): Cell[][] | null => {
	const br = analyzeBreaks(cells);
	const n = cells.length;
	let best: {cost: number; rows: Cell[][]} | null = null;
	const consider = (cuts: number[], strict: boolean) => {
		const rows: Cell[][] = [];
		let prev = 0;
		let pen = 0;
		for (const k of cuts) {
			if (strict && !br[k].allowed) return;
			pen += br[k].penalty + (br[k].allowed ? 0 : 6);
			rows.push(cells.slice(prev, k + 1));
			prev = k + 1;
		}
		rows.push(cells.slice(prev));
		const widths = rows.map(measure);
		for (const w of widths) if (w > maxEm) pen += 20 + 10 * (w - maxEm);
		const shortest = Math.min(...rows.map((r) => r.length));
		const mean = widths.reduce((s, w) => s + w, 0) / widths.length;
		const spread = widths.reduce((s, w) => s + (w - mean) * (w - mean), 0) / widths.length;
		// 只有 1–2 个字的孤行（「里说」「了」）很难看：重罚
		const cost = Math.max(...widths) + pen + (shortest <= 2 ? 8 : 0) + 0.03 * spread;
		if (!best || cost < best.cost) best = {cost, rows};
	};
	for (const strict of [true, false]) {
		if (nRows === 2) {
			for (let k = 0; k < n - 1; k++) consider([k], strict);
		} else {
			for (let k1 = 0; k1 < n - 2; k1++) for (let k2 = k1 + 1; k2 < n - 1; k2++) consider([k1, k2], strict);
		}
		if (best) break;
	}
	return best ? (best as {rows: Cell[][]}).rows : null;
};

/** 一行在 1px 字号下的实际宽度（字体就绪后用 measureText，含停顿空隙） */
const rowWidth1 = (row: Cell[], font: FontSpec, fontsReady: boolean) =>
	width100(rowText(row), font, fontsReady) / 100 + rowGaps(row) * GAP_EM;

/**
 * 字幕排版（「一行字幕」优先）：
 * 1) 单行，字号 size；放不下时单行缩到 ≥ minSize 也行（「小时候没被好好满足的需要」≈61px 单行）；
 * 2) 否则按词/停顿拆 2 行，字号 size，必要时缩到 ≥ minSize（「丛非从在 / 《养育你内心的小孩》里说」）；
 * 3) 再不行才 3 行；3 行仍放不下时取字号最大的方案（最后手段）。
 * 绝不拆关键词或《书名》，叠词不和后面的动词分开，避免 1–2 字孤行。
 */
export const layoutCaptionFixed = (
	line: CapLine,
	font: FontSpec,
	size: number,
	maxW: number,
	fontsReady: boolean,
	minSize = 60,
): LineLayout => {
	const cells = toCells(line);
	if (!cells.length) return {rows: [], fontSize: size};
	const measure = (r: Cell[]) => rowWidth1(r, font, fontsReady);
	const sizeOf = (rows: Cell[][]) => Math.min(size, ...rows.map((r) => maxW / Math.max(1e-6, measure(r))));
	const ok = (rows: Cell[][] | null): rows is Cell[][] => !!rows && sizeOf(rows) >= minSize - 1e-6;
	const one = [cells];
	if (ok(one) || cells.length < 2) return {rows: one, fontSize: sizeOf(one)};
	const ls = font.letterSpacingEm;
	// 先找能用满字号的两行；没有的话找「缩到 minSize 也放得下」的最均衡两行
	const two = cells.length >= 4 ? splitRows(cells, 2, ls, measure, maxW / size + 1e-6) : null;
	if (two && sizeOf(two) >= size - 1e-6) return {rows: two, fontSize: size};
	const twoMin = cells.length >= 4 ? splitRows(cells, 2, ls, measure, maxW / minSize + 1e-6) : null;
	// 满字号放不下时，取「断在哪里最自然」的那个（代价已含宽度），而不是一味求大字号
	const twoBest = ok(twoMin) ? twoMin : ok(two) ? two : null;
	if (twoBest) return {rows: twoBest, fontSize: sizeOf(twoBest)};
	const three = cells.length >= 6 ? splitRows(cells, 3, ls, measure, maxW / minSize + 1e-6) : null;
	if (ok(three)) return {rows: three, fontSize: sizeOf(three)};
	// 最后手段：取能给出更大字号的方案
	const options = [three, twoMin, two, one].filter((r): r is Cell[][] => !!r);
	let best = options[0];
	for (const o of options) if (sizeOf(o) > sizeOf(best) + 0.5) best = o;
	return {rows: best, fontSize: sizeOf(best)};
};

export type CaptionFit = {maxW: number; maxSingle: number; maxMulti: number; singleMin: number; minSize: number};

/**
 * 一行字幕的排版：能单行放下且字号 ≥ singleMin 就单行；
 * 否则按词/停顿拆成 2 行（必要时 3 行），保证字号 ≥ minSize，绝不拆关键词或书名。
 */
export const layoutCaptionLine = (line: CapLine, font: FontSpec, fit: CaptionFit, fontsReady: boolean): LineLayout => {
	const cells = toCells(line);
	if (!cells.length) return {rows: [], fontSize: fit.maxSingle};
	const size = (rows: Cell[][], cap: number) =>
		Math.min(cap, ...rows.map((r) => fitRow(r, fit.maxW, font, fontsReady)));
	const one = size([cells], fit.maxSingle);
	if (one >= fit.singleMin || cells.length < 4) return {rows: [cells], fontSize: one};
	const two = splitRows(cells, 2, font.letterSpacingEm);
	const twoSize = two ? size(two, fit.maxMulti) : 0;
	if (two && (twoSize >= fit.minSize || cells.length < 7)) return {rows: two, fontSize: Math.max(one, twoSize)};
	const three = splitRows(cells, 3, font.letterSpacingEm);
	const threeSize = three ? size(three, fit.maxMulti) : 0;
	if (three && threeSize > twoSize) return {rows: three, fontSize: threeSize};
	if (two) return {rows: two, fontSize: twoSize};
	return {rows: [cells], fontSize: one};
};

/** 标题类文字（封面/结尾）：单行或拆成两行，取字号更大的方案 */
export const layoutTitle = (
	text: string,
	font: FontSpec,
	maxW: number,
	maxSize: number,
	twoRowBelow: number,
	fontsReady: boolean,
): {rows: string[]; fontSize: number} => {
	const clean = text.trim();
	const fitOne = (s: string) => {
		const w = width100(s, font, fontsReady) / 100;
		return w > 0 ? Math.min(maxSize, maxW / w) : maxSize;
	};
	const one = fitOne(clean);
	const chars = Array.from(clean);
	if (one >= twoRowBelow || chars.length < 4) return {rows: [clean], fontSize: one};
	// 复用字幕断行逻辑：把字符串当作一行字幕
	const fake: CapLine = {
		i: 0,
		text: clean,
		startMs: 0,
		endMs: 0,
		sentenceEnd: true,
		chars: chars.map((t) => ({t, s: 0, e: 0, hl: false})),
	};
	const cells = toCells(fake);
	const two = splitRows(cells, 2, font.letterSpacingEm);
	if (!two) return {rows: [clean], fontSize: one};
	const rows = two.map((r) => r.map((c) => c.t + (c.gapAfter ? ' ' : '')).join('').trim());
	const twoSize = Math.min(maxSize, ...rows.map(fitOne));
	return twoSize > one * 1.08 ? {rows, fontSize: twoSize} : {rows: [clean], fontSize: one};
};
