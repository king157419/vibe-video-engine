import React from 'react';
import {bump, fin, mv, ramp, win} from './anim';
import {easeOut} from './cam';
import type {BeatProps} from './beats';
import {Diamond, PaintDot, PaintText, Panel} from './paint';
import {C} from './theme';

// ⑤ 边界和落地：4 张小卡依次翻出（看手机 / 电动车 / 车速越低 / 结冰）
const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
export const CARD_W = 430;
export const CARD_H = 400;
export const CARD_Y = 286;
export const cardX = (i: number) => 61 + i * 456;

const Card: React.FC<{i: number; t: number; t0: number; tOut: number; shrink: number; title: string; children: React.ReactNode}> = ({i, t, t0, tOut, shrink, title, children}) => {
	const flip = easeOut(ramp(t, t0, 0.4));
	// 第三轮自查：收得快一点（0.45 → 0.35 秒），终局图等卡收完再进，不再两层叠在一起
	const a = Math.min(fin(t, t0, 0.2), 1 - ramp(t, tOut, 0.35));
	if (a <= 0) return null;
	const x = cardX(i);
	const cx = x + CARD_W / 2;
	const cy = CARD_Y + CARD_H / 2;
	// 终局时缩小，排到画面下沿上方
	const sc = 1 - 0.55 * shrink;
	const tx = mv(shrink, 0, 1, cx, 520 + i * 294);
	const ty = mv(shrink, 0, 1, cy, 812);
	return (
		<g opacity={a} transform={`translate(${tx} ${ty}) scale(${Math.max(0.02, flip) * sc} ${sc}) translate(${-cx} ${-cy})`}>
			<Panel x={x} y={CARD_Y} w={CARD_W} h={CARD_H} />
			{/* 第二轮审片后自查：卡片序号原来 30 px，低于 36 px 下限 → 36 px，菱形放大一点 */}
			<Diamond cx={x + 44} cy={CARD_Y + 48} r={36} text={String(i + 1)} size={36} />
			<PaintText x={x + 92} y={CARD_Y + 60} size={40} weight={700}>
				{title}
			</PaintText>
			{children}
		</g>
	);
};

export const Bounds: React.FC<BeatProps> = ({t, T, N}) => {
	// 审片 P2：原来终局开头 4 张卡缩成约 20 px 高的缩略图停 2.5 秒（读不出来，还和角标叠在一起）→ 念完边界直接淡出，不缩小
	const on = t >= T.s5 - 0.1 && t < T.s5End + 0.6;
	if (!on) return null;
	const shrink = 0;
	const tOut = T.s5End;
	const K = N.cards;
	// 卡 1：看手机 2 秒
	const x1 = cardX(0);
	const m33 = fin(t, T.m33, 0.3);
	const nDots = K.phone_dots;
	// 卡 2：电动车 25 → 35 码，刹车段长度
	const x2 = cardX(1);
	const L35 = 300;
	const L25 = (L35 * K.ebike_brake['25']) / K.ebike_brake['35'];
	const g25 = fin(t, T.eb25, 0.35);
	const g35 = fin(t, T.eb35, 0.35);
	const dbl = fin(t, T.dbl, 0.3);
	// 卡 3：反应段占比
	const x3 = cardX(2);
	const maxStop = K.split['60'].react + K.split['60'].brake;
	const kb = 245 / maxStop;
	const more = fin(t, T.more, 0.3);
	const moreFl = bump(t, T.more, 0.7);
	// 卡 4：结冰
	const x4 = cardX(3);
	return (
		<g>
			<defs>
				<pattern id="hatchY" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
					<rect width="18" height="18" fill={C.asphalt} />
					<rect width="8" height="18" fill={C.yellow} />
				</pattern>
				<pattern id="hatchIce" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
					<rect width="22" height="22" fill={C.asphalt} />
					<rect width="3" height="22" fill={C.white} opacity={0.85} />
				</pattern>
			</defs>
			<Card i={0} t={t} t0={T.s5} tOut={tOut} shrink={shrink} title="看手机 2 秒">
				{/* 迷你黄路：一整段“没看路”，11 个等距的点（每 0.2 秒一个，含首尾） */}
				<rect x={x1 + 25} y={CARD_Y + 120} width={380} height={96} fill={C.asphalt} />
				<rect x={x1 + 25} y={CARD_Y + 120} width={380} height={4} fill={C.white} />
				<rect x={x1 + 25} y={CARD_Y + 212} width={380} height={4} fill={C.white} />
				<rect x={x1 + 35} y={CARD_Y + 146} width={360} height={44} fill="url(#hatchY)" opacity={0.55} />
				{Array.from({length: nDots}, (_, k) => (
					<PaintDot key={k} x={x1 + 35 + (360 * k) / (nDots - 1)} y={CARD_Y + 168} r={8} color={C.yellow} />
				))}
				<PaintText x={x1 + 215} y={CARD_Y + 110} size={36} anchor="middle" color={C.yellow} weight={600}>
					没看路
				</PaintText>
				<g opacity={m33}>
					<PaintText x={x1 + 215} y={CARD_Y + 290} size={50} anchor="middle" color={C.yellow} weight={800}>
						{`2 秒 = ${Math.round(K.phone_60_2s)} 米`}
					</PaintText>
					<PaintText x={x1 + 215} y={CARD_Y + 345} size={38} anchor="middle" weight={600}>
						一米都没刹
					</PaintText>
				</g>
				<PaintText x={x1 + 215} y={CARD_Y + 385} size={36} anchor="middle" color={C.yellow} weight={500} opacity={0.9}>
					60 码
				</PaintText>
			</Card>
			<Card i={1} t={t} t0={T.eb25 - 0.6} tOut={tOut} shrink={shrink} title="电动车">
				<PaintText x={x2 + 30} y={CARD_Y + 120} size={36} weight={500} opacity={0.9}>
					刹车那段多长
				</PaintText>
				<g opacity={g25}>
					<PaintText x={x2 + 90} y={CARD_Y + 192} size={40} anchor="end" weight={700}>
						25
					</PaintText>
					<rect x={x2 + 105} y={CARD_Y + 164} width={L25 * easeOut(ramp(t, T.eb25, 0.5))} height={30} fill={C.white} />
				</g>
				<g opacity={g35}>
					<PaintText x={x2 + 90} y={CARD_Y + 262} size={40} anchor="end" weight={700}>
						35
					</PaintText>
					<rect x={x2 + 105} y={CARD_Y + 234} width={L35 * easeOut(ramp(t, T.eb35, 0.5))} height={30} fill={C.white} />
				</g>
				<g opacity={dbl}>
					<PaintText x={x2 + 405} y={CARD_Y + 330} size={64} anchor="end" weight={800}>
						{`×${Math.round(K.ebike_ratio)}`}
					</PaintText>
					<PaintText x={x2 + 30} y={CARD_Y + 382} size={36} weight={500}>
						刹车能力不变时
					</PaintText>
				</g>
			</Card>
			<Card i={2} t={t} t0={T.lower - 0.2} tOut={tOut} shrink={shrink} title="车速越低">
				{(['30', '50', '60'] as const).map((k, j) => {
					const s = K.split[k];
					const y = CARD_Y + 110 + j * 70;
					const hi = k === '30' ? moreFl : 0;
					return (
						<g key={k}>
							<PaintText x={x3 + 70} y={y + 30} size={38} anchor="end" weight={700}>
								{k}
							</PaintText>
							<rect x={x3 + 84} y={y + 2} width={s.react * kb - 4} height={36} fill="none" stroke={C.white} strokeWidth={4 + 2 * hi} />
							<rect x={x3 + 82 + s.react * kb} y={y} width={s.brake * kb} height={40} fill={C.white} />
							<PaintText x={x3 + 82 + (s.react + s.brake) * kb + 8} y={y + 32} size={36} weight={700}>
								{`${Math.round(s.share * 100)}%`}
							</PaintText>
						</g>
					);
				})}
				<PaintText x={x3 + 30} y={CARD_Y + 335} size={36} weight={500} opacity={0.9}>
					空心 = 反应那段
				</PaintText>
				<PaintText x={x3 + 30} y={CARD_Y + 383} size={38} weight={700} opacity={more}>
					{`30 码：${CN[Math.round(K.split['30'].share * 10)]}成在反应段`}
				</PaintText>
			</Card>
			<Card i={3} t={t} t0={T.ice - 0.2} tOut={tOut} shrink={shrink} title="结冰打滑">
				<rect x={x4 + 25} y={CARD_Y + 96} width={380} height={110} fill="url(#hatchIce)" opacity={0.75} />
				<PaintText x={x4 + 215} y={CARD_Y + 265} size={40} anchor="middle" weight={700}>
					前提：轮胎抓得住地
				</PaintText>
				<PaintText x={x4 + 215} y={CARD_Y + 325} size={36} anchor="middle" weight={500} opacity={0.9}>
					冰面停车距离
				</PaintText>
				<PaintText x={x4 + 215} y={CARD_Y + 370} size={36} anchor="middle" weight={500} opacity={0.9}>
					可达干路 10 倍
				</PaintText>
			</Card>
		</g>
	);
};

export const boundsWin = (t: number, T: BeatProps['T']) => win(t, T.s5, T.quiz, 0.3, 0.4);
