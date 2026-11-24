/** 片名星座「弱关系」：星带里的星飞进三个字的笔画，字内用暗细线连成三个抱团的星座，
 *  三个字之间只有一根琥珀线：从「弱」右上角到「系」左上角、从「关」上方掠过的浅拱（桥）。
 *  审片（第二轮）：星拼的字像串灯。落定前后 0.9 秒，星座下面浮出一层清晰的细宋真字（带柔光），
 *  星压暗成字面上的闪光；长弦在变桥之前先整体抬到字顶上方，再从上面落进桥位，不再斜穿字面。 */
import {clamp, easeInOut, inv, mulberry32, smooth} from '../kit/util';
import {FONT_ZH} from '../kit/theme';
import {serifReady} from './fontReady';
import {AMBER, AMBER_CORE, bezC, glow, glowLine, hairSegs, haze, ID, samp, SILVER, type Ctx, type View} from './draw';
import {BAND, N, type XY} from './model';

export const TITLE_TEXT = '弱关系';
export const TITLE_SIZE = 150;
export const TITLE_WEIGHT = 420;
export const TITLE_STEP = 7;
export const TITLE_TRACK = 0.48;
export const TITLE_C: XY = [960, 400];
const ADV = TITLE_SIZE * (1 + TITLE_TRACK);

export type TitleGeo = {
	pts: XY[];
	ch: number[];
	star: number[]; // 每个取样点由哪颗星来填
	segs: number[]; // 字内细线（点的下标两两一组）
	ia: number; // 桥的左端（「弱」右上角）是第几个点
	ib: number; // 桥的右端（「系」左上角）
	apex: number; // 桥拱顶的 y
	delay: number[]; // 每颗星起飞的错开
	bend: number[];
	spark: Uint8Array; // 落定后仍然闪的那四分之一
};

export const makeTitle = (rel: XY[], exclude: number[], endA: number, endB: number, seed: number): TitleGeo => {
	const pts: XY[] = rel.map(([x, y]) => [TITLE_C[0] + x, TITLE_C[1] + y]);
	const ch = rel.map(([x]) => Math.max(0, Math.min(2, Math.round(x / ADV) + 1)));
	// 每个字的上缘
	const ys = [0, 1, 2].map((c) => pts.filter((_, i) => ch[i] === c).map((p) => p[1]));
	const top = ys.map((a) => Math.min(...a));
	const bot = ys.map((a) => Math.max(...a));
	const pick = (c: number, sign: number) => {
		let best = -1;
		let bv = -1e9;
		pts.forEach((p, i) => {
			if (ch[i] !== c) return;
			if (p[1] > top[c] + (bot[c] - top[c]) * 0.3) return;
			const v = sign * p[0] - 0.35 * (p[1] - top[c]);
			if (v > bv) {
				bv = v;
				best = i;
			}
		});
		return best;
	};
	const ia = pick(0, 1);
	const ib = pick(2, -1);
	const apex = Math.min(300, top[1] - 26);
	// 星的分配：按点的 x 从左到右，每个点挑离它最近、还没被选走的星
	const used = new Uint8Array(N);
	for (const e of exclude) used[e] = 1;
	used[endA] = 1;
	used[endB] = 1;
	const star = new Array<number>(pts.length).fill(-1);
	star[ia] = endA;
	star[ib] = endB;
	const order = pts.map((_, i) => i).sort((a, b) => pts[a][0] - pts[b][0]);
	for (const i of order) {
		if (i === ia || i === ib) continue;
		let best = -1;
		let bd = 1e18;
		for (let s = 0; s < N; s++) {
			if (used[s]) continue;
			const dx = BAND[s][0] - pts[i][0];
			const dy = BAND[s][1] - pts[i][1];
			const d = dx * dx + dy * dy;
			if (d < bd) {
				bd = d;
				best = s;
			}
		}
		used[best] = 1;
		star[i] = best;
	}
	// 字内细线：每颗星只连同一个字里最近的 1 颗（< 22 px）
	const seen = new Set<number>();
	const segs: number[] = [];
	pts.forEach((p, i) => {
		const near = pts
			.map((q, j) => ({j, d: Math.hypot(q[0] - p[0], q[1] - p[1])}))
			.filter((o) => o.j !== i && ch[o.j] === ch[i] && o.d < 22)
			.sort((a, b) => a.d - b.d)
			.slice(0, 1);
		for (const o of near) {
			const key = Math.min(i, o.j) * 100000 + Math.max(i, o.j);
			if (seen.has(key)) continue;
			seen.add(key);
			segs.push(i, o.j);
		}
	});
	const r = mulberry32(seed);
	const xs = pts.map((p) => p[0]);
	const x0 = Math.min(...xs);
	const x1 = Math.max(...xs);
	const delay = pts.map((p) => 0.55 * ((p[0] - x0) / (x1 - x0)) + 0.25 * r());
	const bend = pts.map(() => (r() - 0.5) * 0.5);
	const spark = new Uint8Array(pts.length);
	pts.forEach((_, i) => (spark[i] = r() < 0.25 ? 1 : 0));
	return {pts, ch, star, segs, ia, ib, apex, delay, bend, spark};
};

export type Chord = {a: XY; c: XY; b: XY};
/** 桥的形状（二次贝塞尔：端点 + 控制点）。拱顶 = 0.5·端点均值 + 0.5·控制点 */
export const bridgeOf = (geo: TitleGeo): Chord => {
	const a = geo.pts[geo.ia];
	const b = geo.pts[geo.ib];
	const my = (a[1] + b[1]) / 2;
	return {a, b, c: [(a[0] + b[0]) / 2, 2 * geo.apex - my]};
};

export type TitleTiming = {
	fly: [number, number];
	lift: [number, number];
	bridge: [number, number];
	hair: [number, number];
	land: number;
	out: [number, number];
	flash: number;
};

// ---------------------------------------------------------------- 清晰的字（预渲染：一张实字 + 一张柔光）
const TX0 = 480;
const TY0 = 250;
const TW = 960;
const TH = 300;
let GLYPH: {sharp: HTMLCanvasElement; soft: HTMLCanvasElement} | null = null;
const glyphs = () => {
	if (GLYPH) return GLYPH;
	if (!serifReady()) return null; // 字体没就位就不画、也不缓存（否则会把系统黑体烤进缓存）
	const mk = (blur: number, color: string) => {
		const c = document.createElement('canvas');
		c.width = TW;
		c.height = TH;
		const g = c.getContext('2d')!;
		g.font = `${TITLE_WEIGHT} ${TITLE_SIZE}px "${FONT_ZH}"`;
		g.textAlign = 'center';
		g.textBaseline = 'middle';
		g.fillStyle = color;
		if (blur > 0) g.filter = `blur(${blur}px)`;
		Array.from(TITLE_TEXT).forEach((chr, i) => g.fillText(chr, TITLE_C[0] + (i - 1) * ADV - TX0, TITLE_C[1] - TY0));
		return c;
	};
	GLYPH = {sharp: mk(0, 'rgb(240,236,226)'), soft: mk(16, 'rgb(255,226,170)')};
	return GLYPH;
};
const drawGlyphs = (g: Ctx, a: number) => {
	if (a <= 0.003) return;
	const G = glyphs();
	if (!G) return;
	g.globalAlpha = clamp(0.55 * a);
	g.drawImage(G.soft, TX0, TY0);
	g.globalAlpha = clamp(0.9 * a);
	g.drawImage(G.sharp, TX0, TY0);
	g.globalAlpha = 1;
};

const sampleMaxY = (c: Chord) => {
	let m = -1e9;
	for (let i = 0; i <= 16; i++) m = Math.max(m, bezC(c.a, c.c, c.b)(i / 16)[1]);
	return m;
};
const LIFT_TO = 262; // 抬起后长弦最低点的 y（字顶约 330）

/** 片名星座。from(i) 给出第 i 颗星起飞时的屏幕位置；chordFrom 是桥原来的样子（屏幕坐标）。 */
export const drawTitle = (g: Ctx, t: number, geo: TitleGeo, T: TitleTiming, from: (star: number) => XY, chordFrom: Chord, chordK0: number) => {
	const fade = 1 - smooth(inv(T.out[0], T.out[1], t));
	if (fade <= 0 || t < T.fly[0] - 0.01) return;
	const v: View = ID;
	const flyDur = T.fly[1] - T.fly[0] - 0.8;
	const landed = smooth(inv(T.land - 0.2, T.land + 0.6, t));
	// 清晰的字：落定前 0.2 秒开始浮出，0.9 秒到位
	const textA = smooth(inv(T.land - 0.2, T.land + 0.7, t)) * fade;
	// 落定后的整体呼吸 + 一道从左到右扫过的光
	const sweepX = 560 + 900 * inv(T.flash - 0.3, T.flash + 1.1, t);
	const sweepOn = t > T.flash - 0.3 && t < T.flash + 1.1 ? 1 : 0;
	// 背后的暖光
	const warm = landed * fade;
	haze(g, v, [960, 400], 520, '#3a2a14', 0.45 * warm);
	haze(g, v, [960, 395], 300, '#5a4422', 0.2 * warm);
	drawGlyphs(g, textA);
	// 长弦先整体抬到字顶上方（lift），再滑进桥位（bridge）
	const liftU = easeInOut(inv(T.lift[0], T.lift[1], t));
	const dy = Math.max(0, sampleMaxY(chordFrom) - LIFT_TO) * liftU;
	const cur: XY[] = new Array(geo.pts.length);
	const bu = easeInOut(inv(T.bridge[0], T.bridge[1], t));
	for (let i = 0; i < geo.pts.length; i++) {
		const isEnd = i === geo.ia || i === geo.ib;
		const s0 = from(geo.star[i]);
		const e = geo.pts[i];
		if (isEnd) {
			const s: XY = [s0[0], s0[1] - dy];
			cur[i] = [s[0] + (e[0] - s[0]) * bu, s[1] + (e[1] - s[1]) * bu];
			continue;
		}
		const u = easeInOut(clamp((t - T.fly[0] - geo.delay[i]) / flyDur));
		// 带一点弧度的飞行轨迹
		const mx = (s0[0] + e[0]) / 2 - (e[1] - s0[1]) * geo.bend[i];
		const my = (s0[1] + e[1]) / 2 + (e[0] - s0[0]) * geo.bend[i];
		cur[i] = bezC(s0, [mx, my], e)(u);
	}
	// 字内细线（真字浮出后退到很淡）
	const hairA = smooth(inv(T.hair[0], T.hair[1], t)) * fade * (1 - 0.75 * textA);
	if (hairA > 0) {
		const flat: number[] = [];
		for (let k = 0; k < geo.segs.length; k += 2) {
			const p = cur[geo.segs[k]];
			const q = cur[geo.segs[k + 1]];
			flat.push(p[0], p[1], q[0], q[1]);
		}
		hairSegs(g, v, flat, SILVER, 0.9, 0.22 * hairA);
	}
	// 星：真字浮出后，四分之一的星留在字面上闪，其余压到很暗
	for (let i = 0; i < geo.pts.length; i++) {
		const isEnd = i === geo.ia || i === geo.ib;
		const u = isEnd ? bu : easeInOut(clamp((t - T.fly[0] - geo.delay[i]) / flyDur));
		const sp = geo.spark[i];
		const tw = sp ? 0.55 + 0.45 * Math.sin(t * 2.6 + i * 1.7) : 0.82 + 0.18 * Math.sin(t * 2.3 + i * 1.7);
		const sw = sweepOn ? Math.exp(-Math.pow((cur[i][0] - sweepX) / 70, 2)) : 0;
		const after = isEnd ? 1 : sp ? 1 - 0.35 * textA : 1 - 0.82 * textA;
		const k = (0.32 + 0.6 * u) * tw * fade * after * (1 + 0.9 * sw);
		glow(g, v, cur[i], (9 + 2 * u) * (sp ? 1 : 1 - 0.3 * textA), SILVER, k, 'star');
		if (isEnd) glow(g, v, cur[i], 16, AMBER, 0.6 * fade * u, 'dot');
	}
	// 桥：原来那根线（抬起后）的端点和弧度，滑成「关」上方的浅拱
	const B = bridgeOf(geo);
	const a = cur[geo.ia];
	const b = cur[geo.ib];
	const c0: XY = [chordFrom.c[0], chordFrom.c[1] - dy];
	const c: XY = [c0[0] + (B.c[0] - c0[0]) * bu, c0[1] + (B.c[1] - c0[1]) * bu];
	const flash = Math.exp(-Math.pow((t - T.flash) / 0.35, 2));
	const kb = (chordK0 + (0.95 - chordK0) * bu + 0.6 * flash + 0.3 * Math.exp(-Math.pow((t - T.land) / 0.3, 2))) * fade;
	const pts = samp(bezC(a, c, b), 48);
	glowLine(g, v, pts, AMBER, 2.0, kb);
	// 沿桥慢慢走的一粒光
	if (landed > 0) {
		const q = ((t - T.land) * 0.23) % 1;
		const p = bezC(a, c, b)(q);
		glow(g, v, p, 12, AMBER_CORE, 0.6 * landed * fade * Math.sin(Math.PI * q), 'star');
	}
};
