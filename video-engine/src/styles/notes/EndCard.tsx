import type React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {SAFE} from '../../lib/safe';
import {SANS, SERIF} from '../../lib/fonts';
import type {Measure} from './layout';
import {wrapTextInfo} from './layout';
import {Marker, Pencil} from './parts';
import {CARD, INK, inkA, RED, redA, TEXT_X} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// 手画小箭头
const ARROW = 'M2 14 C 20 12, 38 11, 58 12 M46 3 C 51 7, 55 10, 60 12 C 54 14, 50 18, 46 22';

export const SIGNOFF_H = 200; // 系列名 64 + 间距 22 + CTA 60 + 间距 18 + 声明 32
const END_NOTE = '读书分享，非心理咨询 · 丛非从《养育你内心的小孩》';

/**
 * 落款：—— 系列名（荧光笔刷一下）+「关注我，下期继续聊 →」。
 * t = 进入落款后的毫秒数，dur = 全部写完的时长（尾巴短时会被压缩）
 */
export const SignOff: React.FC<{t: number; dur: number; series: string; top: number}> = ({t, dur, series, top}) => {
	if (t < 0) return null;
	const k = (x: number) => x * dur;
	const sA = interpolate(t, [0, k(0.35)], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const sMark = interpolate(t, [k(0.15), k(0.7)], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const cA = interpolate(t, [k(0.35), k(0.75)], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const arrow = interpolate(t, [k(0.55), k(1)], [0, 1], clamp);
	const ctaTop = series ? top + 64 + 22 : top;
	return (
		<>
			{series ? (
				<div
					style={{
						position: 'absolute',
						left: TEXT_X,
						top,
						height: 64,
						display: 'flex',
						alignItems: 'center',
						gap: 20,
						opacity: sA,
						transform: `translateY(${(1 - sA) * 14}px)`,
					}}
				>
					<div style={{width: 56, height: 2.5, background: redA(0.85)}} />
					<div
						style={{
							position: 'relative',
							fontFamily: SERIF,
							fontSize: 52,
							fontWeight: 700,
							letterSpacing: '0.06em',
							color: INK,
							lineHeight: '64px',
							whiteSpace: 'pre',
						}}
					>
						<Marker progress={sMark} variant={2} top="50%" height="0.5em" opacity={0.78} />
						<span style={{position: 'relative', zIndex: 1}}>{series}</span>
					</div>
				</div>
			) : null}
			<div
				style={{
					position: 'absolute',
					left: TEXT_X + (series ? 76 : 0),
					top: ctaTop,
					height: 60,
					display: 'flex',
					alignItems: 'center',
					gap: 18,
					opacity: cA,
					transform: `translateY(${(1 - cA) * 12}px)`,
				}}
			>
				<span style={{fontFamily: SANS, fontSize: 44, fontWeight: 500, letterSpacing: '0.08em', color: inkA(0.82), whiteSpace: 'pre', fontFeatureSettings: '"halt"'}}>
					关注我，下期继续聊
				</span>
				<span style={{position: 'relative', width: 66, height: 26, display: 'inline-block'}}>
					<Pencil d={ARROW} w={62} h={26} width={3.2} progress={arrow} style={{left: 0, top: 0}} />
				</span>
			</div>
			<div
				style={{
					position: 'absolute',
					left: TEXT_X + (series ? 76 : 0),
					top: ctaTop + 60 + 18,
					height: 32,
					lineHeight: '32px',
					fontFamily: SANS,
					fontSize: 24,
					letterSpacing: '0.04em',
					color: inkA(0.5),
					whiteSpace: 'nowrap',
					opacity: cA,
				}}
			>
				{END_NOTE}
			</div>
		</>
	);
};

// ---------- 摘句卡（只有 meta.quote 和最后一句不同时才用） ----------
const CARD_X = TEXT_X + 14; // 110
const CARD_W = SAFE.right - CARD_X - 12; // 758：旋转后仍在安全区内
const PAD_X = 50;
const INNER_W = CARD_W - PAD_X * 2;

// 胶带：两端撕口
const TAPE_CLIP = 'polygon(0% 12%, 4% 0%, 8% 14%, 12% 2%, 88% 4%, 92% 16%, 96% 0%, 100% 10%, 97% 50%, 100% 88%, 95% 100%, 90% 86%, 85% 100%, 12% 96%, 7% 84%, 3% 100%, 0% 90%, 3% 50%)';

export const excerptLayout = (quote: string, m: Measure) => {
	// 按标点折行；从 56 往下找一个不用硬切语块、最多 3 行、末行不只剩一两个字的字号
	let size = 56;
	let lines: string[] = [];
	for (let s = 56; s >= 42; s -= 2) {
		const w = wrapTextInfo(quote, INNER_W, s, m);
		size = s;
		lines = w.lines;
		const tail = Array.from(lines[lines.length - 1] ?? '').length;
		if (!w.hard && lines.length <= 3 && (lines.length === 1 || tail >= 3)) break;
	}
	const lineH = Math.round(size * 1.6);
	const cardH = 60 + 40 + lines.length * lineH + 26 + 44 + 40;
	return {size, lines, lineH, cardH};
};

/**
 * 摘句卡。source='book'（meta.quoteSource）时标「摘记」并署名「—— 《书名》 P.xx」；
 * 否则是主播自己的话，标「本期笔记」、不署名（不能把自己的话挂在书名下面）。
 */
export const ExcerptCard: React.FC<{
	t: number; // 卡片出现后的毫秒数
	fps: number;
	build: number; // 摘句写完的目标时长
	quote: string;
	fromBook: boolean;
	book: string;
	page?: string;
	top: number;
	measure500: Measure;
}> = ({t, fps, build, quote, fromBook, book, page, top, measure500}) => {
	if (t < 0) return null;
	const frame = (t / 1000) * fps;
	const enter = spring({frame, fps, config: {damping: 18, stiffness: 150, mass: 0.8}});
	const cardOpacity = interpolate(t, [0, 67], [0, 1], clamp);
	const {size, lines, lineH, cardH} = excerptLayout(quote, measure500);
	const total = lines.reduce((n, l) => n + Array.from(l).length, 0);
	const writeStart = 60;
	const CHAR_FADE = 160;
	const step = Math.min(40, Math.max(8, (build - writeStart - CHAR_FADE) / Math.max(1, total)));
	const writeEnd = writeStart + total * step + CHAR_FADE;
	const attrib = fromBook ? `—— ${book}${page ? `  P.${page}` : ''}` : '';
	const attribT = interpolate(t, [writeEnd - 120, writeEnd + 160], [0, 1], clamp);
	let k = 0;
	return (
		<div
			style={{
				position: 'absolute',
				left: CARD_X,
				top,
				width: CARD_W,
				height: cardH,
				opacity: cardOpacity,
				transform: `translateY(${(1 - enter) * 90}px) rotate(${-3.6 + enter * 2.4}deg)`,
				transformOrigin: '50% 30%',
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: CARD,
					borderRadius: 4,
					border: `1px solid ${inkA(0.07)}`,
					boxShadow: '0 22px 44px -18px rgba(70,45,20,0.30), 0 3px 8px rgba(70,45,20,0.08)',
					backgroundImage: `linear-gradient(to bottom, transparent ${lineH - 1.5}px, rgba(96,118,138,0.16) ${lineH - 1.5}px, rgba(96,118,138,0.16) ${lineH}px)`,
					backgroundSize: `100% ${lineH}px`,
					backgroundPosition: `0 ${100 + Math.round(lineH * 0.06)}px`,
					backgroundRepeat: 'repeat-y',
				}}
			/>
			<div style={{position: 'absolute', left: 0, right: 0, top: 92, height: 1.5, background: redA(0.35)}} />
			<div
				style={{
					position: 'absolute',
					left: CARD_W / 2 - 100,
					top: -26,
					width: 200,
					height: 52,
					background: 'rgba(246,211,101,0.62)',
					clipPath: TAPE_CLIP,
					transform: 'rotate(3deg)',
					mixBlendMode: 'multiply',
				}}
			/>
			<div style={{position: 'absolute', left: PAD_X, top: 40, fontFamily: SANS, fontSize: 28, fontWeight: 500, letterSpacing: '0.3em', color: redA(0.9)}}>
				{fromBook ? '摘记' : '本期笔记'}
			</div>
			<div style={{position: 'absolute', left: PAD_X, top: 100, width: INNER_W}}>
				{lines.map((l, li) => (
					<div key={li} style={{fontFamily: SERIF, fontWeight: 500, fontSize: size, lineHeight: `${lineH}px`, color: INK, whiteSpace: 'pre'}}>
						{Array.from(l).map((ch, ci) => {
							const at = writeStart + k++ * step;
							const a = interpolate(t, [at, at + CHAR_FADE], [0, 1], clamp);
							return (
								<span key={ci} style={{display: 'inline-block', opacity: a, transform: `translateY(${(1 - a) * 4}px)`}}>
									{ch}
								</span>
							);
						})}
					</div>
				))}
			</div>
			{attrib ? (
				<div
					style={{
						position: 'absolute',
						right: PAD_X,
						bottom: 40,
						fontFamily: SERIF,
						fontSize: 32,
						fontWeight: 500,
						color: RED,
						opacity: attribT,
						letterSpacing: '0.04em',
						whiteSpace: 'pre',
						fontFeatureSettings: '"halt"',
					}}
				>
					{attrib}
				</div>
			) : null}
		</div>
	);
};
