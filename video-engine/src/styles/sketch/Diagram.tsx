import React from 'react';
import {interpolate, interpolateColors} from 'remotion';
import {SERIF} from '../../lib/fonts';
import {bump, bumps, clamp01, fade, progress} from './anim';
import type {Geo} from './rough';
import {drawGeo} from './rough';
import type {Badge, HeartNode, NeedNode, Scene, StickyNote} from './scene';
import {AMBER, CALL, CENTER, CUE_LABEL, CUE_LINE, DRAW, FAINT, FAINT_LABEL, INK, NOTE, NOTE_FILL, PAPER, STROKE_W} from './theme';

// 中心图：铅笔草稿（常驻）+ 墨线（被说到时用笔画出来）+ 琥珀色排线填充 + 便利贴 + 序号。
// 全部在“图坐标”里画，外层 <g> 负责封面/正片/片尾之间的缩放移动。

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Ink: React.FC<{
	geo: Geo;
	p: number;
	lag?: number;
	color?: string;
	width?: number;
	opacity?: number;
	dash?: string;
}> = ({geo, p, lag = 0.1, color = INK, width = STROKE_W, opacity = 1, dash}) => {
	if (p <= 0) return null;
	const {ds} = drawGeo(geo, p, lag);
	return (
		<g opacity={opacity}>
			{ds.map((d, i) => (
				<path
					key={i}
					d={d}
					fill="none"
					stroke={color}
					strokeWidth={i === 0 ? width : width * 0.8}
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeDasharray={dash}
				/>
			))}
		</g>
	);
};

const scaleAbout = (x: number, y: number, s: number) => `translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})`;

// ---------- 一个需要 ----------
const Need: React.FC<{n: NeedNode; i: number; ms: number; vi: number; ripple: number[]}> = ({n, i, ms, vi, ripple}) => {
	const on = n.on;
	const active = on !== null && ms >= on;
	const pC = on === null ? 0 : progress(ms, on, n.circleDur);
	const pL = on === null ? 0 : progress(ms, n.lineStart, n.lineDur);
	const pF = on === null ? 0 : fade(ms, n.fillAt, DRAW.fill);
	const ink = pC >= 1 ? n.ink[vi] : n.ink[0];
	const conn = pL >= 1 ? n.conn[vi] : n.conn[0];

	const rip = bumps(
		ms,
		ripple.map((t) => t + i * 110),
		600,
	);
	const hit = bumps(ms, n.hits.slice(1), 520);
	const pop = on === null ? 0 : bumps(ms, [on + n.circleDur - 120], 460);
	// 还是草稿时那一跳要大一点才看得见
	const s = 1 + 0.06 * Math.max(hit, pop) + (active ? 0.05 : 0.09) * rip;

	// 预告：说到“五种需要”后草稿加深一档并保持，直到被圈出来
	const cueK = n.cue === null ? 0 : fade(ms, n.cue, 340);
	const draftLabel = cueK > 0 ? interpolateColors(cueK, [0, 1], [FAINT_LABEL, CUE_LABEL]) : FAINT_LABEL;
	const draftLine = cueK > 0 ? interpolateColors(cueK, [0, 1], [FAINT, CUE_LINE]) : FAINT;
	const labelColor = on === null ? draftLabel : interpolateColors(ms, [on + 120, on + 420], [draftLabel, INK]);

	// 排线填充用剪裁矩形沿排线方向扫过去（像马克笔来回涂）
	const ang = -38 + i * 7 + 90;
	const R = n.r;
	return (
		<g transform={scaleAbout(n.x, n.y, s)}>
			<path d={n.connFaint} stroke={draftLine} strokeWidth={2.2 + 0.4 * cueK} strokeDasharray="7 11" strokeLinecap="round" fill="none" opacity={1 - 0.6 * pL} />
			{n.faint[vi].subs.map((sub, k) => (
				<path key={k} d={sub.d} stroke={draftLine} strokeWidth={2.5 + 0.6 * cueK} fill="none" strokeLinecap="round" opacity={active ? 0.8 : 1} />
			))}
			{pF > 0 ? (
				<>
					<defs>
						<clipPath id={`sk-need-${i}`}>
							<rect
								x={n.x - R - 4}
								y={n.y - R - 4}
								width={(R * 2 + 8) * pF}
								height={R * 2 + 8}
								transform={`rotate(${ang} ${n.x} ${n.y})`}
							/>
						</clipPath>
					</defs>
					<circle cx={n.x} cy={n.y} r={R - 10} fill={AMBER} opacity={0.14 * pF} />
					<path
						d={n.fill}
						clipPath={`url(#sk-need-${i})`}
						stroke={AMBER}
						strokeWidth={3.4}
						strokeLinecap="round"
						fill="none"
						opacity={0.62}
					/>
				</>
			) : null}
			<Ink geo={conn} p={pL} lag={0.06} width={3.4} />
			<Ink geo={ink} p={pC} lag={0.12} />
			<text
				x={n.x}
				y={n.y}
				textAnchor="middle"
				dominantBaseline="central"
				fontFamily={SERIF}
				fontWeight={active ? 700 : 600}
				fontSize={n.labelSize}
				fill={labelColor}
				letterSpacing="0.04em"
			>
				{n.def.label}
			</text>
		</g>
	);
};

// ---------- 序号 01–05：五个都圈完后再说到“五种需要”，笔在每个圈边写上（系列路线图） ----------
const NeedBadge: React.FC<{b: Badge; ms: number}> = ({b, ms}) => {
	if (b.t === null || ms < b.t) return null;
	const p = progress(ms, b.t, DRAW.badge);
	const bg = fade(ms, b.t, 140);
	const txt = clamp01((ms - (b.t + DRAW.badge * 0.5)) / 170);
	const sc = 1 + 0.14 * bump(ms, b.t + DRAW.badge - 60, 380);
	return (
		<g transform={scaleAbout(b.x, b.y, sc)}>
			<circle cx={b.x} cy={b.y} r={b.r - 1} fill={PAPER} opacity={bg} />
			<Ink geo={b.geo} p={p} lag={0.1} width={3} />
			<text
				x={b.x}
				y={b.y + 1}
				textAnchor="middle"
				dominantBaseline="central"
				fontFamily={SERIF}
				fontWeight={800}
				fontSize={28}
				fill={INK}
				opacity={txt}
				letterSpacing="0.02em"
			>
				{b.num}
			</text>
		</g>
	);
};

// ---------- 中心的心 ----------
const Heart: React.FC<{h: HeartNode; ms: number; vi: number; calls: number[]}> = ({h, ms, vi, calls}) => {
	const on = h.on;
	const active = on !== null && ms >= on;
	const pH = on === null ? 0 : progress(ms, on, DRAW.heart);
	const pF = h.fillOn === null ? 0 : fade(ms, h.fillOn, DRAW.fill + 200);
	const ink = pH >= 1 ? h.ink[vi] : h.ink[0];
	const hit = bumps(ms, h.hits, 560);
	const pop = on === null ? 0 : 0.6 * bump(ms, on + DRAW.heart - 140, 460);
	const fillPop = h.fillOn === null ? 0 : bump(ms, h.fillOn + 60, 600);
	// 心跳：lub-dub
	const beat = calls.reduce((m, t) => Math.max(m, bump(ms, t, 300), 0.65 * bump(ms, t + 230, 300)), 0);
	const s = 1 + 0.05 * Math.max(hit, pop, fillPop) + CALL.amp * beat;
	const ys = h.poly.map((p) => p[1]);
	const top = Math.min(...ys);
	const bottom = Math.max(...ys);
	const labelColor = on === null ? FAINT_LABEL : interpolateColors(ms, [on + 200, on + 520], [FAINT_LABEL, INK]);
	const lh = h.labelSize * 1.22;
	return (
		<g transform={scaleAbout(CENTER.x, CENTER.y, s)}>
			{h.faint[vi].subs.map((sub, k) => (
				<path key={k} d={sub.d} stroke={FAINT} strokeWidth={2.5} fill="none" strokeLinecap="round" opacity={active ? 0.8 : 1} />
			))}
			{pF > 0 ? (
				<>
					<defs>
						{/* 心从下往上被“装满” */}
						<clipPath id="sk-heart">
							<rect x={CENTER.x - 160} y={bottom + 6 - (bottom - top + 12) * pF} width={320} height={(bottom - top + 12) * pF} />
						</clipPath>
					</defs>
					<path d={h.fill} clipPath="url(#sk-heart)" stroke={AMBER} strokeWidth={3.4} strokeLinecap="round" fill="none" opacity={0.62} />
				</>
			) : null}
			<Ink geo={ink} p={pH} lag={0.1} />
			{h.lines.map((l, k) => (
				<text
					key={k}
					x={CENTER.x}
					y={CENTER.y - 6 + (k - (h.lines.length - 1) / 2) * lh}
					textAnchor="middle"
					dominantBaseline="central"
					fontFamily={SERIF}
					fontWeight={700}
					fontSize={h.labelSize}
					fill={labelColor}
					letterSpacing="0.06em"
				>
					{l}
				</text>
			))}
		</g>
	);
};

// ---------- 便利贴 ----------
const Note: React.FC<{n: StickyNote; ms: number; endFade: number}> = ({n, ms, endFade}) => {
	if (ms < n.t0 - 20) return null;
	const old = Number.isFinite(n.old) ? interpolate(ms, [n.old, n.old + 600], [1, NOTE.oldOpacity], clamp) : 1;
	const gone = Number.isFinite(n.gone) ? interpolate(ms, [n.gone - 280, n.gone], [1, 0], clamp) : 1;
	const alpha = Math.min(old, gone) * (n.keep ? 1 : endFade);
	if (alpha <= 0.001) return null;
	const pop = fade(ms, n.t0, 260);
	const sc = 0.86 + 0.14 * pop + 0.05 * bumps(ms, n.hits, 480);
	const wig = 2.2 * bumps(ms, n.hits, 480);
	const ta = n.t0 + 60;
	const pA = progress(ms, ta, DRAW.arrow);
	const pHd = progress(ms, ta + DRAW.arrow, DRAW.head);
	const x0 = n.x - n.w / 2;
	const y0 = n.y - n.h / 2;
	const tw = Math.min(84, n.w * 0.42);
	const glyphT = (k: number) => n.t0 + 240 + k * 85;
	return (
		<g opacity={alpha}>
			<Ink geo={n.arrow} p={pA} lag={0.06} width={3.4} />
			<Ink geo={n.head} p={pHd} lag={0} width={3.4} />
			<g opacity={pop} transform={`rotate(${n.rot + wig} ${n.x} ${n.y}) ${scaleAbout(n.x, n.y, sc)}`}>
				<rect x={x0 + 5} y={y0 + 7} width={n.w} height={n.h} rx={3} fill="rgba(60,50,30,0.07)" />
				<rect x={x0} y={y0} width={n.w} height={n.h} rx={3} fill={NOTE_FILL} />
				<Ink geo={n.box} p={1} width={2.4} opacity={0.85} />
				<rect
					x={n.x - tw / 2 + n.tape}
					y={y0 - 12}
					width={tw}
					height={24}
					fill={AMBER}
					opacity={0.42}
					transform={`rotate(${-4 + n.tape * 0.15} ${n.x + n.tape} ${y0})`}
				/>
				<text
					x={n.x}
					y={n.y + 2}
					textAnchor="middle"
					dominantBaseline="central"
					fontFamily={SERIF}
					fontWeight={700}
					fontSize={n.font}
					fill={INK}
					letterSpacing="0.03em"
				>
					{n.glyphs.map((g, k) => (
						<tspan key={k} fillOpacity={clamp01((ms - glyphT(k)) / 160)}>
							{g}
						</tspan>
					))}
				</text>
			</g>
		</g>
	);
};

export const Diagram: React.FC<{scene: Scene; ms: number; vi: number; endFade: number}> = ({scene, ms, vi, endFade}) => (
	<g>
		<Heart h={scene.heart} ms={ms} vi={vi} calls={scene.calls} />
		{scene.needs.map((n, i) => (
			<Need key={n.def.id} n={n} i={i} ms={ms} vi={vi} ripple={scene.ripples} />
		))}
		{scene.needs.map((n) => (
			<NeedBadge key={`b-${n.def.id}`} b={n.badge} ms={ms} />
		))}
		{scene.notes.map((n, i) => (
			<Note key={i} n={n} ms={ms} endFade={endFade} />
		))}
	</g>
);
