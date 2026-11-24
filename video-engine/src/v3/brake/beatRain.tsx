import React from 'react';
import {fin, ramp, win} from './anim';
import type {BeatProps} from './beats';
import {DimLine, PaintDot, PaintLine, PaintText, PlateText} from './paint';
import {easeOut} from './cam';
import {C, CAR_L, CAR_W, DOT_OFF, DOT_R, gx, RY50} from './theme';
import {S, zoomOf} from './top';
import {CarBox} from './world';

// ④a 近迁移：下雨了，同一辆 50 码车、同样 35 米。反应段和晴天一样，刹车每个点只能少两三码。
export const Rain: React.FC<BeatProps> = (p) => {
	const {cam, t, T, N, rain} = p;
	const z = zoomOf(cam);
	const on = win(t, T.s4, T.unlike, 0.5, 0.6);
	if (on <= 0) return null;
	const R = N.rain;
	const tr = R.t_react;
	const wetA = fin(t, T.s4, 0.8) * (1 - ramp(t, T.unlike, 0.6));
	// 静止的哑光湿反光带（不闪、不用粒子）
	const bands = [
		[gx(-6), RY50 - 30, gx(16), 7],
		[gx(9), RY50 + 18, gx(30), 5],
		[gx(24), RY50 - 52, gx(44), 6],
		[gx(-4), RY50 - 120, gx(12), 5],
		[gx(30), RY50 + 60, gx(48), 6],
		[gx(-9), RY50 + 100, gx(6), 5],
		[gx(14), RY50 - 95, gx(27), 4],
		[gx(36), RY50 - 10, gx(52), 5],
	];
	const carOn = fin(t, T.again, 0.3);
	const xf = gx(rain.x);
	const carTop = S(cam, xf - CAR_L / 2 - 100, RY50 - 100);
	const hit = t >= T.rainGo + R.t_brake / 0.6;
	// 念到“还剩多快”（第二轮审稿前是“停得住吗”）读数变成“?”，一直留到车开出、滴下第一个点（原来车开出那 0.33 秒会先跳回 50，再往下掉）
	// 第二轮审片 P2：车开动时读数会短暂显示白色“42”（雨天第 3 个点），和全片红色的“42”撞数 →
	// 这是估数题，读数从“还剩多快”起一直是“?”，撞线落定时才出 35（每个点少多少，看点下面的小数字）
	const valText = t < T.canStop ? String(R.v0) : hit ? String(Math.round(R.v_hit)) : '?';
	const tagA = fin(t, T.about35, 0.3);
	const dry = N.main['50'];
	const frameA = fin(t, T.again, 0.4);
	const fr0 = S(cam, gx(dry.stop_dist) - CAR_L, RY50 - CAR_W / 2 - 3);
	const fr1 = S(cam, gx(dry.stop_dist), RY50 + CAR_W / 2 + 3);
	const legend = win(t, T.twoThree, T.rainGo, 0.3, 0.4);
	const dimY = S(cam, 0, RY50 + 150)[1];
	const r = DOT_R * z;
	const rainDash = fin(t, T.cant, 0.4);
	const rainDraw = easeOut(ramp(t, T.cant, 0.9));
	const xBrake = S(cam, gx(R.react), 0)[0];
	const xRainStop = S(cam, gx(R.stop_dist), 0)[0];
	const dashY = S(cam, 0, RY50 + DOT_OFF)[1];
	return (
		<g opacity={on}>
			<g opacity={wetA}>
				{bands.map((b, i) => {
					const a = S(cam, b[0], b[1]);
					const c = S(cam, b[2], b[1]);
					const h = b[3] * z;
					const pts = `${a[0]},${a[1]} ${a[0] + 60},${a[1] - h} ${c[0] - 90},${a[1] - h * 0.7} ${c[0]},${a[1]} ${c[0] - 70},${a[1] + h} ${a[0] + 40},${a[1] + h * 0.8}`;
					return <polygon key={i} points={pts} fill="#2a3037" opacity={0.75} />;
				})}
			</g>
			{/* 晴天停在这：白色虚线车框 */}
			{/* 第二轮审片 P2：雨天车最后停在“晴天停在这”虚线车框上，几乎把框盖满 → 框改成车头位置的一根竖虚线（上下伸出车身） */}
			{frameA > 0 ? (
				<g opacity={frameA}>
					<PaintLine a={[fr1[0], fr0[1] - 6]} b={[fr1[0], fr1[1] + 6]} w={4} color={C.white} dash="10 8" sh={1} />
					{/* 第三轮自查：这行字正好压在车道分隔虚线上（像被划掉）→ 垫一块雨天沥青色底板 */}
					<PlateText x={fr1[0]} y={fr0[1] - 12} size={38} anchor="end" weight={700} pad={8} plateFill={C.wetAsphalt}>
						晴天停在这
					</PlateText>
				</g>
			) : null}
			{/* 审片 P2：去掉原来的两个空心示意点（空心圈现在是“晴天的点”），只留文字 */}
			{legend > 0 ? (
				<g opacity={legend}>
					<PaintText x={S(cam, gx(dry.react + 3.2), 0)[0]} y={S(cam, 0, RY50 + DOT_OFF + 84)[1]} size={40} anchor="middle" weight={700}>
						每点 −2.5（示意）
					</PaintText>
				</g>
			) : null}
			{/* 审片 P2：雨天车撞线时和“晴天停在这”框几乎重合，“停不住”只靠数字 →
			    念“35码左右”（第二轮审稿前是“停不住”）时用白色虚线画出雨天完整的刹车路（到 48.4 米，伸出画面右边），和 ③c 黄车那根虚线同一种画法 */}
			{rainDash > 0 ? (
				<g opacity={rainDash}>
					<PaintLine a={[xBrake, dashY]} b={[xBrake + (xRainStop - xBrake) * rainDraw, dashY]} w={4} color={C.white} dash="12 10" opacity={0.8} sh={1} />
					<g opacity={fin(t, T.cant + 0.6, 0.4)}>
						<PaintText x={1900} y={dashY - 62} size={38} anchor="end" weight={700}>
							雨天刹车路
						</PaintText>
						<PaintText x={1900} y={dashY - 20} size={38} anchor="end" weight={700}>
							只用了一半
						</PaintText>
					</g>
				</g>
			) : null}
			<DimLine x1={S(cam, gx(0), 0)[0]} x2={S(cam, gx(35), 0)[0]} y={dimY} color={C.white} label="35 米" size={40} above={false} opacity={fin(t, T.again, 0.4)} w={3} />
			{/* 雨天的点：比晴天宽 */}
			{R.dots
				.filter((d) => d.tb > 1e-9 && d.t <= rain.tp + 1e-6)
				.map((d, i) => {
					const q = S(cam, gx(d.x), RY50 + DOT_OFF);
					return (
						<g key={i}>
							<PaintDot x={q[0]} y={q[1]} r={r} color={C.white} />
							{/* 数字放到下移后的晴天空心圈那一排下面 */}
							<PaintText x={q[0]} y={q[1] + 76 * z} size={36} anchor="middle" weight={700}>
								{Math.round(d.v)}
							</PaintText>
						</g>
					);
				})}
			<CarBox cam={cam} xFront={xf} yc={RY50} opacity={carOn} />
			{/* 跟着车走的读数 */}
			{carOn > 0 ? (
				<g opacity={carOn}>
					<PaintText x={carTop[0] + 20} y={carTop[1]} size={72} anchor="end" weight={700} tnum>
						{valText}
					</PaintText>
					<PaintText x={carTop[0] + 28} y={carTop[1]} size={36} weight={600}>
						码
					</PaintText>
					<PaintText x={carTop[0] + 76} y={carTop[1]} size={38} weight={700} opacity={tagA}>
						雨天
					</PaintText>
				</g>
			) : null}
		</g>
	);
};
