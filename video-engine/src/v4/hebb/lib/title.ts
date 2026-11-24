/** 片名「赫 布」：字体加载、笔画节点图（连线成字）、片名卡绘制、鲁迅引文排版。
 *  片名的实字和节点图都用同一个 drawTitleChars 画，所以交叉淡化时一定对齐。 */
import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import {FONT_EN, FONT_EN_IT, FONT_ZH, hash2} from '../../kit';
import {meta, P} from '../data';
import type {Ctx, Pt} from './core';

export const TITLE = {
	chars: ['赫', '布'],
	cx: [862, 1058], // 两字中心距 196 px（约 2.1 em）
	cy: 466, // = titleCenterY(400, 92)
	size: 92,
	weight: 480,
	sub: meta.title_card.sub, // 赫布定律 · 唐纳德·赫布 · 1949
	en: meta.title_card.en, // HEBB'S RULE
	subY: 566,
	subSize: 25,
	subTrack: 0.34,
	enY: 606,
	enSize: 15,
	enTrack: 0.5,
};

export const QUOTE = {
	text: meta.V.typewriter.text,
	t0: meta.V.typewriter.t0,
	cps: meta.V.typewriter.cps,
	y: 384, // 行中线（Typewriter top 360 + 半个字高）
	size: 48,
	weight: 340,
	track: 0.12,
};

export type Layout = {xs: number[]; ws: number[]; left: number; width: number};
export type Assets = {
	nodes: Pt[];
	charOf: number[];
	edges: [number, number][];
	edgeT: number[]; // 每条边开始连的时刻
	nodeFirst: number[]; // 每个节点第一次被连到的时刻
	glowWide: HTMLCanvasElement;
	glowTight: HTMLCanvasElement;
	glowBox: [number, number];
	sub: Layout;
	en: Layout;
	quote: Layout;
};

const fontZh = (w: number, s: number) => `${w} ${s}px "${FONT_ZH}"`;

export const drawTitleChars = (g: Ctx, color: string) => {
	g.font = fontZh(TITLE.weight, TITLE.size);
	g.textAlign = 'center';
	g.textBaseline = 'middle';
	g.fillStyle = color;
	TITLE.chars.forEach((ch, i) => g.fillText(ch, TITLE.cx[i], TITLE.cy));
};

/** 逐字排版（canvas 不依赖 letterSpacing 支持）：返回每个字的中心 x */
const layoutLine = (g: Ctx, text: string, font: string, track: number, size: number, cx = 960): Layout => {
	g.font = font;
	const chars = Array.from(text);
	const ws = chars.map((c) => g.measureText(c).width);
	const gap = track * size;
	const width = ws.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
	const left = cx - width / 2;
	const xs: number[] = [];
	let x = left;
	for (let i = 0; i < chars.length; i++) {
		xs.push(x + ws[i] / 2);
		x += ws[i] + gap;
	}
	return {xs, ws, left, width};
};

export const drawLine = (g: Ctx, text: string, lay: Layout, font: string, y: number, color: string, upto = Infinity) => {
	g.font = font;
	g.textAlign = 'center';
	g.textBaseline = 'middle';
	g.fillStyle = color;
	const chars = Array.from(text);
	for (let i = 0; i < chars.length && i < upto; i++) g.fillText(chars[i], lay.xs[i], y);
};
export const subFont = () => fontZh(400, TITLE.subSize);
export const enFont = () => `400 ${TITLE.enSize}px "${FONT_EN}"`;
export const quoteFont = () => fontZh(QUOTE.weight, QUOTE.size);

/** 笔画节点图：沿笔画中轴取点（距离变换的脊优先），相邻且连线落在笔画内的点对连一根线 */
const buildGraph = () => {
	const X0 = 770;
	const Y0 = 400;
	const Wd = 380;
	const Hd = 140;
	const cv = document.createElement('canvas');
	cv.width = Wd;
	cv.height = Hd;
	const g = cv.getContext('2d')!;
	g.translate(-X0, -Y0);
	drawTitleChars(g, '#fff');
	const img = g.getImageData(0, 0, Wd, Hd).data;
	const ink = new Uint8Array(Wd * Hd);
	for (let i = 0; i < Wd * Hd; i++) ink[i] = img[i * 4 + 3] > 110 ? 1 : 0;
	// 3-4 倒角距离变换
	const D = new Float32Array(Wd * Hd);
	for (let i = 0; i < Wd * Hd; i++) D[i] = ink[i] ? 1e6 : 0;
	const at = (x: number, y: number) => (x < 0 || y < 0 || x >= Wd || y >= Hd ? 0 : D[y * Wd + x]);
	for (let y = 0; y < Hd; y++)
		for (let x = 0; x < Wd; x++) {
			const i = y * Wd + x;
			if (!ink[i]) continue;
			D[i] = Math.min(D[i], at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4);
		}
	for (let y = Hd - 1; y >= 0; y--)
		for (let x = Wd - 1; x >= 0; x--) {
			const i = y * Wd + x;
			if (!ink[i]) continue;
			D[i] = Math.min(D[i], at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4);
		}
	const cand: number[] = [];
	for (let i = 0; i < Wd * Hd; i++) if (ink[i]) cand.push(i);
	cand.sort((a, b) => D[b] - D[a] || hash2(a % Wd, (a / Wd) | 0, 7) - hash2(b % Wd, (b / Wd) | 0, 7));
	const R = 6.5;
	const cs = 6;
	const gw = Math.ceil(Wd / cs);
	const gh = Math.ceil(Hd / cs);
	const grid: number[][] = Array.from({length: gw * gh}, () => []);
	const loc: Pt[] = [];
	for (const i of cand) {
		const x = i % Wd;
		const y = (i / Wd) | 0;
		const gx = Math.floor(x / cs);
		const gy = Math.floor(y / cs);
		let ok = true;
		for (let j = Math.max(0, gy - 2); j <= Math.min(gh - 1, gy + 2) && ok; j++)
			for (let k = Math.max(0, gx - 2); k <= Math.min(gw - 1, gx + 2) && ok; k++)
				for (const id of grid[j * gw + k])
					if (Math.hypot(loc[id][0] - x, loc[id][1] - y) < R) {
						ok = false;
						break;
					}
		if (!ok) continue;
		grid[gy * gw + gx].push(loc.length);
		loc.push([x, y]);
	}
	const inkNear = (x: number, y: number) => {
		const xi = Math.round(x);
		const yi = Math.round(y);
		for (let dy = -1; dy <= 1; dy++)
			for (let dx = -1; dx <= 1; dx++) {
				const xx = xi + dx;
				const yy = yi + dy;
				if (xx >= 0 && yy >= 0 && xx < Wd && yy < Hd && ink[yy * Wd + xx]) return true;
			}
		return false;
	};
	const edges: [number, number][] = [];
	for (let a = 0; a < loc.length; a++)
		for (let b = a + 1; b < loc.length; b++) {
			const d = Math.hypot(loc[a][0] - loc[b][0], loc[a][1] - loc[b][1]);
			if (d > 12) continue;
			let ok = true;
			for (let s = 1; s < 8 && ok; s++) {
				const f = s / 8;
				if (!inkNear(loc[a][0] + (loc[b][0] - loc[a][0]) * f, loc[a][1] + (loc[b][1] - loc[a][1]) * f)) ok = false;
			}
			if (ok) edges.push([a, b]);
		}
	// 没连上的点：接到最近的、连线在笔画内的邻点（≤ 17 px）
	const deg = new Int32Array(loc.length);
	for (const [a, b] of edges) {
		deg[a]++;
		deg[b]++;
	}
	for (let a = 0; a < loc.length; a++) {
		if (deg[a] > 0) continue;
		let best = -1;
		let bd = 17;
		for (let b = 0; b < loc.length; b++) {
			if (b === a) continue;
			const d = Math.hypot(loc[a][0] - loc[b][0], loc[a][1] - loc[b][1]);
			if (d >= bd) continue;
			let ok = true;
			for (let s = 1; s < 10 && ok; s++) {
				const f = s / 10;
				if (!inkNear(loc[a][0] + (loc[b][0] - loc[a][0]) * f, loc[a][1] + (loc[b][1] - loc[a][1]) * f)) ok = false;
			}
			if (ok) {
				bd = d;
				best = b;
			}
		}
		if (best >= 0) {
			edges.push([a, best]);
			deg[a]++;
			deg[best]++;
		}
	}
	const nodes: Pt[] = loc.map(([x, y]) => [x + X0 + 0.5, y + Y0 + 0.5]);
	const mx = (e: [number, number]) => (nodes[e[0]][0] + nodes[e[1]][0]) / 2;
	edges.sort((e1, e2) => mx(e1) - mx(e2));
	const [w0, w1] = meta.prologue.wiring;
	const span = w1 - w0 - 0.2; // 1.4 s
	const E = edges.length;
	const edgeT = edges.map((_, i) => w0 + span * Math.sqrt(i / E));
	const nodeFirst = nodes.map(() => Infinity);
	edges.forEach(([a, b], i) => {
		nodeFirst[a] = Math.min(nodeFirst[a], edgeT[i]);
		nodeFirst[b] = Math.min(nodeFirst[b], edgeT[i]);
	});
	// 孤立点（没有边）：在它最近的那条边开始时一起亮
	nodes.forEach((p, i) => {
		if (nodeFirst[i] < Infinity) return;
		let best = 0;
		let bd = 1e9;
		edges.forEach(([a], j) => {
			const d = Math.abs(nodes[a][0] - p[0]);
			if (d < bd) {
				bd = d;
				best = j;
			}
		});
		nodeFirst[i] = edgeT[best] ?? w0;
	});
	const charOf = nodes.map((p) => (p[0] < 960 ? 0 : 1));
	// 片名的光晕（预先模糊好，渲染时 drawImage）
	const pad = 70;
	const mk = (blur: number, color: string) => {
		const c2 = document.createElement('canvas');
		c2.width = Wd + pad * 2;
		c2.height = Hd + pad * 2;
		const g2 = c2.getContext('2d')!;
		g2.filter = `blur(${blur}px)`;
		g2.translate(pad - X0, pad - Y0);
		drawTitleChars(g2, color);
		return c2;
	};
	return {nodes, charOf, edges, edgeT, nodeFirst, glowWide: mk(22, P.gold), glowTight: mk(5, P.goldCore), glowBox: [X0 - pad, Y0 - pad] as [number, number]};
};

let fontsP: Promise<void> | null = null;
const loadFonts = () => {
	if (!fontsP) {
		const faces = [
			new FontFace(FONT_ZH, `url(${staticFile('fonts/NotoSerifSC-VF.ttf')})`, {weight: '200 900'}),
			new FontFace(FONT_EN, `url(${staticFile('fonts/NotoSerif-Regular.ttf')})`, {weight: '400'}),
			new FontFace(FONT_EN_IT, `url(${staticFile('fonts/NotoSerif-Italic.ttf')})`, {weight: '400', style: 'italic'}),
		];
		fontsP = Promise.all(faces.map((f) => f.load())).then((fs) => {
			fs.forEach((f) => document.fonts.add(f));
		});
	}
	return fontsP;
};

let cached: Assets | null = null;
const build = (): Assets => {
	const gr = buildGraph();
	const cv = document.createElement('canvas');
	const g = cv.getContext('2d')!;
	const sub = layoutLine(g, TITLE.sub, subFont(), TITLE.subTrack, TITLE.subSize);
	const en = layoutLine(g, TITLE.en, enFont(), TITLE.enTrack, TITLE.enSize);
	const quote = layoutLine(g, QUOTE.text, quoteFont(), QUOTE.track, QUOTE.size);
	return {...gr, sub, en, quote};
};

/** 等字体加载完再算节点图；之前 delayRender 挡住截帧 */
export const useAssets = (): Assets | null => {
	const [st, setSt] = useState<Assets | null>(cached);
	const [handle] = useState(() => (cached ? null : delayRender('hebb title assets')));
	useEffect(() => {
		if (st) return;
		loadFonts()
			.then(() => document.fonts.load(fontZh(TITLE.weight, TITLE.size), '赫布'))
			.then(() => {
				cached = build();
				// eslint-disable-next-line no-console
				console.log(`[hebb] title graph: ${cached.nodes.length} nodes, ${cached.edges.length} edges`);
				setSt(cached);
			})
			.catch((e) => {
				console.error('hebb assets failed', e);
				if (handle !== null) continueRender(handle);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	useEffect(() => {
		if (st && handle !== null) continueRender(handle);
	}, [st, handle]);
	return st;
};
