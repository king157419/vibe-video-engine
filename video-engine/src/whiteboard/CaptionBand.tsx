import React from 'react';
import {clamp01} from './camera';
import {C, FONT_SANS, H, STAGE, W} from './theme';
import type {Captions} from './types';

/** 当前时刻正在念的行（行间空隙里保持上一行，直到下一行开始） */
export const activeLineIndex = (captions: Captions, ms: number): number => {
	const {lines} = captions;
	let lo = 0;
	let hi = lines.length;
	while (lo < hi) {
		const mid = (lo + hi) >> 1;
		if (lines[mid].startMs <= ms) lo = mid + 1;
		else hi = mid;
	}
	return lo - 1;
};

/**
 * 底部阅读字幕带（16:9）：纸色底（不透明，画面永远压不到字幕），一行居中，
 * 关键词（captions.json 里 hl=true）念到时加粗，下面扫出一道牛皮纸色记号。
 * 关键词不用四种句尾颜色——那四个颜色只给画面里的句尾用。
 */
export const CaptionBand: React.FC<{captions: Captions; ms: number; size?: number; footnote?: React.ReactNode}> = ({captions, ms, size = 46, footnote}) => {
	const i = activeLineIndex(captions, ms);
	const line = i >= 0 ? captions.lines[i] : null;
	let a = 0;
	let aIn = 1;
	if (line) {
		const next = captions.lines[i + 1];
		// 行尾停顿很长时（>1.2s）提前隐藏
		const hideAt = next ? Math.min(next.startMs, line.endMs + 1200) : line.endMs + 1500;
		aIn = clamp01((ms - line.startMs + 60) / 160);
		const aOut = 1 - clamp01((ms - hideAt) / 200);
		a = Math.min(aIn, aOut);
	}
	return (
		<>
			{/* 字幕带底：上缘纸色渐隐，下面不透明 */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: STAGE.bottom - 18,
					width: W,
					height: H - STAGE.bottom + 18,
					background: `linear-gradient(to bottom, rgba(246,241,230,0) 0px, rgba(246,241,230,0.92) 26px, rgba(246,241,230,0.985) 48px, rgba(246,241,230,0.985) 100%)`,
				}}
			/>
			{line && a > 0 ? (
				<div
					style={{
						position: 'absolute',
						left: 0,
						width: W,
						top: STAGE.bottom + 38,
						textAlign: 'center',
						fontFamily: FONT_SANS,
						fontSize: size,
						lineHeight: `${size * 1.3}px`,
						fontWeight: 500,
						letterSpacing: 2,
						color: C.ink,
						opacity: a,
						transform: `translateY(${(1 - aIn) * 8}px)`,
						whiteSpace: 'nowrap',
					}}
				>
					{line.chars.map((c, k) => {
						const said = ms >= c.s;
						const t = c.t.replace(/\s+$/, '');
						const sp = /\s$/.test(c.t) ? <span style={{display: 'inline-block', width: size * 0.5}} /> : null;
						if (!t) return <span key={k} style={{display: 'inline-block', width: size * 0.5}} />;
						if (!c.hl)
							return (
								<React.Fragment key={k}>
									<span>{t}</span>
									{sp}
								</React.Fragment>
							);
						const u = clamp01((ms - c.s) / Math.max(60, c.e - c.s));
						return (
							<React.Fragment key={k}>
								<span style={{position: 'relative', fontWeight: said ? 800 : 500}}>
									<span
										style={{
											position: 'absolute',
											left: -2,
											right: -2,
											bottom: 4,
											height: 14,
											background: C.hl,
											opacity: 0.95,
											transformOrigin: 'left',
											transform: `scaleX(${u})`,
											borderRadius: 6,
										}}
									/>
									<span style={{position: 'relative'}}>{t}</span>
								</span>
								{sp}
							</React.Fragment>
						);
					})}
				</div>
			) : null}
			{footnote}
		</>
	);
};
