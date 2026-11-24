import React from 'react';
import {bump, mv, ramp, win} from './anim';
import {easeOut} from './cam';
import type {BeatProps} from './beats';
import {PaintPoly, PaintText, Panel} from './paint';
import {C, DOT_OFF, gx, RY50, RY60} from './theme';
import {lookAt, S, zoomOf} from './top';

// 抛题与押注（分镜表 §1）：俯视后的预训练标签、“刚好停住”、三张卡、进度条、揭晓

type CardStyle = 'neutral' | 'lit' | 'gray';
export const BetCard: React.FC<{x: number; y: number; w: number; h: number; letter: string; value: string; sub?: string; style: CardStyle; opacity?: number; dy?: number; valueSize?: number}> = ({
	x,
	y,
	w,
	h,
	letter,
	value,
	sub,
	style,
	opacity = 1,
	dy = 0,
	valueSize = 50,
}) => {
	if (opacity <= 0.001) return null;
	const col = style === 'lit' ? C.yellow : style === 'gray' ? C.gray : C.white;
	return (
		<g opacity={opacity} transform={`translate(0 ${dy})`}>
			<Panel x={x} y={y} w={w} h={h} stroke={col} sw={style === 'lit' ? 6 : 3}>
				<PaintText x={x + 18} y={y + 46} size={38} color={col} weight={800}>
					{letter}
				</PaintText>
				<PaintText x={x + w / 2 + 16} y={y + (sub ? 74 : 86)} size={valueSize} color={col} weight={700} anchor="middle">
					{value}
				</PaintText>
				{sub ? (
					<PaintText x={x + w / 2 + 16} y={y + h - 22} size={36} color={C.gray} weight={600} anchor="middle">
						{sub}
					</PaintText>
				) : null}
			</Panel>
		</g>
	);
};

export const Guess: React.FC<BeatProps> = ({cam, t, T, N}) => {
	const z = zoomOf(cam);
	// ── 俯视刚落定：预训练标签 ──
	const preA = win(t, T.liftB + 0.1, T.pick, 0.4, 0.4);
	// 审片 P2：字顶原来压在路缘白线上，下移 12 px
	const dotsLbl = S(cam, gx(1.0), RY50 + DOT_OFF + 62);
	const twin = win(t, T.liftB + 0.1, T.liftB + 1.6, 0.3, 0.4);
	// ── “刚好停住” ──
	const stopP = S(cam, gx(N.main['50'].stop_dist), RY50 - 75 * z);
	const stopA = win(t, T.stopTxt, T.same35, 0.25, 0.5);
	// ── 三张卡 ──
	const drop = (k: number) => easeOut(ramp(t, T.pick + k * 0.08, 0.45));
	const cardsOn = t >= T.pick;
	const revealed = t >= T.reveal;
	// 卡落在画面下方的空带里（不压路、不压读数），A 卡揭晓后只需往左挪到底
	const cardY = 780;
	const cw = 270;
	const ch = 128;
	const xs = [360, 660, 960];
	// A 卡揭晓后退到左下角，留到 ③d“按秒掉”时收起
	const aMove = easeOut(ramp(t, T.reveal + 0.25, 0.7));
	const ax = mv(t, T.reveal + 0.25, 0.7, xs[0], 30);
	const ay = mv(t, T.reveal + 0.25, 0.7, cardY, 762);
	const aw = 262 + (cw - 262) * (1 - aMove);
	const ahh = 128 + 20 * aMove;
	const aFold = 1 - ramp(t, T.byS, 0.45);
	const aJump = -14 * bump(t, T.subtract, 0.4) - 10 * bump(t, T.left10, 0.4);
	const bA = revealed ? 1 - ramp(t, T.reveal + 0.1, 0.35) : 1;
	const cA = revealed ? 1 - ramp(t, T.s1 + 0.6, 0.5) : 1;
	// 进度条：定格 3 秒里唯一在动的东西
	const prog = Math.min(1, Math.max(0, (t - T.pickEnd) / (T.reveal - T.pickEnd)));
	const progA = win(t, T.pickEnd - 0.1, T.reveal, 0.15, 0.2);
	// 红色越线段：60 码那辆在人那条线之后本来还要走的 0.2 秒（全片唯一的红色）
	const vHit = N.main['60'].v_hit / 3.6;
	const look = lookAt(t, T);
	const redA = win(t, T.reveal, T.s3d, 0.25, 0.5) * (1 - look.dim60) * look.road60;
	const r0 = S(cam, gx(35), RY60 + DOT_OFF);
	const r1 = S(cam, gx(35 + vHit * 0.2), RY60 + DOT_OFF);
	// ① 的 A 卡小字、算式
	// 审片 P1-5：出处小字和四格条是 ① 的过程标注，② 起收掉，只留 A 卡（“直接相减”）当残影
	const noteA = win(t, T.quarter, T.s2, 0.35, 0.5);
	const formA = win(t, T.f6050, T.s2, 0.3, 0.5);
	const formHi = bump(t, T.left10, 0.6);
	// 第二轮审片 P2：讲 A 卡算法的那几秒（“研究里……剩10码……相减，等于默认”），A 卡、出处、算式都很小，视线停在红色 42 上 →
	// 这段把左下角整组放大 1.28 倍（以 (30, 823) 为锚点：上沿让开黄路的漆点，下沿不进字幕带），画灰色放样线之前缩回原位
	const zA = 0.28 * win(t, T.s1 + 1.0, T.same35 - 0.6, 0.5, 0.5);
	const zT = `translate(30 823) scale(${1 + zA}) translate(-30 -823)`;
	return (
		<g>
			{/* 预训练：漆点是什么 */}
			<PaintText x={dotsLbl[0]} y={dotsLbl[1]} size={40} opacity={preA} weight={600}>
				每 0.2 秒一个点
			</PaintText>
			<PaintText x={40} y={598} size={36} opacity={twin} weight={500}>
				同一条路，两个平行时空
			</PaintText>
			<PaintText x={stopP[0] - 8} y={stopP[1]} size={40} anchor="end" opacity={stopA} weight={700}>
				刚好停住
			</PaintText>
			{/* 红色越线段 */}
			{redA > 0 ? (
				<g opacity={redA}>
					<PaintPoly
						pts={[
							[r0[0], r0[1] - 7 * z],
							[r1[0], r1[1] - 7 * z],
							[r1[0] + 16 * z, r1[1]],
							[r1[0], r1[1] + 7 * z],
							[r0[0], r0[1] + 7 * z],
						]}
						fill={C.red}
					/>
				</g>
			) : null}
			{/* 三张卡 */}
			{cardsOn ? (
				<>
					<g transform={revealed ? zT : undefined}>
					<BetCard
						x={revealed ? ax : xs[0]}
						y={revealed ? ay : cardY - 820 * (1 - drop(0))}
						w={revealed ? aw : cw}
						h={revealed ? ahh : ch}
						letter="A"
						value="约 10 码"
						sub={revealed ? '直接相减' : undefined}
						style={revealed ? 'gray' : 'neutral'}
						opacity={drop(0) * aFold}
						dy={aJump}
					/>
					</g>
					<BetCard x={xs[1]} y={cardY - 820 * (1 - drop(1))} w={cw} h={ch} letter="B" value="约 20 码" style="neutral" opacity={drop(1) * bA} />
					<BetCard x={xs[2]} y={cardY - 820 * (1 - drop(2))} w={cw} h={ch} letter="C" value="约 40 码" style={revealed ? 'lit' : 'neutral'} opacity={drop(2) * cA} />
				</>
			) : null}
			{progA > 0 ? (
				<g opacity={progA}>
					<rect x={xs[0]} y={cardY + ch + 10} width={xs[2] + cw - xs[0]} height={6} fill="#3a3e45" />
					<rect x={xs[0]} y={cardY + ch + 10} width={(xs[2] + cw - xs[0]) * prog} height={6} fill={C.white} />
				</g>
			) : null}
			{/* ① 猜：A 卡的出处和算式 */}
			<g transform={zT}>
			<PaintText x={312} y={850} size={36} color={C.gray} opacity={noteA * aFold} weight={500}>
				约 1/4 的回答 · Svenson 等 2018
			</PaintText>
			{/* “约 1/4 的回答”：四格里填满一格 */}
			{noteA > 0 ? (
				<g opacity={noteA * aFold}>
					{[0, 1, 2, 3].map((k) => (
						<rect key={k} x={312 + k * 40} y={866} width={32} height={32} fill="none" stroke={C.gray} strokeWidth={3} />
					))}
					<rect x={312} y={866} width={32 * easeOut(ramp(t, T.quarter + 0.2, 0.5))} height={32} fill={C.gray} />
				</g>
			) : null}
			{formA > 0 ? (
				<g opacity={formA * aFold}>
					<PaintText x={312} y={800} size={46} color={C.gray} weight={700}>
						{t >= T.left10 ? '60 − 50 = 10' : '60 − 50'}
					</PaintText>
					{formHi > 0.02 ? (
						<PaintText x={312} y={800} size={46} color={C.white} weight={700} opacity={formHi} sh={0}>
							60 − 50 = 10
						</PaintText>
					) : null}
				</g>
			) : null}
			</g>
		</g>
	);
};
