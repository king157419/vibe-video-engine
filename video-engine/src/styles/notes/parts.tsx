import type React from 'react';
import {AbsoluteFill, Img, random, staticFile} from 'remotion';
import {SANS, SERIF} from '../../lib/fonts';
import {H, W} from '../../lib/safe';
import {
	CHAPTER_TOP,
	FADE_TOP,
	HEAD_RULE,
	HEAD_TOP,
	INK,
	inkA,
	MARGIN_X,
	MARK,
	MASK_CLEAR,
	MASK_SOLID,
	NOTES_TOP,
	PT_LH,
	PT_TOP,
	RED,
	redA,
	ROW,
	RULE_Y,
	TEXT_R,
	TEXT_X,
} from './theme';

// ---------- 荧光笔 ----------
// 三种略有差异的手绘笔触（两端毛糙、上下缘有深一点的笔痕），按 seed 选
const MARKER_PATHS = [
	'M4 8 C 52 4, 140 7, 196 5 L 199 12 L 195 20 L 200 29 L 196 36 C 138 39, 62 35, 3 37 L 0 29 L 4 21 L 1 13 Z',
	'M2 6 C 60 7, 130 3, 197 7 L 200 15 L 196 22 L 199 31 L 195 37 C 130 35, 70 38, 4 35 L 1 27 L 5 19 L 0 11 Z',
	'M5 7 C 45 5, 150 5, 195 8 L 198 14 L 200 23 L 196 30 L 198 36 C 150 37, 50 37, 2 36 L 3 28 L 0 20 L 3 12 Z',
];
const markerUrl = (i: number) => {
	const svg =
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 40' preserveAspectRatio='none'>` +
		`<path d='${MARKER_PATHS[i]}' fill='${MARK}'/>` +
		`<path d='M3 10 C 60 9, 140 11, 197 9' stroke='#E9B83C' stroke-width='1.6' opacity='.45' fill='none' vector-effect='non-scaling-stroke'/>` +
		`<path d='M3 33 C 70 35, 150 32, 197 33' stroke='#E9B83C' stroke-width='1.4' opacity='.35' fill='none' vector-effect='non-scaling-stroke'/>` +
		`</svg>`;
	return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
};
const MARKER_URLS = MARKER_PATHS.map((_, i) => markerUrl(i));

/** 放在一个 position:relative 的文字容器里，画在文字后面；progress 0→1 从左往右刷出 */
export const Marker: React.FC<{
	progress: number;
	opacity?: number;
	variant?: number;
	top?: string;
	height?: string;
	left?: string;
	right?: string;
	tilt?: number;
}> = ({progress, opacity = 0.72, variant = 0, top = '52%', height = '0.56em', left = '-0.1em', right = '-0.06em', tilt = -0.6}) => {
	if (progress <= 0) return null;
	return (
		<span
			style={{
				position: 'absolute',
				left,
				right,
				top,
				height,
				backgroundImage: MARKER_URLS[variant % MARKER_URLS.length],
				backgroundSize: '100% 100%',
				opacity,
				mixBlendMode: 'multiply',
				clipPath: `inset(-10% ${(1 - Math.min(1, progress)) * 100}% -10% 0)`,
				transform: `rotate(${tilt}deg)`,
				zIndex: 0,
				pointerEvents: 'none',
			}}
		/>
	);
};

// ---------- 红铅笔笔画 ----------
export const Pencil: React.FC<{
	d: string;
	w: number;
	h: number;
	progress: number;
	width?: number;
	color?: string;
	opacity?: number;
	style?: React.CSSProperties;
}> = ({d, w, h, progress, width = 3.2, color = RED, opacity = 0.88, style}) => {
	if (progress <= 0) return null;
	return (
		<svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: 'absolute', overflow: 'visible', ...style}}>
			<path
				d={d}
				pathLength={1}
				fill="none"
				stroke={color}
				strokeWidth={width}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray="1 1"
				strokeDashoffset={1 - Math.min(1, progress)}
				opacity={opacity}
			/>
		</svg>
	);
};

// ---------- 红铅笔圆点（句组开头的项目符号） ----------
// 手点上去的小墨点：不是正圆，略带一点拖尾
const DOT = 'M7.4 1.2 C 10.9 1.0, 13.6 3.6, 13.5 7.2 C 13.4 10.6, 10.6 13.3, 7.0 13.1 C 3.4 12.9, 0.9 10.3, 1.1 6.8 C 1.3 3.7, 3.9 1.4, 7.4 1.2 Z';
export const Dot: React.FC<{progress: number; opacity?: number; style?: React.CSSProperties}> = ({progress, opacity = 0.6, style}) => {
	if (progress <= 0) return null;
	const p = Math.min(1, progress);
	return (
		<svg width={14} height={14} viewBox="0 0 14 14" style={{position: 'absolute', overflow: 'visible', ...style}}>
			<path d={DOT} fill={RED} opacity={opacity * p} transform={`translate(7 7) scale(${0.35 + 0.65 * p}) translate(-7 -7)`} />
		</svg>
	);
};

/** 手绘下划线（略带弧度和收笔） */
export const underlinePath = (w: number, seed = 0) => {
	const a = 2 + (seed % 3);
	return `M2 ${6 + a * 0.4} C ${w * 0.3} ${3 + a * 0.3}, ${w * 0.65} ${7 - a * 0.5}, ${w - 2} ${4 + a * 0.2}`;
};

/** 红铅笔划线：略有起伏，收笔微微上挑 */
const ulPath = (w: number, seed: number) => {
	const r = (k: string) => random(`ul-${seed}-${k}`) - 0.5;
	const y0 = 6 + r('a') * 2;
	return `M0 ${y0} C ${w * 0.28} ${y0 - 1.6 + r('b') * 1.5}, ${w * 0.62} ${y0 + 1.8 + r('c') * 1.5}, ${w} ${y0 - 1.2 + r('d') * 1.2} L ${w + 6} ${y0 - 4.5}`;
};

/** 书名线：小波浪 */
const wavyPath = (w: number) => {
	const step = 13;
	const n = Math.max(2, Math.round(w / step));
	const dx = w / n;
	let d = `M0 5`;
	for (let i = 0; i < n; i++) {
		const x = i * dx;
		d += ` Q ${x + dx / 2} ${i % 2 ? 9 : 1}, ${x + dx} 5`;
	}
	return d;
};

/** 手绘圈：略歪的椭圆，首尾交叠一小段 */
export const penCircle = (w: number, h: number, seed: number) => {
	const r = (k: string) => random(`ci-${seed}-${k}`) - 0.5;
	const cx = w / 2;
	const cy = h / 2;
	const rx = w / 2;
	const ry = h / 2;
	const pts: string[] = [];
	const N = 28;
	const start = -2.5 + r('s') * 0.3; // 从左上方起笔
	const sweep = Math.PI * 2 * 1.1;
	for (let i = 0; i <= N; i++) {
		const a = start + (sweep * i) / N;
		const k = 1 + 0.05 * Math.sin(a * 2 + r('p') * 3) + (i / N) * 0.06; // 越画越外扩一点
		const x = cx + Math.cos(a) * rx * k;
		const y = cy + Math.sin(a) * ry * k + r('t') * 2;
		pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
	}
	return pts.join(' ');
};

/** 一行笔记里的红铅笔批注（坐标相对正文框） */
export const AccentMark: React.FC<{kind: 'ul' | 'circle' | 'book'; x0: number; x1: number; fontSize: number; progress: number; opacity: number; seed: number}> = ({
	kind,
	x0,
	x1,
	fontSize,
	progress,
	opacity,
	seed,
}) => {
	if (progress <= 0) return null;
	const w = Math.max(10, x1 - x0);
	// 汉字字身底边约在行高中线 + 0.42em；横线在 RULE_Y
	const base = ROW / 2 + fontSize * 0.43;
	if (kind === 'circle') {
		const padX = fontSize * 0.16;
		const top = ROW / 2 - fontSize * 0.62;
		const h = fontSize * 1.24;
		return (
			<Pencil
				d={penCircle(w + padX * 2, h, seed)}
				w={w + padX * 2}
				h={h}
				progress={progress}
				width={3}
				opacity={0.82 * opacity}
				style={{left: x0 - padX, top}}
			/>
		);
	}
	if (kind === 'book') {
		return <Pencil d={wavyPath(w)} w={w} h={10} progress={progress} width={2.2} opacity={0.8 * opacity} style={{left: x0, top: Math.min(RULE_Y - 9, base + 1)}} />;
	}
	return <Pencil d={ulPath(w, seed)} w={w} h={12} progress={progress} width={3} opacity={0.78 * opacity} style={{left: x0 - 2, top: Math.min(RULE_Y - 10, base)}} />;
};

// ---------- 纸 + 横线 + 页边线 ----------
export const Paper: React.FC = () => (
	<AbsoluteFill style={{backgroundColor: '#F4EDE1'}}>
		<Img src={staticFile('styles/notes/paper.jpg')} style={{width: W, height: H, position: 'absolute', inset: 0}} />
	</AbsoluteFill>
);

export const RuledLines: React.FC<{scrollPx: number}> = ({scrollPx}) => {
	const top = NOTES_TOP - FADE_TOP;
	const off = NOTES_TOP + RULE_Y - scrollPx - top - ROW + 1.5;
	const pos = ((off % ROW) + ROW) % ROW;
	const line = 'rgba(96,118,138,0.20)'; // 淡灰蓝：笔记本横线，和暖纸形成一点冷暖对比
	const mask = `linear-gradient(to bottom, transparent ${MASK_CLEAR - top}px, #000 ${MASK_SOLID - top}px)`;
	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top,
					bottom: 0,
					backgroundImage: `linear-gradient(to bottom, transparent ${ROW - 1.5}px, ${line} ${ROW - 1.5}px, ${line} ${ROW}px)`,
					backgroundSize: `100% ${ROW}px`,
					backgroundPosition: `0 ${pos}px`,
					WebkitMaskImage: mask,
					maskImage: mask,
				}}
			/>
			{/* 红色页边线（双线） */}
			<div style={{position: 'absolute', left: MARGIN_X, top: HEAD_RULE - 6, bottom: 0, width: 1.6, background: redA(0.34)}} />
			<div style={{position: 'absolute', left: MARGIN_X + 5, top: HEAD_RULE - 6, bottom: 0, width: 1, background: redA(0.18)}} />
		</>
	);
};

// ---------- 页眉 ----------
export const Header: React.FC<{
	book: string;
	author: string;
	chapter?: string;
	ep?: string;
	extras: number; // 章节/页码的出现进度 0..1
	chapterW: number;
}> = ({book, author, chapter, ep, extras, chapterW}) => {
	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: TEXT_X,
					top: HEAD_TOP,
					fontFamily: SERIF,
					fontSize: 34,
					fontWeight: 500,
					lineHeight: '48px',
					color: inkA(0.84),
					whiteSpace: 'pre',
					// halt：书名号/间隔号只占半格，不再在「》 · 」处留一大块空
					fontFeatureSettings: '"halt"',
				}}
			>
				{book}
				<span style={{color: inkA(0.45), fontWeight: 400}}>{' · '}</span>
				<span style={{fontWeight: 400, color: inkA(0.7)}}>{author}</span>
			</div>
			{ep ? (
				<div
					style={{
						position: 'absolute',
						right: 1080 - TEXT_R,
						top: HEAD_TOP - 3,
						display: 'flex',
						alignItems: 'baseline',
						gap: 8,
						opacity: extras,
					}}
				>
					<span style={{fontFamily: SANS, fontSize: 26, fontWeight: 500, letterSpacing: '0.1em', color: inkA(0.6)}}>{/^\d+$/.test(ep) ? 'EP' : ''}</span>
					<span style={{fontFamily: SERIF, fontSize: 40, fontWeight: 600, color: RED, lineHeight: '52px'}}>{ep}</span>
				</div>
			) : null}
			{/* 书眉双线 */}
			<div style={{position: 'absolute', left: TEXT_X, width: TEXT_R - TEXT_X, top: HEAD_RULE, height: 2, background: inkA(0.32)}} />
			<div style={{position: 'absolute', left: TEXT_X, width: TEXT_R - TEXT_X, top: HEAD_RULE + 6, height: 1, background: inkA(0.16)}} />
			{chapter ? (
				<div
					style={{
						position: 'absolute',
						left: TEXT_X,
						top: CHAPTER_TOP,
						fontFamily: SERIF,
						fontSize: 28,
						fontWeight: 600,
						lineHeight: '40px',
						letterSpacing: '0.06em',
						color: RED,
						opacity: Math.min(1, extras * 1.4),
						whiteSpace: 'pre',
					}}
				>
					{chapter}
					<Pencil d={underlinePath(chapterW + 8, 1)} w={chapterW + 8} h={12} width={2.4} progress={extras} style={{left: -2, top: 36}} />
				</div>
			) : null}
		</>
	);
};

/** 常驻的本期标题（封面大标题缩上来的样子）：一行，粗衬线，钩子那半句带一道淡荧光 */
export const PageTitle: React.FC<{text: string; mark: string; size: number; ls: number; opacity: number}> = ({text, mark, size, ls, opacity}) => {
	if (opacity <= 0 || !text) return null;
	const at = mark ? text.lastIndexOf(mark) : -1;
	const before = at >= 0 ? text.slice(0, at) : text;
	const marked = at >= 0 ? mark : '';
	const after = at >= 0 ? text.slice(at + mark.length) : '';
	return (
		<div
			style={{
				position: 'absolute',
				left: TEXT_X,
				top: PT_TOP,
				fontFamily: SERIF,
				fontWeight: 800,
				fontSize: size,
				lineHeight: `${PT_LH}px`,
				letterSpacing: `${ls}em`,
				color: INK,
				whiteSpace: 'pre',
				opacity,
				fontFeatureSettings: '"halt"',
			}}
		>
			{before}
			{marked ? (
				<span style={{position: 'relative', display: 'inline-block'}}>
					<Marker progress={1} opacity={0.62} variant={1} top="52%" height="0.44em" left="-0.06em" right="0.02em" tilt={-0.5} />
					<span style={{position: 'relative', zIndex: 1}}>{marked}</span>
				</span>
			) : null}
			{after}
		</div>
	);
};
