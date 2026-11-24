import React from 'react';
import {noise2D} from '@remotion/noise';
import {SANS, SERIF} from '../../lib/fonts';
import {clamp01, fade, progress} from './anim';
import type {Geo, Pt} from './rough';
import {drawGeo} from './rough';
import {AMBER, INK, MUTED, SAFE_CX, SOFT, STROKE_W, TOP_LABEL} from './theme';

// ---------- 通用：屏幕坐标里的一笔 ----------
export const Stroke: React.FC<{geo: Geo; p: number; color?: string; width?: number; opacity?: number; lag?: number}> = ({
	geo,
	p,
	color = INK,
	width = STROKE_W,
	opacity = 1,
	lag = 0.08,
}) => {
	if (p <= 0) return null;
	const {ds} = drawGeo(geo, p, lag);
	return (
		<g opacity={opacity}>
			{ds.map((d, i) => (
				<path key={i} d={d} fill="none" stroke={color} strokeWidth={i === 0 ? width : width * 0.8} strokeLinecap="round" strokeLinejoin="round" />
			))}
		</g>
	);
};

/** 琥珀色马克笔排线（从左往右扫出来） */
export const Marker: React.FC<{d: string; x: number; y: number; w: number; h: number; p: number; id: string; opacity?: number}> = ({
	d,
	x,
	y,
	w,
	h,
	p,
	id,
	opacity = 0.7,
}) => {
	if (p <= 0) return null;
	return (
		<g>
			<defs>
				<clipPath id={id}>
					<rect x={x - 10} y={y - 20} width={(w + 20) * p} height={h + 40} />
				</clipPath>
			</defs>
			<rect x={x + 4} y={y + 4} width={Math.max(0, (w - 8) * p)} height={Math.max(0, h - 8)} fill={AMBER} opacity={0.18} />
			<path d={d} clipPath={`url(#${id})`} stroke={AMBER} strokeWidth={4} strokeLinecap="round" fill="none" opacity={opacity} />
		</g>
	);
};

// ---------- 笔（小铅笔，笔尖在 (0,0)） ----------
export const Pencil: React.FC<{pt: Pt; alpha: number; ms: number; scale?: number}> = ({pt, alpha, ms, scale = 1}) => {
	if (alpha <= 0.01) return null;
	const wob = noise2D('pen', ms / 900, 0) * 3.5;
	return (
		<g transform={`translate(${pt[0]} ${pt[1]}) scale(${scale}) rotate(${-42 + wob})`} opacity={alpha}>
			<g transform="translate(5 7)" opacity={0.09}>
				<path d="M0 0 L20 -7.5 L68 -7.5 L78 -6 L78 6 L68 7.5 L20 7.5 Z" fill="#000" />
			</g>
			<path d="M0 0 L20 -7.5 L20 7.5 Z" fill="#F1E2C6" stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
			<path d="M0 0 L7.5 -2.8 L7.5 2.8 Z" fill={INK} />
			<path d="M20 -7.5 L64 -7.5 L64 7.5 L20 7.5 Z" fill={AMBER} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
			<path d="M22 -2.5 L62 -2.5" stroke="rgba(51,51,51,0.35)" strokeWidth={1.4} />
			<path d="M64 -7.5 L71 -7.5 L71 7.5 L64 7.5 Z" fill="#D9D5CC" stroke={INK} strokeWidth={1.8} />
			<path d="M71 -7.5 L77 -7.5 Q80 -7.5 80 -4 L80 4 Q80 7.5 77 7.5 L71 7.5 Z" fill="#EDB8A8" stroke={INK} strokeWidth={1.8} />
		</g>
	);
};

// ---------- 顶部标签 ----------
export const TopLabel: React.FC<{text: string; size: number; width: number; underline: Geo; ms: number; from: number; opacity: number}> = ({
	text,
	size,
	width,
	underline,
	ms,
	from,
	opacity,
}) => {
	if (!text || opacity <= 0) return null;
	const pU = progress(ms, from + 250, 520);
	return (
		<div style={{position: 'absolute', left: 0, top: 0, width: '100%', opacity}}>
			<div
				style={{
					position: 'absolute',
					left: SAFE_CX - width / 2 - 20,
					width: width + 40,
					top: TOP_LABEL.y - size * 0.75,
					textAlign: 'center',
					fontFamily: SERIF,
					fontWeight: 600,
					fontSize: size,
					lineHeight: `${size * 1.5}px`,
					color: INK,
					opacity: 0.7,
					whiteSpace: 'pre',
				}}
			>
				{text}
			</div>
			<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
				<Stroke geo={underline} p={pU} color={AMBER} width={5} opacity={0.95} />
			</svg>
		</div>
	);
};

// ---------- 封面 ----------
export type CoverLayout = {
	label: string;
	labelSize: number;
	labelW: number;
	hook: {lines: string[]; size: number; widths: number[]};
	title: {lines: string[]; size: number};
	top: number;
	hookTop: number;
	titleTop: number;
	markers: {d: string; x: number; y: number; w: number; h: number}[];
	labelLine: Geo;
};

/** out：封面整体淡出进度；sub：副标题的不透明度（视频里第一帧之后就收起，只留在封面图上） */
export const Cover: React.FC<{c: CoverLayout; out: number; sub?: number}> = ({c, out, sub = 1}) => {
	if (out >= 1) return null;
	const o = 1 - out;
	const lift = (k: number) => `translateY(${-48 * out * (1 + k * 0.3)}px)`;
	const lhHook = c.hook.size * 1.2;
	return (
		<div style={{position: 'absolute', inset: 0, opacity: o}}>
			{c.label ? (
				<div
					style={{
						position: 'absolute',
						left: 0,
						width: 960,
						top: c.top,
						textAlign: 'center',
						transform: lift(0),
						fontFamily: SERIF,
						fontWeight: 600,
						fontSize: c.labelSize,
						lineHeight: `${c.labelSize * 1.4}px`,
						letterSpacing: '0.08em',
						color: SOFT,
						whiteSpace: 'pre',
					}}
				>
					{c.label}
				</div>
			) : null}
			<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', transform: lift(1)}} width={1080} height={1920}>
				{c.markers.map((m, i) => (
					<Marker key={i} id={`sk-cover-m${i}`} d={m.d} x={m.x} y={m.y} w={m.w} h={m.h} p={1} opacity={0.75} />
				))}
				{c.label ? <Stroke geo={c.labelLine} p={1} color={AMBER} width={5} /> : null}
			</svg>
			<div style={{position: 'absolute', left: 0, width: 960, top: c.hookTop, transform: lift(1), textAlign: 'center'}}>
				{c.hook.lines.map((l, i) => (
					<div
						key={i}
						style={{
							fontFamily: SERIF,
							fontWeight: 800,
							fontSize: c.hook.size,
							lineHeight: `${lhHook}px`,
							letterSpacing: '0.04em',
							color: INK,
							whiteSpace: 'pre',
						}}
					>
						{l}
					</div>
				))}
			</div>
			<div style={{position: 'absolute', left: 0, width: 960, top: c.titleTop, transform: lift(2), textAlign: 'center', opacity: sub}}>
				{c.title.lines.map((l, i) => (
					<div
						key={i}
						style={{
							fontFamily: SERIF,
							fontWeight: 500,
							fontSize: c.title.size,
							lineHeight: `${c.title.size * 1.45}px`,
							color: SOFT,
							whiteSpace: 'pre',
						}}
					>
						{l}
					</div>
				))}
			</div>
		</div>
	);
};

// ---------- 片尾 ----------
export type EndLayout = {
	series: string;
	seriesSize: number;
	seriesW: number;
	book: string;
	cta: string;
	ctaW: number;
	disclaimer: string;
	discW: number;
	y: {series: number; book: number; cta: number; disc: number};
	ctaSize: number;
	marker: {d: string; x: number; y: number; w: number; h: number};
	dashL: Geo;
	dashR: Geo;
};

// 片尾节奏：全部在 ~0.9s 内到齐，留足时间读 CTA；lasso（琥珀色套索圈住整张图）在 Sketch 的图层里画
export const END_T = {series: 250, marker: 420, book: 380, cta: 480, lasso: 540, lassoDur: 460, disc: 600, fade: 300};

export const EndCard: React.FC<{e: EndLayout; t: number}> = ({e, t}) => {
	if (t < 0) return null;
	const a = (k: number) => fade(t, k, END_T.fade);
	const rise = (k: number) => `translateY(${(1 - a(k)) * 18}px)`;
	const text = (k: number, y: number, size: number, style: React.CSSProperties, s: string) => (
		<div
			style={{
				position: 'absolute',
				left: 0,
				width: 960,
				top: y - size * 0.7,
				textAlign: 'center',
				lineHeight: `${size * 1.4}px`,
				fontSize: size,
				whiteSpace: 'pre',
				opacity: a(k),
				transform: rise(k),
				...style,
			}}
		>
			{s}
		</div>
	);
	return (
		<div style={{position: 'absolute', inset: 0}}>
			<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
				<Marker id="sk-end-m" d={e.marker.d} x={e.marker.x} y={e.marker.y} w={e.marker.w} h={e.marker.h} p={progress(t, END_T.marker, 480)} opacity={0.72} />
				<Stroke geo={e.dashL} p={progress(t, END_T.disc + 100, 260)} width={2} color={MUTED} />
				<Stroke geo={e.dashR} p={progress(t, END_T.disc + 100, 260)} width={2} color={MUTED} />
			</svg>
			{text(END_T.series, e.y.series, e.seriesSize, {fontFamily: SERIF, fontWeight: 800, color: INK, letterSpacing: '0.06em'}, e.series)}
			{text(END_T.book, e.y.book, 36, {fontFamily: SERIF, fontWeight: 500, color: SOFT, letterSpacing: '0.02em'}, e.book)}
			{text(END_T.cta, e.y.cta, e.ctaSize, {fontFamily: SERIF, fontWeight: 700, color: INK, letterSpacing: '0.04em'}, e.cta)}
			{text(END_T.disc, e.y.disc, 28, {fontFamily: SANS, fontWeight: 500, color: MUTED, letterSpacing: '0.12em'}, e.disclaimer)}
		</div>
	);
};

export const alphaIn = (ms: number, t0: number, dur: number) => clamp01((ms - t0) / dur);
