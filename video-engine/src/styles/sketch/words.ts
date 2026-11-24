// 中文分词边界（浏览器自带的 Intl.Segmenter，无需词典）。
// 用来给折行打分：尽量不要把“忍不住”“安全感”这类词从中间劈开。

type SegLike = {segment: (s: string) => Iterable<{index: number; isWordLike?: boolean}>};

let seg: SegLike | null | undefined;
const getSeg = (): SegLike | null => {
	if (seg !== undefined) return seg;
	try {
		const S = (Intl as unknown as {Segmenter?: new (l: string, o: {granularity: string}) => SegLike}).Segmenter;
		seg = S ? new S('zh-Hans', {granularity: 'word'}) : null;
	} catch {
		seg = null;
	}
	return seg;
};

/**
 * 返回长度为 glyphs+1 的布尔数组：inside[p] = 在第 p 个字前断行会劈开一个词。
 * （以 Array.from 的字为单位；没有分词器时全部 false）
 */
export const wordInside = (text: string): boolean[] => {
	const glyphs = Array.from(text);
	const out = new Array<boolean>(glyphs.length + 1).fill(false);
	const s = getSeg();
	if (!s) return out;
	// code unit 下标 → 字下标
	const unitToGlyph = new Map<number, number>();
	let u = 0;
	glyphs.forEach((g, i) => {
		unitToGlyph.set(u, i);
		u += g.length;
	});
	unitToGlyph.set(u, glyphs.length);
	const starts = new Set<number>();
	for (const part of s.segment(text)) {
		const gi = unitToGlyph.get(part.index);
		if (gi !== undefined) starts.add(gi);
	}
	for (let p = 1; p < glyphs.length; p++) out[p] = !starts.has(p);
	return out;
};
