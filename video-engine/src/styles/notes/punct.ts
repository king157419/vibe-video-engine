import type {Captions} from '../../lib/types';

/**
 * 字幕里没有标点（行内逗号/顿号被管线换成了空格，行尾标点被去掉，只保留《》？！）。
 * 读书笔记是“写下来”的，没有标点会像漏写。这里把 episodes/<id>/script.txt 的标点按字对齐回来。
 * 稿子和字幕对不上（改过稿、没有稿）就返回 null，由调用方退回到“停顿 → ，/、”的兜底写法。
 *
 * 另外支持稿子里的 __红笔划线__ 标记（第二档强调：红铅笔下划线）。
 * 注意：tools/script_text.py 目前只认 **关键词**，要用 __ 标记需要管线同样把 __ 去掉（见报告）。
 */

export type TokPunct = {pre: string; post: string; ul: boolean};
export type ScriptPunct = {rows: TokPunct[][]; explicitUl: boolean};

// 与 tools/script_text.py 的 PUNCT 一致：这些字符不会成为字幕里的“字”
const PIPE_PUNCT = new Set(Array.from('，。！？；：、,.!?;:…—-·“”"‘’\'（）()【】[]「」『』《》'));
const OPEN_Q = new Set(Array.from('“‘「『（【〈'));
const SHOW_POST = new Set(Array.from('，。、；：！？…—”’」』）】〉'));
const ASCII: Record<string, string> = {',': '，', '.': '。', ';': '；', ':': '：', '!': '！', '?': '？', '(': '（', ')': '）', '[': '【', ']': '】'};

const baseChars = (core: string) => Array.from(core).filter((ch) => !PIPE_PUNCT.has(ch) && !/\s/.test(ch));

export const scriptPunct = (captions: Captions, raw: string | null | undefined): ScriptPunct | null => {
	if (!raw) return null;
	const text = raw.replace(/\r\n?/g, '\n').replace(/\*\*/g, '').replace(/\/+/g, '');
	const explicitUl = /__[^_\n]+__/.test(text);
	type S = {c: string; pre: string; post: string; ul: boolean};
	const sp: S[] = [];
	let pending = '';
	text.split('__').forEach((seg, si) => {
		const ul = explicitUl && si % 2 === 1;
		for (const ch0 of Array.from(seg)) {
			const ch = ASCII[ch0] ?? ch0;
			if (/\s/.test(ch) || ch === '《' || ch === '》') continue; // 书名号字幕里本来就有
			if (OPEN_Q.has(ch)) {
				pending += ch;
				continue;
			}
			if (PIPE_PUNCT.has(ch)) {
				if (sp.length && SHOW_POST.has(ch)) sp[sp.length - 1].post += ch;
				continue;
			}
			sp.push({c: ch, pre: pending, post: '', ul});
			pending = '';
		}
	});

	let k = 0;
	const out: TokPunct[][] = [];
	for (const line of captions.lines) {
		const row: TokPunct[] = [];
		for (const c of line.chars) {
			const core = c.t.trim();
			const bs = baseChars(core);
			if (bs.length === 0) {
				row.push({pre: '', post: '', ul: false});
				continue;
			}
			const first = k;
			for (const b of bs) {
				if (k >= sp.length || sp[k].c !== b) return null; // 稿子和字幕对不上
				k++;
			}
			const last = k - 1;
			// 字幕里已经带着的尾部符号（？！》）不重复
			const have = Array.from(core);
			let post = '';
			for (const ch of Array.from(sp[last].post)) {
				const at = have.indexOf(ch);
				if (at >= 0) have.splice(at, 1);
				else post += ch;
			}
			const pre = Array.from(sp[first].pre)
				.filter((ch) => !core.includes(ch))
				.join('');
			row.push({pre, post, ul: sp[first].ul});
		}
		out.push(row);
	}
	if (k !== sp.length) return null;
	return {rows: out, explicitUl};
};
