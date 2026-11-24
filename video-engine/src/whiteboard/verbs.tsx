import {evolvePath} from '@remotion/paths';
import getStroke from 'perfect-freehand';
import React from 'react';
import type {Board, Box} from './board';
import {clamp01, penEase} from './camera';
import {getHanzi, warnMissing} from './hanzi';
import type {Pt} from './rough';
import {C, charEm, FONT_HAND} from './theme';

// 两个「手绘动词」：
//  write     关键词按真实笔顺一笔一笔写出来（hanzi-writer-data 的笔画轮廓 + 中线遮罩，evolvePath 驱动）
//            没有笔顺数据的字（字母、标点、没生成的字）退回用字体在同一格里擦出来。
//  freehand  有粗细变化的笔迹（perfect-freehand，simulatePressure 是确定性的）

const polyLen = (pts: number[][]) => {
	const cum = [0];
	for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
	return cum;
};
const along = (pts: number[][], cum: number[], p: number): number[] => {
	const L = cum[cum.length - 1] * clamp01(p);
	for (let i = 1; i < pts.length; i++) {
		if (cum[i] >= L) {
			const u = (L - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
			return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
		}
	}
	return pts[pts.length - 1];
};

let maskSeq = 0;

export type WriteOpts = {
	color?: string;
	out?: number;
	outDur?: number;
	g?: string;
	/** 字距（1 = 字挨字） */
	track?: number;
	/** x 是第一个字的左边（start，默认）、整词中心（middle）还是右边（end） */
	anchor?: 'start' | 'middle' | 'end';
	/** y 是字框顶（top，默认）还是基线（baseline，和 b.text 一样） */
	valign?: 'top' | 'baseline';
	pen?: boolean;
	nolint?: boolean;
};

const slotW = (ch: string, size: number, track: number) => (getHanzi(ch) ? size * track : charEm(ch) * size * 1.02);

/** 整词宽度（和 write 的排法一致） */
export const writeWidth = (word: string, size: number, track = 1.02) => Array.from(word).reduce((a, ch) => a + slotW(ch, size, track), 0);

/**
 * write：按笔顺写一个词。size 是字号（世界单位）；在 [t0, t0+dur] 内写完。
 * 返回写完的时刻。每一笔的时长按中线长度分配，笔间停 45ms，字间停 110ms。
 */
export const write = (b: Board, word: string, x: number, y: number, size: number, t0: number, dur: number, o: WriteOpts = {}): number => {
	const chars = Array.from(word).filter((c) => c !== '\n');
	const track = o.track ?? 1.02;
	const color = o.color ?? C.ink;
	const totalW = writeWidth(word, size, track);
	let x0 = o.anchor === 'middle' ? x - totalW / 2 : o.anchor === 'end' ? x - totalW : x;
	const top = o.valign === 'baseline' ? y - size * 0.86 : y;
	const data = chars.map((c) => {
		const d = getHanzi(c);
		if (!d && c.trim()) warnMissing(c, word);
		return d;
	});
	const GAP = 45;
	const CGAP = 110;
	// 每个字的「笔」：汉字=真实中线；其它=一笔横扫
	const lens = data.map((d, i) => (d ? d.medians.map((m) => polyLen(m)[m.length - 1] + 120) : chars[i].trim() ? [320] : []));
	const totalLen = lens.flat().reduce((a, v) => a + v, 0) || 1;
	const nStrokes = lens.flat().length;
	const drawT = Math.max(160, dur - GAP * Math.max(0, nStrokes - chars.length) - CGAP * Math.max(0, chars.length - 1));
	const k = size / 1024;
	let t = t0;
	let first = true;
	chars.forEach((ch, ci) => {
		const d = data[ci];
		const ox = x0;
		const w = slotW(ch, size, track);
		x0 += w;
		if (!ch.trim()) return;
		const bb: Box = [ox, top, ox + w, top + size];
		const lintMeta = first && !o.nolint ? {textSize: size, textLen: chars.length, bb: [bb[0], bb[1], bb[0] + totalW, bb[3]] as Box} : {nolint: true, bb};
		first = false;
		if (!d) {
			// 字体退路：在字格里从左往右擦出
			const sd = (lens[ci][0] / totalLen) * drawT;
			const st = t;
			if (o.pen !== false) b.addPen({t0: st, t1: st + sd, tip: (p) => [ox + w * p, top + size * 0.55], g: o.g});
			const id = `wf${maskSeq++}`;
			b.node(
				st,
				(ms) => {
					const p = penEase(clamp01((ms - st) / Math.max(1, sd)));
					return (
						<g>
							{p < 1 ? (
								<defs>
									<clipPath id={id}>
										<rect x={ox - 2} y={top - size * 0.2} width={(w + 4) * p} height={size * 1.4} />
									</clipPath>
								</defs>
							) : null}
							<text x={ox} y={top + size * 0.86} fontFamily={FONT_HAND} fontSize={size} fontWeight={500} fill={color} clipPath={p < 1 ? `url(#${id})` : undefined}>
								{ch}
							</text>
						</g>
					);
				},
				{out: o.out, outDur: o.outDur, g: o.g, dur: sd, ...lintMeta},
			);
			t += sd + CGAP;
			return;
		}
		const times: [number, number][] = [];
		d.medians.forEach((m, si) => {
			const sd = (lens[ci][si] / totalLen) * drawT;
			times.push([t, sd]);
			const cum = polyLen(m);
			if (o.pen !== false)
				b.addPen({
					t0: t,
					t1: t + sd,
					tip: (p) => {
						const q = along(m, cum, p);
						return [ox + q[0] * k, top + (900 - q[1]) * k] as Pt;
					},
					g: o.g,
				});
			t += sd + GAP;
		});
		t += CGAP - GAP;
		const id = `hz${maskSeq++}`;
		const medD = d.medians.map((m) => m.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' '));
		const endT = t;
		b.node(
			times[0][0],
			(ms) => (
				<g transform={`translate(${ox} ${top}) scale(${k}) translate(0 900) scale(1 -1)`}>
					{d.strokes.map((s, si) => {
						const [st, sd] = times[si];
						if (ms < st) return null;
						const p = penEase(clamp01((ms - st) / Math.max(1, sd)));
						if (p >= 1) return <path key={si} d={s} fill={color} />;
						const ev = evolvePath(p, medD[si]);
						return (
							<g key={si}>
								<defs>
									<mask id={`${id}-${si}`} maskUnits="userSpaceOnUse" x={-200} y={-300} width={1500} height={1500}>
										<path
											d={medD[si]}
											fill="none"
											stroke="#fff"
											strokeWidth={170}
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeDasharray={ev.strokeDasharray}
											strokeDashoffset={ev.strokeDashoffset}
										/>
									</mask>
								</defs>
								<path d={s} fill={color} mask={`url(#${id}-${si})`} />
							</g>
						);
					})}
				</g>
			),
			{out: o.out, outDur: o.outDur, g: o.g, dur: endT - times[0][0], ...lintMeta},
		);
	});
	return t;
};

// ---------------- Freehand ----------------
const densify = (pts: Pt[], step = 5): Pt[] => {
	const out: Pt[] = [pts[0]];
	for (let i = 1; i < pts.length; i++) {
		const [ax, ay] = pts[i - 1];
		const [bx, by] = pts[i];
		const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
		for (let j = 1; j <= n; j++) out.push([ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n]);
	}
	return out;
};

const outlineD = (pts: number[][]) => {
	if (pts.length < 3) return '';
	const f = (n: number) => n.toFixed(1);
	let d = `M${f(pts[0][0])} ${f(pts[0][1])} Q`;
	for (let i = 0; i < pts.length; i++) {
		const a = pts[i];
		const c = pts[(i + 1) % pts.length];
		d += `${f(a[0])} ${f(a[1])} ${f((a[0] + c[0]) / 2)} ${f((a[1] + c[1]) / 2)} `;
	}
	return `${d}Z`;
};

export type FreehandOpts = {size?: number; color?: string; out?: number; outDur?: number; thinning?: number; pen?: boolean; opacity?: number; g?: string};

/** freehand：沿点列画一笔「起笔重、收笔轻」的笔迹（下划线、划掉、强调线、涂黑） */
export const freehand = (b: Board, pts: Pt[], t0: number, dur: number, o: FreehandOpts = {}) => {
	const dense = densify(pts);
	const size = o.size ?? 12;
	const opts = {size, thinning: o.thinning ?? 0.6, smoothing: 0.6, streamline: 0.4, simulatePressure: true, last: true};
	const full = outlineD(getStroke(dense, opts));
	const xs = dense.map((p) => p[0]);
	const ys = dense.map((p) => p[1]);
	const bb: Box = [Math.min(...xs) - size, Math.min(...ys) - size, Math.max(...xs) + size, Math.max(...ys) + size];
	const it = b.node(
		t0,
		(ms) => {
			const p = penEase(clamp01((ms - t0) / Math.max(1, dur)));
			const n = Math.max(2, Math.round(dense.length * p));
			const d = p >= 1 ? full : outlineD(getStroke(dense.slice(0, n), {...opts, last: false}));
			return <path d={d} fill={o.color ?? C.ink} opacity={o.opacity ?? 0.92} />;
		},
		{out: o.out, outDur: o.outDur, g: o.g, bb, nolint: true},
	);
	if (o.pen !== false) {
		b.addPen({t0, t1: t0 + dur, tip: (p) => dense[Math.min(dense.length - 1, Math.round((dense.length - 1) * p))], g: o.g});
	}
	return it;
};
