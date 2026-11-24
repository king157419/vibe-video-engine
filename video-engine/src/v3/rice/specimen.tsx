// 米饭视野里的固定布局（单位坐标，视野半径 300）：认零件段和双视野段用同一份，保证“两碗起点相同”。
import React from 'react';
import {C, SANS} from './theme';
import {textW} from './util';

/** 会发芽的芽孢（中间那颗是 B14 里那个蜡样芽孢杆菌结出来的） */
export const GERM = [
	{x: 0, y: 0},
	{x: -172, y: -92},
	{x: 38, y: -192},
	{x: 188, y: -46},
	{x: 118, y: 156},
	{x: -122, y: 146},
];
/** 一直没发芽的芽孢（回锅后还在：左碗约 10 个/克） */
export const DORMANT = [
	{x: 214, y: 118},
	{x: -222, y: 34},
];
export const SPORE_ANGLE = [0.3, -0.5, 1.1, 0.2, -0.9, 0.7, 0.4, -0.2];

/** 煮饭前的杂菌：x, y, 朝向, 形状 */
export const MISC = [
	{x: -90, y: -158, a: 0.4, k: 0},
	{x: 112, y: -98, a: -0.6, k: 2},
	{x: -246, y: -40, a: 1.2, k: 1},
	{x: 66, y: 84, a: 0.3, k: 3},
	{x: -30, y: 236, a: -1.1, k: 0},
	{x: 246, y: 30, a: 1.5, k: 2},
	{x: -100, y: 40, a: 0.1, k: 0},
	{x: 162, y: -196, a: 0.9, k: 1},
	{x: -10, y: -104, a: -0.3, k: 2},
	{x: -206, y: 176, a: 0.6, k: 3},
	{x: 210, y: 200, a: -0.4, k: 0},
];

/** 视野外的引线标注：字在 (x,y)（左对齐基线），引线指向 (tx,ty) */
export const Callout: React.FC<{x: number; y: number; tx: number; ty: number; text: string; size?: number; op: number; color?: string; anchor?: 'start' | 'end'}> = ({
	x,
	y,
	tx,
	ty,
	text,
	size = 48,
	op,
	color = C.ink,
	anchor = 'start',
}) => {
	if (op <= 0.001) return null;
	const w = textW(text, size);
	const lx = anchor === 'start' ? x - 14 : x + 14;
	const ly = y - size * 0.35;
	return (
		<g opacity={op}>
			<line x1={lx} y1={ly} x2={tx} y2={ty} stroke={C.ink} strokeWidth={2.5} />
			<circle cx={tx} cy={ty} r={6} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />
			<rect x={anchor === 'start' ? x - 8 : x - w - 8} y={y - size * 0.95} width={w + 16} height={size * 1.3} rx={8} fill={C.bench} opacity={0.85} />
			<text x={x} y={y} textAnchor={anchor} fontFamily={SANS} fontWeight={500} fontSize={size} fill={color}>
				{text}
			</text>
		</g>
	);
};

/** 一行字（SVG），带可选浅色底 */
export const Label: React.FC<{x: number; y: number; text: string; size?: number; op?: number; weight?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; bg?: string; family?: string}> = ({
	x,
	y,
	text,
	size = 40,
	op = 1,
	weight = 500,
	color = C.ink,
	anchor = 'start',
	bg,
	family = SANS,
}) => {
	if (op <= 0.001) return null;
	const w = textW(text, size);
	const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
	return (
		<g opacity={op}>
			{bg ? <rect x={x0 - 12} y={y - size * 0.98} width={w + 24} height={size * 1.36} rx={10} fill={bg} /> : null}
			<text x={x} y={y} textAnchor={anchor} fontFamily={family} fontWeight={weight} fontSize={size} fill={color}>
				{text}
			</text>
		</g>
	);
};
