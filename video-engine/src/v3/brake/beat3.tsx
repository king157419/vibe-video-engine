import React from 'react';
import {bump, fin, ramp, win} from './anim';
import {easeOut} from './cam';
import type {BeatProps} from './beats';
import {Bracket, PaintLine, PaintPath, PaintText, PlateText} from './paint';
import {SLOW} from './timeline';
import {C, DOT_OFF, dotR, gx, LANE, RY50} from './theme';
import {S, zoomOf} from './top';

// ③a 只改一处：白车从刹车点重放，每滴一个点就标出它的速度；一排一模一样的“−5”
// ③b 合理内核：米尺和秒尺（漆点）在匀速段成固定比例，一刹车就错开

/** 刹车段的点：tb = 0（踩下刹车那一刻）到停住，共 11 个 */
const brakeDots = (p: BeatProps) => p.N.dots['50'].filter((d) => d.tb >= -1e-9);

/** ③a 的结论（两对按秒的括号）：前 k 格 / 后 n − k 格 */
const splitNums = (p: BeatProps) => {
	const dt = p.N.assumptions.dot_dt;
	const k = Math.round(p.N.card_a.t_half / dt); // 刹车路一半处落在第 k 格（0.6 秒）
	const n = brakeDots(p).length - 1;
	return {dt, k, n, lost1: Math.round(50 - p.N.card_a.v_half), lost2: Math.round(p.N.card_a.v_half)};
};

export const PerSecond: React.FC<BeatProps> = (p) => {
	const {cam, t, T, N} = p;
	const z = zoomOf(cam);
	const ds = brakeDots(p);
	const tr = N.main['50'].t_react;
	const on = win(t, T.s3aEnd, T.s3b, 0.2, 0.5);
	if (on <= 0) return null;
	const tpReplay = tr + Math.max(0, (t - T.s3aEnd) * SLOW);
	const dotY = S(cam, 0, RY50 + DOT_OFF)[1];
	const xs = ds.map((d) => S(cam, gx(d.x), 0)[0]);
	const x0 = xs[0];
	const x1 = xs[xs.length - 1];
	// 审片 P0-1：下面这排等距的速度标签明确做成“秒尺”——一根带刻度的横线，每格 0.2 秒，每个漆点用引线连到自己的那一格。
	// 路面上（漆点正下方）是按米对半分的括号（Stuck）；秒尺下面是按秒分的括号：前 3 格 0.6 秒 −15、后 7 格 1.4 秒 −35。
	// 两对括号减掉的一样多，一对等宽、一对宽窄悬殊——米和秒的错位直接画出来。
	const {dt, k, n: nCell, lost1, lost2} = splitNums(p);
	const lx = ds.map((_, i) => x0 + ((x1 - x0) * i) / nCell);
	// 第二轮审片 P1-4：上面“前一半路 / 后一半路”和下面括号里的结论都提到 48–50 px，秒尺整体下移 6 世界像素腾位置
	const rulerY = S(cam, 0, RY50 + DOT_OFF + 140)[1];
	const labY = rulerY - 16;
	const m5Y = rulerY + 44;
	const brY = rulerY + 64;
	const m5 = fin(t, T.minus5, 0.3);
	const tick = win(t, T.p02, T.s3b, 0.3, 0.4);
	const r = dotR(z);
	const tA = fin(t, T.t06, 0.3);
	const tB = fin(t, T.t14, 0.3);
	const big = fin(t, T.moreTime, 0.3);
	const ruler = fin(t, T.s3aEnd, 0.3);
	const head = fin(t, T.p02, 0.4);
	const dripped = (d: (typeof ds)[number]) => fin(t, T.s3aEnd + (d.tb >= 0 ? (d.t - tr) / SLOW : 0), 0.18) * (tpReplay + 1e-6 >= d.t ? 1 : 0);
	// 第二轮审片 P2：每个漆点到秒尺刻度的斜引线，斜着穿过“前一半路 −15 / 后一半路 −35”。
	// 滴点时照旧每个点一根斜线（看清“第几个点对第几格”）；念到“零点六秒”前全部收掉，
	// 换成只连三对分界点（起点、一半路、停住）的折线：从漆点竖直落下，从两块标签之间的缝里穿过，再折到刻度
	const diag = 1 - ramp(t, T.t06 - 0.45, 0.35);
	const elbow = fin(t, T.t06 - 0.3, 0.35);
	const yG = labY - 54; // 折线的水平段：在上面标签的下沿和速度数字的上沿之间
	const elbowPath = (i: number) => `M ${xs[i]} ${dotY + r + 3} L ${xs[i]} ${yG} L ${lx[i]} ${yG} L ${lx[i]} ${labY - 44}`;
	return (
		<g opacity={on}>
			{/* 秒尺：横线 + 每格刻度 */}
			<g opacity={ruler}>
				<PaintLine a={[x0, rulerY]} b={[x1, rulerY]} w={3} color={C.white} />
				{lx.map((x, i) => (
					<PaintLine key={i} a={[x, rulerY - 8]} b={[x, rulerY + 8]} w={3} color={C.white} opacity={0.35 + 0.65 * dripped(ds[i])} />
				))}
			</g>
			<PaintText x={x1 + 30} y={rulerY + 14} size={40} weight={700} opacity={head}>
				每格 0.2 秒
			</PaintText>
			{elbow > 0
				? [0, k, nCell].map((i) => <PaintPath key={`e${i}`} d={elbowPath(i)} w={2} color={C.white} sh={0} opacity={0.75 * elbow} cap="butt" />)
				: null}
			{ds.map((d, i) => {
				const a = dripped(d);
				if (a <= 0) return null;
				return (
					<g key={i} opacity={a}>
						{diag > 0 ? <PaintLine a={[xs[i], dotY + r + 3]} b={[lx[i], labY - 44]} w={2} color={C.white} sh={0} opacity={0.6 * diag} /> : null}
						<PaintText x={lx[i]} y={labY} size={46} anchor="middle" weight={700} tnum>
							{Math.round(d.v)}
						</PaintText>
					</g>
				);
			})}
			{m5 > 0
				? ds.slice(1).map((_, i) => (
						<PaintText key={i} x={(lx[i] + lx[i + 1]) / 2} y={m5Y} size={36} anchor="middle" weight={700} opacity={m5} scale={1 + 0.15 * bump(t, T.minus5, 0.5)}>
							−5
						</PaintText>
					))
				: null}
			{tA > 0 ? (
				<g opacity={tA}>
					<Bracket x1={lx[0] + 3} x2={lx[k] - 3} y={brY} color={C.white} dir={1} depth={14} reveal={easeOut(ramp(t, T.t06, 0.4))} />
					<PaintText x={(lx[0] + lx[k]) / 2} y={brY + 58} size={50} anchor="middle" weight={700}>
						{`${(k * dt).toFixed(1)} 秒 −${lost1}`}
					</PaintText>
				</g>
			) : null}
			{tB > 0 ? (
				<g opacity={tB}>
					<Bracket x1={lx[k] + 3} x2={lx[nCell] - 3} y={brY} color={C.white} dir={1} depth={14} reveal={easeOut(ramp(t, T.t14, 0.4))} />
					<PaintText x={(lx[k] + lx[nCell]) / 2} y={brY + 58 + 4 * big} size={50 + 8 * big} anchor="middle" weight={700}>
						{`${((nCell - k) * dt).toFixed(1)} 秒 −${lost2}`}
					</PaintText>
				</g>
			) : null}
			{tick > 0 ? (
				<g opacity={tick}>
					<Bracket x1={xs[0] + r} x2={xs[1] - r} y={dotY - r - 8} color={C.white} dir={1} depth={10} w={3} />
					<PaintText x={(xs[0] + xs[1]) / 2} y={dotY - r - 26} size={36} anchor="middle" weight={700}>
						0.2 秒
					</PaintText>
				</g>
			) : null}
		</g>
	);
};

/**
 * ③b 合理内核。第二轮审片 P1-2：原来米尺是一根细线、刻度 1–2 px，手机上只剩一条线，“匀速时成比例、一刹车就错开”看不出来。
 * 改成：
 * - 米尺做成“斑马尺”：26 px 高，每 1 米黑白相间（格线从停车点往回数，最后一格正好是“最后 1 米”），放在漆点正下方；
 * - 每个漆点竖一根短线落到尺上：匀速段每个点都跨过约 2.8 格；
 * - 念到“一刹车”时尺子延伸到刹车段，镜头同时推近刹车段（每米约 82 px，top.tsx camAt），最后几格里挤着 3–4 个点；
 * - “最后 1 米 / 第一米”两个框各正好一格宽（≥ 80 px），时间写在框下，60 px；
 * - ③a 的结论缩成一行小字残影“0.6 秒 −15 ｜ 1.4 秒 −35”，留到 ③b 结束（第二轮审片 P2：原来 ③b 一开口就全撤了）。
 */
export const Kernel: React.FC<BeatProps> = (p) => {
	const {cam, t, T, N} = p;
	const z = zoomOf(cam);
	const s50 = N.main['50'];
	const on = win(t, T.uniform - 0.2, T.s3c, 0.4, 0.5);
	const resA = win(t, T.s3b + 0.3, T.s3c, 0.4, 0.5);
	if (on <= 0 && resA <= 0) return null;
	const r = dotR(z);
	const X = (m: number) => S(cam, gx(m), 0)[0];
	const dotY = S(cam, 0, RY50 + DOT_OFF)[1];
	// 斑马尺上沿：漆点下方，并且让开路缘实线（推近后路缘线离漆点更远）
	const curbY = S(cam, 0, RY50 + LANE / 2 + 3)[1];
	const zTop = Math.max(dotY + r + 14, curbY + 8);
	const zH = 26;
	const draw = easeOut(ramp(t, T.uniform, 0.6));
	const ext = easeOut(ramp(t, T.oneBrake, 0.8)); // 一刹车：两把尺一起往刹车段延伸
	const stop = s50.stop_dist;
	const mLim = t >= T.oneBrake ? s50.react + (stop - s50.react) * ext : s50.react * draw;
	// 格线从停车点往回数：[stop − k − 1, stop − k]
	const cells: [number, number][] = [];
	for (let k = 0; stop - k > 0; k++) cells.push([Math.max(0, stop - k - 1), stop - k]);
	const flash = bump(t, T.mAndS, 0.7);
	const spacing = ((s50.v0 / 3.6) * N.assumptions.dot_dt).toFixed(2);
	const lbl = win(t, T.uniform + 0.2, T.oneBrake + 0.4, 0.3, 0.4);
	const lastA = fin(t, T.lastM, 0.3);
	const firstA = fin(t, T.eachM, 0.3); // “每一米都更费时间”：念到“每一米”时出第一米的框，和最后 1 米对照
	const box = (m0: number, m1: number) => ({x: X(m0), y: dotY - r - 12, w: X(m1) - X(m0), h: zTop + zH + 8 - (dotY - r - 12)});
	const bl = box(stop - 1, stop);
	const bf = box(s50.react, s50.react + 1);
	const sp = splitNums(p);
	const xEndScr = X(mLim);
	return (
		<g>
			<g opacity={on}>
				{/* 斑马尺：深色底 + 白格 */}
				{mLim > 0.01 ? (
					<g>
						<rect x={X(0)} y={zTop + 3} width={Math.max(0, xEndScr - X(0))} height={zH} fill={C.shadow} />
						<rect x={X(0)} y={zTop} width={Math.max(0, xEndScr - X(0))} height={zH} fill="#0b0c0e" stroke={C.white} strokeWidth={2} />
						{cells.map(([a, b], i) => {
							if (i % 2 === 1 || a >= mLim) return null;
							const xa = X(a);
							const xb = X(Math.min(b, mLim));
							return <rect key={i} x={xa} y={zTop} width={Math.max(0, xb - xa)} height={zH} fill={C.white} />;
						})}
					</g>
				) : null}
				<PaintText x={X(0) - 12} y={zTop + zH / 2 + 13} size={36} anchor="end" weight={600} opacity={lbl}>
					米尺
				</PaintText>
				<PaintText x={X(0) - 12} y={dotY + 12} size={36} anchor="end" weight={600} opacity={lbl}>
					秒尺
				</PaintText>
				{/* 放在尺子左端下面（右端上方是人和斑马线）；推近后左端出画，就贴住画面左边 */}
				<PaintText x={Math.max(X(0), 24)} y={zTop + zH + 44} size={36} weight={600} opacity={fin(t, T.uniform + 0.3, 0.4)}>
					每格 1 米
				</PaintText>
				{/* 每个漆点竖一根短线落到尺上 */}
				{N.dots['50'].map((d, i) => {
					if (d.x > mLim + 1e-6) return null;
					const x = X(d.x);
					const inReact = d.tb <= 1e-9;
					const fl = inReact && i % 2 === 0 ? flash : 0;
					return <PaintLine key={i} a={[x, dotY + r + 2]} b={[x, zTop - 1]} w={3 + 3 * fl} color={C.white} sh={0} opacity={0.85} />;
				})}
				<PaintText x={X(1.5)} y={S(cam, 0, RY50 - 14)[1]} size={40} weight={600} opacity={lbl}>
					{`匀速：每 0.2 秒都是 ${spacing} 米`}
				</PaintText>
				{lastA > 0 ? (
					<g opacity={lastA}>
						<rect x={bl.x} y={bl.y} width={bl.w} height={bl.h} fill="none" stroke={C.white} strokeWidth={4} />
						<PaintText x={bl.x + bl.w / 2} y={bl.y + bl.h + 46} size={40} anchor="middle" weight={600}>
							最后 1 米
						</PaintText>
						<PaintText x={bl.x + bl.w / 2} y={bl.y + bl.h + 110} size={60} anchor="middle" weight={800}>
							{`${N.per_meter_time.last_1m.toFixed(2)} 秒`}
						</PaintText>
					</g>
				) : null}
				{firstA > 0 ? (
					<g opacity={firstA}>
						<rect x={bf.x} y={bf.y} width={bf.w} height={bf.h} fill="none" stroke={C.white} strokeWidth={4} />
						<PaintText x={bf.x + bf.w / 2} y={bf.y + bf.h + 46} size={40} anchor="middle" weight={600}>
							刹车后第一米
						</PaintText>
						<PaintText x={bf.x + bf.w / 2} y={bf.y + bf.h + 110} size={60} anchor="middle" weight={800}>
							{`${N.per_meter_time.first_1m.toFixed(2)} 秒`}
						</PaintText>
					</g>
				) : null}
			</g>
			{resA > 0 ? (
				<PlateText x={840} y={900} size={40} anchor="middle" weight={700} opacity={resA} pad={10}>
					{`${(sp.k * sp.dt).toFixed(1)} 秒 −${sp.lost1}  ｜  ${((sp.n - sp.k) * sp.dt).toFixed(1)} 秒 −${sp.lost2}`}
				</PlateText>
			) : null}
		</g>
	);
};
