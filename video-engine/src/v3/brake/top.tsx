import React from 'react';
import {fin, mv, ramp, win} from './anim';
import type {Cam, V2} from './cam';
import {project, topCam} from './cam';
import type {Numbers} from './data';
import {PERSON_X, PARKED_DY, PARKED_X, personDy} from './opening';
import {PaintDot} from './paint';
import type {CarState} from './state';
import {firstRunTp} from './state';
import type {TL} from './timeline';
import {carX} from './timeline';
import {BAND, C, DOT_OFF, dotR, gx, RY50, RY60} from './theme';
import {CarBox, drawPolys, PersonFlat, roadPolys} from './world';

// 俯视镜头：只做水平跟拍和推拉，不旋转（方案 §2.3 镜头语言 3）
type Key = {t: number; cx: number; cy: number; z: number};
export const KERNEL_Z = 2.4;
export const KERNEL_CX = gx(28);
export const KERNEL_CY = 436;
export const camAt = (t: number, T: TL): Cam => {
	const keys: Key[] = [
		{t: T.liftB, cx: 960, cy: 540, z: 1},
		{t: T.s2, cx: gx(27.4), cy: 432, z: 1.45}, // ② 推近白路刹车段
		{t: T.s3b, cx: 925, cy: 448, z: 1.28}, // ③b 拉回，露出反应段
		// 第二轮审片 P1-2：念到“一刹车”时推近白车刹车段（每米约 82 px），让最后几格米尺里挤着的 3–4 个点看得清
		{t: T.oneBrake, cx: KERNEL_CX, cy: KERNEL_CY, z: KERNEL_Z},
		{t: T.s3c, cx: 960, cy: 540, z: 1}, // ③c 两条路都看
		{t: T.s4, cx: 960, cy: 380, z: 1}, // ④a 只看白路，挪到画面中间
		{t: T.unlike, cx: 960, cy: 540, z: 1},
	];
	let cx = keys[0].cx;
	let cy = keys[0].cy;
	let z = keys[0].z;
	for (let i = 1; i < keys.length; i++) {
		const k = keys[i];
		cx = mv(t, k.t, 1.0, cx, k.cx);
		cy = mv(t, k.t, 1.0, cy, k.cy);
		// 缩放在对数空间插值，推拉更匀
		z = Math.exp(mv(t, k.t, 1.0, Math.log(z), Math.log(k.z)));
	}
	return topCam(cx, cy, z);
};

export const S = (cam: Cam, x: number, y: number): V2 => project(cam, [x, y, 0]) ?? [0, 0];
export const zoomOf = (cam: Cam) => cam.F / cam.pos[2];

export type WorldLook = {
	road50: number;
	road60: number;
	dim50: number; // 0..1 压暗（讲另一辆车时）
	dim60: number;
	parked: number;
	person50: number;
	person60: number;
	car50: number;
	car60: number;
	dots50: number;
	dots60: number;
	dryBrake50: number; // 白车刹车段漆点（雨天时压暗）
};

export const lookAt = (t: number, T: TL): WorldLook => {
	const graph = ramp(t, T.s3d, 0.6); // ③d 路面淡出、点进图
	const rain = ramp(t, T.s4, 0.6);
	const ball = ramp(t, T.unlike, 0.6);
	const inRain = t >= T.s4;
	// 审片 P1-5：② 起镜头推近白路，黄路被推到画面下部、滑进字幕带。推近期间黄路整块淡到 0，③c 重新登场时再淡入
	const hide60 = 1 - win(t, T.s2, T.s3c, 0.6, 0.6);
	return {
		road50: inRain ? Math.max(rain * (1 - ball), 0) : 1 - graph,
		road60: inRain ? 0 : (1 - graph) * hide60,
		// ① 讲直觉算法时两条路都压暗，让灰色放样线浮在上面；③c 讲黄车时压暗白路
		dim50: Math.max(win(t, T.same35 - 0.3, T.s2 + 0.2, 0.5, 0.5) * 0.65, win(t, T.s3c, T.s3d, 0.6, 0.4) * 0.65),
		dim60: win(t, T.same35 - 0.3, T.s2 + 0.2, 0.5, 0.5) * 0.65,
		parked: 1 - ramp(t, T.s1, 0.6),
		person50: inRain ? rain * (1 - ball) : 1 - graph,
		person60: inRain ? 0 : (1 - graph) * hide60,
		car50: inRain ? 0 : 1 - graph,
		car60: inRain ? 0 : (1 - graph) * hide60,
		dots50: inRain ? rain * (1 - ball) : 1 - graph,
		dots60: inRain ? 0 : (1 - graph) * hide60,
		dryBrake50: inRain ? 0.28 * rain : 1,
	};
};

/** 俯视世界：两条路（各自裁在自己的半幅里）、漆点、车、人 */
export const TopWorld: React.FC<{cam: Cam; t: number; T: TL; N: Numbers; w: CarState; y: CarState; look: WorldLook; frame: number}> = ({cam, t, T, N, w, y, look}) => {
	const z = zoomOf(cam);
	const band = S(cam, 0, BAND)[1];
	const tpW = firstRunTp(t, T, N, '50');
	const tpY = firstRunTp(t, T, N, '60');
	const r = dotR(z);
	const pdy = personDy(N.main['50'].t_react);
	const roads = (
		<>
			<defs>
				<clipPath id="bandTop">
					<rect x={0} y={-2000} width={1920} height={band + 2000} />
				</clipPath>
				<clipPath id="bandBot">
					<rect x={0} y={band} width={1920} height={4000} />
				</clipPath>
			</defs>
			<g clipPath="url(#bandTop)" opacity={look.road50 * (1 - look.dim50)}>
				{drawPolys(cam, roadPolys(RY50, false, true), 1, 'a')}
			</g>
			<g clipPath="url(#bandBot)" opacity={look.road60 * (1 - look.dim60)}>
				{drawPolys(cam, roadPolys(RY60, false, false), 1, 'b')}
			</g>
			{/* 两个平行时空之间的暗缝 */}
			<line x1={0} y1={band} x2={1920} y2={band} stroke={C.shadow} strokeWidth={6} opacity={Math.max(look.road50, look.road60) * (look.road60 > 0 ? 1 : 0)} />
		</>
	);
	const dots50 = N.dots['50'].filter((d) => d.t <= tpW + 1e-6);
	const dots60 = N.dots['60'].filter((d) => d.t <= tpY + 1e-6);
	return (
		<g>
			{roads}
			<CarBox cam={cam} xFront={gx(PARKED_X)} yc={RY50 + PARKED_DY} parked opacity={look.parked * look.road50} />
			<CarBox cam={cam} xFront={gx(PARKED_X)} yc={RY60 + PARKED_DY} parked opacity={look.parked * look.road60} />
			<PersonFlat cam={cam} x={gx(PERSON_X)} y={RY50 + pdy} opacity={look.person50 * (1 - look.dim50)} />
			<PersonFlat cam={cam} x={gx(PERSON_X)} y={RY60 + pdy} opacity={look.person60 * (1 - look.dim60)} />
			<g opacity={look.dots50 * (1 - look.dim50)}>
				{dots50.map((d, i) => {
					const p = S(cam, gx(d.x), RY50 + DOT_OFF);
					// 审片 P2：雨天段晴天刹车段的点原来压到 28% 的实心白，看上去是灰色（灰只给错误直觉）→ 改成白色空心圈作晴天参照
					// 第二轮审片 P2：空心圈和雨天的实心点交错在同一条线上太挤 → 空心圈整排下移 22 px，排成第二排
					if (t >= T.s4 && d.phase === '刹车') {
						return <circle key={i} cx={p[0]} cy={p[1] + 30 * z * ramp(t, T.s4, 0.6)} r={r - 1} fill="none" stroke={C.white} strokeWidth={2.5} opacity={look.dryBrake50 / 0.28 * 0.8} />;
					}
					return <PaintDot key={i} x={p[0]} y={p[1]} r={r} color={C.white} sh={Math.max(1, 2 * z)} />;
				})}
			</g>
			<g opacity={look.dots60 * (1 - look.dim60)}>
				{dots60.map((d, i) => {
					const p = S(cam, gx(d.x), RY60 + DOT_OFF);
					return <PaintDot key={i} x={p[0]} y={p[1]} r={r} color={C.yellow} sh={Math.max(1, 2 * z)} />;
				})}
			</g>
			<CarBox cam={cam} xFront={gx(w.x)} yc={RY50} opacity={look.car50 * w.opacity * (1 - look.dim50)} />
			<CarBox cam={cam} xFront={gx(y.x)} yc={RY60} opacity={look.car60 * y.opacity * (1 - look.dim60)} />
			<GhostCar cam={cam} t={t} T={T} N={N} />
		</g>
	);
};

/** ② 白车的半透明重影：按 0.6× 从刹车点开到刹车路中点的小旗下 */
const GhostCar: React.FC<{cam: Cam; t: number; T: TL; N: Numbers}> = ({cam, t, T, N}) => {
	const a = win(t, T.still35, T.s2End + 0.6, 0.15, 0.4);
	if (a <= 0) return null;
	const s = N.main['50'];
	const tp = s.t_react + Math.min(N.card_a.t_half, Math.max(0, (t - T.still35) * 0.6));
	return <CarBox cam={cam} xFront={gx(carX(s.v0, s.a, s.t_react, tp))} yc={RY50} ghost opacity={a} />;
};

export const fadeAfter = (t: number, a: number) => 1 - fin(t, a, 0.4);
