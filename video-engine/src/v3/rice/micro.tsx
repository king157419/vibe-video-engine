// 显微视野和视野里的东西。视野内容用单位坐标：视野半径 = 300，中心 (0,0)。
import React from 'react';
import {C} from './theme';
import {blobPath, mulberry32} from './util';

/** 视野外形：圆（rx = 半径）或者正在压扁成横条的圆角矩形 */
export type Shape = {cx: number; cy: number; w: number; h: number; rx: number};
export const circleShape = (cx: number, cy: number, r: number): Shape => ({cx, cy, w: 2 * r, h: 2 * r, rx: r});

const ShapeEl: React.FC<{s: Shape} & React.SVGProps<SVGRectElement>> = ({s, ...rest}) => (
	<rect x={s.cx - s.w / 2} y={s.cy - s.h / 2} width={s.w} height={s.h} rx={Math.min(s.rx, s.w / 2, s.h / 2)} {...rest} />
);

/**
 * 一个显微视野。children 画在单位坐标里（自动按 r/300 缩放到 (cx,cy)）。
 * dim：0..1，讲另一边时把这一边压淡（E 清单 16）；cold：0..1 冷藏叠色 12%。
 */
export const Field: React.FC<{
	id: string;
	shape: Shape;
	r: number; // 内容缩放用的半径
	dim?: number;
	cold?: number;
	contentOpacity?: number;
	flash?: number; // 视野内白闪
	rim?: boolean;
	children?: React.ReactNode;
}> = ({id, shape, r, dim = 0, cold = 0, contentOpacity = 1, flash = 0, rim = true, children}) => {
	const k = r / 300;
	return (
		<g>
			<defs>
				<clipPath id={`${id}-clip`}>
					<ShapeEl s={shape} />
				</clipPath>
				<radialGradient id={`${id}-vig`} cx="50%" cy="50%" r="50%">
					<stop offset="0.68" stopColor={C.fieldEdge} stopOpacity={0} />
					<stop offset="0.93" stopColor={C.fieldEdge} stopOpacity={0.75} />
					<stop offset="1" stopColor="#b3a88e" stopOpacity={0.95} />
				</radialGradient>
			</defs>
			{rim ? <ShapeEl s={{...shape, w: shape.w + 26, h: shape.h + 26, rx: shape.rx + 13}} fill={C.benchDeep} /> : null}
			<g clipPath={`url(#${id}-clip)`}>
				<ShapeEl s={shape} fill={C.field} />
				<g transform={`translate(${shape.cx},${shape.cy}) scale(${k})`} opacity={contentOpacity}>
					{children}
				</g>
				<ShapeEl s={shape} fill={`url(#${id}-vig)`} />
				{cold > 0 ? <ShapeEl s={shape} fill={C.coldEdge} opacity={0.16 * cold} /> : null}
				{cold > 0 ? <ShapeEl s={shape} fill={C.cold} opacity={0.12 * cold} /> : null}
				{flash > 0 ? <ShapeEl s={shape} fill={C.white} opacity={flash} /> : null}
			</g>
			{rim ? <ShapeEl s={shape} fill="none" stroke={C.rim} strokeWidth={5} /> : null}
			{dim > 0 ? <ShapeEl s={{...shape, w: shape.w + 28, h: shape.h + 28, rx: shape.rx + 14}} fill={C.bench} opacity={0.55 * dim} /> : null}
		</g>
	);
};

// ---------- 背景：米粒的淀粉块 ----------
export const Starch: React.FC<{seed: number; n?: number; opacity?: number}> = ({seed, n = 9, opacity = 1}) => {
	const items = React.useMemo(() => {
		const rnd = mulberry32(seed);
		const out: {d: string; o: number}[] = [];
		for (let i = 0; i < n; i++) {
			const a = rnd() * Math.PI * 2;
			const rr = 60 + rnd() * 250;
			const x = Math.cos(a) * rr;
			const y = Math.sin(a) * rr;
			const size = 70 + rnd() * 90;
			out.push({d: blobPath(x, y, size, seed * 31 + i, 9, 0.35, 1.25, 0.85), o: 0.55 + rnd() * 0.3});
		}
		return out;
	}, [seed, n]);
	return (
		<g opacity={opacity}>
			{items.map((b, i) => (
				<path key={i} d={b.d} fill={C.starch} fillOpacity={b.o} stroke={C.starchEdge} strokeWidth={3} />
			))}
		</g>
	);
};

// ---------- 细菌 ----------
export const Capsule: React.FC<{x: number; y: number; a: number; len: number; w?: number; pinch?: number; fill?: string; stroke?: string; opacity?: number}> = ({
	x,
	y,
	a,
	len,
	w = 11,
	pinch = -1,
	fill = C.bac,
	stroke = C.bacEdge,
	opacity = 1,
}) => {
	const deg = (a * 180) / Math.PI;
	if (pinch < 0) {
		return (
			<rect x={-len / 2} y={-w / 2} width={len} height={w} rx={w / 2} fill={fill} stroke={stroke} strokeWidth={1.6} opacity={opacity} transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${deg.toFixed(1)})`} />
		);
	}
	// 收腰：两半各长 len/2 + w/2·(1-q)，中心在 ±len/4
	const h = len / 2 + (w / 2) * (1 - pinch);
	return (
		<g transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${deg.toFixed(1)})`} opacity={opacity}>
			<rect x={-len / 4 - h / 2} y={-w / 2} width={h} height={w} rx={w / 2} fill={fill} stroke={stroke} strokeWidth={1.6} />
			<rect x={len / 4 - h / 2} y={-w / 2} width={h} height={w} rx={w / 2} fill={fill} stroke={stroke} strokeWidth={1.6} />
		</g>
	);
};

/** 芽孢：青色核 + 深色硬壳。germ 0..1：壳裂开、长出紫色胶囊；swell：轻微胀大；glow：壳亮一下；crack 0..1：壳上出现一道裂纹（被热“叫醒”，还没破开） */
export const SPORE_SCALE = 1.35;
export const Spore: React.FC<{x: number; y: number; a?: number; scale?: number; germ?: number; swell?: number; glow?: number; shell?: number; crack?: number; opacity?: number}> = ({
	x,
	y,
	a = 0,
	scale = 1,
	germ = 0,
	swell = 0,
	glow = 0,
	shell = 1,
	crack = 0,
	opacity = 1,
}) => {
	const s = scale * SPORE_SCALE * (1 + 0.06 * swell);
	const deg = (a * 180) / Math.PI;
	const open = Math.min(1, germ * 1.6);
	const shellOp = germ > 0 ? Math.max(0, 1 - (germ - 0.45) / 0.55) : 1;
	return (
		<g transform={`translate(${x},${y}) rotate(${deg})`} opacity={opacity}>
			{germ > 0 ? <Capsule x={0} y={0} a={0} len={10 + (0.9 * 24 - 10) * germ} opacity={Math.min(1, germ * 2)} /> : null}
			<g transform={`scale(${s})`}>
				{glow > 0 ? <ellipse rx={20} ry={15} fill={C.spore} opacity={0.25 * glow} /> : null}
				<ellipse rx={9} ry={6.5} fill={C.spore} opacity={1 - germ} />
				{/* 硬壳：上下两半，发芽时向两边张开 */}
				<g opacity={shellOp} stroke={C.shell} strokeWidth={3.2 + 1.4 * shell + 1.2 * glow} fill="none" strokeLinecap="round">
					<path d="M-11,0 A11,8.5 0 0,1 11,0" transform={`translate(0,${-7 * open}) rotate(${-14 * open})`} />
					<path d="M-11,0 A11,8.5 0 0,0 11,0" transform={`translate(0,${7 * open}) rotate(${14 * open})`} />
				</g>
				{crack > 0 && germ <= 0 ? (
					<path d="M-4,-11.5 L1,-6.5 L-2.5,-2.5 L2,1.5 L-0.5,4" fill="none" stroke={C.paper} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset={30 * (1 - crack)} />
				) : null}
			</g>
		</g>
	);
};

/** 煮饭前的杂菌（灰）。kind：0 球菌、1 双球、2 杆菌、3 链球；dead 0..1 干瘪淡出 */
export const Misc: React.FC<{x: number; y: number; a: number; kind: number; dead?: number}> = ({x, y, a, kind, dead = 0}) => {
	const sc = 1 - 0.45 * dead;
	const op = 1 - dead;
	const deg = (a * 180) / Math.PI;
	const p = {fill: C.misc, stroke: C.miscEdge, strokeWidth: 1.6};
	let body: React.ReactNode;
	if (kind === 0) body = <circle r={8} {...p} />;
	else if (kind === 1) body = (
		<>
			<circle cx={-7} r={7} {...p} />
			<circle cx={7} r={7} {...p} />
		</>
	);
	else if (kind === 2) body = <rect x={-17} y={-6} width={34} height={12} rx={6} {...p} />;
	else body = (
		<>
			<circle cx={-14} r={6.5} {...p} />
			<circle cx={0} r={6.5} {...p} />
			<circle cx={14} r={6.5} {...p} />
		</>
	);
	return (
		<g transform={`translate(${x},${y}) rotate(${deg}) scale(${sc}, ${sc * (1 - 0.35 * dead)})`} opacity={op}>
			{body}
		</g>
	);
};

// ---------- 雾的渐变定义（每个视野一份） ----------
export const LawnDefs: React.FC<{id: string}> = ({id}) => (
	<defs>
		<radialGradient id={`${id}-fog`} cx="50%" cy="50%" r="50%">
			<stop offset="0" stopColor={C.toxin} stopOpacity={1} />
			<stop offset="0.5" stopColor={C.toxin} stopOpacity={0.7} />
			<stop offset="1" stopColor={C.toxin} stopOpacity={0} />
		</radialGradient>
	</defs>
);

/** 毒素雾：单独一层，只由“毒素量”驱动（opacity 上限 55%） */
export const Fog: React.FC<{id: string; blobs: {x: number; y: number; r: number}[]; amount: number}> = ({id, blobs, amount}) => {
	if (amount <= 0.001) return null;
	return (
		<g opacity={0.55 * Math.min(1, amount)}>
			{blobs.map((b, i) => (
				<circle key={i} cx={b.x} cy={b.y} r={b.r} fill={`url(#${id}-fog)`} />
			))}
		</g>
	);
};
