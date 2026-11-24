import {noise2D} from '@remotion/noise';
import React from 'react';
import type {Board, Item, PenEvent} from './board';
import {applyMat, boxHit, boxMat, isIdent, matStr} from './board';
import type {View} from './camera';
import {clamp01, easeInOut, penEase, screenBox, toScreen, worldTf} from './camera';
import type {Pt} from './rough';
import {drawGeo, drawSeq} from './rough';
import {C, FONT_HAND, FONT_SANS, H, textW, W} from './theme';

const BOIL_EVERY = 9; // 线条每 9 帧换一版抖动（约 3.3 次/秒）

const eraseA = (it: Item, ms: number) => (it.out === undefined ? 1 : 1 - clamp01((ms - it.out) / (it.outDur ?? 450)));

const ItemView: React.FC<{it: Item; idx: number; ms: number; frame: number; sw: number; boil: boolean}> = ({it, idx, ms, frame, sw, boil}) => {
	const a = eraseA(it, ms) * (it.opacity ?? 1);
	if (it.k === 'stroke') {
		const p = penEase(clamp01((ms - it.t0) / Math.max(1, it.dur)));
		let ds: string[];
		if (p >= 1) {
			const v = boil && it.boil ? Math.floor(frame / BOIL_EVERY + idx * 0.37) % it.geos.length : 0;
			ds = it.geos[v].subs.map((s) => s.d);
		} else {
			ds = drawGeo(it.geos[0], p, it.lag ?? 0.12).ds;
		}
		return (
			<g opacity={a}>
				{ds.map((d, i) => (
					<path
						key={i}
						d={d}
						fill="none"
						stroke={it.color}
						strokeWidth={(i % 2 === 0 ? it.w : it.w * 0.7) * sw}
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeDasharray={it.dash}
					/>
				))}
			</g>
		);
	}
	if (it.k === 'fill') {
		const p = penEase(clamp01((ms - it.t0) / Math.max(1, it.dur)));
		let ds: string[];
		if (p >= 1) {
			const every = it.flicker ?? 14;
			const v = boil || it.flicker ? Math.floor(frame / every + idx * 0.29) % it.geos.length : 0;
			ds = it.geos[v].subs.map((s) => s.d);
		} else {
			ds = drawSeq(it.geos[0], p).ds;
		}
		return <path d={ds.join(' ')} fill="none" stroke={it.color} strokeWidth={it.w * sw} strokeLinecap="round" opacity={a * 0.9} />;
	}
	if (it.k === 'text') {
		const p = it.dur <= 0 ? 1 : penEase(clamp01((ms - it.t0) / Math.max(1, it.dur)));
		const w = textW(it.s, it.size);
		const x0 = it.anchor === 'start' ? it.x : it.anchor === 'middle' ? it.x - w / 2 : it.x - w;
		const id = `tc${idx}`;
		return (
			<g opacity={a}>
				{p < 1 ? (
					<defs>
						<clipPath id={id}>
							<rect x={x0 - it.size * 0.2} y={it.y - it.size * 1.2} width={(w + it.size * 0.2) * p + 1} height={it.size * 1.6} />
						</clipPath>
					</defs>
				) : null}
				<text
					x={it.x}
					y={it.y}
					fontFamily={it.font === 'hand' ? FONT_HAND : FONT_SANS}
					fontSize={it.size}
					fontWeight={it.weight ?? 500}
					fill={it.color}
					textAnchor={it.anchor}
					clipPath={p < 1 ? `url(#${id})` : undefined}
				>
					{it.s}
				</text>
			</g>
		);
	}
	return <g opacity={a}>{it.render(ms, frame)}</g>;
};

/** 画整张纸。只画已经开始、没擦完、并且在视野里的条目。 */
export const World: React.FC<{board: Board; view: View; ms: number; frame: number; boil?: boolean}> = ({board, view, ms, frame, boil = true}) => {
	const sw = Math.pow(view.z, -0.6);
	const vis = screenBox(view);
	const pad = 80 / view.z;
	const visP: typeof vis = [vis[0] - pad, vis[1] - pad, vis[2] + pad, vis[3] + pad];
	const gcache: Record<string, {m: ReturnType<Board['groupAt']>['m']; o: number}> = {};
	const out: React.ReactNode[] = [];
	board.items.forEach((it, i) => {
		if (ms < it.t0) return;
		if (it.out !== undefined && ms >= it.out + (it.outDur ?? 450)) return;
		let gs: {m: ReturnType<Board['groupAt']>['m']; o: number} | null = null;
		if (it.g && board.groups[it.g]) {
			gs = gcache[it.g] ?? (gcache[it.g] = board.groupAt(it.g, ms));
			if (gs.o <= 0.001) return;
		}
		if (it.bb) {
			const bb = gs && !isIdent(gs.m) ? boxMat(gs.m, it.bb) : it.bb;
			if (!boxHit(bb, visP)) return;
		}
		const el = <ItemView key={i} it={it} idx={i} ms={ms} frame={frame} sw={gs ? sw / Math.max(0.05, Math.abs(gs.m[0])) ** 0.4 : sw} boil={boil} />;
		if (gs && (!isIdent(gs.m) || gs.o < 1)) {
			out.push(
				<g key={i} transform={isIdent(gs.m) ? undefined : matStr(gs.m)} opacity={gs.o < 1 ? gs.o : undefined}>
					{el}
				</g>,
			);
		} else out.push(el);
	});
	return (
		<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
			<g transform={worldTf(view)}>{out}</g>
		</svg>
	);
};

// ---------------- 笔 ----------------
export type PenState = {pt: Pt; alpha: number; drawing: boolean};

const GLIDE = 520;
const IN = 180;
const OUT = 260;

/** 笔尖位置（世界坐标，已经过组变换）。gm(g, ms) 返回组矩阵 */
export const penAt = (ev: PenEvent[], ms: number, board?: Board): PenState | null => {
	const tipW = (e: PenEvent, p: number, t: number): Pt => {
		const pt = e.tip(p);
		if (!board || !e.g) return pt;
		const {m} = board.groupAt(e.g, t);
		return isIdent(m) ? pt : applyMat(m, pt);
	};
	// 重叠的笔画：取还在进行中、最晚开始的那一笔；都画完了就取最后收笔的那一笔
	let active: PenEvent | null = null;
	let done: PenEvent | null = null;
	for (const e of ev) {
		if (e.t0 > ms) break;
		if (ms <= e.t1) active = e;
		else if (!done || e.t1 > done.t1) done = e;
	}
	if (active) {
		const p = clamp01((ms - active.t0) / Math.max(1, active.t1 - active.t0));
		if (active.hover) {
			const [hx, hy] = tipW(active, 0, ms);
			const inA = clamp01((ms - active.t0) / 200) * (1 - clamp01((ms - active.t1 + 200) / 200));
			return {pt: [hx + 10 + noise2D('hx', ms / 900, 0) * 5, hy - 22 + noise2D('hy', 0, ms / 800) * 4], alpha: Math.max(0.02, inA), drawing: false};
		}
		return {pt: tipW(active, penEase(p), ms), alpha: 1, drawing: true};
	}
	if (!done) {
		const n = ev[0];
		if (n && ms >= n.t0 - IN) return {pt: tipW(n, 0, ms), alpha: clamp01((ms - (n.t0 - IN)) / IN), drawing: false};
		return null;
	}
	const s = done;
	// 下一笔：二分找第一个 t0 > ms
	let lo = 0;
	let hi = ev.length;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (ev[mid].t0 > ms) hi = mid;
		else lo = mid + 1;
	}
	const next = ev[lo];
	if (next && next.t0 - s.t1 <= GLIDE) {
		const u = easeInOut(clamp01((ms - s.t1) / Math.max(1, next.t0 - s.t1)));
		const a = tipW(s, 1, ms);
		const b = tipW(next, 0, ms);
		const lift = Math.sin(u * Math.PI) * 26;
		return {pt: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - lift], alpha: 1, drawing: false};
	}
	const gap = next ? next.t0 - s.t1 : Infinity;
	const outD = Math.min(OUT, Math.max(80, gap * 0.45));
	const inD = Math.min(IN, Math.max(80, gap * 0.45));
	const lift = clamp01((ms - s.t1) / outD);
	const e = tipW(s, 1, ms);
	if (lift < 1) return {pt: [e[0] + lift * 18, e[1] - lift * 26], alpha: 1 - lift, drawing: false};
	if (next && ms >= next.t0 - inD) {
		const b = tipW(next, 0, ms);
		const u = clamp01((ms - (next.t0 - inD)) / inD);
		return {pt: [b[0] + (1 - u) * 18, b[1] - (1 - u) * 26], alpha: u, drawing: false};
	}
	return null;
};

export const Pencil: React.FC<{st: PenState | null; view: View; ms: number}> = ({st, view, ms}) => {
	if (!st || st.alpha <= 0.01) return null;
	const [x, y] = toScreen(view, st.pt[0], st.pt[1]);
	const wob = noise2D('pen', ms / 700, 0) * 4;
	const press = st.drawing ? 0 : -3;
	return (
		<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, pointerEvents: 'none'}}>
			<g transform={`translate(${x} ${y + press}) scale(1.55) rotate(${-38 + wob})`} opacity={st.alpha}>
				<g transform="translate(7 10)" opacity={0.1}>
					<path d="M0 0 L20 -7.5 L86 -7.5 L96 -6 L96 6 L86 7.5 L20 7.5 Z" fill="#000" />
				</g>
				<path d="M0 0 L20 -7.5 L20 7.5 Z" fill="#EBDDC2" stroke={C.ink} strokeWidth={1.6} strokeLinejoin="round" />
				<path d="M0 0 L7 -2.6 L7 2.6 Z" fill={C.ink} />
				<path d="M20 -7.5 L80 -7.5 L80 7.5 L20 7.5 Z" fill="#3B3632" stroke={C.ink} strokeWidth={1.6} strokeLinejoin="round" />
				<path d="M22 -2.6 L78 -2.6" stroke="rgba(255,255,255,0.18)" strokeWidth={1.6} />
				<path d="M80 -7.5 L87 -7.5 L87 7.5 L80 7.5 Z" fill={C.accent} stroke={C.ink} strokeWidth={1.6} />
				<path d="M87 -7.5 L93 -7.5 Q96 -7.5 96 -4 L96 4 Q96 7.5 93 7.5 L87 7.5 Z" fill="#D8CFC0" stroke={C.ink} strokeWidth={1.6} />
			</g>
		</svg>
	);
};
