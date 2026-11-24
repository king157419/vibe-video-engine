import type React from 'react';
import {Easing, interpolate, spring} from 'remotion';
import {SANS, SERIF} from '../../lib/fonts';
import type {Measure} from './layout';
import {Marker, Pencil, penCircle} from './parts';
import {CARD, INK, inkA, RED, redA, TEXT_BOTTOM, TEXT_R, TEXT_X} from './theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const norm = (s: string) => s.replace(/[\s\p{P}\p{S}]/gu, '');

export const CARD_L = TEXT_X;
export const CARD_W = TEXT_R - 6 - CARD_L; // 778：右缘 874，旋转 0.6° 后仍 ≤ 880
const PAD = 28;
const INNER = CARD_W - PAD * 2;
const NUM_D = 32; // 编号圈直径
const NUM_GAP = 6;
const ITEM_GAP = 22;
const HEAD_H = 46;
const ITEM_H = 62;

type Item = {text: string; at: number};

/** 目录卡的排版：一行放得下就一行（字号 38→30），否则两行 */
const plan = (items: Item[], m: Measure) => {
	const widthAt = (its: Item[], size: number) => its.reduce((a, it) => a + NUM_D + NUM_GAP + (m(it.text) / 100) * size, 0) + ITEM_GAP * Math.max(0, its.length - 1);
	for (let s = 40; s >= 32; s -= 2) if (widthAt(items, s) <= INNER) return {rows: [items], size: s};
	const half = Math.ceil(items.length / 2);
	const rows = [items.slice(0, half), items.slice(half)];
	for (let s = 40; s >= 26; s -= 2) if (Math.max(...rows.map((r) => widthAt(r, s))) <= INNER) return {rows, size: s};
	return {rows, size: 26};
};

export const indexCardHeight = (items: Item[], m: Measure) => 24 + HEAD_H + 12 + plan(items, m).rows.length * ITEM_H + 20;
export const indexCardTop = (items: Item[], m: Measure) => TEXT_BOTTOM - 40 - indexCardHeight(items, m);

// 胶带：两端撕口
const TAPE_CLIP = 'polygon(0% 12%, 4% 0%, 8% 14%, 12% 2%, 88% 4%, 92% 16%, 96% 0%, 100% 10%, 97% 50%, 100% 88%, 95% 100%, 90% 86%, 85% 100%, 12% 96%, 7% 84%, 3% 100%, 0% 90%, 3% 50%)';

/**
 * 钉在页脚的目录卡：口播列举到哪一项，卡上就写出哪一项（和正文荧光笔同步），之后一直留到片尾。
 * 片尾：meta.next 对应的那一项被红笔圈出并标「下期」；meta.current 对应的一项带荧光。
 */
export const IndexCard: React.FC<{
	title: string;
	label: string;
	items: Item[];
	ms: number;
	fps: number;
	appearAt: number;
	next?: string;
	nextAt: number;
	current?: number;
	measure600: Measure;
}> = ({title, label, items, ms, fps, appearAt, next, nextAt, current, measure600}) => {
	if (ms < appearAt || !items.length) return null;
	const {rows, size} = plan(items, measure600);
	const h = indexCardHeight(items, measure600);
	const top = indexCardTop(items, measure600);
	const f = ((ms - appearAt) / 1000) * fps;
	const enter = spring({frame: f, fps, config: {damping: 16, stiffness: 140, mass: 0.8}});
	const op = interpolate(ms, [appearAt, appearAt + 140], [0, 1], clamp);
	const headA = interpolate(ms, [appearAt + 120, appearAt + 380], [0, 1], clamp);

	const nextIdx = next ? items.findIndex((it) => norm(it.text) === norm(next) || norm(it.text).includes(norm(next))) : -1;
	const nextP = next ? interpolate(ms, [nextAt, nextAt + 520], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)}) : 0;
	const showNextLabel = !!next;

	let k = 0;
	return (
		<div
			style={{
				position: 'absolute',
				left: CARD_L,
				top,
				width: CARD_W,
				height: h,
				opacity: op,
				transform: `translateY(${(1 - enter) * 40}px) rotate(${-0.6 - (1 - enter) * 1.4}deg)`,
				transformOrigin: '50% 50%',
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					background: CARD,
					borderRadius: 4,
					border: `1px solid ${inkA(0.07)}`,
					boxShadow: '0 16px 30px -18px rgba(70,45,20,0.30), 0 2px 6px rgba(70,45,20,0.07)',
				}}
			/>
			{/* 胶带 */}
			<div
				style={{
					position: 'absolute',
					left: -22,
					top: -14,
					width: 130,
					height: 40,
					background: 'rgba(246,211,101,0.6)',
					clipPath: TAPE_CLIP,
					transform: 'rotate(-9deg)',
					mixBlendMode: 'multiply',
				}}
			/>
			{/* 卡头：标题 + 右侧小字 */}
			<div style={{position: 'absolute', left: PAD, right: PAD, top: 24, height: HEAD_H, display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: headA}}>
				<span style={{fontFamily: SERIF, fontSize: 34, fontWeight: 700, letterSpacing: '0.08em', color: RED, whiteSpace: 'pre'}}>{title}</span>
				<span style={{position: 'relative', display: 'inline-block', whiteSpace: 'pre'}}>
					<span style={{fontFamily: SANS, fontSize: 24, fontWeight: 500, letterSpacing: '0.2em', color: inkA(0.5), opacity: showNextLabel ? 1 - nextP : 1}}>{label}</span>
					{showNextLabel && nextP > 0 ? (
						<span
							style={{
								position: 'absolute',
								right: 0,
								top: '50%',
								transform: `translateY(-50%) rotate(-2deg)`,
								fontFamily: SANS,
								fontSize: 30,
								fontWeight: 600,
								letterSpacing: '0.1em',
								color: RED,
								opacity: nextP,
								fontFeatureSettings: '"halt"',
							}}
						>
							{`下期 · ${next}`}
						</span>
					) : null}
				</span>
			</div>
			<div style={{position: 'absolute', left: PAD, right: PAD, top: 24 + HEAD_H + 4, height: 1.5, background: redA(0.35), opacity: headA}} />
			{/* 条目 */}
			{rows.map((row, ri) => (
				<div key={ri} style={{position: 'absolute', left: PAD, top: 24 + HEAD_H + 12 + ri * ITEM_H, height: ITEM_H, display: 'flex', alignItems: 'center', gap: ITEM_GAP}}>
					{row.map((it) => {
						const idx = k++;
						const a = interpolate(ms, [it.at, it.at + 220], [0, 1], clamp);
						const numP = interpolate(ms, [it.at - 40, it.at + 260], [0, 1], clamp);
						const w = (measure600(it.text) / 100) * size;
						const isNext = idx === nextIdx;
						const isCur = current !== undefined && idx === current - 1;
						return (
							<div key={idx} style={{position: 'relative', display: 'flex', alignItems: 'center', gap: NUM_GAP}}>
								<div style={{position: 'relative', width: NUM_D, height: NUM_D}}>
									<Pencil d={penCircle(NUM_D - 4, NUM_D - 4, idx + 3)} w={NUM_D - 4} h={NUM_D - 4} progress={numP} width={2.2} opacity={0.75} style={{left: 2, top: 2}} />
									<div
										style={{
											position: 'absolute',
											inset: 0,
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontFamily: SANS,
											fontSize: 19,
											fontWeight: 600,
											color: RED,
											opacity: a,
										}}
									>
										{idx + 1}
									</div>
								</div>
								<div
									style={{
										position: 'relative',
										fontFamily: SERIF,
										fontSize: size,
										fontWeight: 600,
										lineHeight: `${ITEM_H}px`,
										color: INK,
										whiteSpace: 'pre',
										opacity: a,
										transform: `translateY(${(1 - a) * 6}px)`,
									}}
								>
									{isCur ? <Marker progress={a} opacity={0.7} variant={idx} top="50%" height="0.5em" /> : null}
									<span style={{position: 'relative', zIndex: 1}}>{it.text}</span>
									{isNext ? (
										<Pencil
											d={penCircle(w + 24, size * 1.28, idx + 11)}
											w={w + 24}
											h={size * 1.28}
											progress={nextP}
											width={3}
											opacity={0.85}
											style={{left: -12, top: ITEM_H / 2 - size * 0.64}}
										/>
									) : null}
								</div>
							</div>
						);
					})}
				</div>
			))}
		</div>
	);
};
