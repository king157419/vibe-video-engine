// 段 5 反驳 + 合理内核 · 记录 04 秒表（K7，B31–B36）：两个圆形视野在原位压扁成两根“室温秒表”条。
// 二审 S6：段末不再缩成右上角的无字迷你条，两根条随段落淡出；残影改成两条改好的链（cards.tsx）。
import React from 'react';
import type {Numbers, Timeline} from './data';
import {Calendar, Cross, Icon, Pause, Rewind, Stopwatch} from './icons';
import type {Shape} from './micro';
import {C, SANS, SERIF} from './theme';
import {easeOut, fade, lin, mix, pop, pulse, ramp} from './util';

export const BAR = {x0: 200, px: 62, aY: 385, bY: 565, h: 70};
export const barShapes = (num: Numbers): {A: Shape; B: Shape} => {
	const wA = num.stopwatch.A.calendar_h * BAR.px;
	const wB = num.stopwatch.B.calendar_h * BAR.px;
	return {
		A: {cx: BAR.x0 + wA / 2, cy: BAR.aY, w: wA, h: BAR.h, rx: 14},
		B: {cx: BAR.x0 + wB / 2, cy: BAR.bY, w: wB, h: BAR.h, rx: 14},
	};
};

const Seg: React.FC<{x0: number; x1: number; y: number; warm: boolean; hi?: number; op?: number; dx?: number}> = ({x0, x1, y, warm, hi = 0, op = 1, dx = 0}) => {
	if (x1 - x0 < 0.5) return null;
	return (
		<rect
			x={x0 + dx}
			y={y - BAR.h / 2}
			width={x1 - x0}
			height={BAR.h}
			rx={10}
			fill={warm ? C.warm : C.coldBar}
			stroke={warm ? C.warmEdge : C.coldEdge}
			strokeWidth={3 + 4 * hi}
			opacity={op}
		/>
	);
};

export const StopwatchScene: React.FC<{T: Timeline; t: number; num: Numbers}> = ({T, t, num}) => {
	const px = BAR.px;
	const hA = num.stopwatch.A.room_h;
	const hBroom = num.stopwatch.B.room_h;
	const hBcal = num.stopwatch.B.calendar_h;
	const segIn = lin(t, T.suoYi + 0.85, T.suoYi + 1.3);
	const labelsOp = 1;
	const calHi = fade(t, T.riLi1, T.shiWenMiaoBiao, 0.3, 0.4);
	const calKeep = Math.max(calHi, 0.35 * lin(t, T.shiWenMiaoBiao, T.shiWenMiaoBiao + 0.4));
	const roomHi = fade(t, T.shiWenMiaoBiao, Infinity, 0.3);
	// B32：暂停键 / 倒带键
	const pauseOp = pop(t, T.zanTingJian, 0.4);
	// A 现在才放进冰箱：后面接一段冷蓝（标“现在才进冰箱”），演示完约 1.5 秒收回（二审 S7：A 的日历读数始终是 6 小时）
	const appendIn = ramp(t, T.daoDai, 0.5);
	const retract = ramp(t, T.daoDai + 2.0, 0.5);
	const append = appendIn * (1 - retract);
	const appendW = 2 * px * append;
	const rew = fade(t, T.daoDai + 0.2, T.daoDai + 2.0, 0.3, 0.45);
	const shake = Math.sin(lin(t, T.daoDai + 0.45, T.daoDai + 0.95) * Math.PI * 6) * 6 * (t > T.daoDai + 0.45 && t < T.daoDai + 0.95 ? 1 : 0);
	const rewCross = ramp(t, T.daoDai + 1.0, 0.35);
	// B34：一夜算进去 / 漏掉
	const flashB = pulse(t, T.suanJinQu, 0.8);
	const flashA = pulse(t, T.louDiao, 0.8);
	const xA1 = BAR.x0 + hA * px;
	const xBw = BAR.x0 + hBroom * px;
	const xB1 = BAR.x0 + hBcal * px;
	const allOut = 1 - lin(t, T.naiReDeDu1End + 0.4, T.naiReDeDu1End + 0.9);
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: allOut}}>
			<g>
				{/* 行标签、刻度（缩成残影时淡掉） */}
				<g opacity={segIn * labelsOp}>
					<text x={40} y={BAR.aY + 14} fontFamily={SERIF} fontWeight={600} fontSize={40} fill={C.ink}>
						A 桌上
					</text>
					<text x={40} y={BAR.bY + 14} fontFamily={SERIF} fontWeight={600} fontSize={40} fill={C.ink}>
						B 冰箱
					</text>
					{[0, 6, 12, 18, 24].map((v) => (
						<g key={v}>
							<line x1={BAR.x0 + v * px} y1={BAR.bY + 42} x2={BAR.x0 + v * px} y2={BAR.bY + 54} stroke={C.inkSoft} strokeWidth={3} />
							<text x={BAR.x0 + v * px} y={BAR.bY + 92} textAnchor="middle" fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.inkSoft}>
								{v === 24 ? '24 小时' : `${v}`}
							</text>
						</g>
					))}
				</g>
				{/* 条 */}
				<g opacity={segIn}>
					<Seg x0={BAR.x0} x1={xA1} y={BAR.aY} warm hi={roomHi + flashA} dx={shake} />
					<Seg x0={xA1 + 2} x1={xA1 + appendW} y={BAR.aY} warm={false} />
					<Seg x0={BAR.x0} x1={xBw} y={BAR.bY} warm hi={roomHi} />
					<Seg x0={xBw + 2} x1={xB1} y={BAR.bY} warm={false} hi={flashB} op={1 - 0.35 * roomHi * (1 - flashB)} />
				</g>
				{/* 日历：两根条的全长 */}
				<g opacity={calKeep * labelsOp}>
					<rect x={BAR.x0 - 8} y={BAR.aY - BAR.h / 2 - 8} width={xA1 + appendW - BAR.x0 + 16} height={BAR.h + 16} rx={18} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="10 8" />
					<rect x={BAR.x0 - 8} y={BAR.bY - BAR.h / 2 - 8} width={xB1 - BAR.x0 + 16} height={BAR.h + 16} rx={18} fill="none" stroke={C.ink} strokeWidth={3} strokeDasharray="10 8" />
				</g>
				<g opacity={fade(t, T.riLi1, Infinity, 0.3) * labelsOp * (1 - appendIn * (1 - retract))}>
					<Icon x={xA1 + 40} y={BAR.aY} size={40}>
						<Calendar color={C.inkSoft} sw={8} />
					</Icon>
					<text x={xA1 + 66} y={BAR.aY + 13} fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.inkSoft}>
						{`${num.stopwatch.A.calendar_h} 小时`}
					</text>
				</g>
				{/* B32：冷蓝段上的小签 */}
				<g opacity={append}>
					<text x={xA1 + px} y={BAR.aY + BAR.h / 2 + 46} textAnchor="middle" fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.coldInk}>
						现在才进冰箱
					</text>
				</g>
				<g opacity={fade(t, T.riLi1, Infinity, 0.3) * labelsOp}>
					<Icon x={xB1 + 40} y={BAR.bY} size={40}>
						<Calendar color={C.inkSoft} sw={8} />
					</Icon>
					<text x={xB1 + 66} y={BAR.bY + 13} fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.inkSoft}>
						{`${hBcal} 小时`}
					</text>
				</g>
				{/* 室温秒表：只描暖色那一段 */}
				<g opacity={roomHi * labelsOp}>
					<Icon x={xA1 - 64} y={BAR.aY - 70} size={44}>
						<Stopwatch color={C.warmInk} hand={0.5} sw={9} />
					</Icon>
					<text x={xA1 - 34} y={BAR.aY - 52} fontFamily={SANS} fontWeight={700} fontSize={48} fill={C.warmInk}>
						6:00
					</text>
					<Icon x={xBw - 30} y={BAR.bY - 70} size={44}>
						<Stopwatch color={C.warmInk} hand={1 / 12} sw={9} />
					</Icon>
					<text x={xBw} y={BAR.bY - 52} fontFamily={SANS} fontWeight={700} fontSize={48} fill={C.warmInk}>
						1:00
					</text>
				</g>
				{/* B32：暂停键压在冷蓝段上 */}
				{pauseOp > 0 ? (
					<Icon x={(xBw + xB1) / 2} y={BAR.bY} size={58} opacity={Math.min(1, pauseOp)}>
						<Pause color={C.ink} fill={C.ink} sw={4} />
					</Icon>
				) : null}
				{/* B32：倒带键压在 A 的暖色段上，被划掉 */}
				{rew > 0 ? (
					<g opacity={rew * labelsOp}>
						<circle cx={(BAR.x0 + xA1) / 2} cy={BAR.aY} r={40} fill={C.paper} stroke={C.ink} strokeWidth={3} />
						<Icon x={(BAR.x0 + xA1) / 2} y={BAR.aY} size={50}>
							<Rewind color={C.ink} />
						</Icon>
						<Icon x={(BAR.x0 + xA1) / 2} y={BAR.aY} size={86}>
							<Cross u={rewCross} color={C.ink} sw={9} />
						</Icon>
					</g>
				) : null}
			</g>
		</svg>
	);
};

