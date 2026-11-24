import React from 'react';
import {bump, fin, ramp, win} from './anim';
import type {V2} from './cam';
import {easeOut} from './cam';
import type {BeatProps} from './beats';
import {Bracket, DimLine, PaintDot, PaintLine, PaintPath, PaintText, PlateText} from './paint';
import {C, DOT_OFF, dotR, gx, RY50, RY60} from './theme';
import {ZEBRA_M} from './world';

const ZEBRA_END_M = ZEBRA_M[1];
import {S, zoomOf} from './top';

// ① 猜（代理式尝试：灰色放样线画在路上） + ② 卡住（只看刹车段，走到一半：该剩 25｜实际 35）

export const K_GRAY = 2.2; // 放样线：每码多高（世界像素）
export const YB50 = RY50 - 59.5; // 白路放样线基线 = 分隔线（图画在相邻车道里，不压车）
export const YB60 = RY60 + 59.5; // 黄路放样线基线 = 路缘线
export const TICKS_M = [0, 7, 14, 21, 28, 35];
export const STENCIL_X = 900; // 路面喷字“每米/每秒”的位置（两条路之间）
export const STENCIL_Y = 540;

/** 刹车段中点（小旗）的位置，米 */
export const flagM = (p: BeatProps) => p.N.main['50'].react + p.N.card_a.half_x;

export const GrayLayout: React.FC<BeatProps> = (p) => {
	const {cam, t, T, N} = p;
	const z = zoomOf(cam);
	const loss = N.card_a.loss_per_m;
	// 审片 P1-5：① 的放样线和刻度是“过程标注”，② 一开始就整块收掉（不再留 30% 残影，免得和 ② 的小旗、③ 的尺叠成三层）。
	// ② 只看刹车段，由 Stuck 在刹车段上重画一根灰线
	const on = win(t, T.same35, T.s2, 0.3, 0.5);
	if (on <= 0) return null;
	const draw = easeOut(ramp(t, T.same35, 0.9)); // 从左到右刷出来
	// ② 起白路整根线压到 30%（只看刹车段）；③a 刷字后都留 30% 作对照
	const whole50 = 1 - 0.7 * ramp(t, T.onlyBrake, 0.4);
	const whole60 = 1 - 0.7 * ramp(t, T.s2, 0.5);
	const roads: {yb: number; v0: number; a: number; key: string}[] = [
		{yb: YB50, v0: 50, a: whole50, key: 'w'},
		{yb: YB60, v0: 60, a: whole60, key: 'y'},
	];
	const slider = ramp(t, T.perMeter, T.equal2 + 0.3 - T.perMeter);
	const sliding = t >= T.perMeter && t <= T.equal2 + 0.5;
	const sm = 35 * slider;
	const ten = bump(t, T.equal1, 0.6);
	const lossA = fin(t, T.equal1, 0.3);
	return (
		<g opacity={on}>
			{roads.map((r) => {
				const P = (m: number): V2 => S(cam, gx(m), r.yb - K_GRAY * (r.v0 - loss * m));
				const pts = [0, 35].map((m) => P(m));
				const xEnd = pts[0][0] + (pts[1][0] - pts[0][0]) * draw;
				const yEnd = pts[0][1] + (pts[1][1] - pts[0][1]) * draw;
				return (
					<g key={r.key} opacity={r.a}>
						<PaintLine a={pts[0]} b={[xEnd, yEnd]} w={4 * z} color={C.gray} dash={`${14 * z} ${10 * z}`} sh={1.5} />
						{TICKS_M.map((m) => {
							const q = P(m);
							const vis = ramp(draw, m / 35 - 0.02, 0.05);
							const passed = sliding && Math.abs(sm - m) < 1.2 ? 1 : 0;
							const isEnd = m === 35;
							const v = Math.round(r.v0 - loss * m);
							const big = r.key === 'y' && isEnd ? ten : 0;
							// 35 米处的读数放到斑马线右边（灰字压在白色斑马线上看不清）
							const lx = isEnd ? S(cam, gx(ZEBRA_END_M) + 16, 0)[0] : q[0];
							// 第二轮审片 P2：“0 共 −50”原来正压在车道分隔虚线上（只垫了底板）→ 两行都挪进线和线之间的空车道：
							// 白路的终点读数提到分隔线上方，黄路的提到路缘线上方，上下错开车道线
							const ly = isEnd ? (r.key === 'w' ? q[1] - 24 : q[1] - 10) : 0;
							// 滑块经过时刻度数字放大一下（审片 P2：1 米小括号太小，改成让刻度数字按米逐个亮起）
							const passSc = 1 + 0.35 * passed;
							return (
								<g key={m} opacity={vis}>
									<PaintDot x={q[0]} y={q[1]} r={(6 + 3 * passed) * z} color={C.gray} />
									{isEnd ? (
										<PlateText x={lx} y={ly} size={46} color={C.gray} weight={700} scale={1 + 0.3 * big + 0.15 * passed} pad={8}>
											{String(v)}
										</PlateText>
									) : (
										<PaintText x={lx} y={q[1] - 14 * z} size={38} anchor="middle" color={C.gray} weight={700} scale={passSc}>
											{v}
										</PaintText>
									)}
									{isEnd ? (
										<PlateText x={lx + (v >= 10 ? 70 : 42)} y={ly - 2} size={36} color={C.gray} weight={600} opacity={lossA} pad={8}>
											共 −50
										</PlateText>
									) : null}
								</g>
							);
						})}
						{/* 1 米宽的一段沿着放样线匀速滑过。审片 P2：原来的小括号只有 34 px、手机上看不见 →
						    改成压在线上的一段粗灰漆 + 大一号的括号，旁边写出“每 1 米 −1.4”（A 卡算法的每米减速，numbers.json card_a.loss_per_m） */}
						{sliding ? (
							<g opacity={win(t, T.perMeter, T.equal2 + 0.2, 0.2, 0.3)}>
								<PaintLine a={P(sm)} b={P(Math.min(35, sm + 1))} w={14 * z} color={C.gray} sh={2} />
								<Bracket x1={P(sm)[0]} x2={P(Math.min(35, sm + 1))[0]} y={P(sm)[1] + 26 * z} color={C.gray} dir={1} depth={14} w={4} />
								{r.key === 'w' ? (
									<PlateText x={P(sm)[0] + 17 * z} y={P(sm)[1] + 76 * z} size={38} anchor="middle" color={C.gray} weight={700} plate={0.85}>
										{`每 1 米 −${loss.toFixed(1)}`}
									</PlateText>
								) : null}
							</g>
						) : null}
					</g>
				);
			})}
			{/* 两条路共用一根尺寸线（两条路的 35 米完全对齐）；喷“每米”时收起 */}
			<DimLine x1={S(cam, gx(0), 0)[0]} x2={S(cam, gx(35), 0)[0]} y={S(cam, 0, STENCIL_Y)[1]} color={C.gray} opacity={draw * (1 - ramp(t, T.alsoIs - 0.2, 0.4))} label="35 米" size={40} w={3} />
			{/* 黄路“10”用细灰线连到左边的 A 卡 */}
			{(() => {
				const a = win(t, T.equal1, T.s2, 0.4, 0.5);
				if (a <= 0) return null;
				const q = S(cam, gx(ZEBRA_END_M) + 16, YB60 - K_GRAY * 10);
				// 从“10”下方（路缘线外侧）出发，避开红色越线段
				return <PaintLine a={[q[0] + 30, S(cam, 0, YB60 + 6)[1]]} b={[292, 764]} w={2} color={C.gray} opacity={a * 0.8} dash="8 8" sh={0} />;
			})()}
		</g>
	);
};

/** 路面喷字：“每米” → 刷子刷成“每秒” */
export const Stencil: React.FC<BeatProps> = ({cam, t, T}) => {
	const z = zoomOf(cam);
	const on = win(t, T.alsoIs, T.s3b, 0.5, 0.6);
	if (on <= 0) return null;
	const size = 76 * z;
	const st = 2;
	const c = S(cam, STENCIL_X, STENCIL_Y);
	const base = c[1] + 0.36 * size * st;
	const wipe = easeOut(ramp(t, T.bySec, 0.35)); // 刷子扫过“米”
	const gap = size * 0.6;
	const gx2 = c[0] + gap; // 第二个字中心
	// 路政划线刷：标线白的刷头 + 斜杆。从右上方进来，停在“米”上，念到“按秒掉”时往下一刷，刷完往右下退出。
	// 审片 P2：原来念到“只改一个地方”就进场、灰色刷头在点列上停了约 2.8 秒（灰色只给错误直觉）→
	// 刷头改成标线白；“按秒掉”前 0.75 秒才进场，到位就刷，不再停着挡点列和“该剩 25”
	const inS = easeOut(ramp(t, T.bySec - 0.75, 0.7));
	const outS = easeOut(ramp(t, T.bySec + 0.5, 0.8));
	const top = c[1] - size * st * 0.66;
	// 第二轮审片 P2：刷完原来往右下退场，杆子穿过角标、刷头穿过字幕带 → 刷完沿进场的路线往右上退出
	const brushX = gx2 + (1 - inS) * 900 + outS * 900;
	const brushY = top - (1 - inS) * 520 + wipe * size * st * 1.2 - outS * 520;
	const brushOn = t >= T.bySec - 0.75 && t < T.bySec + 1.4;
	const clipTop = c[1] - size * st * 0.62;
	const clipH = size * st * 1.25;
	return (
		<g opacity={on}>
			<defs>
				<clipPath id="wipeOld">
					<rect x={gx2 - size} y={clipTop + clipH * wipe} width={size * 2} height={clipH} />
				</clipPath>
				<clipPath id="wipeNew">
					<rect x={gx2 - size} y={clipTop} width={size * 2} height={clipH * wipe} />
				</clipPath>
			</defs>
			<PaintText x={c[0] - gap} y={base} size={size} stretch={st} weight={900} anchor="middle" sh={2}>
				每
			</PaintText>
			<g clipPath="url(#wipeOld)">
				<PaintText x={gx2} y={base} size={size} stretch={st} weight={900} anchor="middle" sh={2}>
					米
				</PaintText>
			</g>
			<g clipPath="url(#wipeNew)">
				<PaintText x={gx2} y={base} size={size} stretch={st} weight={900} anchor="middle" sh={2}>
					秒
				</PaintText>
			</g>
			{brushOn ? (
				<g>
					<line x1={brushX + 10} y1={brushY - 8} x2={brushX + 330} y2={brushY - 230} stroke={C.shadow} strokeWidth={18} transform="translate(0 3)" />
					<line x1={brushX + 10} y1={brushY - 8} x2={brushX + 330} y2={brushY - 230} stroke="#4a4d52" strokeWidth={16} strokeLinecap="round" />
					<rect x={brushX - size * 0.66} y={brushY - 30} width={size * 1.32} height={46} fill={C.shadow} transform="translate(0 3)" />
					<rect x={brushX - size * 0.66} y={brushY - 30} width={size * 1.32} height={46} fill={C.white} />
					<rect x={brushX - size * 0.66} y={brushY - 30} width={size * 1.32} height={9} fill="#3d4046" />
				</g>
			) : null}
		</g>
	);
};

/** ②：只看刹车段——反应段盖暗、刹车段上重画一根灰线、刹车路中点插小旗 */
export const Stuck: React.FC<BeatProps> = (p) => {
	const {cam, t, T, N} = p;
	const z = zoomOf(cam);
	const s50 = N.main['50'];
	const fm = flagM(p);
	// 反应段盖 45% 暗色（“先不看”），③b 拉镜时揭开
	const cover = win(t, T.onlyBrake, T.s3b, 0.4, 0.6) * 0.5;
	const c0 = S(cam, gx(-2), RY50 - 180);
	const c1 = S(cam, gx(s50.react), RY50 + 140);
	// 刹车段上的灰线：踩刹车处 50 → 停住处 0（误解在刹车段里最公平的版本）
	const lineA = win(t, T.onlyBrake, T.s3c, 0.5, 0.5) * (1 - 0.7 * ramp(t, T.bySec, 0.5));
	const b0 = S(cam, gx(s50.react), YB50 - K_GRAY * 50);
	const b1 = S(cam, gx(s50.stop_dist), YB50);
	const draw = easeOut(ramp(t, T.onlyBrake, 0.6));
	// 小旗
	const flagA = win(t, T.half, T.s3c, 0.3, 0.5);
	const pole0 = S(cam, gx(fm), YB50);
	const poleTop = S(cam, gx(fm), YB50 - 140);
	const g25 = S(cam, gx(fm), YB50 - K_GRAY * N.card_a.v_half_naive);
	const r35 = S(cam, gx(fm), YB50 - K_GRAY * N.card_a.v_half);
	const a25 = fin(t, T.should25, 0.3);
	const arrive = T.still35 + N.card_a.t_half / 0.6;
	const a35 = fin(t, arrive, 0.3);
	// 两个“按米”的括号：刹车路对半分，各 6.9 米，分界正对小旗；前一半 −15、后一半 −35。
	// 审片 P0-1：括号贴在漆点正下方的路面上（按米画），不再和下面那排等距的速度标签挤在一起；
	// ③a 的“秒尺”（PerSecond）在更下方另画一对按秒的括号（0.6 秒 / 1.4 秒），两对括号一对等宽、一对宽窄悬殊。
	// ③b 拉镜时收起（米尺、秒尺接班）
	const brA = win(t, T.s2End + 0.1, T.s3b, 0.4, 0.5);
	const yBr = S(cam, 0, RY50 + DOT_OFF + 40)[1];
	const xA = S(cam, gx(s50.react), 0)[0];
	const xM = pole0[0];
	const xB = S(cam, gx(s50.stop_dist), 0)[0];
	const hi1 = bump(t, T.t06, 0.7);
	const hi2 = bump(t, T.t14, 0.7);
	const lost1 = Math.round(50 - N.card_a.v_half);
	const lost2 = Math.round(N.card_a.v_half);
	const splitA = brA * fin(t, T.s2End + 0.5, 0.4);
	// 第二轮审片 P2：反应段盖暗后，白色漆点变成了灰点（灰色只给错误直觉）→ 只盖路面，漆点在盖板上面重画一遍，保持白色
	const r = dotR(z);
	const reactDots = N.dots['50'].filter((d) => d.tb <= 1e-9);
	return (
		<g>
			{cover > 0 ? <rect x={c0[0]} y={c0[1]} width={c1[0] - c0[0]} height={c1[1] - c0[1]} fill={C.shadow} opacity={cover} /> : null}
			{cover > 0
				? reactDots.map((d, i) => {
						const q = S(cam, gx(d.x), RY50 + DOT_OFF);
						return <PaintDot key={`rd${i}`} x={q[0]} y={q[1]} r={r} color={C.white} sh={Math.max(1, 2 * z)} opacity={Math.min(1, cover / 0.5)} />;
					})
				: null}
			{lineA > 0 ? (
				<PaintLine a={b0} b={[b0[0] + (b1[0] - b0[0]) * draw, b0[1] + (b1[1] - b0[1]) * draw]} w={5 * z} color={C.gray} opacity={lineA} sh={1.5} />
			) : null}
			{flagA > 0 ? (
				<g opacity={flagA}>
					<PaintLine a={pole0} b={poleTop} w={4} color={C.white} />
					<PaintPath d={`M ${poleTop[0]} ${poleTop[1]} L ${poleTop[0] + 54} ${poleTop[1] + 16} L ${poleTop[0]} ${poleTop[1] + 32} Z`} w={2} color={C.white} fill={C.white} />
					<g opacity={a25}>
						{/* 审片 P2：灰字原来压在灰色斜线上 → 垫一块沥青色底板。第二轮审片 P1-4：40 → 50 px（“实际 35”是卡点，52 px） */}
						<PlateText x={g25[0] - 20} y={g25[1] + 17} size={50} anchor="end" color={C.gray} weight={700} pad={8}>
							该剩 25
						</PlateText>
						<PaintDot x={g25[0]} y={g25[1]} r={9} color={C.gray} />
					</g>
					<g opacity={a35}>
						<PaintDot x={r35[0]} y={r35[1]} r={9} color={C.white} />
						<PaintText x={r35[0] + 18} y={r35[1] + 12} size={52} color={C.white} weight={800}>
							实际 35
						</PaintText>
					</g>
				</g>
			) : null}
			{brA > 0 ? (
				<g opacity={brA}>
					{/* 小旗竖杆往下延一根细虚线，指到两个括号的分界 */}
					<PaintLine a={[xM, pole0[1] + 4]} b={[xM, yBr - 4]} w={2} color={C.white} dash="6 7" sh={0} opacity={0.55 * splitA} />
					<Bracket x1={xA + 4} x2={xM - 4} y={yBr} color={C.white} dir={1} depth={14} reveal={easeOut(ramp(t, T.s2End + 0.1, 0.4))} />
					<Bracket x1={xM + 4} x2={xB - 4} y={yBr} color={C.white} dir={1} depth={14} reveal={easeOut(ramp(t, T.s2End + 0.3, 0.4))} />
					{/* 第二轮审片 P1-4：40 → 48 px */}
					<PlateText x={(xA + xM) / 2} y={yBr + 54} size={48} anchor="middle" weight={700} scale={1 + 0.08 * hi1}>
						{`前一半路 −${lost1}`}
					</PlateText>
					<PlateText x={(xM + xB) / 2} y={yBr + 54} size={48} anchor="middle" weight={700} scale={1 + 0.08 * hi2}>
						{`后一半路 −${lost2}`}
					</PlateText>
				</g>
			) : null}
		</g>
	);
};
