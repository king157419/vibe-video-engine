import React from 'react';
import {fin, ramp, win} from './anim';
import type {Cam, V2} from './cam';
import {clipHalf, easeInOut, FULL, horizonFrame, lerp, project, ptsAttr, skyPoly} from './cam';
import type {Numbers} from './data';
import {PaintLine, PaintPoly, PaintText} from './paint';
import type {TL} from './timeline';
import {carX} from './timeline';
import {C, DOT_OFF, DOT_R, gx, PX_PER_M, RY50, RY60, SUB_TOP} from './theme';
import {CarBox, drawPolys, GroundDot, PersonFlat, PersonStanding, roadPolys} from './world';

// 开头：左右分屏的驾驶视角 → 升镜 → 上下两条路的正俯视（方案 §2.5，分镜表 §1）
const F = 685; // 俯视终点的焦距（与 topCam 一致）
const F_DRIVE = 900; // 驾驶视角用稍长的镜头，35 米外的人看得清
const DEG = Math.PI / 180;
const EYE_BACK = 2.1 * PX_PER_M; // 驾驶员眼睛在车头后 2.1 米
const EYE_H = 1.2 * PX_PER_M;
const EYE_Y = -0.35 * PX_PER_M; // 左舵车，驾驶员偏左
export const PARKED_X = 34.9; // 路边停着的车，车头在 34.9 米
export const PARKED_DY = 2.9 * PX_PER_M;
export const PERSON_X = 36.2; // 人形标志站在斑马线上（人那条线 = 35 米 = 斑马线近边），离近边 1.2 米，车头碰线时不压住人

export const personDy = (tp: number) => (2.9 - 1.4 * Math.min(Math.max(tp, 0), 1.5)) * PX_PER_M;

export const liftS = (t: number, T: TL) => easeInOut(ramp(t, T.liftA, T.liftB - T.liftA));

/** 分屏视口：分隔线绕画面中心从竖线顺时针转成横线 */
const halfClip = (side: 0 | 1, s: number): V2[] => {
	const th = (Math.PI / 2) * s;
	const n: V2 = [-Math.cos(th), -Math.sin(th)];
	const sg = side === 0 ? 1 : -1;
	return clipHalf(FULL, (p) => sg * ((p[0] - 960) * n[0] + (p[1] - 540) * n[1]));
};

export const drivingCam = (side: 0 | 1, t: number, T: TL, N: Numbers): Cam => {
	const sc = side === 0 ? N.main['50'] : N.main['60'];
	const yc = side === 0 ? RY50 : RY60;
	const tp = Math.min(t, T.brake) - T.see;
	const xf = gx(carX(sc.v0, sc.a, sc.t_react, tp));
	const s = liftS(t, T);
	const dip = 1.2 * DEG * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - T.brake) / 0.25)));
	const H = Math.exp(lerp(Math.log(EYE_H), Math.log(F), s)); // 终点 H = F → 屏幕 = 地面坐标
	return {
		pos: [lerp(xf - EYE_BACK, 960, s), lerp(yc + EYE_Y, 540, s), H],
		pitch: lerp(10 * DEG + dip, 90 * DEG, s),
		roll: lerp(0, 90 * DEG, s),
		F: lerp(F_DRIVE, F, s),
		pp: [lerp(side === 0 ? 480 : 1440, 960, s), lerp(600, 540, s)],
		clip: halfClip(side, s),
	};
};

const Sky: React.FC<{cam: Cam; id: string; fade: number}> = ({cam, id, fade}) => {
	const sky = skyPoly(cam);
	if (sky.length < 3 || fade <= 0) return null;
	const hf = horizonFrame(cam);
	const far: V2 = [hf.p[0] + hf.up[0] * 620, hf.p[1] + hf.up[1] * 620];
	// 地平线下的一层薄雾，让远处的路面融进天色
	const dep = (p: V2) => (p[0] - hf.p[0]) * -hf.up[0] + (p[1] - hf.p[1]) * -hf.up[1];
	const below = clipHalf(
		clipHalf(cam.clip, (p) => dep(p)),
		(p) => 170 - dep(p),
	);
	const hazeEnd: V2 = [hf.p[0] - hf.up[0] * 170, hf.p[1] - hf.up[1] * 170];
	return (
		<g opacity={fade}>
			<defs>
				<linearGradient id={`${id}s`} gradientUnits="userSpaceOnUse" x1={hf.p[0]} y1={hf.p[1]} x2={far[0]} y2={far[1]}>
					<stop offset="0" stopColor={C.skyHorizon} />
					<stop offset="1" stopColor={C.skyTop} />
				</linearGradient>
				<linearGradient id={`${id}h`} gradientUnits="userSpaceOnUse" x1={hf.p[0]} y1={hf.p[1]} x2={hazeEnd[0]} y2={hazeEnd[1]}>
					<stop offset="0" stopColor={C.skyHorizon} stopOpacity={0.95} />
					<stop offset="1" stopColor={C.skyHorizon} stopOpacity={0} />
				</linearGradient>
			</defs>
			{below.length >= 3 ? <polygon points={ptsAttr(below)} fill={`url(#${id}h)`} /> : null}
			<polygon points={ptsAttr(sky)} fill={`url(#${id}s)`} />
		</g>
	);
};

/** 引擎盖：屏幕固定的剪影，升镜开始时下沉淡出 */
const Hood: React.FC<{side: 0 | 1; t: number; T: TL}> = ({side, t, T}) => {
	const s = ramp(t, T.liftA, 0.35);
	if (s >= 1) return null;
	const ox = side === 0 ? 0 : 960;
	const dy = s * 220;
	const top = 868 + dy;
	const d = `M ${ox + 30} 1080 L ${ox + 150} ${top + 30} Q ${ox + 520} ${top - 26} ${ox + 890} ${top + 30} L ${ox + 960} 1080 Z`;
	const label = win(t, T.same, T.liftA, 0.3, 0.2);
	return (
		<g opacity={1 - s}>
			<path d={d} fill={C.shadow} transform="translate(0 -3)" />
			<path d={d} fill="#3d4046" />
			<path d={`M ${ox + 160} ${top + 26} Q ${ox + 520} ${top - 22} ${ox + 880} ${top + 26}`} stroke="#5a5e65" strokeWidth={3} fill="none" />
			<PaintText x={ox + 300} y={top + 50} size={36} anchor="middle" opacity={label} weight={600}>
				同款车
			</PaintText>
		</g>
	);
};

/** 驾驶视角里的一条路：标线、漆点、路边停着的车、人 */
const SideWorld: React.FC<{side: 0 | 1; cam: Cam; t: number; T: TL; N: Numbers}> = ({side, cam, t, T, N}) => {
	const key = side === 0 ? '50' : '60';
	const sc = N.main[key];
	const yc = side === 0 ? RY50 : RY60;
	const color = side === 0 ? C.white : C.yellow;
	const tp = Math.min(t, T.brake) - T.see;
	const xf = gx(carX(sc.v0, sc.a, sc.t_react, tp));
	const s = liftS(t, T);
	const polys = roadPolys(yc, true, side === 0);
	// 漆点在驾驶视角里看不见（在车身旁、身后），升镜时才露出来：“已经躺在路上”。
	// 审片 P1-1：原来 s > 0.25 就出现，离镜头太近，是一摊摊大白斑；改成镜头升到 6 米以上（s ≥ 0.6）再淡入
	const dotsA = ramp(s, 0.6, 0.25);
	const dots = dotsA > 0 ? N.dots[key].filter((d) => d.t <= tp + 1e-6) : [];
	const pAlpha = fin(t, T.see, 0.15);
	const py = yc + personDy(tp);
	// 审片 P1-1：自车原来在 s = 0.2 就画，镜头还在车顶上方不到 1 米，盒子透视爆成巨大的灰色多边形；
	// 改成镜头升到约 9 米（s ≥ 0.72）再淡入，此时车在画面里约是俯视大小的 2 倍，之后平滑缩到俯视大小
	const ownCar = ramp(s, 0.72, 0.18);
	// “35 米”距离标：钉在斑马线近边、本车道中心。审片 P2：字放到竖线左边（人从右边走过来，不再压字）；踩刹车那一刻淡出
	const tag = project(cam, [gx(35), yc, 0]);
	const tagA = win(t, T.d35, T.brake, 0.3, 0.25);
	return (
		<g>
			{drawPolys(cam, polys, 1, `r${side}`)}
			{dots.map((d, i) => (
				<GroundDot key={i} cam={cam} x={gx(d.x)} y={yc + DOT_OFF} r={DOT_R} color={color} opacity={dotsA} />
			))}
			<CarBox cam={cam} xFront={gx(PARKED_X)} yc={yc + PARKED_DY} parked />
			{s < 0.6 ? <PersonStanding cam={cam} x={gx(PERSON_X)} y={py} opacity={pAlpha * (1 - ramp(s, 0.35, 0.2))} /> : null}
			{s > 0.5 ? <PersonFlat cam={cam} x={gx(PERSON_X)} y={py} opacity={ramp(s, 0.52, 0.25)} /> : null}
			{ownCar > 0 ? <CarBox cam={cam} xFront={xf} yc={yc} opacity={ownCar} /> : null}
			{tag && tagA > 0 ? (
				<g opacity={tagA}>
					<PaintLine a={[tag[0], tag[1] - 6]} b={[tag[0], tag[1] - 70]} w={3} color={C.white} />
					<PaintLine a={[tag[0], tag[1] - 70]} b={[tag[0] - 16, tag[1] - 70]} w={3} color={C.white} />
					<PaintText x={tag[0] - 22} y={tag[1] - 56} size={44} anchor="end" weight={700}>
						35 米
					</PaintText>
				</g>
			) : null}
		</g>
	);
};

/** 开头整段的 SVG（天空、两条路、引擎盖、分屏线、反应计时条） */
export const OpeningSVG: React.FC<{t: number; T: TL; N: Numbers}> = ({t, T, N}) => {
	const s = liftS(t, T);
	const cams = [drivingCam(0, t, T, N), drivingCam(1, t, T, N)];
	const th = (Math.PI / 2) * s;
	const dir: V2 = [Math.sin(th), -Math.cos(th)]; // 分隔线方向（竖 → 横）
	const L = 1300;
	const divA: V2 = [960 - dir[0] * L, 540 - dir[1] * L];
	const divB: V2 = [960 + dir[0] * L, 540 + dir[1] * L];
	const divYellow = 1 - ramp(s, 0.55, 0.4);
	return (
		<>
			<defs>
				{cams.map((c, i) => (
					<clipPath key={i} id={`half${i}`}>
						<polygon points={ptsAttr(c.clip)} />
					</clipPath>
				))}
			</defs>
			{cams.map((c, i) => (
				<g key={i} clipPath={`url(#half${i})`}>
					<Sky cam={c} id={`sky${i}`} fade={1} />
					<SideWorld side={i as 0 | 1} cam={c} t={t} T={T} N={N} />
					<Hood side={i as 0 | 1} t={t} T={T} />
				</g>
			))}
			{/* 中间的分隔线：驾驶视角时是 4 px 黄线（像双黄线），升镜后变成两条路之间的暗缝。
			    审片 P2：分隔线在字幕带（y > SUB_TOP）里断开，不从字幕中间穿过（升镜转成横线后本来就不在字幕带里） */}
			<defs>
				<clipPath id="divAbove">
					<rect x={0} y={0} width={1920} height={SUB_TOP - 4} />
				</clipPath>
			</defs>
			<g clipPath="url(#divAbove)">
				<line x1={divA[0]} y1={divA[1]} x2={divB[0]} y2={divB[1]} stroke={C.shadow} strokeWidth={6} />
				<line x1={divA[0]} y1={divA[1]} x2={divB[0]} y2={divB[1]} stroke={C.yellow} strokeWidth={4} opacity={divYellow} />
			</g>
			<ReactionBars t={t} T={T} />
		</>
	);
};

/** “反应 1.5 秒”计时条：按真实时间 1.5 秒走满 */
const ReactionBars: React.FC<{t: number; T: TL}> = ({t, T}) => {
	const a = win(t, T.see, T.liftA, 0.2, 0.3);
	if (a <= 0) return null;
	const p = Math.min(1, Math.max(0, (t - T.see) / (T.brake - T.see)));
	return (
		<g opacity={a}>
			{[0, 1].map((side) => {
				const cx = side === 0 ? 480 : 1440;
				const col = side === 0 ? C.white : C.yellow;
				const w = 360;
				return (
					<g key={side}>
						<PaintText x={cx - w / 2} y={300} size={40} color={col} weight={600}>
							反应 1.5 秒
						</PaintText>
						<PaintPoly
							pts={[
								[cx - w / 2, 318],
								[cx + w / 2, 318],
								[cx + w / 2, 336],
								[cx - w / 2, 336],
							]}
							fill="#2c3038"
						/>
						<PaintPoly
							pts={[
								[cx - w / 2, 318],
								[cx - w / 2 + w * p, 318],
								[cx - w / 2 + w * p, 336],
								[cx - w / 2, 336],
							]}
							fill={col}
							sh={0}
						/>
					</g>
				);
			})}
		</g>
	);
};
