// 押注的三张便签（K2）：落下 → 定格 → 圈 B → A、C 退到右缘 → 机制讲完后 A、C 叠到长卷上，指出错在哪一步。
import React from 'react';
import type {Clock, Model, Numbers} from './data';
import {clamp01, ease, easeOutBack, lerp, pulse, ramp, skyColor} from './data';
import {Hand, Note, Ring} from './draw';
import type {Lay} from './scroll';
import {smoothPath, xm, yv} from './scroll';
import {COL, FLAT_VB} from './theme';

type Pose = {cx: number; cy: number; s: number; tilt: number};
const CW = 470;
const CH = 360;
// 便签内部的小图：x −195…195 对应 第一天 20:00 → 第二天 18:00，y：v=1 → −105，v=0 → 75
const PX0 = -195;
const PX1 = 195;
const PV1 = -105;
const PV0 = 75;

const BET: Record<string, Pose> = {
	A: {cx: 430, cy: 530, s: 1, tilt: -2},
	B: {cx: 960, cy: 530, s: 1, tilt: 1},
	C: {cx: 1490, cy: 530, s: 1, tilt: 2.5},
};
/** 右缘的残影位置（之后一直在，到迁移段前）。审片第二轮 P2-14：整组左移 15 px，B 的墨圈离画面右缘留足空 */
export const SIDE: Record<string, Pose> = {
	B: {cx: 1775, cy: 286, s: 0.44, tilt: 1},
	A: {cx: 1775, cy: 463, s: 0.36, tilt: -2}, // 第二轮 P2-14：B 墨圈下沿不再压 A 的顶边
	C: {cx: 1775, cy: 670, s: 0.36, tilt: 2.5}, // 第二轮：A 下面的小标放大到 42 px，C 往下让 22 px
};
const BIG_B: Pose = {cx: 960, cy: 470, s: 1.45, tilt: 0};

const mixPose = (a: Pose, b: Pose, u: number): Pose => ({cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u), s: lerp(a.s, b.s, u), tilt: lerp(a.tilt, b.tilt, u)});
const toScreen = (p: Pose, lx: number, ly: number): [number, number] => {
	const a = (p.tilt * Math.PI) / 180;
	const x = lx * p.s;
	const y = ly * p.s;
	return [p.cx + x * Math.cos(a) - y * Math.sin(a), p.cy + x * Math.sin(a) + y * Math.cos(a)];
};

export const Cards: React.FC<{t: number; clock: Clock; nums: Numbers; model: Model; L: Lay | null; opacity: number}> = ({t, clock, nums, model, L, opacity}) => {
	const fallT = clock.ev('便签落下');
	if (t < fallT || opacity <= 0) return null;
	const s4 = clock.sub(4);
	const s17 = clock.sub(17);
	const {cards} = nums;
	const tt = cards.t;
	const t0c = tt[0];
	const t1c = tt[tt.length - 1];
	const lx = (h: number) => PX0 + ((h - t0c) / (t1c - t0c)) * (PX1 - PX0);
	const ly = (v: number) => PV0 + (PV1 - PV0) * v;

	const poseOf = (k: 'A' | 'B' | 'C'): Pose => {
		const i = k === 'A' ? 0 : k === 'B' ? 1 : 2;
		const fall = easeOutBack(ramp(t, fallT + i * 0.08, 0.5));
		let p: Pose = {...BET[k], cy: lerp(-320, BET[k].cy, fall), tilt: lerp(BET[k].tilt - 9, BET[k].tilt, fall)};
		if (k === 'B') {
			p = mixPose(p, BIG_B, ease(ramp(t, s4.t0 + 0.8, 0.8)));
			p = mixPose(p, SIDE.B, ease(ramp(t, s4.t1 - 0.6, 0.8)));
		} else {
			p = mixPose(p, SIDE[k], ease(ramp(t, s4.t0, 0.8)));
		}
		return p;
	};

	// A、C、B 叠到长卷上：m=0 在便签里，m=1 完全落在图表上
	// 审片第二轮：C 的线和它的小标在 #17 结束前 0.5 秒先收回，接下来的“压平”只动图表（先收再动）
	const cBack = s17.t1 - 0.5;
	const mA = L ? ease(ramp(t, clock.ev('便签A的线叠到灰面积上沿'), clock.evDur('便签A的线叠到灰面积上沿'))) * (1 - ease(ramp(t, s17.t0, 0.6))) : 0;
	const mC = L ? ease(ramp(t, clock.ev('便签C的线叠上'), clock.evDur('便签C的线叠上'))) * (1 - ease(ramp(t, cBack, 0.5))) : 0;
	// 审片第二轮 P1-1：B 的线飞下来、拉到同一条时间轴上，和压平后的沙漏线重合；还原时飞回便签
	const evBfly = clock.ev('便签B的线飞下来');
	const evBack = clock.ev('还原');
	// 还原时 B 不再飞回去（飞回途中会横扫钉子和字幕区上方）：图上那条线原地淡掉，便签里的线和框一起淡回来
	const bIn = L ? ease(ramp(t, evBfly, clock.evDur('便签B的线飞下来'))) : 0;
	const bBack = L ? ramp(t, evBack, clock.evDur('还原')) : 0;
	const mB = bBack > 0 ? 0 : bIn;
	// B = (沙漏 − 潮水) 在便签时段里归一到 0–1（numbers.py [E]）。反过来映射：B 的 0、1 对应缝的最小、最大值
	let gMin = Infinity;
	let gMax = -Infinity;
	tt.forEach((h) => {
		const g = model.S(h) - model.C(h);
		gMin = Math.min(gMin, g);
		gMax = Math.max(gMax, g);
	});
	const target = (k: 'A' | 'B' | 'C', h: number, v: number): [number, number] => {
		if (!L) return [0, 0];
		const vv = k === 'A' ? model.S(h) : k === 'B' ? FLAT_VB + gMin + v * (gMax - gMin) : 0.5 + 0.47 * v;
		return [xm(L, h), yv(L, vv)];
	};
	const curve = (k: 'A' | 'B' | 'C', p: Pose, m: number) => {
		const ys = cards[k];
		const pts: [number, number][] = tt.map((h, i) => {
			const a = toScreen(p, lx(h), ly(ys[i]));
			if (m <= 0) return a;
			const b = target(k, h, ys[i]);
			return [lerp(a[0], b[0], m), lerp(a[1], b[1], m)];
		});
		return pts;
	};

	const ringB = ramp(t, s4.t0, 0.6);
	const bSky = ramp(t, s4.t0 + 0.8, 0.6) * (1 - ramp(t, s4.t1 - 0.6, 0.5));
	const labPeak = ramp(t, s4.t0 + 0.9, 0.4) * (1 - ramp(t, s4.t1 - 0.6, 0.4));
	const labRelief = ramp(t, s4.t0 + 3.0, 0.4) * (1 - ramp(t, s4.t1 - 0.6, 0.4));
	const bGlow = pulse(t, s17.t1 - 1.0, 1.0);

	const draw = (k: 'A' | 'B' | 'C') => {
		const p = poseOf(k);
		const m = k === 'A' ? mA : k === 'C' ? mC : mB;
		// B 的线落到图上时，便签框留 35%（还看得出这是 B 的那张）；还原时框和线一起淡回来
		const frameOp = k !== 'B' ? 1 - m : bBack > 0 ? lerp(0.35, 1, ease(bBack)) : 1 - 0.65 * m;
		const lineOp = k === 'B' && bBack > 0 ? ease(bBack) : 1;
		const pts = curve(k, p, m);
		const bigText = clamp01((p.s - 0.75) / 0.2);
		const letterSize = Math.max(36, 60 * p.s);
		const [lxs, lys] = toScreen(p, -CW / 2 + 22, -CH / 2 + 16);
		const axisL = toScreen(p, PX0, PV0 + 8);
		const axisR = toScreen(p, PX1 + 10, PV0 + 8);
		const [labx, laby] = toScreen(p, 0, CH / 2 - 26);
		const glow = k === 'B' ? bGlow : 0;
		return (
			<g key={k}>
				<g opacity={frameOp}>
					{glow > 0 ? (
						<rect x={p.cx - (CW / 2) * p.s - 14} y={p.cy - (CH / 2) * p.s - 14} width={CW * p.s + 28} height={CH * p.s + 28} rx={16} fill={COL.lamp} opacity={glow} />
					) : null}
					<g transform={`translate(${p.cx} ${p.cy}) scale(${p.s})`}>
						<Note k={`card${k}`} w={CW} h={CH} tilt={p.tilt} />
					</g>
					{/* B 的迷你天色带：顶点对着黎明粉，回落段对着白天 */}
					{k === 'B' && bSky > 0
						? Array.from({length: 44}, (_, i) => {
								const h0 = t0c + (i / 44) * (t1c - t0c);
								const h1 = t0c + ((i + 1) / 44) * (t1c - t0c);
								const a = toScreen(p, lx(h0), PV0 + 14);
								const b = toScreen(p, lx(h1) + 1, PV0 + 14);
								const c = toScreen(p, lx(h1) + 1, PV0 + 40);
								const d = toScreen(p, lx(h0), PV0 + 40);
								return <polygon key={i} points={`${a.join(',')} ${b.join(',')} ${c.join(',')} ${d.join(',')}`} fill={skyColor((h0 + h1) / 2)} opacity={bSky} />;
							})
						: null}
					<line x1={axisL[0]} y1={axisL[1]} x2={axisR[0]} y2={axisR[1]} stroke={COL.ink} strokeWidth={2.2} opacity={k === 'B' ? 1 - bSky : 1} />
					<Hand x={lxs} y={lys + letterSize * 0.9} size={letterSize}>
						{k}
					</Hand>
					{bigText > 0 ? (
						<Hand x={labx} y={laby} size={36} anchor="middle" color={COL.sleepText} opacity={bigText * (k === 'B' ? 1 - bSky : 1)}>
							晚8点 → 次日傍晚
						</Hand>
					) : null}
					{k === 'B' && ringB > 0 ? (
						<Ring k="ringB" cx={p.cx} cy={p.cy} rx={(CW / 2) * 1.235 * p.s} ry={(CH / 2) * 1.27 * p.s} p={ringB} w={5} />
					) : null}
				</g>
				{/* A、C 叠上去时垫一层纸色，和底下的线分开；B 要和压平后的沙漏线“重合”，不垫纸色、线细一点，让底下那条灰线从两边露出来 */}
				{k !== 'B' ? <path d={smoothPath(pts)} fill="none" stroke={COL.paper} strokeWidth={m > 0 ? 11 : 0} strokeLinecap="round" opacity={m} /> : null}
				<path d={smoothPath(pts)} fill="none" stroke={COL.ink} strokeWidth={lerp(Math.max(2.5, 5 * p.s), k === 'B' ? 3.2 : 5, m)} strokeLinecap="round" strokeLinejoin="round" opacity={lineOp} />
				{k === 'B' && bBack > 0 && bBack < 0.5 ? (
					<path d={smoothPath(curve('B', p, 1))} fill="none" stroke={COL.ink} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" opacity={1 - bBack * 2} />
				) : null}
			</g>
		);
	};

	// B 放大时的两个小标
	const pB = poseOf('B');
	const bPeakH = cards.t[cards.B.indexOf(Math.max(...cards.B))];
	const peakPt = toScreen(pB, lx(bPeakH), ly(1));
	const relH = nums.keys.reliefBest.t;
	const relPt = toScreen(pB, lx(relH), ly(Math.min(...cards.B.filter((_, i) => tt[i] > bPeakH && tt[i] < relH + 2))));

	// 叠到长卷上之后的小标
	const labA = L && mA > 0.6 ? ramp(t, clock.ev('便签A的线叠到灰面积上沿') + 1.2, 0.5) * (1 - ramp(t, s17.t0, 0.4)) : 0;
	const cTop = L ? clamp01(mC * 2 - 1) : 0;
	const cPeak = L ? target('C', 24, 1) : [0, 0];
	const seg1 = L ? ramp(t, clock.ev('C 的 00:00–05:30 段描粗'), 0.6) * (1 - ramp(t, cBack, 0.45)) : 0;
	const seg2 = L ? ramp(t, clock.ev('C 的下午段描粗'), 0.6) * (1 - ramp(t, cBack, 0.45)) : 0;
	const segPath = (a: number, b: number) => {
		if (!L) return '';
		const pts: [number, number][] = [];
		for (let i = 0; i < tt.length; i++) if (tt[i] >= a - 1e-6 && tt[i] <= b + 1e-6) pts.push(target('C', tt[i], cards.C[i]));
		return smoothPath(pts);
	};
	// 回到右缘后，便签下面的小标（审片第二轮 P1-3：36 → 42 px；等 B 的对位做完、还原后再出，不和压平同时动）
	const tagOp = ramp(t, evBack + clock.evDur('还原'), 0.5);
	return (
		<g opacity={opacity}>
			{draw('A')}
			{draw('C')}
			{draw('B')}
			{labPeak > 0 ? (
				<Hand x={peakPt[0]} y={peakPt[1] - 26} size={38} anchor="middle" color={COL.ink} opacity={labPeak} halo={COL.card}>
					天亮前
				</Hand>
			) : null}
			{labRelief > 0 ? (
				<Hand x={relPt[0]} y={relPt[1] + 52} size={38} anchor="middle" color={COL.ink} opacity={labRelief} halo={COL.card}>
					缓一口气
				</Hand>
			) : null}
			{/* A：它就是沙漏本身 */}
			{L && labA > 0 ? (
				<Hand x={xm(L, 41.4)} y={yv(L, model.S(41.4)) - 30} size={38} anchor="middle" opacity={labA} halo={COL.paper}>
					只算沙漏
				</Hand>
			) : null}
			{/* C：顶点是平时睡觉的点；错的两段用墨色粗描 + 小叉（审片 P1-2：红色只留给“困”和车祸，不再表示“错”）。
			    第二段错处的“沙漏没倒”不另写字：长卷上那支“沙漏没倒”箭头的残影此刻亮一下（Video.tsx） */}
			{L && cTop > 0 ? (
				<g>
					<path d={segPath(24, nums.keys.maxGap.t)} fill="none" stroke={COL.ink} strokeWidth={15} strokeLinecap="round" opacity={0.2 * seg1} />
					<path d={segPath(nums.keys.reliefBest.t, nums.keys.afternoonMax.t)} fill="none" stroke={COL.ink} strokeWidth={15} strokeLinecap="round" opacity={0.2 * seg2} />
					{[
						{h: (24 + nums.keys.maxGap.t) / 2, p: seg1},
						{h: (nums.keys.reliefBest.t + nums.keys.afternoonMax.t) / 2, p: seg2},
					].map(({h, p}, i) => {
						if (p <= 0) return null;
						const ci = tt.findIndex((x) => x >= h);
						const [cx, cy] = target('C', tt[ci], cards.C[ci]);
						const r = 13;
						return (
							<g key={i} opacity={p}>
								<circle cx={cx} cy={cy - 30} r={r + 9} fill={COL.paper} opacity={0.85} />
								<line x1={cx - r} y1={cy - 30 - r} x2={cx + r} y2={cy - 30 + r} stroke={COL.ink} strokeWidth={5} strokeLinecap="round" />
								<line x1={cx + r} y1={cy - 30 - r} x2={cx - r} y2={cy - 30 + r} stroke={COL.ink} strokeWidth={5} strokeLinecap="round" />
							</g>
						);
					})}
					<Hand x={cPeak[0]} y={cPeak[1] - 26} size={38} anchor="middle" opacity={cTop * (1 - ramp(t, cBack, 0.45))} halo={COL.paper}>
						平时睡觉的点
					</Hand>
					<Hand x={xm(L, 27.2)} y={yv(L, model.C(27.2)) + 56} size={40} anchor="middle" color={COL.tide} opacity={seg1} halo={COL.paper}>
						潮水还在退
					</Hand>
				</g>
			) : null}
			{L && tagOp > 0 ? (
				<g opacity={tagOp * (1 - ramp(t, clock.sub(21).t0, 0.6))}>
					<Hand x={SIDE.A.cx} y={SIDE.A.cy + 110} size={42} anchor="middle" color={COL.sleepText} halo={COL.paper}>
						只算沙漏
					</Hand>
					<Hand x={SIDE.C.cx} y={SIDE.C.cy + 108} size={42} anchor="middle" color={COL.sleepText} halo={COL.paper}>
						潮水还在退
					</Hand>
				</g>
			) : null}
		</g>
	);
};
