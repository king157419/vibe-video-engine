import React from 'react';
import {bump, fin, mv, ramp, win} from './anim';
import type {V2} from './cam';
import {easeOut} from './cam';
import type {BeatProps} from './beats';
import type {Numbers} from './data';
import {Bracket, PaintDot, PaintLine, PaintPath, PaintText, PlateText} from './paint';
import {C, DOT_OFF, DOT_R, gx, RY50, RY60} from './theme';

// ③d 具体渐隐：路上的漆点 → 原地竖成柱（柱高 = 那一刻的速度）→ 柱顶连成曲线 → 一句规则
// 第二轮审片 P2：“刹车路 13.8 米”括号右端贴住右下角角标第一行 → 整张图上移 60 px（760 → 700）
export const YG = 700; // 图的基线
export const KV = 6; // 每码 6 px（50 码 = 300 px；分镜写 4 px，放大到 6 px 让曲线在手机上更清楚）
const YOFF = 6; // 黄点在后、白点在前，前后错开 6 px
// “按米 / 按秒”图例：图右侧（“人”那条线右边）的空白，两行
const LEG_X = 1572;
const LEG_Y1 = YG - 150;
const LEG_Y2 = YG - 70;

/** 刹车段速度曲线 v(x)，与 numbers.py 同一公式 v² = v0² − 2a(x − 反应距离) */
export const curvePts = (N: Numbers, key: '50' | '60', xEndM: number, n = 60): V2[] => {
	const s = N.main[key];
	const v0 = s.v0 / 3.6;
	const out: V2[] = [[gx(0), YG - KV * s.v0]];
	out.push([gx(s.react), YG - KV * s.v0]);
	for (let i = 1; i <= n; i++) {
		const x = s.react + ((xEndM - s.react) * i) / n;
		const v2 = v0 * v0 - 2 * s.a * (x - s.react);
		out.push([gx(x), YG - KV * Math.sqrt(Math.max(0, v2)) * 3.6]);
	}
	return out;
};

const toPath = (p: V2[]) => p.map((q, i) => `${i ? 'L' : 'M'} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');

/** 只取曲线的前 frac（按 x 方向） */
const partial = (p: V2[], frac: number): V2[] => {
	if (frac >= 1) return p;
	const xEnd = p[0][0] + (p[p.length - 1][0] - p[0][0]) * frac;
	const out: V2[] = [];
	for (let i = 0; i < p.length; i++) {
		if (p[i][0] <= xEnd) out.push(p[i]);
		else {
			const a = p[i - 1];
			const b = p[i];
			const s = (xEnd - a[0]) / (b[0] - a[0] || 1);
			out.push([xEnd, a[1] + (b[1] - a[1]) * s]);
			break;
		}
	}
	return out;
};

export const Curve: React.FC<BeatProps> = (p) => {
	const {t, T, N} = p;
	const on = win(t, T.s3d, T.s4, 0.3, 0.6);
	if (on <= 0) return null;
	const s50 = N.main['50'];
	const s60 = N.main['60'];
	// 点从路上平移到同一条基线（横坐标不变）
	const move = easeOut(ramp(t, T.s3d + 0.1, 0.9));
	// 收起：雨天开始时柱子落回、点回到路上（白），黄的淡出
	const back = easeOut(ramp(t, T.s4, 0.7));
	const axisA = fin(t, T.s3d + 0.6, 0.5) * (1 - back);
	const colStart = (x: number) => T.raise + ((x - gx(0)) / (gx(35) - gx(0))) * 1.3;
	const colH = (x: number, v: number) => KV * v * easeOut(ramp(t, colStart(x), 0.45)) * (1 - back);
	const wCurve = curvePts(N, '50', s50.stop_dist);
	const yCurve = curvePts(N, '60', 35);
	const draw = easeOut(ramp(t, T.raiseEnd, 1.6));
	const curveA = (1 - back) * fin(t, T.raiseEnd, 0.3);
	const flat = bump(t, T.flat, 0.8);
	const steep = bump(t, T.steep, 0.8);
	const gray = fin(t, T.raiseEnd + 0.4, 0.5) * (1 - back);
	const grayFlash = bump(t, T.grayLine, 0.6);
	const q34 = fin(t, T.q34, 0.4) * (1 - back);
	const half = fin(t, T.halfV, 0.4) * (1 - back);
	const byM = fin(t, T.byM, 0.3) * (1 - back);
	const byS = fin(t, T.byS, 0.3) * (1 - back);
	const res = fin(t, T.halfVEnd + 0.1, 0.4) * (1 - back);
	const xm = gx(N.rule_marker_50.x);
	const y25 = YG - KV * N.rule_marker_50.v;
	const vHit = s60.v_hit;
	const hitP: V2 = [gx(35), YG - KV * vHit];
	const xA = gx(s50.react);
	const xB = gx(s50.stop_dist);
	// 审片 P1-2：“刹车路走完 3/4、速度剩一半”要在图上有锚点。
	// 念“前面平”时横轴下方画出白车刹车路的括号；念“四分之三”时最后 1/4 铺一层浅白底、标“最后 1/4”；
	// 念“还剩一半”时 3/4 处那根柱子（正好是 25 码那个点）加粗闪一下，横线拉到纵轴的“一半 25”。
	// 讲这条规则时黄车那组压暗，只突出白车。
	const brk = fin(t, T.flat, 0.4) * (1 - back);
	const shade = fin(t, T.q34, 0.4) * (1 - back);
	const barPop = bump(t, T.halfV, 0.8);
	const yDim = 1 - 0.6 * win(t, T.q34 - 0.3, T.grayLine, 0.4, 0.4);
	const yTop = YG - KV * 52;
	// 第二轮审片 P1-1：“按米”原来是灰字深灰底、压在柱子和“一半 25”横虚线中间，几乎看不清。改成：
	// - “按米 / 按秒”做成图右侧空白处的一对图例（线样 + 52 px 字），不再塞进柱子区；
	// - 念“按米掉”时灰线加粗、柱子和两条曲线压到 40%，图例只亮“按米”；
	// - 念“按秒掉”时反过来：只亮白曲线（加粗），灰线也压到 40%，图例亮“按秒”。
	const mPhase = win(t, T.byM, T.byS, 0.25, 0.25);
	const sPhase = fin(t, T.byS, 0.25) * (1 - back);
	const focus = Math.max(mPhase, sPhase); // 有一个在讲时，柱子压暗
	const colDim = 1 - 0.6 * focus;
	const yCurveDim = 1 - 0.6 * focus;
	const grayDim = 1 - 0.6 * sPhase;
	const wCurveDim = 1 - 0.6 * mPhase;
	return (
		<g opacity={on}>
			{/* 坐标轴 */}
			<g opacity={axisA}>
				<PaintLine a={[gx(0) - 10, YG]} b={[gx(40), YG]} w={3} color={C.white} />
				<PaintLine a={[gx(0), YG]} b={[gx(0), YG - KV * 64]} w={3} color={C.white} />
				{[0, 10, 20, 30].map((m) => (
					<g key={m}>
						<PaintLine a={[gx(m), YG]} b={[gx(m), YG + 12]} w={3} color={C.white} />
						<PaintText x={gx(m)} y={YG + 50} size={36} anchor="middle">
							{m}
						</PaintText>
					</g>
				))}
				<PaintText x={gx(40) + 14} y={YG + 12} size={36}>
					米
				</PaintText>
				<PaintText x={gx(0) + 14} y={YG - KV * 64 - 6} size={36}>
					速度（码）
				</PaintText>
				{[25, 50].map((v) => (
					<g key={v}>
						<PaintLine a={[gx(0) - 12, YG - KV * v]} b={[gx(0), YG - KV * v]} w={3} color={C.white} />
						<PaintText x={gx(0) - 18} y={YG - KV * v + 14} size={v === 25 && half > 0 ? 44 : 36} anchor="end" weight={v === 25 && half > 0 ? 700 : 500}>
							{v === 25 && half > 0 ? '一半 25' : String(v)}
						</PaintText>
					</g>
				))}
				{/* 人那条线 */}
				<PaintLine a={[gx(35), YG]} b={[gx(35), YG - KV * 66]} w={3} color={C.white} dash="10 8" opacity={0.8} />
				<PaintText x={gx(35)} y={YG - KV * 66 - 12} size={36} anchor="middle" weight={600}>
					人
				</PaintText>
			</g>
			{/* 最后 1/4 刹车路：浅白底（画在柱子下面） */}
			{shade > 0 ? (
				<g opacity={shade}>
					<rect x={xm} y={yTop} width={(xB - xm) * easeOut(ramp(t, T.q34, 0.5))} height={YG - yTop} fill={C.white} opacity={0.13} />
					<PlateText x={(xm + xB) / 2} y={yTop - 14} size={44} anchor="middle" weight={800} pad={6}>
						最后 1/4
					</PlateText>
				</g>
			) : null}
			{/* 横轴下方：白车的刹车路 */}
			{brk > 0 ? (
				<g opacity={brk}>
					<Bracket x1={xA + 2} x2={xB - 2} y={YG + 70} color={C.white} dir={1} depth={14} w={4} reveal={easeOut(ramp(t, T.flat, 0.5))} />
					{/* 字放在括号左边：放括号正下方会和右下角假设角标连成一行 */}
					<PaintText x={xA - 16} y={YG + 94} size={44} anchor="end" weight={700}>
						{`刹车路 ${s50.brake_dist.toFixed(1)} 米`}
					</PaintText>
				</g>
			) : null}
			{/* 柱子和点：黄在后，白在前 */}
			{(['60', '50'] as const).map((k) => {
				const yRoad = (k === '50' ? RY50 : RY60) + DOT_OFF;
				const col = k === '50' ? C.white : C.yellow;
				const dx = k === '60' ? YOFF : 0;
				return N.dots[k].map((d, i) => {
					const x = gx(d.x) + dx * move;
					const yDot = mv(t, T.s3d + 0.1, 0.9, yRoad, YG);
					const yy = back > 0 ? yDot + (yRoad - YG) * back : yDot;
					const h = colH(gx(d.x), d.v);
					const fade = (1 - back) * (k === '60' ? yDim : 1) * colDim; // 白点回到路上的同时淡出，路上的点（TopWorld）同时淡入
					return (
						<g key={`${k}${i}`} opacity={fade}>
							{h > 0.5 ? <rect x={x - 4} y={YG - h} width={8} height={h} fill={col} opacity={0.9} /> : null}
							<PaintDot x={x} y={yy - (h > 0.5 ? h : 0)} r={DOT_R} color={col} />
						</g>
					);
				});
			})}
			{/* 曲线：先平后陡 */}
			{curveA > 0 ? (
				<g opacity={curveA}>
					<PaintPath d={toPath(partial(yCurve, draw))} w={5} color={C.yellow} opacity={yDim * yCurveDim} />
					<PaintPath d={toPath(partial(wCurve, draw))} w={5 + 4 * flat + 4 * steep + 4 * sPhase} color={C.white} opacity={wCurveDim} />
					{flat > 0 ? <PaintPath d={toPath(partial(wCurve, 0.62))} w={12} color={C.white} opacity={flat * 0.6} sh={0} /> : null}
					{steep > 0 ? <PaintPath d={toPath(wCurve.filter((q) => q[0] >= gx(s50.react + 0.75 * s50.brake_dist)))} w={12} color={C.white} opacity={steep * 0.6} sh={0} /> : null}
					{draw >= 0.999 ? (
						<g>
							<PaintDot x={hitP[0]} y={hitP[1]} r={10} color={C.red} />
							<PaintText x={hitP[0] + 16} y={hitP[1] + 14} size={44} color={C.red} weight={800}>
								{Math.round(vHit)}
							</PaintText>
						</g>
					) : null}
				</g>
			) : null}
			{/* A 卡那种“按米均匀掉”：刹车段上的灰色直线 */}
			{gray > 0 ? (
				<g opacity={gray * grayDim}>
					<PaintLine a={[xA, YG - KV * 50]} b={[xB, YG]} w={5 + 4 * grayFlash + 4 * mPhase} color={C.gray} dash="16 10" />
				</g>
			) : null}
			{/* 图例：右侧空白处，线样 + 字（第二轮审片 P1-1） */}
			{byM > 0 ? (
				<g opacity={byM * (1 - 0.6 * sPhase)}>
					<PaintLine a={[LEG_X, LEG_Y1 - 17]} b={[LEG_X + 78, LEG_Y1 - 17]} w={5 + 4 * mPhase} color={C.gray} dash="16 10" />
					<PaintText x={LEG_X + 96} y={LEG_Y1} size={52} color={C.grayText} weight={800}>
						按米
					</PaintText>
				</g>
			) : null}
			{byS > 0 ? (
				<g opacity={byS}>
					<PaintLine a={[LEG_X, LEG_Y2 - 17]} b={[LEG_X + 78, LEG_Y2 - 17]} w={5 + 4 * sPhase} color={C.white} />
					<PaintText x={LEG_X + 96} y={LEG_Y2} size={52} color={C.white} weight={800}>
						按秒
					</PaintText>
				</g>
			) : null}
			{/* 刹车路走完 3/4 → 速度剩一半：3/4 处的柱子加粗，横线拉到纵轴的 25 */}
			{q34 > 0 ? (
				<g opacity={q34 * colDim}>
					<rect x={xm - 6 - 3 * barPop} y={y25} width={12 + 6 * barPop} height={YG - y25} fill={C.white} />
					<PaintDot x={xm} y={y25} r={11 + 5 * barPop} color={C.white} />
				</g>
			) : null}
			{half > 0 ? <PaintLine a={[xm - 12, y25]} b={[xm - 12 - (xm - 12 - gx(0)) * easeOut(ramp(t, T.halfV, 0.6)), y25]} w={4} color={C.white} dash="12 8" opacity={half * colDim} /> : null}
			{/* 第二轮审片 P2：这行残影原来在段末才出、只停约 0.8 秒就跟着转场撤掉，还放在右边角标旁 →
			    念完“速度还剩一半”就出，放到图左上方的空地，一直留到转场（约 5 秒） */}
			{res > 0 ? (
				<PaintText x={880} y={262} size={44} anchor="middle" weight={700} opacity={res}>
					刹车路走完 3/4 → 速度剩 1/2
				</PaintText>
			) : null}
		</g>
	);
};
