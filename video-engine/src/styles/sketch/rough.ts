import rough from 'roughjs';
import type {Options} from 'roughjs/bin/core';

// roughjs 只用来“算形状”：固定 seed 生成确定的 SVG 路径，再拆成折线，
// 这样可以逐帧只画出前 p% 的笔画（落笔动画），并且知道笔尖此刻在哪。

const gen = rough.generator();

export type Pt = [number, number];

/** 一笔（roughjs 路径里的一个 M 子路径） */
export type Sub = {
	d: string; // 完整平滑路径（画完后用它）
	pts: number[]; // 采样折线 [x0,y0,x1,y1,...]
	cum: number[]; // 各采样点的累计长度
	len: number;
};

export type Geo = {subs: Sub[]; start: Pt; end: Pt};

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

const TOKEN = /[MLC]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

/** 把 roughjs 的 d 串解析成若干子路径（每个 M 一条） */
export const parsePath = (d: string, steps = 7): Sub[] => {
	const toks = d.match(TOKEN) ?? [];
	const subs: Sub[] = [];
	let cur: {d: string[]; pts: number[]} | null = null;
	let x = 0;
	let y = 0;
	let i = 0;
	const num = () => parseFloat(toks[i++]);
	const flush = () => {
		if (!cur || cur.pts.length < 4) return;
		const cum = [0];
		for (let k = 2; k < cur.pts.length; k += 2) {
			cum.push(cum[cum.length - 1] + Math.hypot(cur.pts[k] - cur.pts[k - 2], cur.pts[k + 1] - cur.pts[k - 1]));
		}
		subs.push({d: cur.d.join(' '), pts: cur.pts, cum, len: cum[cum.length - 1]});
	};
	let cmd = 'M';
	while (i < toks.length) {
		const t = toks[i];
		if (/^[MLC]$/i.test(t)) {
			cmd = t.toUpperCase();
			i++;
		}
		if (cmd === 'M') {
			flush();
			x = num();
			y = num();
			cur = {d: [`M${f1(x)} ${f1(y)}`], pts: [x, y]};
			cmd = 'L'; // 隐式后续坐标按 L 处理
		} else if (cmd === 'L') {
			x = num();
			y = num();
			cur?.d.push(`L${f1(x)} ${f1(y)}`);
			cur?.pts.push(x, y);
		} else if (cmd === 'C') {
			const x1 = num();
			const y1 = num();
			const x2 = num();
			const y2 = num();
			const x3 = num();
			const y3 = num();
			cur?.d.push(`C${f1(x1)} ${f1(y1)} ${f1(x2)} ${f1(y2)} ${f1(x3)} ${f1(y3)}`);
			for (let s = 1; s <= steps; s++) {
				const u = s / steps;
				const a = (1 - u) ** 3;
				const b = 3 * (1 - u) ** 2 * u;
				const c = 3 * (1 - u) * u * u;
				const e = u ** 3;
				cur?.pts.push(a * x + b * x1 + c * x2 + e * x3, a * y + b * y1 + c * y2 + e * y3);
			}
			x = x3;
			y = y3;
		} else {
			i++;
		}
	}
	flush();
	return subs;
};

const toGeo = (subs: Sub[]): Geo => {
	const s0 = subs[0];
	const start: Pt = s0 ? [s0.pts[0], s0.pts[1]] : [0, 0];
	const end: Pt = s0 ? [s0.pts[s0.pts.length - 2], s0.pts[s0.pts.length - 1]] : [0, 0];
	return {subs, start, end};
};

type Drawable = ReturnType<typeof gen.line>;
const strokeGeo = (dr: Drawable): Geo => {
	const paths = gen.toPaths(dr);
	return toGeo(paths.flatMap((p) => parsePath(p.d)));
};

const base = (o: Options): Options => ({roughness: 1.4, bowing: 1, strokeWidth: 4, stroke: '#333', ...o});

export const R = {
	circle: (cx: number, cy: number, r: number, o: Options) => strokeGeo(gen.ellipse(cx, cy, r * 2, r * 2, base(o))),
	ellipse: (cx: number, cy: number, w: number, h: number, o: Options) => strokeGeo(gen.ellipse(cx, cy, w, h, base(o))),
	line: (a: Pt, b: Pt, o: Options) => strokeGeo(gen.line(a[0], a[1], b[0], b[1], base(o))),
	curve: (pts: Pt[], o: Options) => strokeGeo(gen.curve(pts, base(o))),
	linear: (pts: Pt[], o: Options) => strokeGeo(gen.linearPath(pts, base(o))),
	rect: (x: number, y: number, w: number, h: number, o: Options) => strokeGeo(gen.rectangle(x, y, w, h, base(o))),
	/** 只要填充（hachure 排线），返回一整条 d */
	fillEllipse: (cx: number, cy: number, w: number, h: number, o: Options): string =>
		gen.toPaths(gen.ellipse(cx, cy, w, h, {...base(o), stroke: 'none', fill: '#F5B942', fillStyle: 'hachure'}))[0]?.d ?? '',
	fillPolygon: (pts: Pt[], o: Options): string =>
		gen.toPaths(gen.polygon(pts, {...base(o), stroke: 'none', fill: '#F5B942', fillStyle: 'hachure'}))[0]?.d ?? '',
	fillRect: (x: number, y: number, w: number, h: number, o: Options): string =>
		gen.toPaths(gen.rectangle(x, y, w, h, {...base(o), stroke: 'none', fill: '#F5B942', fillStyle: 'hachure'}))[0]?.d ?? '',
};

/** 几个 seed 各生成一版，用于“线条呼吸”（boil） */
export const variants = <T,>(n: number, seed: number, make: (seed: number) => T): T[] =>
	Array.from({length: n}, (_, k) => make(seed * 7 + k * 101 + 1));

/** 子路径画到 p（0..1）时的折线与笔尖 */
const partial = (sub: Sub, p: number): {d: string; tip: Pt} => {
	const target = sub.len * p;
	const {pts, cum} = sub;
	const out: string[] = [`M${f1(pts[0])} ${f1(pts[1])}`];
	let tip: Pt = [pts[0], pts[1]];
	for (let k = 1; k < cum.length; k++) {
		const x = pts[k * 2];
		const y = pts[k * 2 + 1];
		if (cum[k] <= target) {
			out.push(`L${f1(x)} ${f1(y)}`);
			tip = [x, y];
			continue;
		}
		const seg = cum[k] - cum[k - 1] || 1;
		const u = (target - cum[k - 1]) / seg;
		const px = pts[k * 2 - 2] + (x - pts[k * 2 - 2]) * u;
		const py = pts[k * 2 - 1] + (y - pts[k * 2 - 1]) * u;
		out.push(`L${f1(px)} ${f1(py)}`);
		tip = [px, py];
		break;
	}
	return {d: out.join(' '), tip};
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * 画到进度 p 的路径。多笔（roughjs 的双描边）并行推进，后一笔晚 lag 起步，
 * 看起来像一支笔带着一点复描。返回 d 数组与笔尖（第一笔的端点）。
 */
export const drawGeo = (geo: Geo, p: number, lag = 0.1): {ds: string[]; tip: Pt | null} => {
	if (p <= 0) return {ds: [], tip: null};
	if (p >= 1) return {ds: geo.subs.map((s) => s.d), tip: geo.end};
	const n = geo.subs.length;
	const span = 1 - lag * Math.max(0, n - 1);
	const ds: string[] = [];
	let tip: Pt | null = null;
	geo.subs.forEach((s, k) => {
		const q = clamp01((p - k * lag) / span);
		if (q <= 0) return;
		if (q >= 1) {
			ds.push(s.d);
			if (k === 0) tip = geo.end;
			return;
		}
		const r = partial(s, q);
		ds.push(r.d);
		if (k === 0) tip = r.tip;
	});
	return {ds, tip};
};

/** 笔尖在 p 时的位置（只算第一笔） */
export const tipAt = (geo: Geo, p: number, lag = 0.1): Pt => {
	if (p <= 0) return geo.start;
	if (p >= 1) return geo.end;
	const n = geo.subs.length;
	const span = 1 - lag * Math.max(0, n - 1);
	const s = geo.subs[0];
	if (!s) return geo.start;
	return partial(s, clamp01(p / span)).tip;
};
