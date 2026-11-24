import type {Captions} from '../../lib/types';

// 从逐字时间里找「某一行里某个词」被念到的时刻。分镜数据全部用这个定位，画面动作就能贴着旁白走。

const cores = (captions: Captions, line: number): {glyphs: string[]; s: number[]; e: number[]} => {
	const l = captions.lines[line];
	if (!l) throw new Error(`cues: line ${line} out of range`);
	const glyphs: string[] = [];
	const s: number[] = [];
	const e: number[] = [];
	for (const c of l.chars) {
		for (const g of Array.from(c.t.replace(/\s+/gu, ''))) {
			glyphs.push(g);
			s.push(c.s);
			e.push(c.e);
		}
	}
	return {glyphs, s, e};
};

const find = (glyphs: string[], word: string, nth: number): number => {
	const w = Array.from(word);
	let seen = 0;
	for (let i = 0; i + w.length <= glyphs.length; i++) {
		if (w.every((ch, j) => glyphs[i + j] === ch)) {
			if (seen === nth) return i;
			seen++;
		}
	}
	return -1;
};

/** 词的第一个字开始念的时刻（ms）。找不到就退回该行开头并打印警告。 */
export const cueAt = (captions: Captions, line: number, word: string, nth = 0): number => {
	const c = cores(captions, line);
	const i = find(c.glyphs, word, nth);
	if (i < 0) {
		console.warn(`cue not found: line ${line} "${word}" — fallback to line start`);
		return captions.lines[line].startMs;
	}
	return c.s[i];
};

/** 词的最后一个字念完的时刻（ms） */
export const cueEnd = (captions: Captions, line: number, word: string, nth = 0): number => {
	const c = cores(captions, line);
	const i = find(c.glyphs, word, nth);
	if (i < 0) return captions.lines[line].endMs;
	return c.e[i + Array.from(word).length - 1];
};

export const lineStart = (captions: Captions, line: number) => captions.lines[line].startMs;
export const lineEnd = (captions: Captions, line: number) => captions.lines[line].endMs;
