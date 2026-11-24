import React from 'react';
import type {Captions} from '../../lib/types';
import {clamp01} from './cam';
import {SANS, SUB_TOP, W} from './theme';

// 底部单行字幕：位置固定，思源黑体 500 / 40 px，白字压在 50% 透明黑底条上。
// 每行从开口时出现，到下一行开始或本行结束后 0.6 秒消失（长停顿时不挂着旧字幕）。
const SIZE = 40;

const charW = (ch: string) => (/[　-鿿＀-￯]/.test(ch) ? SIZE : /\s/.test(ch) ? SIZE * 0.45 : SIZE * 0.58);

export const Subtitles: React.FC<{captions: Captions; t: number}> = ({captions, t}) => {
	const ms = t * 1000;
	const {lines} = captions;
	let i = -1;
	for (let k = 0; k < lines.length; k++) if (lines[k].startMs <= ms) i = k;
	if (i < 0) return null;
	const ln = lines[i];
	const next = lines[i + 1];
	const hideAt = next ? Math.min(next.startMs, ln.endMs + 600) : ln.endMs + 600;
	const a = Math.min(clamp01((ms - ln.startMs + 40) / 120), 1 - clamp01((ms - hideAt) / 150));
	if (a <= 0) return null;
	const text = ln.text;
	const w = [...text].reduce((s, c) => s + charW(c), 0) + 56;
	const cy = SUB_TOP + 72;
	return (
		<div style={{position: 'absolute', left: 0, top: 0, width: W, height: 1080, opacity: a, pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					left: (W - w) / 2,
					top: cy - 34,
					width: w,
					height: 68,
					background: 'rgba(0,0,0,0.5)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 0,
					width: W,
					top: cy - 30,
					height: 60,
					lineHeight: '60px',
					textAlign: 'center',
					fontFamily: SANS,
					fontWeight: 500,
					fontSize: SIZE,
					color: '#f2efe6',
					whiteSpace: 'pre',
				}}
			>
				{text}
			</div>
		</div>
	);
};
