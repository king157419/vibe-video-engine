import type {CapChar, CapLine} from '../../lib/types';

/**
 * 字幕排版（纯计算、确定性）：
 * - 把一行字幕拆成「单元」：普通字 = 1 个单元；连续关键词 = 1 个不可拆的单元
 * - 用字宽估算（思源黑体 CJK 字形恒为 1em）决定字号 / 是否折成两行
 *   不直接用 measureText：字体尚未加载完时它会把回退字体的宽度缓存下来，
 *   而 CJK 字宽本来就是固定的 1em，估算反而更稳定。
 */

export type Glyph = {core: string; s: number; e: number; hl: boolean};

export type Unit = {
	glyphs: Glyph[];
	hl: boolean;
	/** 这个单元后面原本跟着空格（行内逗号/顿号） */
	space: boolean;
	em: number;
	/** 书名号内部，不宜在这里断行 */
	inBook: boolean;
};

export type LineLayout = {
	rows: Unit[][];
	/** 主字号（最大的那一行） */
	fontSize: number;
	/** 每一行各自的字号：两行长短悬殊时，短的首行作为「引子」缩小，避免像掉出来的碎片 */
	rowSizes: number[];
	letterSpacing: number; // em
	lineHeight: number; // 倍数
	height: number; // px
};

export const SPACE_EM = 0.42;
const LATIN = /^[A-Za-z0-9.%'+\-]+$/;

export const charEm = (ch: string): number => {
	let w = 0;
	for (const c of ch) {
		const code = c.codePointAt(0) ?? 0;
		if (c === ' ' || c === '　') w += 0.3;
		else if (code < 0x2000) {
			if (/[0-9]/.test(c)) w += 0.58;
			else if (/[A-Z]/.test(c)) w += 0.68;
			else if (/[a-z]/.test(c)) w += 0.56;
			else w += 0.36;
		} else w += 1;
	}
	return w;
};

export const textEm = (text: string, letterSpacing = 0): number => {
	let n = 0;
	for (const _ of text) n++;
	return charEm(text) + n * letterSpacing;
};

const splitChar = (c: CapChar): {core: string; space: boolean} => {
	const core = c.t.replace(/\s+$/u, '');
	return {core: core.length ? core : c.t, space: core.length < c.t.length};
};

export const toUnits = (line: CapLine): Unit[] => {
	const units: Unit[] = [];
	let depth = 0;
	let run: Unit | null = null;
	for (const c of line.chars) {
		const {core, space} = splitChar(c);
		const g: Glyph = {core, s: c.s, e: c.e, hl: c.hl};
		const inBook = depth > 0;
		if (core.includes('《')) depth++;
		if (core.includes('》')) depth = Math.max(0, depth - 1);
		if (c.hl) {
			if (!run) {
				run = {glyphs: [], hl: true, space: false, em: 0, inBook};
				units.push(run);
			}
			run.glyphs.push(g);
			run.em += charEm(core);
			if (space) {
				run.space = true;
				run = null;
			}
		} else {
			run = null;
			const prev = units[units.length - 1];
			const lastCore = prev?.glyphs[prev.glyphs.length - 1]?.core ?? '';
			if (prev && !prev.hl && !prev.space && LATIN.test(core) && LATIN.test(lastCore)) {
				// 连续的英文/数字（如 AI、2024）不拆开
				prev.glyphs.push(g);
				prev.em += charEm(core);
				prev.space = space;
				continue;
			}
			units.push({glyphs: [g], hl: false, space, em: charEm(core), inBook: inBook || depth > 0});
		}
	}
	return units;
};

const glyphCount = (units: Unit[]) => units.reduce((a, u) => a + u.glyphs.length, 0);

/** 一行单元的宽度（单位 em，含字间距；行尾空格不计） */
export const rowEm = (units: Unit[], ls: number): number => {
	let w = 0;
	units.forEach((u, i) => {
		w += u.em + u.glyphs.length * ls;
		if (u.space && i < units.length - 1) w += SPACE_EM;
	});
	return w;
};

export type LayoutOpts = {
	maxWidth: number;
	maxSize: number;
	minSize: number;
	/** 单行字号低于它时，若有自然断点就改用两行 */
	preferTwoBelow: number;
	letterSpacing: number;
	lineHeight: number;
};

const make = (rows: Unit[][], size: number, o: LayoutOpts, sizes?: number[]): LineLayout => {
	const rowSizes = sizes ?? rows.map(() => Math.floor(size));
	return {
		rows,
		fontSize: Math.max(...rowSizes),
		rowSizes,
		letterSpacing: o.letterSpacing,
		lineHeight: o.lineHeight,
		height: rowSizes.reduce((a, s) => a + s * o.lineHeight, 0),
	};
};

/** 引子行：首行明显比第二行短（宽度比 > 2.2、不超过 5 个字）时，首行缩到 0.74 倍 */
const KICKER_RATIO = 2.2;
const KICKER_MAX_GLYPHS = 5;
const KICKER_SCALE = 0.74;

const withKicker = (rows: Unit[][], size: number, o: LayoutOpts): LineLayout => {
	if (rows.length === 2) {
		const [a, b] = rows;
		const wa = rowEm(a, o.letterSpacing);
		const wb = rowEm(b, o.letterSpacing);
		if (wb / Math.max(0.01, wa) > KICKER_RATIO && glyphCount(a) <= KICKER_MAX_GLYPHS) {
			const main = Math.floor(size);
			return make(rows, size, o, [Math.floor(main * KICKER_SCALE), main]);
		}
	}
	return make(rows, size, o);
};

export const layoutLine = (line: CapLine, o: LayoutOpts): LineLayout => {
	const units = toUnits(line);
	const ls = o.letterSpacing;
	const fit = (rows: Unit[][]) => Math.min(o.maxSize, ...rows.map((r) => o.maxWidth / Math.max(0.01, rowEm(r, ls))));

	const one = fit([units]);
	if (one >= o.preferTwoBelow || units.length < 2) return make([units], one, o);

	// 选两行断点：尽量均衡，优先在原本的空格（逗号）处断，避开书名号内部和孤字
	const total = rowEm(units, ls);
	let best: {i: number; score: number} | null = null;
	for (let i = 0; i < units.length - 1; i++) {
		const a = units.slice(0, i + 1);
		const b = units.slice(i + 1);
		const wa = rowEm(a, ls);
		const wb = rowEm(b, ls);
		let score = Math.max(wa, wb) / total;
		if (!units[i].space) score += 0.22;
		if (units[i + 1].inBook && units[i].inBook) score += 0.6;
		if (glyphCount(a) < 3 || glyphCount(b) < 3) score += 0.5;
		if (!best || score < best.score) best = {i, score};
	}
	if (best) {
		const rows = [units.slice(0, best.i + 1), units.slice(best.i + 1)];
		const two = fit(rows);
		if (two >= o.minSize) {
			// 有自然断点（原句的逗号）就折两行；没有时，单行放得下就不硬拆
			if (units[best.i].space || one < o.minSize) return withKicker(rows, two, o);
			return make([units], one, o);
		}
	}
	if (one >= o.minSize) return make([units], one, o);

	// 兜底：按最小字号贪心折行（任意行数，不拆关键词）
	const size = o.minSize;
	const maxEm = o.maxWidth / size;
	const rows: Unit[][] = [];
	let cur: Unit[] = [];
	for (const u of units) {
		const next = [...cur, u];
		if (cur.length && rowEm(next, ls) > maxEm) {
			rows.push(cur);
			cur = [u];
		} else cur = next;
	}
	if (cur.length) rows.push(cur);
	return make(rows, Math.min(o.maxSize, fit(rows)), o);
};

/** 标题类短文本：按字宽算能放下的最大字号，超长时在标点/中点处折成两行 */
export const fitTitle = (
	text: string,
	maxWidth: number,
	maxSize: number,
	letterSpacing: number,
	maxOneLine = 8,
): {rows: string[]; fontSize: number} => {
	const clean = text.trim();
	const chars = Array.from(clean);
	let rows = [clean];
	if (chars.length > maxOneLine) {
		const punct = /[，,。！？!?、：:；; ]/u;
		let bestI = Math.ceil(chars.length / 2);
		let bestD = Infinity;
		chars.forEach((c, i) => {
			if (punct.test(c)) {
				const d = Math.abs(i + 1 - chars.length / 2);
				if (d < bestD && i > 1 && i < chars.length - 2) {
					bestD = d;
					bestI = i + 1;
				}
			}
		});
		rows = [chars.slice(0, bestI).join('').replace(/[，,、：:；; ]$/u, ''), chars.slice(bestI).join('').trim()];
	}
	const fontSize = Math.floor(Math.min(maxSize, ...rows.map((r) => maxWidth / Math.max(0.01, textEm(r, letterSpacing)))));
	return {rows, fontSize};
};
