import {measureText} from '@remotion/layout-utils';
import {SANS, SERIF} from '../../lib/fonts';
import {groupOf, TAIL_MS} from '../../lib/load';
import type {Captions, EpisodeMeta} from '../../lib/types';
import type {TokPunct} from './punct';
import {BOOK, C, G, INNER_W, NEED_COLORS, NEEDS, SAFE_R, SAFE_X, SYNC_MS} from './theme';

// ---------------------------------------------------------------- 测量

// 字体未就绪时的估算：思源黑体的中日韩字形恒为 1em
const estimate = (text: string): number => {
	let w = 0;
	for (const ch of text) {
		const c = ch.codePointAt(0) ?? 0;
		if (c >= 0x2e80 || (c >= 0xff00 && c <= 0xffef)) w += 1;
		else if (ch === ' ') w += 0.26;
		else if (/[0-9]/.test(ch)) w += 0.57;
		else if (/[A-Z]/.test(ch)) w += 0.66;
		else w += 0.52;
	}
	return w;
};

export const textW = (text: string, size: number, weight: number, ready: boolean, family = SANS): number => {
	if (!text) return 0;
	if (!ready) return estimate(text) * size;
	return measureText({text, fontFamily: family, fontSize: size, fontWeight: weight}).width;
};

/** 在给定宽度内能放下的字号（fitText 同理，但带未就绪回退） */
export const fitSize = (text: string, width: number, weight: number, ready: boolean, family = SANS): number => {
	const w = textW(text, 100, weight, ready, family);
	return w > 0 ? (width / w) * 100 : 999;
};

// ---------------------------------------------------------------- 类型

export type Kw = {
	text: string;
	color: string;
	need: number; // 0..4 五种需要，-1 其他关键词
	line: number;
	a: number;
	b: number;
	startMs: number;
	endMs: number;
};

export type Seg =
	| {kind: 'txt'; idx: number[]}
	| {kind: 'kw'; kw: Kw; idx: number[]; x100: number; w100: number}
	| {kind: 'gap'}
	/** 从稿子对齐回来的行内标点，跟随 at 这个字一起点亮 */
	| {kind: 'p'; text: string; at: number};

export type Row = {
	line: number;
	from: number;
	to: number;
	segs: Seg[];
	w100: number;
	appearMs: number;
	top: number;
	/** 合并卡里属于第几句（后一句开始时前一句变淡） */
	sub: number;
};

export type Tile = {need: number; x: number; y: number; w: number; h: number; startMs: number | null};

export type CardDef = {
	n: number;
	kind: 'text' | 'needs';
	top: number;
	h: number;
	lines: number[];
	rows: Row[];
	fs: number;
	tiles: Tile[];
	/** 合并卡：每句的开始时间（已含 SYNC） */
	subStarts: number[];
	startMs: number;
	endMs: number;
	inMs: number;
	outMs: number;
};

export type Chip = {text: string; color: string; need: number; x: number; y: number; w: number};

export type DeckItem = {kind: 'cover' | 'card' | 'end'; card: number; inMs: number; top: number; h: number};

export type Flight = {need: number; spawnMs: number; x0: number; y0: number};

export type Layout = {
	cards: CardDef[];
	deck: DeckItem[];
	hasTracker: boolean;
	/** chip 飞到追踪条、槽位点亮的时刻 */
	needArrive: (number | null)[];
	/** 之后再次说到该需要时，槽位轻跳一下 */
	needBumps: number[][];
	flights: Flight[];
	coverOutMs: number;
	endInMs: number;
	regionTop: number;
	end: {
		top: number;
		h: number;
		chipsTop: number;
		labelTop: number;
		seriesTop: number;
		seriesFs: number;
		ctaTop: number;
		series: string;
		hasSeries: boolean;
	};
	endChips: {chips: Chip[]; h: number; fs: number; chipH: number; padX: number; dot: number};
	cover: {
		lines: string[];
		fs: number;
		widths: number[];
		sub: string;
		/** 金句，已按标点折好行 */
		quote: string[];
	};
	pill: {ep: string; rest: string; fs: number};
	series: string;
	book: {title: string; author: string} | null;
	/** 每个字幕字的显示文本（含从稿子对齐回来的引号等） */
	disp: string[][];
};

const PUNCT_HEAD = /^[，。！？、；：,.!?;:）》」』”’]/;
const OPENERS = '《「『“（【〈';
const CLOSERS = '》」』”）】〉';
const STRONG_END = /[。！？!?…]/;

export const colorOf = (text: string): {color: string; need: number} => {
	const need = NEEDS.indexOf(text);
	return need >= 0 ? {color: NEED_COLORS[need], need} : {color: C.coral, need: -1};
};

// ---------------------------------------------------------------- 构建

export const buildLayout = (
	captions: Captions,
	meta: EpisodeMeta | null,
	ready: boolean,
	punct: TokPunct[][] | null,
	fps: number,
): Layout => {
	const {lines} = captions;
	const hlAvailable = lines.some((l) => l.chars.some((c) => c.hl));
	const keywords = [...new Set((captions.keywords ?? []).map((k) => k.trim()).filter(Boolean))].sort(
		(a, b) => b.length - a.length,
	);

	// ---- 关键词出现位置（以 hl 标记为准；没有任何 hl 时退化为文本匹配）
	const charKw: (Kw | null)[][] = lines.map((l) => l.chars.map(() => null));
	const allKws: Kw[] = [];
	lines.forEach((line, li) => {
		const txt = line.chars.map((c) => c.t.trim());
		let s = '';
		const offs: number[] = []; // 字符串偏移 -> char 下标
		txt.forEach((t, ci) => {
			for (let k = 0; k < t.length; k++) offs.push(ci);
			s += t;
		});
		const mark = (a: number, b: number, text: string) => {
			const {color, need} = colorOf(text);
			const kw: Kw = {text, color, need, line: li, a, b, startMs: line.chars[a].s, endMs: line.chars[b].e};
			for (let i = a; i <= b; i++) charKw[li][i] = kw;
			allKws.push(kw);
		};
		for (const k of keywords) {
			let from = 0;
			for (;;) {
				const at = s.indexOf(k, from);
				if (at < 0) break;
				from = at + k.length;
				const a = offs[at];
				const b = offs[at + k.length - 1];
				let ok = true;
				for (let i = a; i <= b; i++) {
					if (charKw[li][i] || (hlAvailable && !line.chars[i].hl)) ok = false;
				}
				if (ok) mark(a, b, k);
			}
		}
		// 未被关键词表覆盖的 hl 片段：按停顿切成临时关键词
		if (hlAvailable) {
			let i = 0;
			while (i < line.chars.length) {
				if (line.chars[i].hl && !charKw[li][i] && txt[i]) {
					let j = i;
					while (
						j + 1 < line.chars.length &&
						line.chars[j + 1].hl &&
						!charKw[li][j + 1] &&
						!/\s$/.test(line.chars[j].t)
					)
						j++;
					mark(i, j, txt.slice(i, j + 1).join(''));
					i = j + 1;
				} else i++;
			}
		}
	});
	allKws.sort((x, y) => x.startMs - y.startMs);

	const hasTracker = allKws.some((w) => w.need >= 0);
	const regionTop = hasTracker ? G.cardTopWithTracker : G.cardTopNoTracker;
	const maxH = G.cardBottom - regionTop;
	const centerY = regionTop + maxH * 0.5;

	// ---- 每个字幕字的显示文本 + 其后的分隔（稿子里的标点 / 停顿间距）
	type LineTok = {disp: string[]; sep: (string | null)[]; spAfter: boolean[]; endPunct: string};
	const tok: LineTok[] = lines.map((line, li) => {
		const n = line.chars.length;
		const P = punct?.[li];
		const spAfter = line.chars.map((c, i) => /\s$/.test(c.t) || (i + 1 < n && /^\s/.test(line.chars[i + 1].t)));
		const disp: string[] = [];
		const sep: (string | null)[] = [];
		for (let i = 0; i < n; i++) {
			const core = line.chars[i].t.trim();
			const pre = P?.[i]?.pre ?? '';
			const post = P?.[i]?.post ?? '';
			const last = i === n - 1;
			if (!core) {
				disp.push('');
				sep.push(null);
				continue;
			}
			if (spAfter[i] && !last) {
				disp.push(pre + core);
				sep.push(post || ''); // '' = 没有稿子标点，画成间距
			} else {
				// 行尾：去掉稿子的收尾标点（？！已在字幕里）
				disp.push(pre + core + (last ? post.replace(/[，。、；：…—,.;:]+$/g, '') : post));
				sep.push(null);
			}
		}
		const lastP = P?.[n - 1]?.post ?? '';
		const lastCore = line.chars[n - 1]?.t.trim() ?? '';
		return {disp, sep, spAfter, endPunct: lastP || (/[？！?!]$/.test(lastCore) ? lastCore.slice(-1) : '')};
	});

	// ---- 把一行字幕切成 1..n 个显示行（只在停顿/非关键词/书名号外断）
	const rowsOfLine = (li: number, sub: number, pauseBonus = 45): Row[] => {
		const line = lines[li];
		const n = line.chars.length;
		const {disp, sep, spAfter} = tok[li];
		const kwAt = charKw[li];
		const cw = disp.map((s) => (s ? textW(s, 100, 800, ready) : 0));
		const sw = sep.map((s) => (s === null ? 0 : s ? textW(s, 100, 800, ready) : G.gapEm * 100));
		// 书名号/引号深度：括号内部不许断
		const depth: number[] = [];
		let d = 0;
		for (let i = 0; i < n; i++) {
			for (const ch of disp[i]) {
				if (OPENERS.includes(ch)) d++;
				else if (CLOSERS.includes(ch)) d = Math.max(0, d - 1);
			}
			depth.push(d);
		}
		const pre = [0];
		for (let i = 0; i < n; i++) pre.push(pre[i] + cw[i] + sw[i]);
		const approxW = (a: number, b: number) => pre[b + 1] - pre[a] - sw[b]; // 行尾分隔不占宽
		const maxW100 = (INNER_W / G.splitBelow) * 100; // 62px 时一行能放的宽度
		const tW100 = (INNER_W / G.maxFs) * 100; // 96px 时一行能放的宽度
		const isBreak = (j: number) => j === 0 || j === n || spAfter[j - 1];
		// 折行 DP。代价：放不下 62px (+5000) > 在停顿处断（奖励）/ 非停顿（+100，虚词边界略减）
		//   > 行数（每行 +30）> 比 96px 宽的行（按超出比例）> 1~2 字孤行 > 行宽均匀
		const dp: number[] = new Array(n + 1).fill(Infinity);
		const from: number[] = new Array(n + 1).fill(-1);
		dp[0] = 0;
		for (let j = 1; j <= n; j++) {
			if (j < n) {
				if (kwAt[j] && kwAt[j - 1] === kwAt[j]) continue; // 不拆关键词
				if (PUNCT_HEAD.test(disp[j])) continue; // 标点不放行首
				if (depth[j - 1] > 0) continue; // 不拆《书名》
			}
			const opens = j < n && OPENERS.includes(disp[j].charAt(0));
			const soft =
				j < n
					? (/[的了着过地得吗呢吧啊为]$/.test(disp[j - 1]) ? 18 : 0) +
						(/^[就都也才还又会在是把被让给和跟而但却所可]/.test(disp[j]) &&
						!/[就都也才还又会在是把被让给和跟而但却所可不没别]$/.test(disp[j - 1])
							? 12
							: 0)
					: 0;
			const brk = j === n ? 0 : spAfter[j - 1] ? -pauseBonus : 100 - soft - (opens ? 40 : 0);
			for (let i = j - 1; i >= 0; i--) {
				if (dp[i] === Infinity) continue;
				const w = approxW(i, j - 1);
				const slack = Math.max(0, maxW100 - w) / maxW100;
				const phrase = isBreak(i) && isBreak(j); // 停顿围起来的短语（如「其实」）不算孤行
				const cost =
					dp[i] +
					30 +
					brk +
					(w > maxW100 ? 5000 : 0) +
					(w > tW100 ? (80 * (w - tW100)) / tW100 : 0) +
					(j - i <= 2 && n > 3 && !phrase ? 60 : 0) +
					slack * slack * 8;
				if (cost < dp[j]) {
					dp[j] = cost;
					from[j] = i;
				}
			}
		}
		const ranges: [number, number][] = [];
		for (let j = n; j > 0 && from[j] >= 0; j = from[j]) ranges.unshift([from[j], j - 1]);
		if (!ranges.length) ranges.push([0, n - 1]);
		if (ranges.length > 3 && pauseBonus > 0) return rowsOfLine(li, sub, 0);
		return ranges.map(([a, b]) => {
			const segs: Seg[] = [];
			let x = 0;
			for (let i = a; i <= b; i++) {
				if (!disp[i]) continue;
				const kw = kwAt[i];
				const last = segs[segs.length - 1];
				if (kw) {
					if (last && last.kind === 'kw' && last.kw === kw) {
						last.idx.push(i);
						last.w100 += cw[i];
					} else segs.push({kind: 'kw', kw, idx: [i], x100: x, w100: cw[i]});
				} else if (last && last.kind === 'txt') last.idx.push(i);
				else segs.push({kind: 'txt', idx: [i]});
				x += cw[i];
				if (i < b && sep[i] !== null) {
					segs.push(sep[i] ? {kind: 'p', text: sep[i] as string, at: i} : {kind: 'gap'});
					x += sw[i];
				}
			}
			return {line: li, from: a, to: b, segs, w100: x, appearMs: 0, top: 0, sub};
		});
	};

	// ---- 「五种需要」清单行：≥3 个需要、其余字 ≤3 个（如「安全感 自由 价值感 意义 和亲密」）
	const needsLine = (li: number): boolean => {
		const kws = new Set<number>();
		let other = 0;
		lines[li].chars.forEach((c, i) => {
			const kw = charKw[li][i];
			if (kw && kw.need >= 0) kws.add(kw.need);
			else if (c.t.trim()) other += [...c.t.trim()].length;
		});
		return kws.size >= 3 && other <= 3;
	};

	const bodyTop = G.padTop + G.headerH + G.headerGap;

	// ---- 组 -> 卡片
	type Draft = Omit<CardDef, 'n' | 'inMs' | 'outMs'>;
	const makeNeeds = (li: number): Draft => {
		const gap = G.tileGap;
		const w = (INNER_W - 2 * gap) / 3;
		const gridH = 2 * G.tileH + gap;
		const h = Math.max(G.minH, bodyTop + gridH + 2 * G.bodyPad + G.padBottom);
		const top = Math.round(centerY - h / 2);
		const y0 = bodyTop + Math.round((h - bodyTop - G.padBottom - gridH) / 2);
		const tiles: Tile[] = NEEDS.map((_, k) => {
			const hit = allKws.find((kw) => kw.line === li && kw.need === k);
			return {
				need: k,
				x: (k % 3) * (w + gap),
				y: y0 + Math.floor(k / 3) * (G.tileH + gap),
				w,
				h: G.tileH,
				startMs: hit ? hit.startMs : null,
			};
		});
		return {
			kind: 'needs',
			top,
			h,
			lines: [li],
			rows: [],
			fs: 0,
			tiles,
			subStarts: [lines[li].startMs + SYNC_MS],
			startMs: lines[li].startMs,
			endMs: lines[li].endMs,
		};
	};

	const lineCountOfRows = (rows: Row[]) => {
		let c = 0;
		let prev = -1;
		for (const r of rows) {
			if (r.line !== prev) c++;
			prev = r.line;
		}
		return c;
	};

	/** subs：每句（合并前的组）的行号 */
	const make = (subs: number[][], force: boolean, isFinal: boolean): Draft | null => {
		const lis = subs.flat();
		const cardH = maxH;
		const rows = subs.flatMap((ls, s) => ls.flatMap((li) => rowsOfLine(li, s)));
		const hasKw = rows.some((r) => r.segs.some((sg) => sg.kind === 'kw'));
		const widest = Math.max(...rows.map((r) => r.w100));
		const cap = widest <= 840 || hasKw || isFinal ? G.maxFsBig : G.maxFs;
		const maxBodyH = cardH - bodyTop - G.padBottom - G.bodyPad;
		let fs = Math.floor(Math.min(cap, ...rows.map((r) => (INNER_W / Math.max(1, r.w100)) * 100)));
		const breaks = lineCountOfRows(rows) - 1;
		const textH = (f: number) => rows.length * Math.round(f * G.lh) + breaks * G.lineGap;
		while (textH(fs) > maxBodyH && fs > G.minFs) fs -= 2;
		if (textH(fs) > maxBodyH) {
			if (!force) return null;
			fs = Math.floor((maxBodyH - breaks * G.lineGap) / (rows.length * G.lh));
		}
		// 卡片按内容定高，整体在区域内居中
		const h = Math.round(Math.max(G.minH, Math.min(cardH, bodyTop + textH(fs) + 2 * G.bodyPad + G.padBottom)));
		const top = Math.round(centerY - h / 2);
		const bodyH = h - bodyTop - G.padBottom;
		let y = bodyTop + Math.max(0, bodyH - textH(fs)) * 0.5;
		let prevLine = -1;
		for (const r of rows) {
			if (prevLine >= 0 && r.line !== prevLine) y += G.lineGap;
			r.top = Math.round(y);
			y += Math.round(fs * G.lh);
			prevLine = r.line;
		}
		return {
			kind: 'text',
			top,
			h,
			lines: lis,
			rows,
			fs,
			tiles: [],
			subStarts: subs.map((ls) => lines[ls[0]].startMs + SYNC_MS),
			startMs: lines[lis[0]].startMs,
			endMs: lines[lis[lis.length - 1]].endMs,
		};
	};
	const cardsOf = (subs: number[][], isFinal: boolean): Draft[] => {
		const lis = subs.flat();
		if (lis.length === 1 && needsLine(lis[0])) return [makeNeeds(lis[0])];
		const c = make(subs, lis.length === 1, isFinal);
		if (c) return [c];
		if (subs.length > 1) {
			const mid = Math.ceil(subs.length / 2);
			return [...cardsOf(subs.slice(0, mid), false), ...cardsOf(subs.slice(mid), isFinal)];
		}
		const mid = Math.ceil(lis.length / 2);
		return [...cardsOf([lis.slice(0, mid)], false), ...cardsOf([lis.slice(mid)], isFinal)];
	};

	// 基础分组：sentenceEnd；「五种需要」清单行单独成组
	const gid = groupOf(captions);
	const base: number[][] = [];
	gid.forEach((g, li) => {
		(base[g] ??= []).push(li);
	});
	const groups: number[][] = [];
	for (const g of base.filter(Boolean)) {
		let cur: number[] = [];
		for (const li of g) {
			if (needsLine(li)) {
				if (cur.length) groups.push(cur);
				groups.push([li]);
				cur = [];
			} else cur.push(li);
		}
		if (cur.length) groups.push(cur);
	}

	const isNeeds = (g: number[]) => g.length === 1 && needsLine(g[0]);
	const rowsN = lines.map((_, li) => rowsOfLine(li, 0).length);
	const rowCount = (lis: number[]) => lis.reduce((a, li) => a + rowsN[li], 0);
	const gapAfter = (li: number) => (li + 1 < lines.length ? lines[li + 1].startMs - lines[li].endMs : 1e9);

	// (1) 旧式字幕（每个稿子换行都标 sentenceEnd）：前一组以 ，、结束（没有稿子时停顿 <360ms）且合起来 ≤3 行 → 并成一张，
	//     让「不是…，」「是…。」这类对句同卡
	const weakEnd = (g: number[]) => {
		const last = g[g.length - 1];
		if (punct) return !STRONG_END.test(tok[last].endPunct) && !/[：:；;]/.test(tok[last].endPunct);
		return gapAfter(last) < 360;
	};
	const merged: number[][] = [];
	for (const g of groups) {
		const prev = merged[merged.length - 1];
		if (prev && !isNeeds(g) && !isNeeds(prev) && weakEnd(prev) && rowCount([...prev, ...g]) <= 3) {
			prev.push(...g);
			continue;
		}
		merged.push([...g]);
	}

	// (2) 一整句超过 3 行：在分句处拆成几张卡。断点代价：：；/句末 0 < ，、 10 < 句中硬断 40；
	//     再加每张卡 50、行数偏离 2 的平方（均衡）。平局取更早的断点（主语 | 谓语）。
	const boundaryCost = (li: number) => {
		if (!punct) return gapAfter(li) >= 350 ? 5 : 15;
		const p = tok[li].endPunct;
		if (/[：:；;]/.test(p) || STRONG_END.test(p)) return 0;
		if (/[，,、]/.test(p)) return 10;
		return 40;
	};
	const splitGroup = (lis: number[]): number[][] => {
		if (isNeeds(lis) || rowCount(lis) <= 3) return [lis];
		const n = lis.length;
		const best: number[] = new Array(n + 1).fill(Infinity);
		const from: number[] = new Array(n + 1).fill(-1);
		best[0] = 0;
		for (let j = 1; j <= n; j++) {
			for (let i = 0; i < j; i++) {
				if (best[i] === Infinity) continue;
				const r = rowCount(lis.slice(i, j));
				if (r > 3 && j - i > 1) continue;
				const cost = best[i] + 50 + (j < n ? boundaryCost(lis[j - 1]) : 0) + (r - 2) * (r - 2) * 3;
				if (cost < best[j]) {
					best[j] = cost;
					from[j] = i;
				}
			}
		}
		const out: number[][] = [];
		for (let j = n; j > 0; j = from[j]) out.unshift(lis.slice(from[j], j));
		return out;
	};
	const chunks = merged.flatMap(splitGroup);

	// (3) 卡内按分句分「句」：后一句开始时前面的句子退到 55%（「不是…」退后，「是…」落地）
	const clauseEnds = (li: number) => (punct ? tok[li].endPunct !== '' : true);
	const subsOf = (lis: number[]): number[][] => {
		const subs: number[][] = [[lis[0]]];
		for (let q = 1; q < lis.length; q++) {
			if (clauseEnds(lis[q - 1])) subs.push([lis[q]]);
			else subs[subs.length - 1].push(lis[q]);
		}
		return subs;
	};
	const drafts = chunks.flatMap((lis, i) => cardsOf(subsOf(lis), i === chunks.length - 1));

	// ---- 时间轴
	const firstStart = lines.length ? lines[0].startMs : 0;
	const lastEnd = lines.length ? lines[lines.length - 1].endMs : 0;
	const totalMs = captions.durationMs + TAIL_MS;
	// 封面停 ~1.1s（声音已开始），然后甩走，露出下面早已排好字的第 1 张卡
	const coverOutMs = Math.min(1200, Math.max(900, firstStart + 1000));
	// 最后一句念完后停 0.4s 再进片尾卡，片尾尽量长
	const endInMs = Math.min(lastEnd + 400, Math.max(lastEnd + 150, totalMs - 1800));
	const cards: CardDef[] = [];
	drafts.forEach((d, n) => {
		let inMs = coverOutMs;
		if (n > 0) {
			const prev = drafts[n - 1];
			const base = Math.min(d.startMs - 120, Math.max(prev.endMs + 40, d.startMs - 380));
			// 行间空隙太短时不能在上一句还没念完就把卡甩走
			inMs = Math.max(base, prev.endMs - 40, cards[n - 1].inMs + 300);
		}
		cards.push({...d, n, inMs, outMs: 0});
	});
	cards.forEach((c, n) => {
		c.outMs = n + 1 < cards.length ? cards[n + 1].inMs : endInMs;
		// 第一行在卡片翻上来之前就排好（文字永不缺席）；后面的行在念到前 160ms 出现，折行之间错开 70ms
		let prevLine = -1;
		let lineAppear = 0;
		c.rows.forEach((r, ri) => {
			const line = lines[r.line];
			if (r.line !== prevLine) {
				lineAppear = ri === 0 ? Math.min(line.startMs - 160, c.inMs - 600) : Math.max(line.startMs - 160, c.inMs + 170);
			} else if (r.line !== c.rows[0].line) lineAppear += 70;
			r.appearMs = lineAppear;
			prevLine = r.line;
		});
	});

	// ---- 追踪条：chip 从字的位置飞进槽位
	const flyMs = ((G.flyPop + G.fly) / fps) * 1000;
	const needArrive: (number | null)[] = NEEDS.map(() => null);
	const needBumps: number[][] = NEEDS.map(() => []);
	const flights: Flight[] = [];
	for (const kw of allKws) {
		if (kw.need < 0) continue;
		const k = kw.need;
		if (needArrive[k] !== null) {
			needBumps[k].push(kw.startMs + SYNC_MS);
			continue;
		}
		const card = cards.find((c) => c.lines.includes(kw.line));
		let x0 = (SAFE_X + SAFE_R) / 2;
		let y0 = centerY;
		if (card && card.kind === 'needs') {
			const tile = card.tiles[k];
			x0 = G.cardX + G.padX + tile.x + tile.w / 2;
			y0 = card.top + tile.y + tile.h / 2;
		} else if (card) {
			const lhPx = Math.round(card.fs * G.lh);
			for (const r of card.rows) {
				for (const sg of r.segs) {
					if (sg.kind === 'kw' && sg.kw === kw) {
						x0 = G.cardX + G.padX + ((sg.x100 + sg.w100 / 2) * card.fs) / 100;
						y0 = card.top + r.top + lhPx / 2;
					}
				}
			}
		}
		flights.push({need: k, spawnMs: kw.startMs + SYNC_MS, x0, y0});
		needArrive[k] = kw.startMs + SYNC_MS + flyMs;
	}

	// ---- 片尾关键词
	const seenAll = new Set<string>();
	let allKeywords: {text: string; color: string; need: number}[] = [];
	for (const k of allKws) {
		if (!seenAll.has(k.text)) {
			seenAll.add(k.text);
			allKeywords.push({text: k.text, color: k.color, need: k.need});
		}
	}
	if (!allKeywords.length) allKeywords = (captions.keywords ?? []).map((t) => ({text: t, ...colorOf(t)}));
	// 五种需要按框架顺序排在前面，其余关键词在后
	allKeywords = [
		...allKeywords.filter((k) => k.need >= 0).sort((a, b) => a.need - b.need),
		...allKeywords.filter((k) => k.need < 0),
	].slice(0, 16);

	const chipW = (text: string, fs: number, padX: number, dot: number, dotGap: number) =>
		Math.ceil(padX * 2 + dot + dotGap + textW(text, fs, 700, ready));
	const flowChips = (
		list: {text: string; color: string; need: number}[],
		fs: number,
		h: number,
		padX: number,
		dot: number,
		dotGap: number,
		gap: number,
	) => {
		let x = 0;
		let y = 0;
		const chips: Chip[] = list.map((c) => {
			const w = Math.min(INNER_W, chipW(c.text, fs, padX, dot, dotGap));
			if (x > 0 && x + w > INNER_W) {
				x = 0;
				y += h + gap;
			}
			const chip = {...c, x, y, w};
			x += w + gap;
			return chip;
		});
		return {chips, h: chips.length ? y + h : 0};
	};
	const endAvail = maxH * 0.42;
	let endChips = {chips: [] as Chip[], h: 0, fs: 38, chipH: 72, padX: 28, dot: 14};
	for (const [fs, chipH, padX, dot] of [
		[38, 72, 28, 14],
		[34, 64, 24, 12],
		[30, 56, 20, 11],
	]) {
		const r = flowChips(allKeywords, fs, chipH, padX, dot, 12, 14);
		endChips = {chips: r.chips, h: r.h, fs, chipH, padX, dot};
		if (r.h <= endAvail) break;
	}

	// ---- 片尾卡几何
	const hasSeries = Boolean((meta?.series ?? '').trim());
	const seriesText = (meta?.series ?? '').trim() || '下期见';
	const seriesFs = Math.floor(Math.min(68, fitSize(seriesText, INNER_W - 20, 900, ready)));
	const endChipsTop = bodyTop + 6;
	const labelTop = endChipsTop + endChips.h + (endChips.h ? 64 : 20);
	const seriesTop = labelTop + (hasSeries ? 44 : 0);
	const ctaTop = seriesTop + Math.round(seriesFs * 1.3) + 36;
	const endH = Math.min(maxH, Math.max(G.minH, ctaTop + 100 + 20 + 32 + G.padBottom + 8)); // CTA 下方留一行「读书分享，非心理咨询」
	const end = {
		top: Math.round(centerY - endH / 2),
		h: endH,
		chipsTop: endChipsTop,
		labelTop,
		seriesTop,
		seriesFs,
		ctaTop,
		series: seriesText,
		hasSeries,
	};

	// ---- 书目
	const mAny = (meta ?? {}) as EpisodeMeta & {book?: string; author?: string};
	const bookTitle = (mAny.book ?? BOOK.title).trim();
	const book = bookTitle ? {title: bookTitle, author: (mAny.author ?? BOOK.author).trim()} : null;

	// ---- 封面：大字 + 副标题（标题里封面没说的后半句）+ 金句 + 书目
	const firstGroupText = drafts.length ? drafts[0].lines.map((li) => lines[li].text.replace(/\s+/g, '，')).join('，') : '';
	const headline = (meta?.cover || meta?.title || firstGroupText || captions.id).trim();
	let sub = '';
	if (meta?.cover && meta?.title && meta.title.trim() !== meta.cover.trim()) {
		const t = meta.title.trim();
		const c = meta.cover.trim();
		sub = t.startsWith(c) ? t.slice(c.length).replace(/^[，。、；：,.;:!?！？\s]+/, '') : t;
	}
	const quote = (meta?.quote ?? '').trim();
	const coverH = G.coverBottom - G.coverTop;
	const subLines = sub ? Math.ceil(textW(sub, 46, 700, ready) / INNER_W) : 0;
	const quoteRows = quote ? wrapAtPunct(quote, INNER_W - 70, (s) => textW(s, 40, 600, ready, SERIF)) : [];
	const quoteLines = quoteRows.length;
	const reserved =
		G.padTop +
		8 +
		44 + // 系列行
		(subLines ? 36 + subLines * 66 : 0) +
		(quoteLines ? 34 + quoteLines * 62 : 0) +
		(book ? G.coverBottom - G.bookY + 22 : 52) +
		40; // 呼吸
	const headAvail = coverH - reserved;
	const n = [...headline].length;
	let coverLines = [headline];
	let coverFs = 0;
	for (let k = 1; k <= 3; k++) {
		if (k > 1 && n < k * 2) break;
		if (k === 1 && n > 9) continue;
		const ls = k === 1 ? [headline] : splitHeadline(headline, k, keywords);
		const fsK = Math.min(
			k === 1 ? 190 : 210,
			(headAvail / (ls.length * 1.16)) | 0,
			...ls.map((l) => fitSize(l, INNER_W - 24, 900, ready)),
		);
		if (fsK > coverFs * 1.12) {
			coverFs = fsK;
			coverLines = ls;
		}
	}
	coverFs = Math.floor(coverFs);
	const widths = coverLines.map((l) => textW(l, coverFs, 900, ready));

	// ---- 顶部标签
	const ep = (meta?.episodeNo ?? '').trim();
	const rest = (meta?.chapter ?? '').trim();
	const pillText = [ep, rest].filter(Boolean).join(' · ');
	const pillFs = Math.min(30, Math.floor(fitSize(pillText || 'x', 560, 700, ready)));

	const deck: DeckItem[] = [
		{kind: 'cover', card: -1, inMs: -1e9, top: G.coverTop, h: coverH},
		...cards.map((c) => ({kind: 'card' as const, card: c.n, inMs: c.inMs, top: c.top, h: c.h})),
		{kind: 'end', card: -1, inMs: endInMs, top: end.top, h: end.h},
	];

	return {
		cards,
		deck,
		hasTracker,
		needArrive,
		needBumps,
		flights,
		coverOutMs,
		endInMs,
		regionTop,
		end,
		endChips,
		cover: {lines: coverLines, fs: coverFs, widths, sub, quote: quoteRows},
		disp: tok.map((x) => x.disp),
		pill: {ep, rest, fs: pillFs},
		series: (meta?.series ?? '').trim(),
		book,
	};
};

/** 金句折行：优先在标点后断（「不是教你怎么变强，/ 是陪你…」），整段放不下时才逐字折 */
const wrapAtPunct = (s: string, maxW: number, w: (s: string) => number): string[] => {
	const chunks = s.match(/[^，。！？、；：,.!?;:]+[，。！？、；：,.!?;:]*/g) ?? [s];
	const out: string[] = [];
	let cur = '';
	const pushChars = (chunk: string) => {
		for (const ch of chunk) {
			if (cur && w(cur + ch) > maxW && !PUNCT_HEAD.test(ch)) {
				out.push(cur);
				cur = '';
			}
			cur += ch;
		}
	};
	for (const c of chunks) {
		if (w(cur + c) <= maxW) cur += c;
		else if (w(c) <= maxW) {
			if (cur) out.push(cur);
			cur = c;
		} else pushChars(c);
	}
	if (cur) out.push(cur);
	return out;
};

/** 封面大字断成 nLines 行：优先标点处，其次均分（平局时让前一行更长，如「你不是/矫情」） */
const splitHeadline = (s: string, nLines: number, kws: string[]): string[] => {
	const chars = [...s];
	const out: string[] = [];
	let rest = chars;
	for (let k = nLines; k > 1; k--) {
		const ideal = rest.length / k;
		const str = rest.join('');
		const banned = new Set<number>(); // 不在关键词内部断
		for (const kw of kws) {
			for (let at = str.indexOf(kw); at >= 0; at = str.indexOf(kw, at + 1)) {
				for (let q = at + 1; q < at + kw.length; q++) banned.add(q);
			}
		}
		let best = Math.round(ideal);
		let bestCost = Infinity;
		for (let i = 2; i <= rest.length - 2; i++) {
			const p = /[，,、。！!？?；;：:\s]/.test(rest[i - 1]);
			const fn = /[就都也才还又会在是把被让给和跟而但却所可]/;
			const glue = /[就都也才还又会在是把被让给和跟而但却所可不没别]/; // 「就是」「不是」「没有被」这类连用不拆
			const soft =
				(/[的了着过地得吗呢吧啊为]/.test(rest[i - 1]) ? 1.2 : 0) +
				(fn.test(rest[i]) && !glue.test(rest[i - 1]) ? 0.8 : 0) -
				(fn.test(rest[i]) && glue.test(rest[i - 1]) ? 1 : 0);
			const cost =
				Math.abs(i - ideal) +
				(i < ideal ? 0.01 : 0) -
				(p ? 2.2 : 0) -
				soft +
				(PUNCT_HEAD.test(rest[i]) || banned.has(i) ? 99 : 0);
			if (cost < bestCost) {
				bestCost = cost;
				best = i;
			}
		}
		out.push(rest.slice(0, best).join('').replace(/[，,、；;：:\s]+$/, ''));
		rest = rest.slice(best);
	}
	out.push(rest.join('').replace(/^[\s]+/, ''));
	return out.filter(Boolean);
};
