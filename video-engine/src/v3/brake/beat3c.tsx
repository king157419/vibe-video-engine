import React from 'react';
import {bump, fin, ramp, win} from './anim';
import {easeOut} from './cam';
import type {BeatProps} from './beats';
import {Bracket, DimLine, PaintLine, PaintText} from './paint';
import {C, DOT_OFF, DOT_R, gx, RY50, RY60} from './theme';
import {S, zoomOf} from './top';

// ③c 60 码的账：多冲 4.2 米 → 离人只剩 10 米 → 0.7 秒冲完、只滴 3 个点 → 撞上 42 码
export const SixtyAccount: React.FC<BeatProps> = (p) => {
	const {cam, t, T, N} = p;
	const z = zoomOf(cam);
	const s50 = N.main['50'];
	const s60 = N.main['60'];
	const on = win(t, T.s3c, T.s3d, 0.3, 0.5);
	if (on <= 0) return null;
	const xw = S(cam, gx(s50.react), 0)[0];
	const xy = S(cam, gx(s60.react), 0)[0];
	const xp = S(cam, gx(35), 0)[0];
	const xFull = S(cam, gx(s60.stop_dist), 0)[0];
	const dW = S(cam, 0, RY50 + DOT_OFF)[1];
	const dY = S(cam, 0, RY60 + DOT_OFF)[1];
	const r = DOT_R * z;
	// 反应段的点一起闪一下
	const fl = bump(t, T.r15, 0.7);
	const poles = fin(t, T.r15, 0.3);
	const yBr = S(cam, 0, 520)[1];
	const brA = fin(t, T.d42, 0.3);
	const extra = (s60.react - s50.react).toFixed(1);
	const dimA = fin(t, T.only10, 0.3);
	const yDim = S(cam, 0, 600)[1];
	const t07 = fin(t, T.t07, 0.3);
	const dash = fin(t, T.these10, 0.4);
	const dashDraw = easeOut(ramp(t, T.these10, 0.9));
	const three = N.dots['60'].filter((d) => d.tb >= -1e-9);
	return (
		<g opacity={on}>
			{fl > 0
				? (['50', '60'] as const).map((k) =>
						N.dots[k]
							.filter((d) => d.tb <= 1e-9)
							.map((d, i) => {
								const q = S(cam, gx(d.x), (k === '50' ? RY50 : RY60) + DOT_OFF);
								return <circle key={`${k}${i}`} cx={q[0]} cy={q[1]} r={r + 6 + 6 * fl} fill="none" stroke={k === '50' ? C.white : C.yellow} strokeWidth={3} opacity={fl} />;
							}),
					)
				: null}
			{poles > 0 ? (
				<g opacity={poles}>
					<PaintLine a={[xw, dW + r + 2]} b={[xw, yBr]} w={4} color={C.white} opacity={0.65} />
					<PaintLine a={[xy, dY - r - 2]} b={[xy, yBr]} w={4} color={C.yellow} />
				</g>
			) : null}
			{brA > 0 ? (
				<g opacity={brA}>
					<Bracket x1={xw} x2={xy} y={yBr} color={C.yellow} dir={1} depth={14} w={5} reveal={easeOut(ramp(t, T.d42, 0.4))} />
					{/* 第二轮审片 P1-4：42 → 50 px */}
					<PaintText x={xw - 16} y={yBr + 17} size={50} anchor="end" color={C.yellow} weight={700}>
						{`多冲 ${extra} 米`}
					</PaintText>
				</g>
			) : null}
			{dimA > 0 ? (
				<DimLine x1={xy} x2={xp} y={yDim} color={C.yellow} opacity={dimA} label={t07 > 0 ? `${Math.round(s60.remain)} 米 · ${s60.t_brake.toFixed(1)} 秒` : `${Math.round(s60.remain)} 米`} size={48} w={4} />
			) : null}
			{dash > 0 ? (
				<g opacity={dash}>
					<PaintLine a={[xy, dY]} b={[xy + (xFull - xy) * dashDraw, dY]} w={4} color={C.yellow} dash="12 10" opacity={0.75} sh={1} />
					<PaintLine a={[xFull, dY - 16]} b={[xFull, dY + 16]} w={4} color={C.yellow} opacity={0.75 * dashDraw} sh={1} />
					{/* 放在斑马线右边，分两行（压在白色斑马线上看不清） */}
					<g opacity={fin(t, T.these10 + 0.6, 0.4)}>
						<PaintText x={1900} y={dY - 62} size={38} anchor="end" color={C.yellow} weight={700}>
							刹车路
						</PaintText>
						<PaintText x={1900} y={dY - 20} size={38} anchor="end" color={C.yellow} weight={700}>
							只用了一半
						</PaintText>
					</g>
				</g>
			) : null}
			{three.map((d, i) => {
				const a = fin(t, T.three + i * 0.18, 0.25);
				if (a <= 0) return null;
				const q = S(cam, gx(d.x), RY60 + DOT_OFF);
				const prev = i > 0 ? S(cam, gx(three[i - 1].x), RY60 + DOT_OFF) : null;
				return (
					<g key={i} opacity={a}>
						<PaintText x={q[0]} y={q[1] + 58} size={46} anchor="middle" color={C.yellow} weight={700}>
							{Math.round(d.v)}
						</PaintText>
						{prev ? (
							<PaintText x={(prev[0] + q[0]) / 2} y={q[1] + 96} size={36} anchor="middle" color={C.yellow} weight={700}>
								−5
							</PaintText>
						) : null}
					</g>
				);
			})}
		</g>
	);
};
