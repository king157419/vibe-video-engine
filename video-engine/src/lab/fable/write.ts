import {getLength} from '@remotion/paths';
import {HANZI} from './hanzi';
import type {Geo, Pt} from './rough';
import {R} from './rough';

// 「写出来」动词：用 hanzi-writer-data 的真实笔顺，一笔一笔写关键词。
// 数据坐标 1024×1024、y 朝上（-124..900）；这里换算成世界坐标。渲染在 parts.tsx 的 <Written>。

export type WrittenStroke = {
	d: string; // 这一笔的轮廓（数据坐标）
	med: string; // 这一笔的中线（数据坐标），用来做遮罩
	medLen: number;
	tf: string; // 数据坐标 → 世界坐标
	t0: number;
	dur: number;
	geo: Geo; // 中线的世界坐标折线，给笔尖用
};
export type Written = {strokes: WrittenStroke[]; t0: number; t1: number; x: number; width: number; size: number};

const medianD = (pts: number[][]) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]} ${p[1]}`).join(' ');

/**
 * 从 t0 开始、总共 dur 毫秒，把 text 写在 (x, yTop)，字高 size。
 * 时间按每一笔的长度分配（长笔慢、短笔快），字与字之间停 pause 毫秒。
 */
export const writeText = (text: string, x: number, yTop: number, size: number, t0: number, dur: number, anchor: 'start' | 'middle' | 'end' = 'start', gap = 0.1, pause = 90): Written => {
	const glyphs = Array.from(text);
	const width = glyphs.length * size + (glyphs.length - 1) * gap * size;
	const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - width / 2 : x - width;
	const k = size / 1024;
	// 先收集所有笔，算长度
	const raw: {d: string; med: string; medLen: number; ci: number}[] = [];
	glyphs.forEach((g, ci) => {
		const h = HANZI[g];
		if (!h) throw new Error(`write: no stroke data for ${g}`);
		h.strokes.forEach((d, si) => {
			const med = medianD(h.medians[si]);
			raw.push({d, med, medLen: Math.max(40, getLength(med)), ci});
		});
	});
	const pauses = pause * Math.max(0, glyphs.length - 1);
	const fixed = 45; // 每一笔的起笔固定开销
	const budget = Math.max(1, dur - pauses - fixed * raw.length);
	const total = raw.reduce((a, s) => a + s.medLen, 0);
	let t = t0;
	let lastCi = 0;
	const strokes: WrittenStroke[] = raw.map((s) => {
		if (s.ci !== lastCi) {
			t += pause;
			lastCi = s.ci;
		}
		const sdur = fixed + (s.medLen / total) * budget;
		const gx = x0 + s.ci * size * (1 + gap);
		const tf = `translate(${gx} ${yTop}) scale(${k}) translate(0 900) scale(1 -1)`;
		const medPts = HANZI[glyphs[s.ci]].medians[raw.indexOf(s) - raw.findIndex((r) => r.ci === s.ci)];
		const pts: Pt[] = medPts.map((p) => [gx + p[0] * k, yTop + (900 - p[1]) * k]);
		const geo = R.linear(pts, {seed: 1, roughness: 0, bowing: 0, disableMultiStroke: true});
		const out = {d: s.d, med: s.med, medLen: s.medLen, tf, t0: t, dur: sdur, geo};
		t += sdur;
		return out;
	});
	return {strokes, t0, t1: t, x: x0, width, size};
};
