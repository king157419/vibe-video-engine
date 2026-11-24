import type {Captions} from '../../lib/types';

/**
 * 字幕里没有标点（行内逗号/顿号被管线换成空格，行尾标点被去掉，只保留《》？！）。
 * 这里把 script.txt 的标点按字对齐回来：每个字幕 char 得到 pre（前置引号）/ post（其后的标点）。
 * 稿子和字幕对不上（改过稿、没有稿）就返回 null，调用方退回兜底写法。
 */
export type TokPunct = {pre: string; post: string};

const PIPE_PUNCT = new Set(Array.from('，。！？；：、,.!?;:…—-·“”"‘’\'（）()【】[]「」『』《》'));
const OPEN_Q = new Set(Array.from('“‘「『（【〈'));
const SHOW_POST = new Set(Array.from('，。、；：！？…—”’」』）】〉'));
const ASCII: Record<string, string> = {',': '，', '.': '。', ';': '；', ':': '：', '!': '！', '?': '？', '(': '（', ')': '）', '[': '【', ']': '】'};

const baseChars = (core: string) => Array.from(core).filter((ch) => !PIPE_PUNCT.has(ch) && !/\s/.test(ch));

export const scriptPunct = (captions: Captions, raw: string | null | undefined): TokPunct[][] | null => {
	if (!raw) return null;
	const text = raw.replace(/\r\n?/g, '\n').replace(/\*\*/g, '').replace(/\/+/g, '');
	type S = {c: string; pre: string; post: string};
	const sp: S[] = [];
	let pending = '';
	for (const ch0 of Array.from(text)) {
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
		sp.push({c: ch, pre: pending, post: ''});
		pending = '';
	}

	let k = 0;
	const out: TokPunct[][] = [];
	for (const line of captions.lines) {
		const row: TokPunct[] = [];
		for (const c of line.chars) {
			const core = c.t.trim();
			const bs = baseChars(core);
			if (bs.length === 0) {
				row.push({pre: '', post: ''});
				continue;
			}
			const first = k;
			for (const b of bs) {
				if (k >= sp.length || sp[k].c !== b) return null;
				k++;
			}
			const last = k - 1;
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
			row.push({pre, post});
		}
		out.push(row);
	}
	if (k !== sp.length) return null;
	return out;
};
