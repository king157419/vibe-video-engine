import {Easing} from 'remotion';
import type {Geo, Pt} from './rough';
import {tipAt} from './rough';

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const penEase = Easing.bezier(0.42, 0, 0.3, 1); // 手的节奏：起笔慢一点，收笔带一点减速
export const progress = (ms: number, t0: number, dur: number) => penEase(clamp01((ms - t0) / dur));
export const easeOut = Easing.out(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const fade = (ms: number, t0: number, dur: number) => easeOut(clamp01((ms - t0) / dur));

/** 被说到时轻轻一跳：0 → 1 → 0，dur 毫秒 */
export const bump = (ms: number, t: number, dur = 520): number => {
	const x = (ms - t) / dur;
	if (x <= 0 || x >= 1) return 0;
	return Math.sin(Math.PI * x) * (1 - x * 0.35);
};
export const bumps = (ms: number, ts: number[], dur = 520) => ts.reduce((m, t) => Math.max(m, bump(ms, t, dur)), 0);

// ---------- 笔 ----------
export type PenStrokeLike = {t0: number; t1: number; geo: Geo; lag: number; space?: 'map' | 'screen'};
export type PenState = {pt: Pt; space: 'map' | 'screen'; alpha: number; drawing: boolean};
/** 图坐标里笔滑行时要绕开的区域（中心的心和它的字） */
export type PenAvoid = {c: Pt; r: number; arcR: number};

const GLIDE = 420; // 两笔间隔小于这个就滑过去，不抬笔
const IN = 160;
const OUT = 260;

const segDist = (a: Pt, b: Pt, c: Pt): number => {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const l2 = dx * dx + dy * dy || 1;
	// 只看中段：端点本来就贴着心（连线的终点就在心边上）
	const t = Math.min(0.85, Math.max(0.15, ((c[0] - a[0]) * dx + (c[1] - a[1]) * dy) / l2));
	return Math.hypot(a[0] + dx * t - c[0], a[1] + dy * t - c[1]);
};

/** a → b 的滑行路径：直线会压过心时，改成绕着外圈走的弧（二次贝塞尔，中点落在半径 arcR 上） */
const glidePt = (a: Pt, b: Pt, u: number, avoid?: PenAvoid): Pt => {
	if (!avoid || segDist(a, b, avoid.c) >= avoid.r) return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
	const {c} = avoid;
	const va: Pt = [a[0] - c[0], a[1] - c[1]];
	const vb: Pt = [b[0] - c[0], b[1] - c[1]];
	const la = Math.hypot(va[0], va[1]) || 1;
	const lb = Math.hypot(vb[0], vb[1]) || 1;
	let mx = va[0] / la + vb[0] / lb;
	let my = va[1] / la + vb[1] / lb;
	const ml = Math.hypot(mx, my);
	if (ml < 1e-3) {
		// 正对面：往左手边绕
		mx = -va[1] / la;
		my = va[0] / la;
	} else {
		mx /= ml;
		my /= ml;
	}
	const M: Pt = [c[0] + mx * avoid.arcR, c[1] + my * avoid.arcR];
	const C: Pt = [(4 * M[0] - a[0] - b[0]) / 2, (4 * M[1] - a[1] - b[1]) / 2];
	const w = 1 - u;
	return [w * w * a[0] + 2 * w * u * C[0] + u * u * b[0], w * w * a[1] + 2 * w * u * C[1] + u * u * b[1]];
};

/** 笔此刻在哪：正在画 → 笔尖；两笔之间 → 平滑滑过去（绕开心）；闲着 → 抬笔淡出 */
export const penAt = (ms: number, strokes: PenStrokeLike[], avoid?: PenAvoid): PenState | null => {
	if (!strokes.length) return null;
	let i = -1;
	for (let k = 0; k < strokes.length; k++) {
		if (strokes[k].t0 <= ms) i = k;
		else break;
	}
	const sp = (s: PenStrokeLike) => s.space ?? 'map';
	if (i < 0) {
		const n = strokes[0];
		if (ms >= n.t0 - IN) return {pt: n.geo.start, space: sp(n), alpha: clamp01((ms - (n.t0 - IN)) / IN), drawing: false};
		return null;
	}
	const s = strokes[i];
	if (ms <= s.t1) {
		const p = progress(ms, s.t0, s.t1 - s.t0);
		return {pt: tipAt(s.geo, p, s.lag), space: sp(s), alpha: 1, drawing: true};
	}
	const next = strokes[i + 1];
	if (next && next.t0 - s.t1 <= GLIDE && sp(next) === sp(s)) {
		const u = easeInOut(clamp01((ms - s.t1) / Math.max(1, next.t0 - s.t1)));
		return {pt: glidePt(s.geo.end, next.geo.start, u, sp(s) === 'map' ? avoid : undefined), space: sp(s), alpha: 1, drawing: false};
	}
	// 抬笔：间隔很短时淡出/淡入也跟着缩短，别在原地停着半透明
	const gap = next ? next.t0 - s.t1 : Infinity;
	const outD = Math.min(OUT, Math.max(60, gap * 0.5));
	const inD = Math.min(IN, Math.max(60, gap * 0.5));
	const lift = clamp01((ms - s.t1) / outD);
	if (lift < 1) return {pt: [s.geo.end[0] + lift * 14, s.geo.end[1] - lift * 18], space: sp(s), alpha: 1 - lift, drawing: false};
	if (next && ms >= next.t0 - inD) return {pt: next.geo.start, space: sp(next), alpha: clamp01((ms - (next.t0 - inD)) / inD), drawing: false};
	return null;
};
