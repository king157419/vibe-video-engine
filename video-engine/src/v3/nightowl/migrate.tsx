// 迁移 ×2（K7）：主卷缩成顶部总览条；左边“伦敦小卷”（潮水没换时区），右边“补觉小卷”（沙漏少一截）。
// 二审 / 审片后：两条小卷原地淡入（从上方轻落 30 px，不经过字幕带）；补觉卷只截 16:00–01:00、纵轴放大；
// “伦敦”二字用墨色 + 下划线（红色只给“困”和车祸）；#26 的两个标签改成“潮水没换时区”“沙漏少一截”。
import React from 'react';
import type {Clock, Model, Numbers} from './data';
import {clamp01, ease, interp, lerp, pulse, ramp} from './data';
import {Arrow, ClockFace, Hand, PinHead, Plane, Prop, textW} from './draw';
import type {HourMap} from './scroll';
import {gapPolys, HatchDefs, SkyBand, smoothPath, xm} from './scroll';
import {COL} from './theme';

const ScrollFrame: React.FC<{x0: number; y0: number; x1: number; y1: number}> = ({x0, y0, x1, y1}) => (
	<g>
		<rect x={x0 + 8} y={y0 + 10} width={x1 - x0} height={y1 - y0} fill="#000" opacity={0.05} />
		<rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={COL.card} stroke={COL.ink} strokeWidth={2.4} />
		{[x0, x1].map((x) => (
			<g key={x}>
				<rect x={x - 10} y={y0 - 14} width={20} height={y1 - y0 + 28} rx={9} fill="#d8cbb0" stroke={COL.ink} strokeWidth={2.4} />
				<line x1={x} y1={y0 - 8} x2={x} y2={y1 + 8} stroke={COL.ink} strokeWidth={1.2} opacity={0.4} />
			</g>
		))}
	</g>
);

/** 一条小卷里的三样东西：灰面积（沙漏）、蓝线（潮水）、斜线（困）。Y 是这条小卷自己的纵轴 */
const MiniChart: React.FC<{
	id: string;
	m: HourMap;
	Y: (v: number) => number;
	base: number; // 灰面积的底（= 横轴的 y）
	ha: number;
	hb: number;
	S: ((h: number) => number) | null;
	sFrom: number;
	sTo: number;
	C: (h: number) => number;
	cTo: number;
	blueGlow?: number;
	grayGlow?: number;
	dashed?: {f: (h: number) => number; from: number; to: number} | null;
}> = ({id, m, Y, base, ha, hb, S, sFrom, sTo, C, cTo, blueGlow = 0, grayGlow = 0, dashed}) => {
	const step = 0.1;
	const hsC: number[] = [];
	for (let h = ha; h < cTo; h += step) hsC.push(h);
	hsC.push(cTo);
	const X = (h: number) => xm(m, h);
	const cPts: [number, number][] = hsC.map((h) => [X(h), Y(C(h))]);
	let gray = '';
	let sPath = '';
	let polys: string[] = [];
	if (S && sTo > sFrom) {
		const hs: number[] = [];
		for (let h = sFrom; h < sTo; h += step) hs.push(h);
		hs.push(sTo);
		const pts: [number, number][] = hs.map((h) => [X(h), Math.min(base, Y(S(h)))]);
		gray = `${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')} ${X(sTo).toFixed(1)},${base} ${X(sFrom).toFixed(1)},${base}`;
		sPath = smoothPath(pts);
		polys = gapPolys(hs, S, C, X, Y);
	}
	let dPath = '';
	if (dashed && dashed.to > dashed.from) {
		const hs: number[] = [];
		for (let h = dashed.from; h < dashed.to; h += step) hs.push(h);
		hs.push(dashed.to);
		dPath = smoothPath(hs.map((h) => [X(h), Y(dashed.f(h))]));
	}
	return (
		<g>
			<HatchDefs id={`${id}h`} ox={X(ha)} gap={13} sw={2.2} />
			<line x1={X(ha)} y1={base} x2={X(hb)} y2={base} stroke={COL.ink} strokeWidth={2.2} />
			{gray ? <polygon points={gray} fill={COL.sleep} opacity={0.4 + 0.3 * grayGlow} /> : null}
			{sPath ? <path d={sPath} fill="none" stroke={COL.sleep} strokeWidth={3 + 4 * grayGlow} strokeLinecap="round" /> : null}
			{polys.map((p, i) => (
				<polygon key={i} points={p} fill={`url(#${id}h)`} opacity={0.9} />
			))}
			{dPath ? <path d={dPath} fill="none" stroke={COL.sleepText} strokeWidth={3} strokeDasharray="9 9" strokeLinecap="round" /> : null}
			{blueGlow > 0 ? <path d={smoothPath(cPts)} fill="none" stroke={COL.tide} strokeWidth={16} strokeLinecap="round" opacity={0.3 * blueGlow} /> : null}
			<path d={smoothPath(cPts)} fill="none" stroke={COL.tide} strokeWidth={4.2} strokeLinecap="round" strokeLinejoin="round" />
		</g>
	);
};

/** 刻度：只在离卷轴够远的地方写字，不被卷轴挡半个字（审片 P2-5） */
const Ticks: React.FC<{m: HourMap; hours: number[]; label: (h: number) => string; base: number; box: {x0: number; x1: number}; opacity?: number}> = ({m, hours, label, base, box, opacity = 1}) => (
	<g opacity={opacity}>
		{hours.map((h) => {
			const x = xm(m, h);
			if (x < box.x0 + 4 || x > box.x1 - 4) return null;
			const s = label(h);
			const half = textW(s, 36) / 2;
			const room = Math.min(x - half - (box.x0 + 14), box.x1 - 14 - (x + half));
			const op = clamp01(room / 16 + 1);
			return (
				<g key={h}>
					<line x1={x} y1={base} x2={x} y2={base + 10} stroke={COL.ink} strokeWidth={2.2} />
					{op > 0 ? (
						<Hand x={x} y={base + 42} size={36} anchor="middle" color={COL.sleepText} opacity={op}>
							{s}
						</Hand>
					) : null}
				</g>
			);
		})}
	</g>
);

export const LONDON_BOX = {x0: 60, y0: 432, x1: 900, y1: 905};
export const NAP_BOX = {x0: 1020, y0: 432, x1: 1860, y1: 905};
const hh = (H: number) => `${String(((H % 24) + 24) % 24).padStart(2, '0')}:00`;

export const Migrate: React.FC<{t: number; clock: Clock; nums: Numbers; model: Model; opacity: number}> = ({t, clock, nums, model, opacity}) => {
	if (opacity <= 0) return null;
	const s21 = clock.sub(21);
	const s22 = clock.sub(22);
	const s24 = clock.sub(24);
	const s25 = clock.sub(25);
	const s26 = clock.sub(26);
	// #26：读到“两股一错位”（+1.6 s）时，两卷里被打乱对位的那一股同时闪一下、换标签
	const flashT = s26.t0 + 1.6;
	const blueFlash = pulse(t, flashT, 1.1);
	const grayFlash = pulse(t, flashT, 1.1);
	const relabel = ramp(t, flashT, 0.4);

	// ================= 伦敦小卷（横轴 = 身体的钟，即北京时间）
	// 主卷先挪到顶部（1.2 s），小卷再原地淡入、从上方轻落 30 px（审片 P1-1）
	// 主卷缩成顶部总览条要 1.2 秒；放大的伦敦卷等它缩完再淡入，不和缩小中的主卷叠在一起（第二轮自查）
	const inL = ease(ramp(t, s21.t0 + 1.15, 0.6));
	// 审片第二轮 P2-7：伦敦卷先放大居中（右半屏不再空 16 秒），补觉卷进场前缩回左半屏——“两卷并排比对”在画面上也有一个动作。
	// 放大 1.15 倍、中心 (960, 640)：卷轴上下沿 352–928，不碰总览条（≤ 331）和字幕带（≥ 940）
	const toSide = ease(ramp(t, s24.t0 - 0.1, 0.7));
	const kL = lerp(1.15, 1, toSide);
	const cxL = lerp(960, (LONDON_BOX.x0 + LONDON_BOX.x1) / 2, toSide);
	const cyL = lerp(640, (LONDON_BOX.y0 + LONDON_BOX.y1) / 2, toSide);
	const tfL = `translate(${cxL.toFixed(1)} ${(cyL + (1 - inL) * -30).toFixed(1)}) scale(${kL.toFixed(4)}) translate(${-(LONDON_BOX.x0 + LONDON_BOX.x1) / 2} ${-(LONDON_BOX.y0 + LONDON_BOX.y1) / 2})`;
	const L = nums.london;
	const tz = L.tzDiff;
	const mL: HourMap = {h0: L.t[0] + tz, h1: L.t[L.t.length - 1] + tz, x0: 100, x1: 860};
	const baseL = 810;
	const YL = (v: number) => baseL - v * 262;
	const slideKey = '伦敦小卷天色带左滑';
	const slideT = clock.ev(slideKey);
	const slideDur = clock.evDur(slideKey);
	const off = tz * ease(ramp(t, slideT, slideDur));
	const tag = ramp(t, slideT + slideDur, 0.5);
	// 审片第二轮 P2-9：灰面积（沙漏）从小卷一出现就画好——伦敦早 7 点起床，它和天色滑不滑无关；
	// 滑动那一刻只有天色和刻度在动，蓝线、灰面积都不动（只改一处）
	const sDraw = t >= s21.t0 ? 1 : 0;
	const sTo = lerp(mL.h0, mL.h1, sDraw);
	const SL = (u: number) => interp(L.t, L.S, u - tz);
	const pinT = clock.ev('伦敦 21:00 钉');
	const pinP = ramp(t, pinT, 1.0);
	const keyU = L.keyLocal + tz;
	// 飞机飞完整段：从小卷出现一直飞到天色开滑（审片 P2-9）
	const plane = ramp(t, s21.t0 + 1.4, slideT - (s21.t0 + 1.4));
	const tickHours: number[] = [];
	for (let H = 0; H <= 48; H += 3) {
		const u = H + off; // 当地钟点 H 在身体钟上的位置：滑动前 = H（北京），滑完 = H + 8（伦敦）
		if (u >= mL.h0 - 0.01 && u <= mL.h1 + 0.01) tickHours.push(u);
	}
	const cityOld = 1 - ramp(t, slideT + 0.6, 0.6);
	const capOp = ramp(t, s22.t0, 0.5);
	const lx = xm(mL, keyU);
	const sKey = SL(keyU);
	const cKey = model.C(keyU);
	const capX = 100;
	const capY = 892;
	const capW = textW('钟点、天色：', 36);

	// ================= 补觉小卷：只截 16:00 → 01:00，纵轴放大（审片 P1-4）
	const inN = ease(ramp(t, s24.t0 + 0.45, 0.8)); // 伦敦卷让到左边以后再进场
	const N = nums.nap;
	const mN: HourMap = {h0: 16, h1: 25, x0: 1075, x1: 1810};
	const baseN = 810;
	const vMinN = 0.3;
	const YN = (v: number) => baseN - (v - vMinN) * 450;
	const dropKey = '18:00–19:00 灰面积倒掉一截';
	const dropT = clock.ev(dropKey);
	const dropDur = clock.evDur(dropKey);
	let Dn = lerp(mN.h0, N.start, ramp(t, s24.t0 + 0.85, 0.9));
	if (t > dropT) Dn = lerp(N.start, N.start + N.len, ramp(t, dropT, dropDur));
	if (t > dropT + dropDur) Dn = lerp(N.start + N.len, mN.h1, ramp(t, dropT + dropDur, s25.t0 - (dropT + dropDur) - 0.1));
	const SN = (h: number) => interp(N.t, N.S, h);
	const SNo = (h: number) => interp(N.t, N.Sno, h);
	const lineT = clock.ev('23:00 竖线');
	const lineP = ramp(t, lineT, 0.6);
	// 读到“入睡推迟”（+1.2 s）时：两条线各自开始出缝的两处各立一条细竖线，中间一支横向箭头“往后挪”
	const shiftP = ramp(t, lineT + 1.2, 0.8);
	const noLab = ramp(t, dropT + dropDur + 0.4, 0.5);
	const x23 = xm(mN, 23);
	const xo = xm(mN, N.openNo);
	const xn = xm(mN, N.openNap);
	const yo = YN(SNo(N.openNo));
	const yn = YN(SN(N.openNap));
	const arrowY = baseN + 14;

	return (
		<g opacity={opacity}>
			{/* 伦敦 */}
			<g opacity={inL} transform={tfL}>
				<ScrollFrame x0={LONDON_BOX.x0} y0={LONDON_BOX.y0} x1={LONDON_BOX.x1} y1={LONDON_BOX.y1} />
				<Hand x={100} y={482} size={42}>
					北京 → 伦敦（冬）
				</Hand>
				{plane > 0 && plane < 1 ? <Plane x={lerp(850, 480, plane)} y={466} s={1} opacity={fadeEnds(plane)} /> : null}
				<SkyBand id="ldnSky" m={mL} ha={mL.h0} hb={mL.h1} y0={494} y1={534} shift={-off} seed={3} />
				<MiniChart
					id="ldn"
					m={mL}
					Y={YL}
					base={baseL}
					ha={mL.h0}
					hb={mL.h1}
					S={sDraw > 0 ? SL : null}
					sFrom={mL.h0}
					sTo={sTo}
					C={model.C}
					cTo={mL.h1}
					blueGlow={Math.max(blueFlash, pulse(t, slideT + slideDur, 0.8))}
				/>
				{/* 刻度跟着天色一起滑（它们都是“当地时间”） */}
				<Ticks m={mL} hours={tickHours} label={(u) => hh(Math.round(u - off))} base={baseL} box={{x0: LONDON_BOX.x0, x1: LONDON_BOX.x1}} />
				{/* 审片第二轮 P2-8：小卷单独截图时也知道是示意 */}
				<Hand x={LONDON_BOX.x1 - 20} y={capY} size={36} anchor="end" color={COL.sleepText}>
					示意
				</Hand>
				{/* 说明写在刻度正下方：它说的就是这排刻度和上面的天色 */}
				<g opacity={capOp}>
					<Hand x={capX} y={capY} size={36} color={COL.ink}>
						钟点、天色：
					</Hand>
					<Hand x={capX + capW} y={capY} size={36} color={COL.ink} opacity={cityOld}>
						北京
					</Hand>
					<g opacity={1 - cityOld}>
						<Hand x={capX + capW} y={capY} size={36} color={COL.ink}>
							伦敦
						</Hand>
						<line x1={capX + capW} y1={capY + 7} x2={capX + capW + 72} y2={capY + 7} stroke={COL.ink} strokeWidth={3} strokeLinecap="round" />
					</g>
				</g>
				{tag > 0 ? (
					<Hand x={156} y={604} size={38} anchor="middle" color={COL.tide} opacity={tag * (1 - relabel)} halo={COL.card}>
						北京时间
					</Hand>
				) : null}
				{relabel > 0 ? (
					<Hand x={242} y={704} size={48} anchor="middle" color={COL.ink} opacity={relabel} halo={COL.card}>
						潮水没换时区
					</Hand>
				) : null}
				{pinP > 0 ? (
					<g opacity={clamp01(pinP * 3)}>
						<line x1={lx} y1={606} x2={lx} y2={YL((sKey + cKey) / 2) - 6} stroke={COL.ink} strokeWidth={2} strokeDasharray="3 7" opacity={0.55} />
						<PinHead x={lx - 60} y={566} r={8} />
						<Hand id="ldnPin" x={lx} y={596} size={48} anchor="middle" wipe={pinP} halo={COL.card}>
							很困
						</Hand>
						<ClockFace cx={584} cy={468} r={24} hour={L.keyHome} w={2.4} />
						<line x1={606} y1={482} x2={lx - 24} y2={552} stroke={COL.ink} strokeWidth={2} strokeDasharray="3 7" opacity={0.55} />
						<Hand x={616} y={484} size={48} halo={COL.card}>
							{`北京 ${String(L.keyHome).padStart(2, '0')}:00`}
						</Hand>
					</g>
				) : null}
			</g>
			{/* 补觉 */}
			<g opacity={inN} transform={`translate(0 ${((1 - inN) * -30).toFixed(1)})`}>
				<ScrollFrame x0={NAP_BOX.x0} y0={NAP_BOX.y0} x1={NAP_BOX.x1} y1={NAP_BOX.y1} />
				<Hand x={1820} y={482} size={42} anchor="end">
					傍晚补觉
				</Hand>
				<SkyBand id="napSky" m={mN} ha={mN.h0} hb={mN.h1} y0={494} y1={534} seed={4} />
				<MiniChart
					id="nap"
					m={mN}
					Y={YN}
					base={baseN}
					ha={mN.h0}
					hb={mN.h1}
					S={SN}
					sFrom={mN.h0}
					sTo={Dn}
					C={model.C}
					cTo={lerp(mN.h0, mN.h1, ramp(t, s24.t0 + 0.65, 0.9))}
					grayGlow={grayFlash}
					dashed={t > dropT ? {f: SNo, from: N.start, to: Math.max(N.start, Dn)} : null}
				/>
				<Ticks m={mN} hours={[18, 20, 22]} label={hh} base={baseN} box={{x0: NAP_BOX.x0, x1: NAP_BOX.x1}} />
				<Hand x={NAP_BOX.x1 - 20} y={892} size={36} anchor="end" color={COL.sleepText}>
					示意
				</Hand>
				{/* 18:00 的小床 */}
				<g opacity={ramp(t, s24.t0 + 1.05, 0.5)}>
					<Prop kind="bed" x={xm(mN, N.start + N.len / 2) - 4} y={YN(SNo(N.start)) - 14} s={0.75} seed={601} w={2.4} />
				</g>
				{noLab > 0 ? (
					<Hand x={xm(mN, 21.57)} y={668} size={36} anchor="middle" color={COL.sleepText} opacity={noLab * (1 - relabel)} halo={COL.card}>
						不补觉
					</Hand>
				) : null}
				{lineP > 0 ? (
					<g>
						{/* 两条“出缝”细竖线出来后，23:00 这条淡下去，免得 8 px 外两条线并排像一条粗线 */}
						<line x1={x23} y1={lerp(baseN, 568, lineP)} x2={x23} y2={baseN} stroke={COL.ink} strokeWidth={2.4} opacity={1 - 0.7 * shiftP} />
						<Hand x={x23 + 8} y={610} size={48} opacity={lineP} halo={COL.card}>
							11点
						</Hand>
					</g>
				) : null}
				{shiftP > 0 ? (
					<g opacity={clamp01(shiftP * 2)}>
						<circle cx={xo} cy={yo} r={6} fill={COL.ink} />
						<circle cx={xn} cy={yn} r={6} fill={COL.ink} />
						<line x1={xo} y1={yo} x2={xo} y2={lerp(yo, arrowY + 8, clamp01(shiftP * 2))} stroke={COL.ink} strokeWidth={2} />
						<line x1={xn} y1={yn} x2={xn} y2={lerp(yn, arrowY + 8, clamp01(shiftP * 2))} stroke={COL.ink} strokeWidth={2} />
						<Arrow k="napShift" a={[xo + 2, arrowY]} b={[xn + 4, arrowY]} p={clamp01(shiftP * 1.6 - 0.4)} w={3} bend={0} head={12} />
						<Hand x={xn + 14} y={arrowY + 16} size={40} opacity={clamp01(shiftP * 2 - 1)} halo={COL.card}>
							往后挪
						</Hand>
					</g>
				) : null}
				{relabel > 0 ? (
					<g opacity={relabel}>
						<Hand x={xm(mN, 20.2)} y={676} size={48} anchor="middle" color={COL.ink} halo={COL.card}>
							沙漏少一截
						</Hand>
						<Arrow k="napLess" a={[xm(mN, 19.3), 694]} b={[xm(mN, 19.3), 742]} p={relabel} w={3} bend={0} head={12} />
					</g>
				) : null}
			</g>
		</g>
	);
};

const fadeEnds = (u: number) => Math.min(clamp01(u / 0.1), clamp01((1 - u) / 0.1));
