import React from 'react';
import {interpolateColors} from 'remotion';
import type {Captions} from '../../lib/types';
import {clamp01, easeOut} from './anim';
import {AMBER, CAP, CAP_DIM, CAP_INK, SANS, W} from './theme';

// 底部阅读字幕：一次只显示正在念的一行，逐字由灰变墨；关键词（hl）念到时下面划一道琥珀色手绘线。

type Run = {chars: {t: string; s: number; e: number; gap: boolean}[]; hl: boolean};

const runsOf = (line: Captions['lines'][number]): Run[] => {
	const runs: Run[] = [];
	for (const c of line.chars) {
		const core = c.t.replace(/\s+$/u, '');
		const gap = core.length !== c.t.length;
		const last = runs[runs.length - 1];
		const item = {t: core, s: c.s, e: c.e, gap};
		if (last && last.hl === c.hl && !(last.chars[last.chars.length - 1]?.gap)) last.chars.push(item);
		else runs.push({chars: [item], hl: c.hl});
	}
	return runs;
};

export const CaptionBar: React.FC<{captions: Captions; ms: number; opacity: number}> = ({captions, ms, opacity}) => {
	if (opacity <= 0) return null;
	const {lines} = captions;
	let i = -1;
	for (let k = 0; k < lines.length; k++) {
		if (lines[k].startMs - CAP.lead <= ms) i = k;
		else break;
	}
	if (i < 0) return null;
	const line = lines[i];
	const inK = easeOut(clamp01((ms - (line.startMs - CAP.lead)) / 180));
	const size = CAP.size;
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: CAP.y - size * 0.75,
				width: W,
				textAlign: 'center',
				fontFamily: SANS,
				fontWeight: 700,
				fontSize: size,
				lineHeight: `${size * 1.5}px`,
				color: CAP_INK,
				letterSpacing: '0.02em',
				whiteSpace: 'nowrap',
				opacity: opacity * inK,
				transform: `translateY(${10 * (1 - inK)}px)`,
			}}
		>
			{runsOf(line).map((run, ri) => {
				const s0 = run.chars[0].s;
				const s1 = run.chars[run.chars.length - 1].e;
				const p = run.hl ? clamp01((ms - s0) / Math.max(200, s1 - s0)) : 0;
				const lastGap = run.chars[run.chars.length - 1].gap;
				return (
					<React.Fragment key={ri}>
						<span style={{position: 'relative', display: 'inline-block'}}>
							{run.chars.map((c, ci) => (
								<span key={ci} style={{color: interpolateColors(ms, [c.s, c.s + CAP.fillMs], [CAP_DIM, CAP_INK])}}>
									{c.t}
								</span>
							))}
							{run.hl && p > 0 ? (
								<svg viewBox="0 0 100 14" preserveAspectRatio="none" style={{position: 'absolute', left: -2, right: -2, bottom: -2, height: 14, width: 'calc(100% + 4px)', overflow: 'visible'}}>
									<path d="M2 6 C 20 9, 40 3, 58 7 S 90 4, 98 7" fill="none" stroke={AMBER} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} vectorEffect="non-scaling-stroke" opacity={0.9} />
								</svg>
							) : null}
						</span>
						{lastGap ? <span style={{display: 'inline-block', width: CAP.gapEm * size}} /> : null}
					</React.Fragment>
				);
			})}
		</div>
	);
};
