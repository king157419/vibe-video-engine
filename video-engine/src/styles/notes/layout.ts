import type {Captions} from '../../lib/types';
import type {ScriptPunct} from './punct';

/** 一个“字块”：captions 里的一个 char 条目（可能带标点，如「孩》」），拆出尾部空白 */
export type Tok = {
	li: number; // 所在字幕行
	core: string; // 可见文字（去掉尾部空白）
	pre: string; // 字前的开引号等（来自稿子）
	post: string; // 字后的标点（来自稿子；没有稿子时由停顿推断）
	synth: boolean; // post 是推断出来的（画得更淡）
	gap: boolean; // 原文尾部带空白 = 口播停顿
	hl: boolean;
	ul: boolean; // 稿子里 __红笔划线__
	s: number;
	e: number;
	r: number; // 实际显现时间（ms）：封面期间念的字延后“追写”，之后与口播同步
	kw: number; // 所属关键词段编号，-1 表示非关键词
	x0: number; // core 在行内的起止 x（px，相对正文框左缘；排版后填）
	x1: number;
};

/** 关键词段：荧光笔跟着落笔走——t[i] 时刻刷到宽度比例 v[i]（逐字分段线性，不会跑到还没写出的字前面） */
export type KwRun = {id: number; start: number; end: number; t: number[]; v: number[]; line: number; text: string};

/** 第二档强调（红铅笔）：ul = 划线，circle = 圈出数字短语，book = 书名线（波浪线） */
export type AccentKind = 'ul' | 'circle' | 'book';
export type Accent = {id: number; kind: AccentKind; row: number; x0: number; x1: number; t: number[]; v: number[]};

export type Row = {
	key: string;
	line: number;
	group: number;
	row: number; // 全局行号（笔记本横线的第几行）
	toks: Tok[];
	fontSize: number;
	ls: number; // 字距（em）
	hang: number; // 行首开括号悬挂（px，负数）
	groupFirst: boolean; // 是否为句组的第一行（画红铅笔圆点）
	farAt: number; // 从这个时刻起，它比当前行高出 far 行以上（再淡一档）
};

export type ScrollEvent = {t: number; rows: number; durMs: number};

/** 一句话里列举了 ≥3 个关键词（「安全感、自由、价值感…」）→ 做成钉在页脚的目录卡 */
export type IndexInfo = {title: string; items: {text: string; at: number}[]; line: number};

export type PageLayout = {
	rows: Row[];
	kw: KwRun[];
	accents: Accent[];
	lineGroup: number[];
	groupStart: number[]; // 每个句组第一个字显现的时间
	groupRows: {first: number; last: number}[]; // 每个句组的首末行号
	lineRows: {start: number; end: number}[];
	lineReveal: number[];
	scroll: ScrollEvent[];
	totalRows: number;
	index: IndexInfo | null;
};

export type LayoutOpts = {
	base: number; // 常规字号
	min: number; // 最小字号（手机上可读的底线）
	shrinkOk: number; // 一行只需缩到 base*shrinkOk 以内时宁可缩字也不折行
	width: number; // 可用宽度
	gapEm: number; // 停顿间隔宽度
	postPadEm: number; // 行内标点（已半角）后补的间距
	maxHang: number; // 行首开括号最多往左挂多少 px（不能挂出安全区）
	lsEm: number; // 常规字距
	lsMin: number; // 放不下时字距最多收到这里
	anchor: number; // 当前行最后一行不低于第 anchor 行（超过就往上滚）
	startRow: number; // 第一行写在第几行
	groupCap: number; // 一个句组最多几行
	far: number; // 比当前行高出这么多行的旧笔记算“远”
	revealStart: number; // 封面淡出后开始显字的时间
	catchupMs: number; // 追写每字间隔
	punct: ScriptPunct | null; // 从稿子对齐回来的标点；null = 用停顿推断
};

/** 以 100px 字号测宽（线性缩放到任意字号） */
export type Measure = (text: string) => number;

export const OPEN = /[《「『“‘（(【〈]$/;
export const OPEN_START = /^[《「『“‘（(【〈]/;
const CLOSE = /^[》」』”’）)】〉，。、；：！？,.;:!?…]/;
const SOFT_END = /[，。、；：！？,.;:!?…》」』”’）)】]$/;
// 不想在它前面断行的字（助词/语气词），以及叠词（好好、一遍一遍）
const NO_BREAK_BEFORE = /^[的了地得着过们吗呢吧啊呀嘛]/;
const NUM_PHRASE = /[二三四五六七八九十两百千几]+[种个件条步类层重]/u;
const NUM_TITLE = /[二三四五六七八九十两]+[种个件条步类层重][^\s，。、；：！？《》“”「」]{1,3}/u;
const glyphs = (s: string) => Array.from(s).length;
const PUNCT_ALL = /[\s\p{P}\p{S}]/gu;

export const buildLayout = (captions: Captions, measure: Measure, o: LayoutOpts): PageLayout => {
	const lines = captions.lines;
	const P = o.punct?.rows ?? null;

	// ---------- 1) 字块 + 显现时间（封面期间念过的字，封面结束后快速追写，追上后严格同步） ----------
	let catchT = o.revealStart;
	let catching = true;
	const lineToks: Tok[][] = lines.map((line, li) =>
		line.chars.map((c, ci) => {
			const m = /^(.*?)(\s*)$/su.exec(c.t);
			const core = m ? m[1] : c.t;
			const gap = m ? m[2].length > 0 : false;
			let r = c.s;
			if (catching) {
				if (c.s >= catchT) catching = false;
				else {
					r = catchT;
					catchT += o.catchupMs;
				}
			}
			const p = P?.[li]?.[ci];
			return {li, core, pre: p?.pre ?? '', post: p?.post ?? '', synth: false, gap, hl: c.hl, ul: p?.ul ?? false, s: c.s, e: c.e, r, kw: -1, x0: 0, x1: 0};
		}),
	);
	// 没有稿子：停顿写成淡淡的「，」，两个关键词之间写成「、」（行尾不补）
	if (!P) {
		lineToks.forEach((toks) =>
			toks.forEach((t, i) => {
				if (!t.gap || i === toks.length - 1) return;
				t.post = t.hl && toks[i + 1].hl ? '、' : '，';
				t.synth = true;
			}),
		);
	}
	const pauseAfter = (t: Tok) => t.gap || t.post.length > 0;

	// ---------- 2) 关键词段：连续的 hl 字块，遇到停顿/标点即断开 ----------
	const kw: KwRun[] = [];
	const runToks: Tok[][] = [];
	for (const toks of lineToks) {
		for (let i = 0; i < toks.length; i++) {
			const t = toks[i];
			if (!t.hl) continue;
			const prev = i > 0 ? toks[i - 1] : null;
			if (prev && prev.hl && !pauseAfter(prev) && prev.kw >= 0 && !t.pre) {
				t.kw = prev.kw;
				runToks[t.kw].push(t);
			} else {
				t.kw = kw.length;
				kw.push({id: kw.length, start: t.r, end: t.r, t: [], v: [], line: t.li, text: ''});
				runToks.push([t]);
			}
		}
	}

	// ---------- 3) 宽度（100px 字号、不含字距；字距按字数另算） ----------
	const cache = new Map<string, number>();
	const cw = (ch: string) => {
		let w = cache.get(ch);
		if (w === undefined) {
			w = measure(ch);
			cache.set(ch, w);
		}
		return w;
	};
	// measure 本身是按 halt（标点半角）量的；行内标点后再补一点呼吸（postPadEm），行尾不补
	const wStr = (s: string) => Array.from(s).reduce((a, ch) => a + cw(ch), 0);
	const tokA = (t: Tok) => wStr(t.pre) + wStr(t.core) + wStr(t.post);
	const tokN = (t: Tok) => glyphs(t.pre + t.core + t.post);
	const rowA = (toks: Tok[]) =>
		toks.reduce((a, t, i) => {
			const mid = i < toks.length - 1;
			return a + tokA(t) + (t.gap && !t.post && mid ? o.gapEm * 100 : 0) + (t.post && mid ? o.postPadEm * 100 : 0);
		}, 0);
	const rowN = (toks: Tok[]) => toks.reduce((a, t) => a + tokN(t), 0);
	/** 先收字距（lsEm → lsMin），还放不下再缩字号 */
	const fit = (toks: Tok[]): {size: number; ls: number} => {
		const A = rowA(toks);
		const n = Math.max(1, rowN(toks));
		const need = ((A + n * o.lsEm * 100) * o.base) / 100;
		if (need <= o.width) return {size: o.base, ls: o.lsEm};
		const ls = ((o.width * 100) / o.base - A) / (n * 100);
		if (ls >= o.lsMin) return {size: o.base, ls};
		return {size: Math.min(o.base, (o.width * 100) / (A + n * o.lsMin * 100)), ls: o.lsMin};
	};
	const lsAt = (toks: Tok[], size: number) => {
		const A = rowA(toks);
		const n = Math.max(1, rowN(toks));
		const ls = ((o.width * 100) / size - A) / (n * 100);
		return Math.max(o.lsMin, Math.min(o.lsEm, ls));
	};
	const fitSize = (toks: Tok[]) => fit(toks).size;
	const w100 = (toks: Tok[]) => rowA(toks) + rowN(toks) * o.lsEm * 100;

	// ---------- 4) 断行：一行放得下（或只需轻微收紧）就一行；否则找“最少行数”的折法 ----------
	//    在该行数下枚举断点：字号尽量大、断在停顿/标点处、不拆关键词、尽量不拆书名号、不留一两个字的孤行
	const split = (toks: Tok[]): Tok[][] => {
		const n = toks.length;
		if (n <= 1 || fitSize(toks) >= o.base * o.shrinkOk) return [toks];
		const inBook: boolean[] = [];
		let depth = 0;
		toks.forEach((t) => {
			inBook.push(depth > 0);
			for (const ch of t.core) {
				if (ch === '《') depth++;
				if (ch === '》') depth = Math.max(0, depth - 1);
			}
		});
		const pen: (number | null)[] = [null];
		for (let p = 1; p < n; p++) {
			const a = toks[p - 1];
			const b = toks[p];
			if (a.kw >= 0 && a.kw === b.kw) {
				pen.push(null); // 绝不拆关键词
				continue;
			}
			let c = pauseAfter(a) || SOFT_END.test(a.core) ? 0 : 3;
			if (inBook[p]) c += 16;
			if (OPEN.test(a.core) || CLOSE.test(b.core)) c += 40;
			if (c > 0 && (NO_BREAK_BEFORE.test(b.core) || a.core === b.core)) c += 6;
			pen.push(c);
		}
		const evalParts = (cuts: number[]) => {
			const bounds = [0, ...cuts, n];
			const parts: Tok[][] = [];
			for (let i = 0; i < bounds.length - 1; i++) parts.push(toks.slice(bounds[i], bounds[i + 1]));
			const size = Math.min(...parts.map(fitSize));
			const widths = parts.map(w100);
			// 字号到 62 以上就够舒服了，再大只算一点分，断在哪里（语义）更重要
			const eff = size <= 62 ? size : 62 + (size - 62) * 0.35;
			let score = eff - cuts.reduce((acc, p) => acc + (pen[p] ?? 999), 0);
			score -= ((Math.max(...widths) - Math.min(...widths)) / Math.max(...widths)) * 3;
			if (parts.some((pt) => pt.reduce((k, t) => k + glyphs(t.core), 0) <= 2)) score -= 10;
			return {parts, size, score};
		};
		type Cand = {parts: Tok[][]; size: number; score: number};
		let fallback: Cand | null = null;
		for (let k = 2; k <= 4; k++) {
			const found: {best: Cand | null} = {best: null};
			const choose = (from: number, left: number, acc: number[]) => {
				if (left === 0) {
					const r = evalParts(acc);
					if (!found.best || r.score > found.best.score) found.best = r;
					return;
				}
				for (let p = from; p <= n - left; p++) {
					if (pen[p] === null) continue;
					choose(p + 1, left - 1, [...acc, p]);
				}
			};
			choose(1, k - 1, []);
			const b = found.best;
			if (b && b.size >= o.min) return b.parts;
			if (b && (!fallback || b.size > fallback.size)) fallback = b;
		}
		// 极端长句：4 行都放不下就按宽度贪心往下排
		if (fallback && fallback.size >= o.min - 4) return fallback.parts;
		const out: Tok[][] = [];
		let cur: Tok[] = [];
		toks.forEach((t, i) => {
			const next = [...cur, t];
			if (cur.length && (w100(next) / 100) * o.min > o.width && pen[i] !== null) {
				out.push(cur);
				cur = [t];
			} else cur = next;
		});
		if (cur.length) out.push(cur);
		return out;
	};

	const rows: Row[] = [];
	const lineRows: {start: number; end: number}[] = [];
	let row = o.startRow;
	lines.forEach((_, li) => {
		const parts = split(lineToks[li]);
		const size = Math.floor(Math.min(...parts.map(fitSize)) * 10) / 10; // 同一句的几行同一字号
		const start = row;
		parts.forEach((toks, pi) => {
			const ls = lsAt(toks, size);
			const first = toks[0];
			// 行首开括号（《「“）整个挂进页边：括号后的第一个字和其他行左缘对齐
			const lead = first ? Array.from(first.pre + first.core)[0] ?? '' : '';
			const hang = OPEN_START.test(lead) ? -Math.min(o.maxHang, (cw(lead) / 100) * size + ls * size) : 0;
			// 行内几何：每个字块 core 的起止 x（和 NoteRow 的排法一一对应）
			const k = size / 100;
			let x = 0;
			toks.forEach((t, i) => {
				const mid = i < toks.length - 1;
				x += (wStr(t.pre) + glyphs(t.pre) * ls * 100) * k;
				t.x0 = x;
				x += (wStr(t.core) + glyphs(t.core) * ls * 100) * k;
				t.x1 = x - ls * size;
				x += (wStr(t.post) + glyphs(t.post) * ls * 100) * k;
				if (t.post && mid) x += o.postPadEm * size;
				if (t.gap && !t.post && mid) x += o.gapEm * size;
			});
			rows.push({key: `${li}-${pi}`, line: li, group: 0, row, toks, fontSize: size, ls, hang, groupFirst: false, farAt: Infinity});
			row++;
		});
		lineRows.push({start, end: row});
	});
	const tokRow = new Map<Tok, number>();
	rows.forEach((r, ri) => r.toks.forEach((t) => tokRow.set(t, ri)));

	// ---------- 5) 句组：按稿子里真正的句号分组（不是 captions.sentenceEnd——那几乎每行都是 true） ----------
	//    。！？ 结束一组；； 只有在本组已有 ≥3 行时才结束；一组最多 groupCap 行，超了就在停顿最长、
	//    语义最松的逗号处拆（冒号后面紧跟的列举不拆开）；只有 1 行的短句尽量和下一句并成一组（「不是…是…」）
	const punctAfter = (t: Tok) => (/[？！?!…]$/.test(t.core) ? t.core.slice(-1) : '') + t.post;
	type EndKind = 'hard' | 'soft' | 'comma' | 'dun' | 'colon' | 'none';
	const endKind = (li: number): EndKind => {
		const toks = lineToks[li];
		const last = toks[toks.length - 1];
		if (!P || !last) return lines[li].sentenceEnd ? 'hard' : 'none';
		const s = punctAfter(last).replace(/[”’」』）)】》\s]+$/u, '');
		const ch = s.slice(-1);
		if (/[。！？!?…]/.test(ch)) return 'hard';
		if (/[；;]/.test(ch)) return 'soft';
		if (/[：:]/.test(ch)) return 'colon';
		if (/、/.test(ch)) return 'dun';
		if (/[，,]/.test(ch)) return 'comma';
		return lines[li].sentenceEnd ? 'hard' : 'none';
	};
	const nL = lines.length;
	const kinds = lines.map((_, li) => endKind(li));
	const lineN = lineRows.map((r) => r.end - r.start);
	const pauseBonus = (li: number) => (li + 1 < nL ? Math.min(800, Math.max(0, lines[li + 1].startMs - lines[li].endMs)) / 200 : 0);
	const endCost = (li: number, groupRowsN: number) => {
		if (li === nL - 1) return 0;
		const k = kinds[li];
		const base = k === 'hard' ? 0 : k === 'soft' ? (groupRowsN >= 3 ? 2 : 6) : k === 'comma' ? 6 : k === 'dun' ? 10 : k === 'colon' ? 30 : P ? 12 : 6;
		return base - pauseBonus(li);
	};
	const internalCost = (li: number) => (kinds[li] === 'hard' ? 5 : kinds[li] === 'soft' ? 1 : 0);
	const best: number[] = new Array(nL + 1).fill(Infinity);
	const from: number[] = new Array(nL + 1).fill(0);
	best[0] = 0;
	for (let j = 1; j <= nL; j++) {
		let rowsN = 0;
		let internal = 0;
		for (let i = j - 1; i >= 0; i--) {
			rowsN += lineN[i];
			if (i < j - 1) internal += internalCost(i);
			const gc = (rowsN === 1 ? 5 : 0) + (rowsN > o.groupCap ? 100 * (rowsN - o.groupCap) : 0);
			const c = best[i] + gc + internal + endCost(j - 1, rowsN);
			if (c < best[j]) {
				best[j] = c;
				from[j] = i;
			}
			if (rowsN > o.groupCap * 3) break;
		}
	}
	const cuts: number[] = [];
	for (let j = nL; j > 0; j = from[j]) cuts.unshift(from[j]);
	const groups: number[] = new Array(nL).fill(0);
	cuts.forEach((startLine, g) => {
		const endLine = g + 1 < cuts.length ? cuts[g + 1] : nL;
		for (let li = startLine; li < endLine; li++) groups[li] = g;
	});
	rows.forEach((r, ri) => {
		r.group = groups[r.line];
		r.groupFirst = ri === 0 || rows[ri - 1].group !== r.group;
	});
	const nGroups = cuts.length;
	const groupRows = Array.from({length: nGroups}, () => ({first: Infinity, last: -Infinity}));
	rows.forEach((r) => {
		groupRows[r.group].first = Math.min(groupRows[r.group].first, r.row);
		groupRows[r.group].last = Math.max(groupRows[r.group].last, r.row);
	});

	// ---------- 6) 荧光笔进度（按 x 位置，跟着落笔） ----------
	runToks.forEach((toks, id) => {
		const total = toks.reduce((a, t) => a + (t.x1 - t.x0), 0) || 1;
		const ts: number[] = [];
		const vs: number[] = [];
		let acc = 0;
		const add = (time: number, v: number) => {
			const tt = ts.length ? Math.max(time, ts[ts.length - 1] + 1) : time;
			ts.push(tt);
			vs.push(v);
		};
		toks.forEach((t, i) => {
			add(t.r, acc / total);
			acc += t.x1 - t.x0;
			if (i === toks.length - 1) add(t.r + Math.min(420, Math.max(160, t.e - t.s)), 1);
		});
		kw[id].t = ts;
		kw[id].v = vs;
		kw[id].end = ts[ts.length - 1];
		kw[id].text = toks.map((t) => t.core).join('').replace(PUNCT_ALL, '');
	});

	// ---------- 7) 红铅笔批注 ----------
	const accents: Accent[] = [];
	// 把一段字块按行切开，每行一段，进度跟着每个字的显现时间走
	const addSpan = (kind: AccentKind, toks: Tok[], trimStart = 0, trimEnd = 0) => {
		const byRow = new Map<number, Tok[]>();
		toks.forEach((t) => {
			const ri = tokRow.get(t);
			if (ri === undefined) return;
			if (!byRow.has(ri)) byRow.set(ri, []);
			byRow.get(ri)?.push(t);
		});
		const keys = [...byRow.keys()];
		keys.forEach((ri, ki) => {
			const ts = byRow.get(ri) ?? [];
			if (!ts.length) return;
			const size = rows[ri].fontSize;
			const x0 = ts[0].x0 + (ki === 0 ? trimStart * size : 0);
			const x1 = ts[ts.length - 1].x1 - (ki === keys.length - 1 ? trimEnd * size : 0);
			if (x1 - x0 < size * 0.8) return;
			const tt: number[] = [];
			const vv: number[] = [];
			const add = (time: number, v: number) => {
				tt.push(tt.length ? Math.max(time, tt[tt.length - 1] + 1) : time);
				vv.push(Math.max(0, Math.min(1, v)));
			};
			ts.forEach((t, i) => {
				add(t.r, (Math.max(x0, t.x0) - x0) / (x1 - x0));
				if (i === ts.length - 1) add(t.r + Math.min(420, Math.max(180, t.e - t.s)), 1);
			});
			accents.push({id: accents.length, kind, row: ri, x0, x1, t: tt, v: vv});
		});
	};
	const flat = lineToks.flat();
	const isHard = (t: Tok, i: number) => {
		if (P) return /[。！？!?…]/.test(punctAfter(t));
		const nx = flat[i + 1];
		return !nx || (nx.li !== t.li && lines[t.li].sentenceEnd);
	};
	const isSoft = (t: Tok) => /[；;]/.test(punctAfter(t));
	const isClause = (t: Tok, i: number) => {
		if (/[，、：,:]/.test(punctAfter(t))) return true;
		if (P) return false;
		const nx = flat[i + 1];
		return t.gap || !nx || nx.li !== t.li;
	};
	// 句子 → 分句
	const sentences: Tok[][] = [];
	let curS: Tok[] = [];
	flat.forEach((t, i) => {
		curS.push(t);
		if (isHard(t, i) || i === flat.length - 1) {
			sentences.push(curS);
			curS = [];
		}
	});
	const clausesOf = (toks: Tok[]): Tok[][] => {
		const out: Tok[][] = [];
		let cur: Tok[] = [];
		toks.forEach((t, i) => {
			cur.push(t);
			const gi = flat.indexOf(t);
			if (i === toks.length - 1 || isClause(t, gi) || isSoft(t)) {
				out.push(cur);
				cur = [];
			}
		});
		return out;
	};
	const used = new Set<Tok>();
	// 7a) 数字短语（「五种需要」）画红圈：短语落在分句末尾、≤5 个字、不含关键词
	for (const s of sentences) {
		for (const cl of clausesOf(s)) {
			const chars: {ch: string; t: Tok}[] = [];
			cl.forEach((t) => Array.from(t.core).forEach((ch) => chars.push({ch, t})));
			const str = chars.map((c) => c.ch).join('');
			const m = NUM_PHRASE.exec(str);
			if (!m) continue;
			const t0 = chars[m.index].t;
			const span = cl.slice(cl.indexOf(t0));
			const text = span.map((t) => t.core).join('').replace(PUNCT_ALL, '');
			if (glyphs(text) > 5 || span.some((t) => t.hl)) continue;
			const ri = tokRow.get(span[0]);
			if (ri === undefined || span.some((t) => tokRow.get(t) !== ri)) continue;
			const last = span[span.length - 1];
			const at = last.r + 80;
			accents.push({id: accents.length, kind: 'circle', row: ri, x0: span[0].x0, x1: last.x1, t: [at, at + 520], v: [0, 1]});
			span.forEach((t) => used.add(t));
		}
	}
	// 7b) 书名线：《…》下面的红色波浪线
	for (let i = 0; i < flat.length; i++) {
		const t = flat[i];
		if (!t.core.includes('《')) continue;
		let j = i;
		while (j < flat.length && !flat[j].core.includes('》') && j - i < 30) j++;
		if (j >= flat.length || !flat[j].core.includes('》')) continue;
		const span = flat.slice(i, j + 1);
		const trimS = t.core.startsWith('《') ? cw('《') / 100 + rows[tokRow.get(t) ?? 0].ls : 0;
		const trimE = flat[j].core.endsWith('》') ? cw('》') / 100 : 0;
		addSpan('book', span, trimS, trimE);
		i = j;
	}
	// 7c) 划线：稿子里有 __标记__ 就只认标记；否则自动——没有关键词的句子，划它最后一个分句（3~12 字）
	if (o.punct?.explicitUl) {
		let run: Tok[] = [];
		const flush = () => {
			if (run.length) addSpan('ul', run);
			run = [];
		};
		flat.forEach((t) => {
			if (t.ul && !used.has(t)) run.push(t);
			else flush();
		});
		flush();
	} else {
		for (const s of sentences) {
			if (s.some((t) => t.hl)) continue;
			// 以 ； 再切一次：每个“半句”各划一处
			const segs: Tok[][] = [];
			let cur: Tok[] = [];
			s.forEach((t, i) => {
				cur.push(t);
				if (isSoft(t) || i === s.length - 1) {
					segs.push(cur);
					cur = [];
				}
			});
			for (const seg of segs) {
				const cls = clausesOf(seg);
				const cl = cls[cls.length - 1];
				if (!cl || cls.length < 2) continue; // 只有一个分句（整句都划）太密，跳过
				const text = cl.map((t) => t.core).join('').replace(PUNCT_ALL, '');
				const n = glyphs(text);
				if (n < 3 || n > 12 || cl.some((t) => used.has(t) || /[《》]/.test(t.core))) continue;
				addSpan('ul', cl);
			}
		}
	}

	// ---------- 8) 句组显现时间 / 远处旧笔记 ----------
	const lineReveal = lines.map((l, li) => lineToks[li][0]?.r ?? l.startMs);
	const groupStart: number[] = new Array(nGroups).fill(Infinity);
	lines.forEach((_, li) => {
		groupStart[groups[li]] = Math.min(groupStart[groups[li]], lineReveal[li]);
	});
	rows.forEach((r) => {
		for (let li = 0; li < lineRows.length; li++) {
			if (lineRows[li].end - 1 - r.row >= o.far) {
				r.farAt = lineReveal[li];
				break;
			}
		}
	});

	// ---------- 9) 锚定滚动：新的一行写之前，保证它的末行不低于第 anchor 行 ----------
	//    每次只滚 1~2 行，在上一行念完后的停顿里滚，弹簧时长跟着停顿走
	const scroll: ScrollEvent[] = [];
	let top = 0;
	lines.forEach((_, li) => {
		const {start, end} = lineRows[li];
		if (end - top <= o.anchor + 1) return;
		let next = end - (o.anchor + 1);
		// 别让半句话（句组的续行）当最上面一行：往下多滚一行对齐到句组开头
		const rAt = (n: number) => rows.find((r) => r.row === n);
		if (next + 1 <= start && rAt(next) && !rAt(next)?.groupFirst && rAt(next + 1)?.groupFirst) next += 1;
		if (next <= top) return;
		const reveal = lineReveal[li];
		const prevEnd = li > 0 ? lines[li - 1].endMs : 0;
		const pause = reveal - prevEnd;
		let t = pause < 420 ? prevEnd + 20 : Math.max(prevEnd + 40, reveal - 620);
		t = Math.min(t, reveal - 60);
		const durMs = Math.max(400, Math.min(667, reveal - t - 100));
		scroll.push({t, rows: next - top, durMs});
		top = next;
	});

	// ---------- 10) 目录卡：第一处“列举 ≥3 个关键词”的句子 ----------
	let index: IndexInfo | null = null;
	for (let li = 0; li < nL && !index; li++) {
		const ids = [...new Set(lineToks[li].filter((t) => t.kw >= 0).map((t) => t.kw))];
		if (ids.length < 3) continue;
		let title = '';
		for (let k = li; k >= Math.max(0, li - 2) && !title; k--) {
			const m = NUM_TITLE.exec(lineToks[k].map((t) => t.core).join(''));
			if (m) title = m[0];
		}
		index = {title, items: ids.slice(0, 6).map((id) => ({text: kw[id].text, at: kw[id].start})), line: li};
	}

	return {rows, kw, accents, lineGroup: groups, groupStart, groupRows, lineRows, lineReveal, scroll, totalRows: row, index};
};

/** 通用：把一段文字按标点优先、宽度受限折成若干行（封面标题、结尾摘句用） */
export const wrapText = (text: string, maxW: number, size: number, measure: Measure): string[] =>
	wrapTextInfo(text, maxW, size, measure).lines;

/** 同 wrapText，另外告诉你是否不得不在语块中间硬切（用来挑一个更合适的字号） */
export const wrapTextInfo = (text: string, maxW: number, size: number, measure: Measure): {lines: string[]; hard: boolean} => {
	let hard = false;
	const clean = text.trim();
	if (!clean) return {lines: [], hard};
	// 先按标点/空格切成语块（标点跟在前一块尾部）
	const chunks: string[] = [];
	let buf = '';
	for (const ch of Array.from(clean)) {
		if (/\s/.test(ch)) {
			if (buf) chunks.push(buf);
			buf = '';
			continue;
		}
		buf += ch;
		if (/[，。、；：！？,.;:!?…]/.test(ch)) {
			chunks.push(buf);
			buf = '';
		}
	}
	if (buf) chunks.push(buf);
	const wOf = (s: string) => (measure(s) / 100) * size;
	const lines: string[] = [];
	let cur = '';
	for (const chunk of chunks) {
		if (!cur) {
			cur = chunk;
		} else if (wOf(cur + chunk) <= maxW) {
			cur += chunk;
		} else {
			lines.push(cur);
			cur = chunk;
		}
		// 单个语块本身太长：按字硬切
		while (wOf(cur) > maxW) {
			hard = true;
			const cs = Array.from(cur);
			let n = cs.length - 1;
			while (n > 1 && wOf(cs.slice(0, n).join('')) > maxW) n--;
			// 别让行首是标点
			while (n > 1 && CLOSE.test(cs[n])) n--;
			lines.push(cs.slice(0, n).join(''));
			cur = cs.slice(n).join('');
		}
	}
	if (cur) lines.push(cur);
	return {lines, hard};
};
