import React from 'react';
import type {Cam, V2, V3} from './cam';
import {groundScale, project, projectPoly, ptsAttr, toCam} from './cam';
import {PaintPoly} from './paint';
import {BAND, C, CAR_L, CAR_W, gx, LANE, PX_PER_M} from './theme';

// ───────── 路面标线（地面多边形，单位 = 地面像素） ─────────
export type GPoly = {pts: V3[]; color: string};

const rect = (x0: number, y0: number, x1: number, y1: number): V3[] => [
	[x0, y0, 0],
	[x1, y0, 0],
	[x1, y1, 0],
	[x0, y1, 0],
];

export const ZEBRA_M = [35, 39] as const; // 斑马线：人那条线（35 米）往前 4 米

/**
 * 一条路的标线。yc = 本车道中心。
 * full=true：驾驶视角用的完整道路；false：俯视用，裁到本路所在的半幅（上路 y<540，下路 y≥540）。
 */
export const roadPolys = (yc: number, full: boolean, upper: boolean): GPoly[] => {
	const out: GPoly[] = [];
	const lw = 0.15 * PX_PER_M; // 线宽 15 cm
	const yOuter = yc - 1.5 * LANE; // 相邻车道外沿
	const yDiv = yc - 0.5 * LANE; // 车道分隔虚线
	const yEdge = yc + 0.5 * LANE; // 右侧路缘线
	const xA = gx(full ? -170 : -12);
	const xB = gx(full ? 140 : 52);
	const [z0, z1] = [gx(ZEBRA_M[0]), gx(ZEBRA_M[1])];
	const lim = (y0: number, y1: number): [number, number] | null => {
		if (full) return [y0, y1];
		const a = upper ? Math.min(y0, BAND) : Math.max(y0, BAND);
		const b = upper ? Math.min(y1, BAND) : Math.max(y1, BAND);
		return b - a > 0.5 ? [a, b] : null;
	};
	const add = (x0: number, y0: number, x1: number, y1: number, color = C.white) => {
		const l = lim(y0, y1);
		if (l) out.push({pts: rect(x0, l[0], x1, l[1]), color});
	};
	// 外沿实线、路缘实线（斑马线处断开）
	for (const y of [yOuter, yEdge]) {
		add(xA, y - lw / 2, z0 - 0.6 * PX_PER_M, y + lw / 2);
		add(z1 + 0.6 * PX_PER_M, y - lw / 2, xB, y + lw / 2);
	}
	// 分隔虚线：2 米实 4 米空；斑马线前 6 米改成实线
	const dash = 2 * PX_PER_M;
	const gap = 4 * PX_PER_M;
	const solidFrom = z0 - 6 * PX_PER_M;
	for (let x = gx(-168); x < solidFrom; x += dash + gap) {
		if (x + dash < xA) continue;
		add(x, yDiv - lw / 2, Math.min(x + dash, solidFrom), yDiv + lw / 2);
	}
	add(solidFrom, yDiv - lw / 2, z0 - 0.6 * PX_PER_M, yDiv + lw / 2);
	for (let x = z1 + 0.6 * PX_PER_M; x < xB; x += dash + gap) add(x, yDiv - lw / 2, x + dash, yDiv + lw / 2);
	// 斑马线：沿行车方向的粗条，0.45 米宽，间距 0.6 米
	const stripe = 0.45 * PX_PER_M;
	const step = 1.05 * PX_PER_M;
	for (let y = yOuter + 0.2 * PX_PER_M; y + stripe <= yEdge + 0.01; y += step) add(z0, y, z1, y + stripe);
	return out;
};

export const drawPolys = (cam: Cam, polys: GPoly[], opacity = 1, keyPrefix = 'p') =>
	polys.map((p, i) => {
		const s = projectPoly(cam, p.pts);
		if (s.length < 3) return null;
		const sc = groundScale(cam, p.pts[0][0], p.pts[0][1]);
		return <PaintPoly key={`${keyPrefix}${i}`} pts={s} fill={p.color} sh={Math.min(2.5, Math.max(0.6, sc * 1.6))} opacity={opacity} />;
	});

// ───────── 车：简易盒子（地面轮廓 + 按高度错开的车顶） ─────────
type Box = {x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; tx0?: number; tx1?: number; ty0?: number; ty1?: number};

const boxFaces = (b: Box): {pts: V3[]; kind: 'top' | 'side' | 'front'}[] => {
	const tx0 = b.tx0 ?? b.x0;
	const tx1 = b.tx1 ?? b.x1;
	const ty0 = b.ty0 ?? b.y0;
	const ty1 = b.ty1 ?? b.y1;
	const B = (x: number, y: number): V3 => [x, y, b.z0];
	const T = (x: number, y: number): V3 => [x, y, b.z1];
	return [
		{kind: 'front', pts: [B(b.x1, b.y0), B(b.x1, b.y1), T(tx1, ty1), T(tx1, ty0)]},
		{kind: 'side', pts: [B(b.x0, b.y0), T(tx0, ty0), T(tx0, ty1), B(b.x0, b.y1)]},
		{kind: 'side', pts: [B(b.x0, b.y1), T(tx0, ty1), T(tx1, ty1), B(b.x1, b.y1)]},
		{kind: 'side', pts: [B(b.x0, b.y0), B(b.x1, b.y0), T(tx1, ty0), T(tx0, ty0)]},
		{kind: 'top', pts: [T(tx0, ty0), T(tx1, ty0), T(tx1, ty1), T(tx0, ty1)]},
	];
};

const area = (p: V2[]) => {
	let s = 0;
	for (let i = 0; i < p.length; i++) {
		const a = p[i];
		const b = p[(i + 1) % p.length];
		s += a[0] * b[1] - b[0] * a[1];
	}
	return s / 2;
};

/** 车：xFront = 车头（地面像素），yc = 车身中心 */
export const CarBox: React.FC<{cam: Cam; xFront: number; yc: number; parked?: boolean; opacity?: number; ghost?: boolean}> = ({cam, xFront, yc, parked = false, opacity = 1, ghost = false}) => {
	if (opacity <= 0.001) return null;
	const L = CAR_L;
	const Wd = CAR_W;
	const m = PX_PER_M;
	const body: Box = {x0: xFront - L, x1: xFront, y0: yc - Wd / 2, y1: yc + Wd / 2, z0: 0.18 * m, z1: 0.78 * m};
	const cabin: Box = {
		x0: xFront - 0.86 * L,
		x1: xFront - 0.36 * L,
		y0: yc - Wd * 0.46,
		y1: yc + Wd * 0.46,
		z0: 0.78 * m,
		z1: 1.42 * m,
		tx0: xFront - 0.8 * L,
		tx1: xFront - 0.5 * L,
		ty0: yc - Wd * 0.38,
		ty1: yc + Wd * 0.38,
	};
	const col = parked ? {top: C.parked, roof: C.parkedRoof, side: '#2e3135', front: '#2a2c30'} : {top: C.car, roof: C.carRoof, side: C.carSide, front: '#4b4e54'};
	// 审片 P1-1：盒子离镜头太近（任一角点的深度不到 2 米）时不画，免得近裁剪后透视爆成巨大的多边形
	const corners: V3[] = [];
	for (const xx of [body.x0, body.x1]) for (const yy of [body.y0, body.y1]) for (const zz of [0, cabin.z1]) corners.push([xx, yy, zz]);
	if (Math.min(...corners.map((p) => toCam(cam, p).z)) < 2 * m) return null;
	const out: React.ReactNode[] = [];
	// 车底阴影（地面上的暗块，哑光，不做模糊）
	const shadow = projectPoly(cam, [
		[xFront - L - 2, yc - Wd / 2 - 2, 0],
		[xFront + 2, yc - Wd / 2 - 2, 0],
		[xFront + 2, yc + Wd / 2 + 4, 0],
		[xFront - L - 2, yc + Wd / 2 + 4, 0],
	]);
	if (shadow.length >= 3) out.push(<polygon key="sh" points={ptsAttr(shadow)} fill={C.shadow} opacity={0.75} />);
	[body, cabin].forEach((bx, bi) => {
		const faces = boxFaces(bx)
			.map((f) => ({...f, s: projectPoly(cam, f.pts)}))
			.filter((f) => f.s.length >= 3 && area(f.s) > 0);
		// 先画侧面，再画顶面
		faces.sort((a, b) => (a.kind === 'top' ? 1 : 0) - (b.kind === 'top' ? 1 : 0));
		faces.forEach((f, fi) => {
			const fill = f.kind === 'top' ? (bi === 0 ? col.top : col.roof) : f.kind === 'front' ? col.front : col.side;
			out.push(<polygon key={`${bi}-${fi}`} points={ptsAttr(f.s)} fill={fill} stroke={C.shadow} strokeWidth={0.8} strokeOpacity={0.5} />);
		});
	});
	return <g opacity={ghost ? opacity * 0.45 : opacity}>{out}</g>;
};

// ───────── 人形标志 ─────────
// 单位框 100×200，原点在脚底中心；白色哑光漆
const PERSON_PATH = 'M 0 -175 m -18 0 a 18 18 0 1 0 36 0 a 18 18 0 1 0 -36 0';
const PersonShape: React.FC<{color: string; outline?: number}> = ({color, outline = 0}) => (
	<g>
		<path d={PERSON_PATH} fill={color} stroke={color} strokeWidth={outline} />
		<path d="M -10 -148 L 10 -148 L 13 -88 L -11 -88 Z" fill={color} stroke={color} strokeWidth={outline} strokeLinejoin="round" />
		<path d="M -6 -92 L -26 -2 M 6 -92 L 24 -2 M -10 -140 L -32 -98 M 10 -140 L 30 -102" stroke={color} strokeWidth={15 + outline} strokeLinecap="round" fill="none" />
	</g>
);

/** 站着的人（驾驶视角的立牌）：按投影后的高度缩放 */
export const PersonStanding: React.FC<{cam: Cam; x: number; y: number; opacity?: number}> = ({cam, x, y, opacity = 1}) => {
	const foot = project(cam, [x, y, 0]);
	const head = project(cam, [x, y, 1.7 * PX_PER_M]);
	if (!foot || !head || opacity <= 0.001) return null;
	const hpx = Math.hypot(head[0] - foot[0], head[1] - foot[1]);
	if (hpx < 2) return null;
	const ang = (Math.atan2(head[0] - foot[0], -(head[1] - foot[1])) * 180) / Math.PI;
	const s = hpx / 195;
	return (
		<g opacity={opacity} transform={`translate(${foot[0]} ${foot[1]}) rotate(${ang}) scale(${s})`}>
			<g transform="translate(0 4)">
				<PersonShape color={C.shadow} />
			</g>
			<PersonShape color={C.white} />
		</g>
	);
};

/** 平躺在路上的人形标志（俯视）：画面里保持头朝上 */
export const PersonFlat: React.FC<{cam: Cam; x: number; y: number; opacity?: number; size?: number}> = ({cam, x, y, opacity = 1, size = 1}) => {
	const c = project(cam, [x, y, 0]);
	if (!c || opacity <= 0.001) return null;
	const sc = groundScale(cam, x, y) * 0.44 * size;
	return (
		<g opacity={opacity} transform={`translate(${c[0]} ${c[1] + 100 * sc}) scale(${sc})`}>
			{/* 深色描边：站在白色斑马线上也看得清 */}
			<PersonShape color={C.shadow} outline={22} />
			<PersonShape color={C.white} />
		</g>
	);
};

/** 地面圆点（漆点）：透视下投影成椭圆多边形 */
export const GroundDot: React.FC<{cam: Cam; x: number; y: number; r: number; color: string; opacity?: number}> = ({cam, x, y, r, color, opacity = 1}) => {
	if (opacity <= 0.001) return null;
	const pts: V3[] = [];
	for (let i = 0; i < 14; i++) {
		const a = (i / 14) * Math.PI * 2;
		pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r, 0]);
	}
	const s = projectPoly(cam, pts);
	if (s.length < 3) return null;
	const sc = groundScale(cam, x, y);
	return <PaintPoly pts={s} fill={color} opacity={opacity} sh={Math.min(2.5, Math.max(0.6, sc * 1.8))} />;
};
