// 开头书桌（K1）、认零件（K3）、“具体渐隐”小图、左上纸签和常驻公式。
import React from 'react';
import type {Clock, Model} from './data';
import {clamp01, darkness, ease, easeOut, interp, lerp, ramp, rng, skyColor, tagText, window01} from './data';
import {Arrow, ClockFace, Hand, Hourglass, hourglassAt, LampGlow, Note, Person, Prop, Ring, textW, WaveIcon} from './draw';
import {gapPolys, HatchDefs, smoothPath} from './scroll';
import {COL, FONT_HAND} from './theme';

// ---------------------------------------------------------------- 开头的时钟
/** 开头快转：视频秒 → 故事时间（numbers.json 的 opening.clockKeys），停钟后保持在第二天 18:00 */
export const deskHour = (t: number, keys: [number, number][]) =>
	interp(
		keys.map((k) => k[0]),
		keys.map((k) => k[1]),
		t,
	);

// ---------------------------------------------------------------- 书桌一幕
export const DESK = {s: 3.0, x: 820, y: 890, clock: {cx: 620, cy: 410, r: 88}, win: {x: 1180, y: 300, w: 290, h: 260}};
const SHRINK = {cx: 1010, cy: 260, k: 0.53};

const STARS_D = (() => {
	const r = rng(11);
	return Array.from({length: 46}, () => ({x: 40 + r() * 1840, y: 20 + r() * 180, s: 1.5 + r() * 2.2}));
})();

/** 书桌模式的天色带：整条一个颜色（就是此刻的天），月亮、太阳在里面走 */
export const DeskSky: React.FC<{hour: number; opacity: number}> = ({hour, opacity}) => {
	if (opacity <= 0) return null;
	const dk = darkness(hour);
	const moonU = (hour - 23.5) / 7.1;
	const sunU = (hour - 30.4) / 11.2;
	return (
		<g opacity={opacity}>
			<path d={`M0 0 L1920 0 L1920 226 C1500 236 1100 220 700 232 C400 240 200 222 0 230 Z`} fill={skyColor(hour)} />
			{STARS_D.map((st, i) => (
				<circle key={i} cx={st.x} cy={st.y} r={st.s} fill="#fffbe8" opacity={0.85 * dk} />
			))}
			{moonU > 0 && moonU < 1 ? (
				<g>
					<circle cx={120 + moonU * 1680} cy={160 - 95 * Math.sin(Math.PI * moonU)} r={30} fill={COL.paper} />
					<circle cx={120 + moonU * 1680 + 13} cy={160 - 95 * Math.sin(Math.PI * moonU) - 6} r={25} fill={skyColor(hour)} />
				</g>
			) : null}
			{sunU > 0 && sunU < 1 ? (
				<g>
					<circle cx={120 + sunU * 1680} cy={190 - 120 * Math.sin(Math.PI * sunU)} r={46} fill={COL.sun} opacity={0.2} />
					<circle cx={120 + sunU * 1680} cy={190 - 120 * Math.sin(Math.PI * sunU)} r={32} fill={COL.sun} />
				</g>
			) : null}
		</g>
	);
};

export const DeskScene: React.FC<{
	t: number;
	hour: number;
	model: Model;
	clock: Clock;
	opacity: number;
}> = ({t, hour, model, clock, opacity}) => {
	if (opacity <= 0) return null;
	const {s, x, y} = DESK;
	const s5 = clock.sub(5);
	// 认零件开始前缩小到场景带里（0.53 倍），给零件让地方
	const k = 1;
	const tf = `translate(${SHRINK.cx} ${SHRINK.cy}) scale(${k}) translate(${-SHRINK.cx} ${-SHRINK.cy})`;
	const dim = ramp(t, s5.t0, 0.5); // 其余压暗
	const restOp = 1 - 0.55 * dim;
	const night = darkness(hour);
	// 写字的手：从第 1 帧就在动，钟停住（9.3 s）以后全静止
	const stopT = clock.sub(2).t1 + 0.1;
	const armRot = t < stopT ? 4 * Math.sin(t * Math.PI * 2 * 1.3) : 0;
	const secDeg = (Math.min(t, stopT) / 60) * 360 * 6;
	const level = model.S(hour);
	// 沙漏放大时，头顶那只先隐去（由 HeroHourglass 接手）
	const heroT = clock.sub(6).t0;
	const hgOp = 1 - ramp(t, heroT, 0.15);
	const ringP = ramp(t, s5.t0, 0.7);
	const hg = hourglassAt('sit', x, y, s);
	const W = DESK.win;
	const C = DESK.clock;
	return (
		<g opacity={opacity * (1 - 0.9 * ease(ramp(t, clock.sub(6).t0, 0.6))) * (1 - ramp(t, clock.sub(8).t0, 0.5))} transform={tf}>
			<g opacity={restOp}>
				<line x1={500} y1={y + 2} x2={1560} y2={y + 2} stroke={COL.pencil} strokeWidth={2.4} />
				{/* 窗：窗外就是天色带同一个颜色 */}
				<rect x={W.x} y={W.y} width={W.w} height={W.h} fill={skyColor(hour)} />
				{night > 0.3
					? STARS_D.slice(0, 9).map((st, i) => (
							<circle key={i} cx={W.x + 20 + ((st.x * 7) % (W.w - 40))} cy={W.y + 20 + ((st.y * 3) % (W.h - 60))} r={st.s} fill="#fffbe8" opacity={night} />
						))
					: null}
				<WindowFrame />
				<LampGlow x={x} y={y} s={s} on={night} />
				<Prop kind="chair" x={x} y={y} s={s} seed={301} />
				<Prop kind="desk" x={x} y={y} s={s} seed={302} />
				<Prop kind="lamp" x={x} y={y} s={s} seed={303} />
				<Prop kind="books" x={x} y={y} s={s} seed={304} />
				<Prop kind="paper" x={x} y={y} s={s} seed={307} />
				<Prop kind="cup" x={x + 28 * s} y={y} s={s} seed={308} />
				<Person pose="sit" x={x} y={y} s={s} seed={305} armRot={armRot} level={null} />
			</g>
			<ClockFace cx={C.cx} cy={C.cy} r={C.r} hour={hour} secDeg={secDeg} w={3.2} />
			<g opacity={hgOp}>
				<Hourglass cx={hg.cx} cy={hg.cy} h={hg.h} level={level} w={3} seed={306} />
			</g>
			{ringP > 0 ? (
				<g>
					<Ring k="dk1" cx={hg.cx} cy={hg.cy} rx={hg.h * 0.62} ry={hg.h * 0.72} p={ringP} w={4.5 / k} />
					<Ring k="dk2" cx={C.cx} cy={C.cy} rx={C.r * 1.28} ry={C.r * 1.28} p={ramp(t, s5.t0 + 0.25, 0.7)} w={4.5 / k} />
				</g>
			) : null}
		</g>
	);
};
const WindowFrame: React.FC = () => {
	const W = DESK.win;
	return (
		<g>
			<rect x={W.x} y={W.y} width={W.w} height={W.h} fill="none" stroke={COL.ink} strokeWidth={5} />
			<line x1={W.x + W.w / 2} y1={W.y} x2={W.x + W.w / 2} y2={W.y + W.h} stroke={COL.ink} strokeWidth={4} />
			<line x1={W.x} y1={W.y + W.h / 2} x2={W.x + W.w} y2={W.y + W.h / 2} stroke={COL.ink} strokeWidth={4} />
			<line x1={W.x - 14} y1={W.y + W.h + 6} x2={W.x + W.w + 14} y2={W.y + W.h + 6} stroke={COL.ink} strokeWidth={5} strokeLinecap="round" />
		</g>
	);
};
/** 缩小后的书桌里，某个点在屏幕上的位置 */
export const deskToScreen = (px: number, py: number, k = 1): [number, number] => [SHRINK.cx + (px - SHRINK.cx) * k, SHRINK.cy + (py - SHRINK.cy) * k];

// ---------------------------------------------------------------- 认零件（K3）+ 具体渐隐
const PANEL_A = {cx: 425, cy: 485, w: 750, h: 470};
const PANEL_B = {cx: 1250, cy: 485, w: 780, h: 470};
const HERO = {cx: 200, cy: 495, h: 260};
const DEMO = {x0: 300, x1: 1540, v0: 925, v1: 625};
/** 认零件里那条 24 小时迷你刻度上的潮水 */
const WAVE = {x0: 920, x1: 1600, yTop: 345, yBot: 478}; // 二审：波幅放大一点，下午 2–4 点的浅坑要看得出

export const Parts: React.FC<{t: number; model: Model; clock: Clock; deskHourNow: number}> = ({t, model, clock, deskHourNow}) => {
	const s6 = clock.sub(6);
	const s7 = clock.sub(7);
	const s8 = clock.sub(8);
	const s9 = clock.sub(9);
	if (t < s6.t0 || t > s9.t0 + 0.8) return null;
	// 开卷时整体淡出。审片第二轮 P2-4：先淡完再开卷（原来 0.6 秒的残影叠在刚开卷的长卷上）
	const out = 1 - ramp(t, s9.t0 - 0.25, 0.35);
	const fall = ease(ramp(t, s8.t0, 0.6)); // 零件落进图表区
	// —— 睡意沙漏：头顶的小沙漏放大
	const hg0 = hourglassAt('sit', DESK.x, DESK.y, DESK.s);
	const [hx0, hy0] = deskToScreen(hg0.cx, hg0.cy);
	const grow = ease(ramp(t, s6.t0, 1.0));
	const heroLevel = model.S(deskHourNow);
	let hcx = lerp(hx0, HERO.cx, grow);
	let hcy = lerp(hy0, HERO.cy, grow);
	let hh = lerp(hg0.h, HERO.h, grow);
	// 具体渐隐：沙漏落到图表左端，变成灰面积的图标
	hcx = lerp(hcx, 205, fall);
	hcy = lerp(hcy, 800, fall);
	hh = lerp(hh, 150, fall);
	const panelA = ease(ramp(t, s6.t0 + 0.3, 0.5)) * (1 - fall);
	const cellL = ramp(t, s6.t0 + 1.6, 0.4);
	const cellR = ramp(t, s6.t0 + 3.0, 0.4);
	const panelB = ease(ramp(t, s7.t0, 0.5)) * (1 - fall);
	const waveP = ramp(t, s7.t0 + 0.2, 1.0);
	const peakLab = ramp(t, s7.t0 + 1.0, 0.4);
	const twoMen = ramp(t, s7.t0 + 3.0, 0.5);
	// 波线：从认零件的位置，平移缩放进图表区（同一条线、同一颜色）
	const wx0 = lerp(WAVE.x0, DEMO.x0, fall);
	const wx1 = lerp(WAVE.x1, DEMO.x1, fall);
	const vy = (v: number) => lerp(WAVE.yBot - ((v - 0.36) / 0.5) * (WAVE.yBot - WAVE.yTop), DEMO.v0 - v * (DEMO.v0 - DEMO.v1), fall);
	const hours = Array.from({length: 97}, (_, k) => k * 0.25);
	const wavePts: [number, number][] = hours.filter((h) => h <= 24 * waveP).map((h) => [wx0 + (h / 24) * (wx1 - wx0), vy(model.C(h + 24))]);
	// 灰面积：沙漏的沙面（一条平的水位）慢慢涨过蓝线
	const rise = ease(ramp(t, clock.ev('沙漏、潮水落到图表区'), clock.evDur('沙漏、潮水落到图表区')));
	const level = lerp(0.02, 0.62, rise);
	const DX = (h: number) => DEMO.x0 + (h / 24) * (DEMO.x1 - DEMO.x0);
	const DY = (v: number) => DEMO.v0 - v * (DEMO.v0 - DEMO.v1);
	const demoHs = hours;
	const polys = rise > 0 ? gapPolys(demoHs, () => level, (h) => model.C(h + 24), DX, DY) : [];
	const kunP = ramp(t, s8.t0 + 3.2, 0.8);
	const kunH = 5.0;
	return (
		<g opacity={out}>
			{/* 左：睡意沙漏 */}
			{panelA > 0 ? (
				<g opacity={panelA} transform={`translate(${PANEL_A.cx} ${PANEL_A.cy})`}>
					<Note k="pa" w={PANEL_A.w} h={PANEL_A.h} tilt={-0.6} />
					<Hand x={-PANEL_A.w / 2 + 40} y={-PANEL_A.h / 2 + 70} size={52}>
						睡意沙漏
					</Hand>
					<g opacity={0.15 + 0.85 * cellL}>
						<Person pose="stand" x={-35} y={170} s={1.35} seed={401} />
						<Hourglass cx={65} cy={70} h={120} level={0.78} seed={402} />
						<Arrow k="up" a={[118, 120]} b={[118, 20]} color={COL.ink} w={3.5} head={16} bend={0} />
						<Hand x={30} y={225} size={40} anchor="middle">
							醒着
						</Hand>
					</g>
					<g opacity={0.15 + 0.85 * cellR}>
						<Prop kind="bed" x={232} y={172} s={1.0} seed={403} />
						<Person pose="lie" x={232} y={172} s={1.0} seed={404} />
						{/* 审片 P2-11：倒空 = 上下两格都几乎空 */}
						<Hourglass cx={300} cy={45} h={120} level={0.05} top={0} seed={405} />
						<Arrow k="down" a={[352, 0]} b={[352, 100]} color={COL.ink} w={3.5} head={16} bend={0} />
						<Hand x={265} y={225} size={40} anchor="middle">
							睡着
						</Hand>
					</g>
				</g>
			) : null}
			{/* 右：清醒潮 */}
			{panelB > 0 ? (
				<g opacity={panelB}>
					<g transform={`translate(${PANEL_B.cx} ${PANEL_B.cy})`}>
						<Note k="pb" w={PANEL_B.w} h={PANEL_B.h} tilt={0.5} />
					</g>
					<Hand x={PANEL_B.cx - PANEL_B.w / 2 + 40} y={PANEL_B.cy - PANEL_B.h / 2 + 70} size={52}>
						清醒潮
					</Hand>
					<ClockFace cx={PANEL_B.cx - PANEL_B.w / 2 + 245} cy={PANEL_B.cy - PANEL_B.h / 2 + 52} r={28} hour={deskHourNow} w={2.4} />
					{/* 24 小时迷你刻度（不用 12 小时的钟面：9 点分不清早晚） */}
					<line x1={WAVE.x0} y1={500} x2={WAVE.x1} y2={500} stroke={COL.ink} strokeWidth={2.5} />
					{Array.from({length: 9}, (_, k) => k * 3).map((h) => (
						<line key={h} x1={WAVE.x0 + (h / 24) * (WAVE.x1 - WAVE.x0)} y1={500} x2={WAVE.x0 + (h / 24) * (WAVE.x1 - WAVE.x0)} y2={h % 12 === 0 ? 514 : 508} stroke={COL.ink} strokeWidth={2.5} />
					))}
					<Hand x={WAVE.x0} y={552} size={42} anchor="middle" color={COL.sleepText}>
						0点
					</Hand>
					<Hand x={WAVE.x0 + (WAVE.x1 - WAVE.x0) / 2} y={552} size={42} anchor="middle" color={COL.sleepText}>
						12点
					</Hand>
					<Hand x={WAVE.x1 + 28} y={552} size={42} anchor="end" color={COL.sleepText}>
						24点
					</Hand>
					{/* 审片 P1-5：峰、谷两个钟点是关键标签，≥ 48 px */}
					<g opacity={peakLab}>
						<Hand x={WAVE.x0 + (21 / 24) * (WAVE.x1 - WAVE.x0)} y={WAVE.yTop - 18} size={48} anchor="middle" color={COL.tide} halo={COL.card}>
							晚9点
						</Hand>
						<Hand x={WAVE.x0 + (5 / 24) * (WAVE.x1 - WAVE.x0)} y={WAVE.yBot - 50} size={48} anchor="middle" color={COL.tide} halo={COL.card}>
							凌晨5点
						</Hand>
					</g>
					<Hand x={WAVE.x0 - 30} y={606} size={36} color={COL.sleepText} opacity={peakLab}>
						一天一个来回
					</Hand>
					<g opacity={twoMen}>
						<Person pose="stand" x={1345} y={706} s={0.95} seed={411} />
						<WaveIcon x={1290} y={584} w={110} h={28} sw={4} />
						<Prop kind="bed" x={1525} y={706} s={0.85} seed={412} />
						<Person pose="lie" x={1525} y={706} s={0.85} seed={413} />
						<WaveIcon x={1470} y={628} w={110} h={28} sw={4} />
					</g>
				</g>
			) : null}
			{/* 具体渐隐的小图：灰面积（沙漏）涨过蓝线（潮水），中间的缝填斜线 = 困 */}
			{fall > 0 ? (
				<g>
					<HatchDefs id="demoHatch" ox={DEMO.x0} />
					<rect x={DEMO.x0} y={DY(level)} width={DEMO.x1 - DEMO.x0} height={DEMO.v0 - DY(level)} fill={COL.sleep} opacity={0.4 * fall} />
					<line x1={DEMO.x0} y1={DY(level)} x2={DEMO.x1} y2={DY(level)} stroke={COL.sleep} strokeWidth={3} opacity={fall} />
					{polys.map((p, i) => (
						<polygon key={i} points={p} fill="url(#demoHatch)" opacity={0.9} />
					))}
					<line x1={DEMO.x0} y1={DEMO.v0} x2={DEMO.x1} y2={DEMO.v0} stroke={COL.ink} strokeWidth={2} opacity={0.5 * fall} />
				</g>
			) : null}
			<path d={smoothPath(wavePts)} fill="none" stroke={COL.tide} strokeWidth={4.5} strokeLinecap="round" opacity={Math.max(panelB, fall)} />
			{kunP > 0 ? (
				<Hand id="kun" x={DX(kunH)} y={(DY(level) + DY(model.C(kunH + 24))) / 2 + 24} size={68} anchor="middle" color={COL.drowsy} wipe={kunP} halo={COL.paper}>
					困
				</Hand>
			) : null}
			{/* 放大的沙漏（从头顶飞出来） */}
			{t >= s6.t0 ? <Hourglass cx={hcx} cy={hcy} h={hh} level={heroLevel} w={3.5} seed={306} /> : null}
		</g>
	);
};

// ---------------------------------------------------------------- 左上纸签（当前时间，只走整点）
export const TimeTag: React.FC<{hour: number; opacity: number}> = ({hour, opacity}) => {
	if (opacity <= 0) return null;
	const tt = tagText(hour);
	return (
		<g opacity={opacity} transform="translate(180 72)">
			<Note k="tag" w={300} h={108} tilt={-1.2} tape={false} />
			<g transform="rotate(-1.2)">
				<Hand x={-128} y={-14} size={36} color={COL.sleepText}>
					{tt.day}
				</Hand>
				<Hand x={-128} y={38} size={50}>
					{`${tt.part} ${tt.clock}`}
				</Hand>
			</g>
		</g>
	);
};

// ---------------------------------------------------------------- 常驻公式：困＝沙漏－潮水
export const FORMULA_W = 430;
export const Formula: React.FC<{x: number; y: number; k?: number; p: number; opacity?: number; glow?: number}> = ({x, y, k = 1, p, opacity = 1, glow = 0}) => {
	if (p <= 0 || opacity <= 0) return null;
	const size = 42;
	const parts: [string, string][] = [
		['困', COL.drowsy],
		['＝', COL.ink],
		['沙漏', COL.sleepText],
		['－', COL.ink],
		['潮水', COL.tide],
	];
	let cx = 128;
	return (
		<g transform={`translate(${x} ${y}) scale(${k})`} opacity={opacity * clamp01(p * 3)}>
			{glow > 0 ? <rect x={-8} y={-8} width={FORMULA_W + 16} height={102} rx={14} fill={COL.lamp} opacity={glow} /> : null}
			<g transform={`translate(${FORMULA_W / 2} 43)`}>
				<Note k="formula" w={FORMULA_W} h={86} tilt={0.6} tape={false} />
			</g>
			<Hourglass cx={34} cy={43} h={58} level={0.6} w={2.6} seed={501} />
			<WaveIcon x={58} y={45} w={52} h={22} sw={3.6} />
			<defs>
				<clipPath id="formulaWipe">
					<rect x={120} y={0} width={(FORMULA_W - 110) * clamp01(p)} height={90} />
				</clipPath>
			</defs>
			<g clipPath="url(#formulaWipe)">
				{parts.map(([s, c]) => {
					const x0 = cx;
					cx += textW(s, size);
					return (
						<text key={s} x={x0} y={58} fontFamily={FONT_HAND} fontSize={size} fill={c}>
							{s}
						</text>
					);
				})}
			</g>
		</g>
	);
};

export {easeOut};
