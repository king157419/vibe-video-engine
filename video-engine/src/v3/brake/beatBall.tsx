import React from 'react';
import {bump, fin, mv, ramp, win} from './anim';
import {easeOut} from './cam';
import type {BeatProps} from './beats';
import {Bracket, PaintDot, PaintLine, PaintPath, PaintText, PlateText, textW} from './paint';
import {C, DOT_OFF, DOT_R, gx, RY50} from './theme';
import {S} from './top';

// ④b 远迁移：往上扔一个球。先问“它在哪一段待得最久？”，停一下，再让球自己飞出答案。
export const BALL_X = 1720;
export const BALL_Y0 = 880; // 球出手的高度（画面 y）
export const PX_PER_M_BALL = 140;
export const ROW_Y = 760; // 白车刹车段那排漆点横躺的位置
export const ROW_X0 = 380; // 整排挪到左边、横向放大 1.7 倍，给球那一列和标签让位
export const ROW_SX = 1.7;
const BALL_SLOW = 0.75;

export const throwTime = (p: BeatProps) => p.T.askEnd + 0.6;

// 第二轮审片 P1-3：
// (a) 括号旁两块两行标签和旁白几乎一字不差 → 缩成一行关键词“后 1/4 路 · 1/2 时间”“上 1/4 高 · 1/2 时间”（48 px），
//     不写“6 个点”，改成把最后 1/4 那一段铺一层浅白底（和 ③d 曲线图里“最后 1/4”同一种画法）。
//     分界那个点正好压在浅白底的边上（一半在里、一半在外），两边各 5 个半点，数得清“一半”。
// (b) 对应连线穿过标签和喷字 → 只留一根“一半时间”的折线：从车列的分界点竖直上去、再水平连到球列的分界点，
//     走两列之间的空地，不穿任何字；车列的“−5”分成两组（前 3/4 路 5 个、最后 1/4 路 5 个），中间给折线留出通道；
//     “每秒”喷字挪到折线围出的空地里。
// (c) “−3.5”没有单位 → 两列各在第一个数上写单位：“−5 码”“−3.5 码”。
export const Ball: React.FC<BeatProps> = (p) => {
	const {cam, t, T, N} = p;
	// 第三轮自查：原来 s5 才开始淡出（0.6 秒），边界卡 1 翻进来时抛球画面还几乎是实的 → 提前 0.3 秒开始收、0.45 秒收完
	const on = win(t, T.unlike, T.s5 - 0.3, 0.4, 0.45);
	if (on <= 0) return null;
	const B = N.ball;
	const tThrow = throwTime(p);
	const tb = Math.min(B.T_up, Math.max(0, (t - tThrow) * BALL_SLOW));
	const hNow = B.v0 * tb - 0.5 * B.g * tb * tb;
	const ballY = (h: number) => BALL_Y0 - PX_PER_M_BALL * h;
	// 车那排：晴天刹车段的 11 个点（tb = 0 … 停住）
	const row = N.dots['50'].filter((d) => d.tb >= -1e-9);
	const move = easeOut(ramp(t, T.unlike + 0.2, 1.0));
	const rowX = (m: number) => ROW_X0 + (m - row[0].x) * 34 * ROW_SX;
	const rowPts = row.map((d) => {
		const from = S(cam, gx(d.x), RY50 + DOT_OFF);
		return [from[0] + (rowX(d.x) - from[0]) * move, from[1] + (ROW_Y - from[1]) * move] as [number, number];
	});
	const ballOn = fin(t, T.ball, 0.35);
	const q = win(t, T.longest, T.top, 0.3, 0.25);
	const pts = B.points.filter((b) => b.t <= tb + 1e-6 && t >= tThrow);
	const topFlash = bump(t, T.top, 0.7);
	const m35 = fin(t, T.gravity, 0.3);
	const higher = (i: number) => bump(t, T.higher + i * 0.09, 0.4);
	const brk = fin(t, T.quarterB, 0.35);
	const halfLbl = fin(t, T.halfT, 0.35);
	const links = easeOut(ramp(t, T.sameWhere, 0.8));
	const perSec = fin(t, T.rule1, 0.4);
	const s50 = N.main['50'];
	const xq = s50.react + 0.75 * s50.brake_dist;
	const nHalf = Math.round(row.length / 2) - 1; // 第 5 个点（tb = 1.0 秒 / 球 t = 0.5 秒）：一半时间
	const xRowEnd = rowPts[rowPts.length - 1][0];
	const yQ = ballY(0.75 * B.H);
	const yTop = ballY(B.H);
	// 车那排的“−5”：分两组，前 3/4 路的 5 个排在 [380, 950]，最后 1/4 路的 5 个排在 [1010, 1370]，引线连回各段中点
	const m5x = row.slice(1).map((_, i) => (i < nHalf ? ROW_X0 - 10 + ((950 - ROW_X0 + 10) * (i + 0.5)) / nHalf : 1010 + ((1370 - 1010) * (i - nHalf + 0.5)) / (row.length - 1 - nHalf)));
	// “−3.5”一列：等距排在球列右边，引线连回每段中点
	const labX = BALL_X + 40;
	const labYs = B.points.slice(1).map((_, i) => 820 - i * 63);
	const dv = (B.g * B.dt * 3.6).toFixed(1);
	// 一半时间的折线：车列分界点 → 竖直向上 → 水平到球列分界点
	const lA: [number, number] = [rowPts[nHalf][0], ROW_Y - DOT_R - 6];
	const lC: [number, number] = [BALL_X - DOT_R - 8, yQ];
	const segV = lA[1] - lC[1];
	const segH = lC[0] - lA[0];
	const drawn = links * (segV + segH);
	const linkD =
		drawn <= segV
			? `M ${lA[0]} ${lA[1]} L ${lA[0]} ${lA[1] - drawn}`
			: `M ${lA[0]} ${lA[1]} L ${lA[0]} ${lC[1]} L ${lA[0] + (drawn - segV)} ${lC[1]}`;
	// 一行关键词标签：前半句先出（念“四分之一”），“· 1/2 时间”后出（念“一半时间”）
	const KW = 48;
	const kwA = (part1: string) => textW(part1, KW);
	const rowLabX = (rowX(xq) + xRowEnd) / 2;
	const carL1 = '后 1/4 路';
	const ballL1 = '上 1/4 高';
	const L2 = ' · 1/2 时间';
	// 后半句出现时整行平移：车列标签保持居中、球列标签保持右端贴着括号
	const carW = kwA(carL1) + textW(L2, KW) * halfLbl;
	const ballW = kwA(ballL1) + textW(L2, KW) * halfLbl;
	return (
		<g opacity={on}>
			{/* 最后 1/4：浅白底（画在点下面）。车列从 3/4 处到停住，球列从 3/4 高到顶 */}
			{brk > 0 ? (
				<g opacity={brk}>
					<rect x={rowX(xq)} y={ROW_Y - 26} width={(xRowEnd + DOT_R + 4 - rowX(xq)) * easeOut(ramp(t, T.quarterB, 0.5))} height={52} fill={C.white} opacity={0.16} />
					<rect x={BALL_X - 26} y={yTop - DOT_R - 6} width={52} height={(yQ - yTop + DOT_R + 6) * easeOut(ramp(t, T.quarterB, 0.5))} fill={C.white} opacity={0.16} />
				</g>
			) : null}
			{/* 一半时间：只留这一根对应线，走两列之间的空地 */}
			{links > 0 ? <PaintPath d={linkD} w={3} color={C.white} dash="10 8" sh={0} opacity={0.85} cap="butt" /> : null}
			{/* 车那排 */}
			{rowPts.map((a, i) => (
				<PaintDot key={i} x={a[0]} y={a[1]} r={DOT_R + 1} color={C.white} sh={2} />
			))}
			<PaintText x={rowPts[0][0] - 24} y={ROW_Y + 13} size={36} anchor="end" weight={600} opacity={move}>
				刹车
			</PaintText>
			{m35 > 0
				? m5x.map((x, i) => {
						const mid: [number, number] = [(rowPts[i][0] + rowPts[i + 1][0]) / 2, ROW_Y];
						return (
							<g key={i} opacity={m35}>
								<PaintLine a={[x, ROW_Y - 58]} b={[mid[0], ROW_Y - 14]} w={2} color={C.white} sh={0} opacity={0.6} />
								<PaintText x={x} y={ROW_Y - 64} size={36} anchor="middle" weight={700}>
									{i === 0 ? '−5 码' : '−5'}
								</PaintText>
							</g>
						);
					})
				: null}
			{/* 车那排最后 1/4 刹车路 */}
			{brk > 0 ? (
				<g opacity={brk}>
					<Bracket x1={rowX(xq)} x2={xRowEnd + 8} y={ROW_Y + 34} color={C.white} dir={1} depth={12} w={4} />
					<PaintText x={rowLabX - carW / 2} y={ROW_Y + 98} size={KW} weight={800}>
						{carL1}
					</PaintText>
					<PaintText x={rowLabX - carW / 2 + kwA(carL1)} y={ROW_Y + 98} size={KW} weight={800} opacity={halfLbl}>
						{L2}
					</PaintText>
				</g>
			) : null}
			{/* 球 */}
			{ballOn > 0 ? (
				<g opacity={ballOn}>
					{t < tThrow ? <PaintPath d={`M ${BALL_X} ${BALL_Y0 - 40} L ${BALL_X} ${BALL_Y0 - 110} M ${BALL_X - 16} ${BALL_Y0 - 92} L ${BALL_X} ${BALL_Y0 - 112} L ${BALL_X + 16} ${BALL_Y0 - 92}`} w={5} color={C.white} /> : null}
					{pts.map((b, i) => {
						const y = ballY(b.h);
						const fl = higher(i) + (b.h >= 0.75 * B.H ? topFlash : 0);
						return <PaintDot key={i} x={BALL_X} y={y} r={DOT_R + 1 + 3 * Math.min(1, fl)} color={C.white} />;
					})}
					<g opacity={1 - ramp(t, T.top, 0.4)}>
						<PaintDot x={BALL_X} y={ballY(hNow)} r={22} color={C.white} sh={3} />
					</g>
					<PlateText x={BALL_X - 72} y={BALL_Y0 + 6} size={36} anchor="end" weight={500} opacity={0.85} pad={8}>
						不计空气阻力
					</PlateText>
					<PlateText x={BALL_X - 72} y={BALL_Y0 - 38} size={36} anchor="end" weight={600} opacity={fin(t, tThrow + 0.3, 0.4)} pad={8}>
						每 0.1 秒一个点
					</PlateText>
				</g>
			) : null}
			{/* 审片 P2：球一出手，“?”就挪到球列左边，不再压在点列上 */}
			{q > 0 ? (
				<PaintText x={mv(t, tThrow, 0.5, BALL_X, BALL_X - 260)} y={520} size={96} anchor="middle" weight={800} opacity={q}>
					?
				</PaintText>
			) : null}
			{m35 > 0
				? labYs.map((ly, i) => {
						const a = B.points[i];
						const b = B.points[i + 1];
						const mid = (ballY(a.h) + ballY(b.h)) / 2;
						return (
							<g key={i} opacity={m35}>
								<PaintLine a={[labX - 6, ly - 12]} b={[BALL_X + 14, mid]} w={2} color={C.white} sh={0} opacity={0.6} />
								<PaintText x={labX} y={ly} size={36} weight={700}>
									{i === 0 ? `−${dv} 码` : `−${dv}`}
								</PaintText>
							</g>
						);
					})
				: null}
			{brk > 0 ? (
				<g opacity={brk}>
					<PaintLine a={[BALL_X - 28, yQ]} b={[BALL_X - 46, yQ]} w={4} color={C.white} />
					<PaintLine a={[BALL_X - 46, yQ]} b={[BALL_X - 46, yTop - 6]} w={4} color={C.white} />
					<PaintLine a={[BALL_X - 28, yTop - 6]} b={[BALL_X - 46, yTop - 6]} w={4} color={C.white} />
					{/* 审片 P2：加一根高度尺——从地面到 3/4 高度是细线，最上面 1/4 是粗括号 */}
					<PaintLine a={[BALL_X - 46, BALL_Y0]} b={[BALL_X - 46, yQ]} w={2} color={C.white} opacity={0.6} sh={0} />
					<PaintLine a={[BALL_X - 58, BALL_Y0]} b={[BALL_X - 34, BALL_Y0]} w={3} color={C.white} opacity={0.8} sh={0} />
					<PaintText x={BALL_X - 64 - ballW} y={(yQ + yTop) / 2 + 17} size={KW} weight={800}>
						{ballL1}
					</PaintText>
					<PaintText x={BALL_X - 64 - ballW + kwA(ballL1)} y={(yQ + yTop) / 2 + 17} size={KW} weight={800} opacity={halfLbl}>
						{L2}
					</PaintText>
				</g>
			) : null}
			{perSec > 0 ? (
				<PaintText x={1330} y={600} size={64} stretch={2} weight={900} anchor="middle" opacity={perSec}>
					每秒
				</PaintText>
			) : null}
		</g>
	);
};
