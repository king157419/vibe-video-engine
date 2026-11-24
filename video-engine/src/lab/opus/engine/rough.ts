import rough from 'roughjs';
import type {Options} from 'roughjs/bin/core';

// 复制自 styles/sketch/rough.ts 并扩展：
// roughjs 只用来「算形状」——固定 seed 生成确定的 SVG 路径，再拆成折线，
// 这样可以逐帧只画出前 p% 的笔画（落笔动画），并且知道笔尖此刻在哪。
// 新增：任意 path、排线填充（hachure）作为一组可以按顺序扫出来的笔画。

const gen = rough.generator();

export type Pt = [number, number];

export type Sub = {
	d: string;
	pts: number[];
	cum: number[];
	len: number;
};

export type Geo = {subs: Sub[]; start: Pt; end: Pt; total: number};

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

const TOKEN = /[MLC]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

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
			cmd = 'L';
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
	const sl = subs[subs.length - 1];
	const start: Pt = s0 ? [s0.pts[0], s0.pts[1]] : [0, 0];
	const end: Pt = s0 ? [s0.pts[s0.pts.length - 2], s0.pts[s0.pts.length - 1]] : [0, 0];
	void sl;
	return {subs, start, end, total: subs.reduce((a, s) => a + s.len, 0)};
};

type Drawable = ReturnType<typeof gen.line>;
const strokeGeo = (dr: Drawable): Geo => {
	const paths = gen.toPaths(dr);
	return toGeo(paths.flatMap((p) => parsePath(p.d)));
};
const fillGeo = (dr: Drawable): Geo => {
	const paths = gen.toPaths(dr);
	return toGeo(parsePath(paths[0]?.d ?? '', 2));
};

const base = (o: Options): Options => ({roughness: 1.2, bowing: 0.9, strokeWidth: 4, stroke: '#333', ...o});
const hatch = (o: Options): Options => ({
	...base(o),
	stroke: 'none',
	fill: '#000',
	fillStyle: 'hachure',
	hachureGap: 11,
	hachureAngle: -41,
	fillWeight: 3,
	...o,
});

export const R = {
	circle: (cx: number, cy: number, r: number, o: Options = {}) => strokeGeo(gen.ellipse(cx, cy, r * 2, r * 2, base(o))),
	ellipse: (cx: number, cy: number, w: number, h: number, o: Options = {}) => strokeGeo(gen.ellipse(cx, cy, w, h, base(o))),
	line: (a: Pt, b: Pt, o: Options = {}) => strokeGeo(gen.line(a[0], a[1], b[0], b[1], base(o))),
	curve: (pts: Pt[], o: Options = {}) => strokeGeo(gen.curve(pts, base(o))),
	linear: (pts: Pt[], o: Options = {}) => strokeGeo(gen.linearPath(pts, base(o))),
	rect: (x: number, y: number, w: number, h: number, o: Options = {}) => strokeGeo(gen.rectangle(x, y, w, h, base(o))),
	path: (d: string, o: Options = {}) => strokeGeo(gen.path(d, base(o))),
	hatchRect: (x: number, y: number, w: number, h: number, o: Options = {}) => fillGeo(gen.rectangle(x, y, w, h, hatch(o))),
	hatchEllipse: (cx: number, cy: number, w: number, h: number, o: Options = {}) => fillGeo(gen.ellipse(cx, cy, w, h, hatch(o))),
	hatchPath: (d: string, o: Options = {}) => fillGeo(gen.path(d, hatch(o))),
	hatchPoly: (pts: Pt[], o: Options = {}) => fillGeo(gen.polygon(pts, hatch(o))),
};

/** 圆角矩形的 SVG path（给 R.path 用） */
export const rr = (x: number, y: number, w: number, h: number, r: number) =>
	`M${x + r} ${y} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} Q${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} Z`;

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

/** roughjs 的双描边：多笔并行推进，后一笔晚 lag 起步 */
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

/** 排线：一根接一根按顺序扫出来（按总长度分配进度） */
export const drawSeq = (geo: Geo, p: number): {ds: string[]; tip: Pt | null} => {
	if (p <= 0) return {ds: [], tip: null};
	if (p >= 1) return {ds: geo.subs.map((s) => s.d), tip: null};
	const target = geo.total * p;
	const ds: string[] = [];
	let acc = 0;
	let tip: Pt | null = null;
	for (const s of geo.subs) {
		if (acc + s.len <= target) {
			ds.push(s.d);
			acc += s.len;
			tip = [s.pts[s.pts.length - 2], s.pts[s.pts.length - 1]];
			continue;
		}
		const r = partial(s, (target - acc) / (s.len || 1));
		ds.push(r.d);
		tip = r.tip;
		break;
	}
	return {ds, tip};
};
