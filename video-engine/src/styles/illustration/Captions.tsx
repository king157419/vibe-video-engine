import React from 'react';
import {Easing, interpolate, interpolateColors} from 'remotion';
import {SANS} from '../../lib/fonts';
import type {CapLine} from '../../lib/types';
import {type LineLayout, SPACE_EM, type Unit} from './layout';

export const WARM = '#FFD48A';
// 还没念到的字：亮图（如晨光床单）上也要读得清，观众会抢在声音前面读
const DIM = 'rgba(255,255,255,0.62)';
export const CTX_SIZE = 36; // 上一行（同一句的前半句）缩小后的字号
const CTX_FADE = 0.25; // 上下文行的透明度损失
const GAP = 16;
// 关键词：暖金色在暖棕底上对比偏弱 → 深暖色阴影托底 + 点亮瞬间轻轻一弹
const KW_SHADOW = '0 2px 12px rgba(40,18,0,0.75), 0 0 3px rgba(40,18,0,0.6)';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Glyphs: React.FC<{unit: Unit; ms: number}> = ({unit, ms}) => (
	<>
		{unit.glyphs.map((g, i) => {
			const p = interpolate(ms, [g.s - 40, g.s + 110], [0, 1], clamp);
			return (
				<span
					key={i}
					style={{
						display: 'inline-block',
						color: interpolateColors(p, [0, 1], [DIM, g.hl ? WARM : '#FFFFFF']),
						transform: `translateY(${(1 - p) * 5}px)`,
						textShadow: g.hl && p > 0 ? KW_SHADOW : undefined,
					}}
				>
					{g.core}
				</span>
			);
		})}
	</>
);

const Keyword: React.FC<{unit: Unit; ms: number}> = ({unit, ms}) => {
	const first = unit.glyphs[0];
	const last = unit.glyphs[unit.glyphs.length - 1];
	const pk = interpolate(ms, [first.s, Math.max(first.s + 1, last.e)], [0, 1], {
		...clamp,
		easing: Easing.out(Easing.quad),
	});
	// 1.0 → 1.08 → 1.04（约 250ms），以字底为原点，不挤动整行排版
	const pop = interpolate(ms, [first.s - 30, first.s + 110, first.s + 280], [1, 1.08, 1.04], {
		...clamp,
		easing: Easing.inOut(Easing.quad),
	});
	return (
		<span
			style={{
				display: 'inline-block',
				position: 'relative',
				transform: `scale(${pop})`,
				transformOrigin: '50% 100%',
			}}
		>
			<Glyphs unit={unit} ms={ms} />
			{/* 下划线，随念的进度画出来 */}
			<span
				style={{
					position: 'absolute',
					left: '4%',
					right: '6%',
					bottom: '0.01em',
					height: '0.09em',
					borderRadius: 99,
					background: WARM,
					boxShadow: '0 1px 5px rgba(40,18,0,0.6)',
					transform: `scaleX(${pk})`,
					transformOrigin: '0% 50%',
					opacity: pk > 0 ? 1 : 0,
				}}
			/>
		</span>
	);
};

export const LineView: React.FC<{layout: LineLayout; ms: number}> = ({layout, ms}) => {
	const {letterSpacing, lineHeight, rows, rowSizes} = layout;
	return (
		<div
			style={{
				fontFamily: SANS,
				fontWeight: 700,
				letterSpacing: `${letterSpacing}em`,
				textAlign: 'center',
				whiteSpace: 'nowrap',
				textShadow: '0 2px 10px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.45)',
			}}
		>
			{rows.map((row, r) => {
				const size = rowSizes[r];
				const kicker = size < layout.fontSize;
				return (
					<div
						key={r}
						style={{
							fontSize: size,
							lineHeight,
							height: size * lineHeight,
							// 抵消最后一个字的字距，让整行视觉居中
							paddingLeft: `${letterSpacing}em`,
							opacity: kicker ? 0.94 : 1,
						}}
					>
						{row.map((u, i) => (
							<React.Fragment key={i}>
								{u.hl ? <Keyword unit={u} ms={ms} /> : <Glyphs unit={u} ms={ms} />}
								{u.space && i < row.length - 1 ? (
									<span style={{display: 'inline-block', width: `${SPACE_EM}em`}} />
								) : null}
							</React.Fragment>
						))}
					</div>
				);
			})}
		</div>
	);
};

/** 片尾：最后一句不退场，而是上浮、略缩，成为片尾卡的「题记」 */
export type Finale = {start: number; lift: number; scale: number; dur: number};

/**
 * 每行离开主位置的方式与时刻（纯时间计算）：
 * - 句末行：下一句开始前轻轻上浮淡出（fade）
 * - 句中行（同一句还没说完）：在两行之间的停顿里缩小、上移，留作上下文（ctx）
 *   —— 移动从「最后一个字念完 +20ms」和「下一行开始前 260ms」中较晚者开始，
 *   保证新行可见（不透明度 > 0.15）之前旧行已经完全让出位置，不会叠字。
 */
type Exit = {kind: 'fade' | 'ctx'; start: number; end: number};

const exitOf = (lines: CapLine[], i: number): Exit | null => {
	const line = lines[i];
	const next = lines[i + 1];
	if (!next) return null;
	const n = next.startMs;
	if (line.sentenceEnd) {
		const start = Math.max(n - 260, Math.min(line.endMs + 60, n - 100));
		return {kind: 'fade', start, end: n - 40};
	}
	const start = Math.min(Math.max(line.endMs + 20, n - 260), n);
	return {kind: 'ctx', start, end: Math.max(start + 80, n + 60)};
};

/**
 * 字幕区：只显示当前行；如果当前行是一句话的后半句，前半句缩小退到上方做上下文。
 * 每行的状态都由绝对时间算出（进场 / 变成上下文 / 退场），底边锚定在字幕基线。
 */
export const CaptionStack: React.FC<{
	lines: CapLine[];
	layouts: LineLayout[];
	active: number;
	ms: number;
	finale: Finale | null;
}> = ({lines, layouts, active, ms, finale}) => {
	const items: React.ReactNode[] = [];
	const from = Math.max(0, active - 2);
	const to = Math.min(lines.length - 1, active + 1);
	const lastIdx = lines.length - 1;
	// 进入片尾后：除最后一句外全部淡出；最后一句上浮成题记
	const outro = finale ? interpolate(ms, [finale.start - 60, finale.start + 220], [0, 1], clamp) : 0;
	const rise = finale
		? interpolate(ms, [finale.start, finale.start + finale.dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)})
		: 0;

	const push = (key: string, layout: LineLayout, opacity: number, lift: number, scale: number) => {
		if (opacity <= 0.005) return;
		items.push(
			<div
				key={key}
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: 0,
					transformOrigin: '50% 100%',
					transform: `translateY(${-lift}px) scale(${scale})`,
					opacity,
				}}
			>
				<LineView layout={layout} ms={ms} />
			</div>,
		);
	};

	for (let i = from; i <= to; i++) {
		const line = lines[i];
		const L = layouts[i];
		const s = line.startMs;

		// 进场：前一行要退成上下文时，等它先让开（约晚 60ms），否则提前 40ms 淡入
		const prevExit = i > 0 ? exitOf(lines, i - 1) : null;
		const enterStart = prevExit?.kind === 'ctx' ? Math.max(s + 20, prevExit.end - 50) : s - 40;
		const enter = interpolate(ms, [enterStart, enterStart + 280], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
		let opacity = enter;
		let lift = -(1 - enter) * 22; // 从下方 22px 浮上来
		let scale = 1;

		// 最后一句：片尾时上浮成题记
		if (i === lastIdx && finale) {
			push(`l${i}`, L, opacity, lift + finale.lift * rise, 1 + (finale.scale - 1) * rise);
			continue;
		}
		// 其余行（比如同一句的前半句）跟着题记一起上移、淡出，不被它穿过
		const finaleLift = finale ? finale.lift * rise : 0;
		if (finale) opacity *= 1 - outro;

		const ex = exitOf(lines, i);
		if (ex && ms >= ex.start - 1) {
			if (ex.kind === 'fade') {
				// 一句话说完、下一句开始：先轻轻上浮淡出，再让新行进场，避免叠字
				const o = interpolate(ms, [ex.start, ex.end], [1, 0], clamp);
				opacity *= o;
				lift += 30 * (1 - o);
			} else {
				// 同一句的前半句（单行或多行）：整块缩小、上移，留作上下文；字不消失，不会闪
				const k = interpolate(ms, [ex.start, ex.end], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
				const target = layouts[i + 1].height + GAP;
				scale = 1 + (Math.min(1, CTX_SIZE / L.fontSize) - 1) * k;
				// 再下一行把「下一行」推走时，这条上下文先淡出
				const ex2 = exitOf(lines, i + 1);
				const o2 = ex2 ? interpolate(ms, [ex2.start - 100, ex2.start + 140], [1, 0], clamp) : 1;
				lift = k * target + 36 * (1 - o2);
				opacity *= (1 - CTX_FADE * k) * o2;
			}
		}
		push(`l${i}`, L, opacity, lift + finaleLift, scale);
	}
	return <>{items}</>;
};
