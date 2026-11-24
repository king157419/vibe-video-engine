import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, type Chapter, FONT_EN, FONT_EN_IT, FONT_ZH, type Sub} from './theme';
import {clamp, easeOut, smooth, win} from './util';

/** 双语字幕：中文细宋体白字在上，英文灰色斜体在下，没有底框。逐句淡入淡出。 */
export const Subtitles: React.FC<{subs: Sub[]; bottom?: number; fade?: number; zhSize?: number; enSize?: number}> = ({
	subs,
	bottom = 54,
	fade = 0.35,
	zhSize = 38,
	enSize = 23,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const cur = subs.find((s) => t >= s.t0 - 0.01 && t <= s.t1 + 0.01);
	if (!cur) return null;
	const a = win(t, cur.t0, cur.t1, fade, fade);
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', pointerEvents: 'none'}}>
			<div style={{marginBottom: bottom, textAlign: 'center', opacity: a, maxWidth: 1560}}>
				<div
					style={{
						fontFamily: FONT_ZH,
						fontWeight: 380,
						fontSize: zhSize,
						letterSpacing: '0.06em',
						color: C.text,
						lineHeight: 1.35,
						textShadow: '0 0 18px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.9)',
					}}
				>
					{cur.zh}
				</div>
				{cur.en ? (
					<div
						style={{
							fontFamily: FONT_EN_IT,
							fontStyle: 'italic',
							fontSize: enSize,
							color: C.en,
							marginTop: 6,
							letterSpacing: '0.01em',
							textShadow: '0 0 12px rgba(0,0,0,0.9)',
						}}
					>
						{cur.en}
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

/** 左上角章节标签：编号（强调色）+ 一个字/词 + 宽字距英文。每章开头只出现 dur 秒。 */
export const ChapterLabel: React.FC<{chapters: Chapter[]; dur?: number; accent?: string; x?: number; y?: number}> = ({
	chapters,
	dur = 3.8,
	accent = C.gold,
	x = 76,
	y = 62,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const cur = [...chapters].reverse().find((c) => t >= c.t);
	if (!cur) return null;
	const a = win(t, cur.t, cur.t + dur, 0.8, 1.2);
	if (a <= 0) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y, opacity: a * 0.9, display: 'flex', alignItems: 'baseline', gap: 16}}>
			<span style={{fontFamily: FONT_EN, fontSize: 19, color: accent, letterSpacing: '0.12em'}}>{cur.num}</span>
			<span style={{fontFamily: FONT_ZH, fontWeight: 400, fontSize: 25, color: C.text, letterSpacing: '0.15em'}}>{cur.zh}</span>
			<span style={{fontFamily: FONT_EN, fontSize: 13, color: C.dim, letterSpacing: '0.38em'}}>{cur.en.toUpperCase()}</span>
		</div>
	);
};

/** 宽字距小标签（贴在物体旁边的读数/名字），很小很暗 */
export const Label: React.FC<{
	x: number;
	y: number;
	zh?: string;
	en?: string;
	color?: string;
	opacity?: number;
	align?: 'left' | 'center' | 'right';
	size?: number;
}> = ({x, y, zh, en, color = C.text, opacity = 1, align = 'center', size = 22}) => {
	if (opacity <= 0.001) return null;
	const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `translate(${tx}, -50%)`, opacity, textAlign: align, whiteSpace: 'nowrap'}}>
			{zh ? (
				<div style={{fontFamily: FONT_ZH, fontWeight: 380, fontSize: size, color, letterSpacing: '0.12em'}}>{zh}</div>
			) : null}
			{en ? (
				<div style={{fontFamily: FONT_EN, fontSize: Math.round(size * 0.55), color: C.dim, letterSpacing: '0.34em', marginTop: 4}}>
					{en.toUpperCase()}
				</div>
			) : null}
		</div>
	);
};

/** 片名主字的视觉中心 ≈ y + size*0.72（lineHeight 固定为 1，实测对齐）。ParticleText 的 cy 用这个值即可对齐。 */
export const titleCenterY = (y: number, size = 92) => y + size * 0.72;

/** 片名卡：大字宽字距（逐渐收拢、去模糊）+ 金色副题 + 极小英文。p 是出现进度 0–1，out 是消失进度 0–1 */
export const TitleCard: React.FC<{
	title: string;
	sub?: string;
	en?: string;
	p: number;
	out?: number;
	y?: number;
	size?: number;
	accent?: string;
	titleOpacity?: number; // 用粒子拼片名时，先让粒子当片名，再把这里从 0 拉到 1 做交接
}> = ({title, sub, en, p, out = 0, y = 440, size = 92, accent = C.gold, titleOpacity = 1}) => {
	const a = clamp(p) * (1 - clamp(out));
	if (a <= 0.001) return null;
	const e = easeOut(p);
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', opacity: a}}>
			<div
				style={{
					fontFamily: FONT_ZH,
					fontWeight: 420,
					fontSize: size,
					color: '#f4f2ea',
					letterSpacing: `${0.7 - 0.22 * e}em`,
					filter: `blur(${(1 - e) * 6}px)`,
					textShadow: '0 0 30px rgba(255,236,190,0.35), 0 0 80px rgba(255,220,150,0.18)',
					paddingLeft: `${0.7 - 0.22 * e}em`,
					lineHeight: 1,
					opacity: titleOpacity,
				}}
			>
				{title}
			</div>
			{sub ? (
				<div
					style={{
						fontFamily: FONT_ZH,
						fontWeight: 400,
						fontSize: Math.round(size * 0.34),
						color: accent,
						letterSpacing: '0.6em',
						paddingLeft: '0.6em',
						marginTop: 26,
						opacity: smooth((p - 0.35) / 0.5),
					}}
				>
					{sub}
				</div>
			) : null}
			{en ? (
				<div
					style={{
						fontFamily: FONT_EN,
						fontSize: 14,
						color: C.dim,
						letterSpacing: '0.5em',
						paddingLeft: '0.5em',
						marginTop: 18,
						opacity: smooth((p - 0.55) / 0.45),
					}}
				>
					{en.toUpperCase()}
				</div>
			) : null}
		</div>
	);
};

/** 逐字打出的一行字 + 一闪一闪的光标。t 秒；从 t0 开始，每 cps 字/秒 */
export const Typewriter: React.FC<{
	text: string;
	t: number;
	t0: number;
	cps?: number;
	x?: number;
	y: number;
	size?: number;
	color?: string;
	cursor?: boolean;
	cursorColor?: string;
	opacity?: number;
	weight?: number;
	tracking?: string;
	children?: React.ReactNode; // 打完之后跟在句尾的东西（例如一个空格框）
}> = ({text, t, t0, cps = 5, x, y, size = 56, color = C.text, cursor = true, cursorColor = C.gold, opacity = 1, weight = 340, tracking = '0.12em', children}) => {
	const chars = Array.from(text);
	const n = Math.max(0, Math.min(chars.length, Math.floor((t - t0) * cps)));
	const done = n >= chars.length;
	const blink = Math.floor(t * 2.2) % 2 === 0 ? 1 : 0.15;
	return (
		<div
			style={{
				position: 'absolute',
				left: x ?? 0,
				right: x === undefined ? 0 : undefined,
				top: y,
				textAlign: x === undefined ? 'center' : 'left',
				opacity,
				fontFamily: FONT_ZH,
				fontWeight: weight,
				fontSize: size,
				color,
				letterSpacing: tracking,
				whiteSpace: 'nowrap',
			}}
		>
			{chars.slice(0, n).join('')}
			{done ? children : null}
			{cursor && t >= t0 - 0.6 ? (
				<span style={{display: 'inline-block', width: 3, height: size * 0.95, marginLeft: 6, verticalAlign: '-0.12em', background: cursorColor, opacity: blink, boxShadow: `0 0 12px ${cursorColor}`}} />
			) : null}
		</div>
	);
};

/** 片尾身份标记：最后几秒一行极小的字。用户 2026-10-12：只写模型名，不写「由 Claude 生成」之类的话。 */
export const EndMark: React.FC<{t: number; from: number; text?: string}> = ({t, from, text = 'Opus 5.5'}) => {
	const a = clamp((t - from) / 0.8) * 0.55;
	if (a <= 0) return null;
	return (
		<div style={{position: 'absolute', left: 0, right: 0, bottom: 40, textAlign: 'center', opacity: a, fontFamily: FONT_ZH, fontWeight: 360, fontSize: 17, color: C.dim, letterSpacing: '0.3em'}}>
			{text}
		</div>
	);
};

/** 会呼吸的问号：提问之后留白用（一个金色问号，明暗缓慢起伏）。 */
export const BreathingMark: React.FC<{t: number; t0: number; t1: number; x?: number; y?: number; size?: number; color?: string; char?: string}> = ({
	t,
	t0,
	t1,
	x = 960,
	y = 430,
	size = 120,
	color = C.gold,
	char = '?',
}) => {
	const a = win(t, t0, t1, 1.0, 1.0);
	if (a <= 0) return null;
	const breath = 0.62 + 0.38 * Math.sin((t - t0) * 1.6 - Math.PI / 2);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: 'translate(-50%, -50%)',
				opacity: a * breath,
				fontFamily: FONT_EN,
				fontSize: size,
				color,
				textShadow: `0 0 24px ${color}, 0 0 70px ${color}`,
			}}
		>
			{char}
		</div>
	);
};

/** 发光的大数字 / 读数（衬线），可带一行极小的说明。value 已经是格式化好的字符串。 */
export const Readout: React.FC<{x: number; y: number; value: string; note?: string; size?: number; color?: string; opacity?: number}> = ({
	x,
	y,
	value,
	note,
	size = 120,
	color = '#f6f1e2',
	opacity = 1,
}) => {
	if (opacity <= 0.001) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', textAlign: 'center', opacity}}>
			<div style={{fontFamily: FONT_EN, fontSize: size, color, letterSpacing: '0.04em', textShadow: '0 0 30px rgba(255,230,170,0.35)'}}>{value}</div>
			{note ? <div style={{fontFamily: FONT_ZH, fontWeight: 380, fontSize: 20, color: C.dim, letterSpacing: '0.3em', marginTop: 8}}>{note}</div> : null}
		</div>
	);
};
