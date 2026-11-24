import {evolvePath} from '@remotion/paths';
import getStroke from 'perfect-freehand';
import React from 'react';
import 事 from 'hanzi-writer-data/事.json';
import 情 from 'hanzi-writer-data/情.json';
import 你 from 'hanzi-writer-data/你.json';
import 的 from 'hanzi-writer-data/的.json';
import 反 from 'hanzi-writer-data/反.json';
import 应 from 'hanzi-writer-data/应.json';
import 需 from 'hanzi-writer-data/需.json';
import 要 from 'hanzi-writer-data/要.json';
import type {Board} from './board';
import {clamp01, penEase} from './camera';
import type {Pt} from './rough';
import {C} from './theme';

// 两个「手绘动词」：
//  Write    关键词按真实笔顺一笔一笔写出来（hanzi-writer-data 的笔画轮廓 + 中线遮罩，evolvePath 驱动）
//  Freehand 有粗细变化的笔迹（perfect-freehand，simulatePressure 是确定性的）

type HanziData = {strokes: string[]; medians: number[][][]};
const HANZI: Record<string, HanziData> = {事, 情, 你, 的, 反, 应, 需, 要} as unknown as Record<string, HanziData>;

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

/**
 * Write：按笔顺写一个词。x,y 是第一个字方框的左上角（世界坐标），size 是字号。
 * 返回写完的时刻。每一笔的时长按中线长度分配，笔间停 45ms，字间停 110ms。
 */
export const write = (
	b: Board,
	word: string,
	x: number,
	y: number,
	size: number,
	t0: number,
	dur: number,
	o: {color?: string; out?: number; outDur?: number; g?: string; track?: number} = {},
): number => {
	const chars = Array.from(word);
	const data = chars.map((c) => {
		const d = HANZI[c];
		if (!d) throw new Error(`no hanzi data for ${c}`);
		return d;
	});
	const GAP = 45;
	const CGAP = 110;
	const lens = data.map((d) => d.medians.map((m) => polyLen(m)[m.length - 1] + 120)); // +120：短笔也要有最短时长
	const totalLen = lens.flat().reduce((a, v) => a + v, 0);
	const nStrokes = lens.flat().length;
	const drawT = Math.max(200, dur - GAP * (nStrokes - chars.length) - CGAP * (chars.length - 1));
	const k = size / 1024;
	const track = o.track ?? 1.02;
	let t = t0;
	chars.forEach((_, ci) => {
		const d = data[ci];
		const ox = x + ci * size * track;
		const oy = y;
		const times: [number, number][] = [];
		d.medians.forEach((m, si) => {
			const sd = (lens[ci][si] / totalLen) * drawT;
			times.push([t, sd]);
			const cum = polyLen(m);
			b.extraPen.push({
				t0: t,
				t1: t + sd,
				tip: (p) => {
					const q = along(m, cum, p);
					return [ox + q[0] * k, oy + (900 - q[1]) * k] as Pt;
				},
				g: o.g,
			});
			t += sd + GAP;
		});
		t += CGAP - GAP;
		const id = `hz${maskSeq++}`;
		const medD = d.medians.map((m) => m.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' '));
		b.node(
			times[0][0],
			(ms) => (
				<g transform={`translate(${ox} ${oy}) scale(${k}) translate(0 900) scale(1 -1)`}>
					{d.strokes.map((s, si) => {
						const [st, sd] = times[si];
						if (ms < st) return null;
						const p = penEase(clamp01((ms - st) / Math.max(1, sd)));
						if (p >= 1) return <path key={si} d={s} fill={o.color ?? C.ink} />;
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
								<path d={s} fill={o.color ?? C.ink} mask={`url(#${id}-${si})`} />
							</g>
						);
					})}
				</g>
			),
			{out: o.out, outDur: o.outDur, g: o.g},
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

/** Freehand：沿点列画一笔「起笔重、收笔轻」的笔迹（下划线、划掉、强调线） */
export const freehand = (
	b: Board,
	pts: Pt[],
	t0: number,
	dur: number,
	o: {size?: number; color?: string; out?: number; outDur?: number; thinning?: number; pen?: boolean; opacity?: number} = {},
) => {
	const dense = densify(pts);
	const opts = {size: o.size ?? 12, thinning: o.thinning ?? 0.6, smoothing: 0.6, streamline: 0.4, simulatePressure: true, last: true};
	const full = outlineD(getStroke(dense, opts));
	b.node(
		t0,
		(ms) => {
			const p = penEase(clamp01((ms - t0) / Math.max(1, dur)));
			const n = Math.max(2, Math.round(dense.length * p));
			const d = p >= 1 ? full : outlineD(getStroke(dense.slice(0, n), {...opts, last: false}));
			return <path d={d} fill={o.color ?? C.ink} opacity={o.opacity ?? 0.92} />;
		},
		{out: o.out, outDur: o.outDur},
	);
	if (o.pen !== false) {
		b.extraPen.push({t0, t1: t0 + dur, tip: (p) => dense[Math.min(dense.length - 1, Math.round((dense.length - 1) * p))]});
	}
};
