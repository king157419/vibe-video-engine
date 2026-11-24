import React from 'react';
import {interpolateColors} from 'remotion';
import {SANS} from '../../lib/fonts';
import {clamp01, easeOut, progress} from './anim';
import type {CPage} from './capLayout';
import {pageAt} from './capLayout';
import {drawGeo} from './rough';
import {AMBER, CAP, CAP_DIM, CAP_INK, SAFE_CX} from './theme';

// 底部字幕：只显示当前句组，逐字由灰变墨（卡拉 OK），关键词念到时下面用琥珀色笔划一道。

const LEAD = 110;
const OUT_MS = 100;
const IN_DELAY = 70;
const XFADE = 190;

const PageView: React.FC<{page: CPage; ms: number; alpha: number; dy: number}> = ({page, ms, alpha, dy}) => {
	const size = page.size;
	const lh = size * CAP.lineH;
	const blockH = page.rows.length * lh;
	const top = (CAP.top + CAP.bottom) / 2 - blockH / 2;
	return (
		<div style={{position: 'absolute', left: 0, top: 0, width: '100%', opacity: alpha, transform: `translateY(${dy}px)`}}>
			{page.rows.map((row, ri) => {
				const left = SAFE_CX - row.width / 2;
				const rowTop = top + ri * lh;
				return (
					<div key={ri} style={{position: 'absolute', left, top: rowTop, height: lh, width: row.width + 4}}>
						{/* 关键词下划线（在字下面） */}
						{row.lines.map((u, k) => {
							const p = progress(ms, u.t0, u.t1 - u.t0);
							if (p <= 0) return null;
							const {ds} = drawGeo(u.geo, p, 0.08);
							return (
								<svg
									key={k}
									width={u.w}
									height={16}
									viewBox={`0 0 ${u.w} 16`}
									style={{position: 'absolute', left: u.x, top: lh / 2 + size * 0.5 - 2, overflow: 'visible'}}
								>
									{ds.map((d, j) => (
										<path key={j} d={d} stroke={AMBER} strokeWidth={j === 0 ? 7 : 5} strokeLinecap="round" fill="none" opacity={0.92} />
									))}
								</svg>
							);
						})}
						<div
							style={{
								position: 'relative',
								fontFamily: SANS,
								fontWeight: 700,
								fontSize: size,
								lineHeight: `${lh}px`,
								whiteSpace: 'pre',
								color: CAP_INK,
							}}
						>
							{row.toks.map((t, i) => (
								<React.Fragment key={i}>
									<span style={{color: interpolateColors(ms, [t.s, t.s + CAP.fillMs], [CAP_DIM, CAP_INK])}}>{t.core}</span>
									{t.gap && i < row.toks.length - 1 ? <span style={{display: 'inline-block', width: CAP.gapEm * size}} /> : null}
								</React.Fragment>
							))}
						</div>
					</div>
				);
			})}
		</div>
	);
};

export const CaptionBlock: React.FC<{pages: CPage[]; ms: number; opacity: number}> = ({pages, ms, opacity}) => {
	if (opacity <= 0) return null;
	const i = pageAt(pages, ms, LEAD);
	if (i < 0) return null;
	const cur = pages[i];
	// 先让旧的一屏快速淡出，新的一屏稍后从下方浮上来：两屏几乎不重叠，避免字叠字
	const t = ms - (cur.start - LEAD);
	const outK = clamp01(t / OUT_MS);
	const inK = i === 0 ? 1 : easeOut(clamp01((t - IN_DELAY) / XFADE));
	const prev = i > 0 && outK < 1 ? pages[i - 1] : null;
	return (
		<div style={{position: 'absolute', inset: 0, opacity}}>
			{prev ? <PageView page={prev} ms={ms} alpha={1 - outK} dy={-8 * outK} /> : null}
			{inK > 0 ? <PageView page={cur} ms={ms} alpha={inK} dy={14 * (1 - inK)} /> : null}
		</div>
	);
};
