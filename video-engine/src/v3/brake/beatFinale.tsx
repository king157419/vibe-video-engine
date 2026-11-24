import React from 'react';
import {fin, ramp} from './anim';
import {easeOut} from './cam';
import type {BeatProps} from './beats';
import {BetCard} from './beatGuess';
import {Bracket, PaintDot, PaintLine, PaintPoly, PaintText} from './paint';
import {C, gx} from './theme';

// 终局图（可截图）：两排漆点 + 喷字规则 + “走完 3/4 → 速度剩 1/2” + 边界一行 + 假设角标
// 下面是留题的迷你场景：学校门口，30 码刚好停住，40 码？
const ROW_Y = 390;
const SPRAY_Y = 192; // 审片后上移 18 px，给下面新加的“每个点 = 0.2 秒”“踩刹车”留空

export const Finale: React.FC<BeatProps> = ({t, T, N}) => {
	if (t < T.s5End - 0.1) return null;
	// 第三轮自查：原来 s5End + 0.1 就淡入，和正在淡出的 4 张边界卡叠了约 0.35 秒（“50 码”压在卡 1 的标题上）→ 等卡收完（s5End + 0.35）再进
	const a0 = fin(t, T.s5End + 0.35, 0.5);
	const r1 = easeOut(ramp(t, T.s5End + 0.36, 0.35));
	const r2 = easeOut(ramp(t, T.s5End + 1.36, 0.35));
	const s60 = N.main['60'];
	const vHit = s60.v_hit / 3.6;
	const xp = gx(35);
	const rowsDraw = easeOut(ramp(t, T.s5End + 0.35, 0.9));
	const sub = fin(t, T.s5End + 1.9, 0.5);
	const legend = fin(t, T.s5End + 1.0, 0.5);
	// 留题
	const school = fin(t, T.school, 0.35);
	const q30 = fin(t, T.q30, 0.35);
	const kid = fin(t, T.kid, 0.35);
	const q40 = fin(t, T.q40, 0.35);
	const cards = (k: number) => easeOut(ramp(t, T.howMuch + k * 0.1, 0.4));
	const ans = fin(t, T.howMuch + 0.6, 0.4);
	// 第二轮审片 P2：AI 标识原来要等最后一行字幕走了才出，只停约 2.5 秒 → 终局图一出来就挂上，放在字幕带上方（y 900–940 这一条终局图没用），
	// 一直留到片尾（约 12 秒），不和字幕重叠
	const ai = fin(t, T.s5End + 1.9, 0.5);
	// 第二轮审片 P2（方案 §0.2“看完能改一个具体做法：开慢 10 码”）：终局图在红色 42 下面加一行落地结论
	const take = fin(t, T.s5End + 1.9, 0.5);
	const quizOn = fin(t, T.quiz, 0.4);
	const QX0 = 320;
	const QX1 = 1060;
	const qScale = (QX1 - QX0) / N.quiz_dots.d_kid;
	const yL30 = 664;
	const yL40 = 770;
	const dots30 = N.quiz_dots['30'];
	const first40 = N.quiz_dots['40'][0];
	return (
		<g>
			<g opacity={a0}>
				{/* 喷字规则：旁白此时不出声，让观众自己读 */}
				<PaintText x={735} y={SPRAY_Y} size={96} stretch={1.45} weight={900} anchor="middle" opacity={r1} sh={3}>
					速度按秒掉
				</PaintText>
				<PaintText x={1255} y={SPRAY_Y} size={96} stretch={1.45} weight={900} anchor="middle" opacity={r2} sh={3}>
					路按米走
				</PaintText>
				{/* 两排漆点：白 50、黄 60，人那条线对齐 */}
				<PaintText x={gx(0) - 24} y={ROW_Y - 90 + 13} size={40} anchor="end" weight={700}>
					50 码
				</PaintText>
				<PaintText x={gx(0) - 24} y={ROW_Y + 13} size={40} anchor="end" color={C.yellow} weight={700}>
					60 码
				</PaintText>
				{N.dots['50'].map((d, i) =>
					gx(d.x) <= gx(0) + (xp - gx(0)) * rowsDraw + 1 ? <PaintDot key={`w${i}`} x={gx(d.x)} y={ROW_Y - 90} r={9} color={C.white} /> : null,
				)}
				{N.dots['60'].map((d, i) =>
					gx(d.x) <= gx(0) + (xp - gx(0)) * rowsDraw + 1 ? <PaintDot key={`y${i}`} x={gx(d.x)} y={ROW_Y} r={9} color={C.yellow} /> : null,
				)}
				<PaintLine a={[xp, ROW_Y - 130]} b={[xp, ROW_Y + 34]} w={3} color={C.white} dash="10 8" />
				{/* 审片 P1-4：35 米标在“人”那条线上（角标里的“人在 35 米外”在终局去掉了，免得和留题冲突） */}
				<PaintText x={xp - 14} y={ROW_Y - 142} size={36} weight={600}>
					人 · 35 米
				</PaintText>
				{/* 审片 P1-6：截图出去也要看得懂点是什么、从哪开始刹 */}
				<PaintText x={gx(0)} y={ROW_Y - 140} size={36} weight={600} opacity={legend}>
					每个点 = 0.2 秒
				</PaintText>
				{(['50', '60'] as const).map((k) => {
					const xb = gx(N.main[k].react);
					const up = k === '50';
					const yRow = up ? ROW_Y - 90 : ROW_Y;
					const col = up ? C.white : C.yellow;
					return (
						<g key={k} opacity={legend}>
							<PaintLine a={[xb, yRow + (up ? -14 : 14)]} b={[xb, yRow + (up ? -36 : 36)]} w={4} color={col} />
							<PaintText x={xb} y={up ? yRow - 46 : yRow + 72} size={36} anchor="middle" color={col} weight={700}>
								踩刹车
							</PaintText>
						</g>
					);
				})}
				{/* 白排最后 1/4 刹车路：括号 + “最后 1/4”，和下面那行规则对应 */}
				<g opacity={legend}>
					<Bracket x1={gx(N.rule_marker_50.x) - 4} x2={gx(N.main['50'].stop_dist) + 6} y={ROW_Y - 62} color={C.white} dir={1} depth={12} w={4} />
					<PaintText x={gx(N.rule_marker_50.x) - 14} y={ROW_Y - 44} size={36} anchor="end" weight={700}>
						最后 1/4
					</PaintText>
				</g>
				<PaintText x={gx(N.main['50'].stop_dist) - 14} y={ROW_Y - 118} size={36} anchor="end" weight={600}>
					刚好停住
				</PaintText>
				{rowsDraw >= 0.99 ? (
					<g>
						<PaintPoly
							pts={[
								[xp, ROW_Y - 7],
								[gx(35 + vHit * 0.2), ROW_Y - 7],
								[gx(35 + vHit * 0.2) + 16, ROW_Y],
								[gx(35 + vHit * 0.2), ROW_Y + 7],
								[xp, ROW_Y + 7],
							]}
							fill={C.red}
						/>
						<PaintText x={gx(35 + vHit * 0.2) + 28} y={ROW_Y + 17} size={52} color={C.red} weight={800}>
							{Math.round(s60.v_hit)}
						</PaintText>
						<PaintText x={gx(35 + vHit * 0.2) + 92} y={ROW_Y + 17} size={36} color={C.red} weight={600}>
							码
						</PaintText>
					</g>
				) : null}
				<PaintText x={1890} y={ROW_Y + 82} size={44} anchor="end" weight={800} opacity={take}>
					慢 10 码，就停得住
				</PaintText>
				<g opacity={sub}>
					<PaintText x={960} y={ROW_Y + 122} size={42} anchor="middle" weight={700}>
						刹车路走完 3/4 → 速度剩 1/2
					</PaintText>
					<PaintText x={960} y={ROW_Y + 172} size={36} anchor="middle" weight={500} opacity={0.9}>
						边界：车速越低，反应段占比越大；结冰打滑时数字不准
					</PaintText>
				</g>
			</g>
			{/* 留题：学校门口 */}
			<g opacity={quizOn}>
				<rect x={QX0 - 230} y={yL30 - 64} width={QX1 - QX0 + 310} height={4} fill={C.white} opacity={0.8} />
				<rect x={QX0 - 90} y={(yL30 + yL40) / 2 - 2} width={QX1 - QX0 + 170} height={4} fill={C.white} opacity={0.5} />
				<rect x={QX0 - 230} y={yL40 + 50} width={QX1 - QX0 + 310} height={4} fill={C.white} opacity={0.8} />
				<PaintText x={QX0 - 175} y={(yL30 + yL40) / 2 + 52} size={66} stretch={2} weight={900} anchor="middle" opacity={school * 0.9}>
					慢
				</PaintText>
				<g opacity={q30}>
					<PaintText x={QX0 - 30} y={yL30 + 16} size={48} anchor="end" weight={800}>
						30
					</PaintText>
					{dots30.map((d, i) => (
						<PaintDot key={i} x={QX0 + d.x * qScale} y={yL30} r={8} color={C.white} />
					))}
				</g>
				<g opacity={kid}>
					<PaintLine a={[QX1 + 12, yL30 - 62]} b={[QX1 + 12, yL40 + 50]} w={3} color={C.white} dash="8 7" />
					<PaintText x={QX1 + 30} y={yL30 + 14} size={36} weight={600}>
						孩子
					</PaintText>
					<PaintText x={QX1 - 6} y={yL30 - 20} size={36} anchor="end" weight={600}>
						刚好停住
					</PaintText>
				</g>
				<g opacity={q40}>
					<PaintText x={QX0 - 30} y={yL40 + 16} size={48} anchor="end" color={C.yellow} weight={800}>
						40
					</PaintText>
					<PaintDot x={QX0 + first40.x * qScale} y={yL40} r={8} color={C.yellow} />
					<PaintText x={QX1 - 20} y={yL40 + 24} size={70} anchor="end" color={C.yellow} weight={800}>
						?
					</PaintText>
				</g>
			</g>
			{t >= T.howMuch ? (
				<g>
					<BetCard x={1190} y={612 - 300 * (1 - cards(0))} w={220} h={118} letter="A" value="约 10 码" valueSize={40} style="neutral" opacity={cards(0)} />
					<BetCard x={1425} y={612 - 300 * (1 - cards(1))} w={220} h={118} letter="B" value="约 25 码" valueSize={40} style="neutral" opacity={cards(1)} />
					<BetCard x={1660} y={612 - 300 * (1 - cards(2))} w={230} h={118} letter="C" value="将近 40 码" valueSize={40} style="neutral" opacity={cards(2)} />
					<PaintText x={1540} y={772} size={36} anchor="middle" weight={600} opacity={ans}>
						答案见置顶评论
					</PaintText>
				</g>
			) : null}
			{ai > 0 ? (
				<PaintText x={700} y={918} size={36} anchor="middle" weight={500} opacity={ai * 0.85}>
					画面由 Claude 用代码生成 · 配音为 AI 合成（占位）
				</PaintText>
			) : null}
		</g>
	);
};
