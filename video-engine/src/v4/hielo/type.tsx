import React from 'react';
import {FONT_ZH, clamp} from '../kit';
import type {TW} from './data.gen';

/** 打字进度：已打出的字数（全段计数） */
export const typed = (tw: TW, t: number) => {
	const total = tw.lines.reduce((a, l) => a + Array.from(l).length, 0);
	return Math.max(0, Math.min(total, Math.floor((t - tw.t0) * tw.cps)));
};

/** 每个中文字一格（定宽），这样画布里的光点能对准每个字。返回第 gi 个字的中心。 */
export const cellCenter = (tw: TW, gi: number, size: number, y0: number, lineH: number, adv = size * 1.12): [number, number] => {
	let k = gi;
	for (let li = 0; li < tw.lines.length; li++) {
		const n = Array.from(tw.lines[li]).length;
		if (k < n) return [960 - (n * adv) / 2 + (k + 0.5) * adv, y0 + li * lineH + size * 0.55];
		k -= n;
	}
	return [960, y0];
};

const blink = (t: number) => (Math.floor(t * 2.2) % 2 === 0 ? 1 : 0.15);

/** 中文定宽逐字打出：新打出的字先亮一下再回落。hl(行, 字) 返回高亮色（或 null）。 */
export const TypeZh: React.FC<{
	tw: TW;
	t: number;
	size: number;
	y0: number;
	lineH: number;
	color?: string;
	opacity?: number;
	hl?: (li: number, ci: number) => {color: string; k: number} | null;
	cursor?: string | null;
	weight?: number;
	adv?: number;
	blankColor?: string;
}> = ({tw, t, size, y0, lineH, color = '#ece4d2', opacity = 1, hl, cursor = '#f0d28c', weight = 380, adv = size * 1.12, blankColor}) => {
	if (opacity <= 0.001) return null;
	const n = typed(tw, t);
	let gi = 0;
	let cursorAt: [number, number] | null = null;
	const rows = tw.lines.map((line, li) => {
		const chars = Array.from(line);
		const x0 = 960 - (chars.length * adv) / 2;
		const cells = chars.map((ch, ci) => {
			const idx = gi++;
			if (idx >= n) {
				if (idx === n && cursorAt === null) cursorAt = [x0 + ci * adv, y0 + li * lineH];
				if (blankColor && ch === '　') {
					// 填空格：没打到也先画出下划线（打到才出现）
				}
				return null;
			}
			const age = t - (tw.t0 + idx / tw.cps);
			const fresh = Math.exp(-Math.max(0, age) * 2.6);
			const h = hl ? hl(li, ci) : null;
			const c = h ? h.color : color;
			const glow = 0.25 + 0.75 * fresh + (h ? h.k : 0);
			const isBlank = ch === '　';
			return (
				<div
					key={ci}
					style={{
						position: 'absolute',
						left: x0 + ci * adv,
						top: y0 + li * lineH,
						width: adv,
						textAlign: 'center',
						fontFamily: FONT_ZH,
						fontWeight: weight,
						fontSize: size,
						lineHeight: 1.1,
						color: c,
						opacity: clamp(0.35 + age * 4),
						textShadow: `0 0 ${10 + 26 * glow}px rgba(255,226,170,${0.25 * glow}), 0 0 ${4 + 8 * glow}px ${c}`,
						borderBottom: isBlank && blankColor ? `2px solid ${blankColor}` : undefined,
						height: isBlank && blankColor ? size * 1.05 : undefined,
					}}
				>
					{isBlank ? '' : ch}
				</div>
			);
		});
		return <React.Fragment key={li}>{cells}</React.Fragment>;
	});
	if (cursorAt === null && n >= gi) {
		const lastLine = Array.from(tw.lines[tw.lines.length - 1]);
		cursorAt = [960 + (lastLine.length * adv) / 2, y0 + (tw.lines.length - 1) * lineH];
	}
	const ca = cursorAt as [number, number] | null;
	return (
		<div style={{position: 'absolute', inset: 0, opacity}}>
			{rows}
			{cursor && ca && t >= tw.t0 - 0.5 ? (
				<div style={{position: 'absolute', left: ca[0] + 4, top: ca[1] + size * 0.08, width: 3, height: size * 0.92, background: cursor, opacity: blink(t), boxShadow: `0 0 12px ${cursor}`}} />
			) : null}
		</div>
	);
};

/** 西文打字机：等宽打字机字体，左对齐成块、整体居中（每行宽度不同也不跳） */
export const TypeLatin: React.FC<{
	tw: TW;
	t: number;
	size: number;
	y0: number;
	lineH: number;
	family: string;
	color?: string;
	opacity?: number;
	cursor?: string | null;
	center?: boolean;
	x?: number;
}> = ({tw, t, size, y0, lineH, family, color = '#a59c88', opacity = 1, cursor = null, center = true, x = 0}) => {
	if (opacity <= 0.001) return null;
	let n = typed(tw, t);
	const done = n >= tw.lines.reduce((a, l) => a + Array.from(l).length, 0);
	return (
		<div style={{position: 'absolute', inset: 0, opacity}}>
			{tw.lines.map((line, li) => {
				const chars = Array.from(line);
				const k = Math.max(0, Math.min(chars.length, n));
				n -= chars.length;
				const showCursor = cursor && !done && k < chars.length && k >= 0 && n < 0 && n + chars.length === k;
				return (
					<div
						key={li}
						style={{
							position: 'absolute',
							left: center ? 0 : x,
							right: center ? 0 : undefined,
							top: y0 + li * lineH,
							textAlign: center ? 'center' : 'left',
							fontFamily: family,
							fontSize: size,
							color,
							whiteSpace: 'pre',
							letterSpacing: '0.02em',
							textShadow: '0 0 10px rgba(0,0,0,0.8)',
						}}
					>
						{/* 先放整行的透明占位，保证居中位置不随打字移动 */}
						<span style={{position: 'relative'}}>
							<span style={{opacity: 0}}>{line}</span>
							<span style={{position: 'absolute', left: 0, top: 0}}>
								{chars.slice(0, k).join('')}
								{showCursor ? <span style={{opacity: blink(t), color: cursor || color}}>▌</span> : null}
							</span>
						</span>
					</div>
				);
			})}
		</div>
	);
};
