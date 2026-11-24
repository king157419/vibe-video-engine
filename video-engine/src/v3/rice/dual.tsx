// 段 3–4（K4–K6，B17–B30）：双显微视野延时。左 A 桌上 30°C，右 B 饭后 1 小时进冰箱 4°C。
// 两行读数（活菌、毒素）是本片的核心道具；回锅白闪那一帧是全片论点：细菌死光，品红雾一像素不变。
import React from 'react';
import type {Numbers, Timeline} from './data';
import {calRight, fmtCount, fmtHM, logNLeft, roomRight, storyLeft, toxinLeft} from './data';
import {buildTree, cellsAt, colonyRadii} from './growth';
import {Arrow, Calendar, Icon, Pause, Snowflake, Stopwatch, Thermo, Wok} from './icons';
import type {Shape} from './micro';
import {Capsule, circleShape, Field, Fog, LawnDefs, Spore, Starch} from './micro';
import {DORMANT, GERM, Label, SPORE_ANGLE} from './specimen';
import {GrayTag} from './cards';
import {C, L, SANS, SERIF} from './theme';
import {clamp, easeOut, fade, lin, mix, mulberry32, pop, pulse, ramp, textW} from './util';

// 读数行的几何（相对视野中心 cx）
export const ROW = {labelX: -290, trackX0: -200, trackX1: 95, readX: 122, countY: 816, tickY: 864, toxY: 908, annY: 788};
export const LOG_MIN = 1;
export const LOG_MAX = 6.5;
export const logX = (cx: number, lg: number) => cx + ROW.trackX0 + ((lg - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (ROW.trackX1 - ROW.trackX0);

let TREE: ReturnType<typeof buildTree> | null = null;
let RADII: number[] = [];
export const riceTree = (num: Numbers) => {
	if (!TREE) {
		TREE = buildTree({seed: 20261006, colonies: GERM.map((g) => ({cx: g.x, cy: g.y})), lagH: num.assumptions.lag_h, periodH: num.assumptions.doubling_min / 60, gMax: 7});
		RADII = colonyRadii(TREE, GERM.map((g) => ({cx: g.x, cy: g.y})));
	}
	return {tree: TREE, radii: RADII};
};

/** 菌落“密度纹理”：固定种子撒好的约 1400 个小胶囊（不重复的纹理），按密度阈值由里往外显现 */
type LawnP = {x: number; y: number; a: number; thr: number; len: number; op: number};
let LAWN: LawnP[] | null = null;
export const lawnParticles = (radii: number[]) => {
	if (!LAWN) {
		const rnd = mulberry32(777);
		const out: LawnP[] = [];
		GERM.forEach((g, k) => {
			const R = radii[k] * 1.25;
			for (let i = 0; i < 235; i++) {
				const v = rnd();
				const r = R * Math.sqrt(v);
				const a = rnd() * Math.PI * 2;
				out.push({x: g.x + Math.cos(a) * r, y: g.y + Math.sin(a) * r, a: rnd() * Math.PI, thr: 0.04 + 0.86 * Math.pow(r / R, 1.3) + 0.1 * rnd(), len: 17 + rnd() * 9, op: 0.7 + 0.3 * rnd()});
			}
		});
		LAWN = out;
	}
	return LAWN;
};
/** 毒素雾的几何是固定的（只改不透明度）：每个菌落一团，再加几团把雾连成片 */
export const fogBlobs = (radii: number[]) => [
	...GERM.map((g, i) => ({x: g.x, y: g.y, r: radii[i] * 1.25 * 1.45})),
	{x: -60, y: -40, r: 120},
	{x: 70, y: 60, r: 110},
	{x: 150, y: -150, r: 90},
	{x: -150, y: 20, r: 95},
];

/** 左碗视野内容（故事时间 h；回锅后 dead 0..1；雾量 fog） */
export const LeftContent: React.FC<{id: string; num: Numbers; h: number; dead: number; fog: number; firstGenPinch?: boolean; sepBoost?: number}> = ({
	id,
	num,
	h,
	dead,
	fog,
	firstGenPinch,
	sepBoost,
}) => {
	const {tree, radii} = riceTree(num);
	const lag = num.assumptions.lag_h;
	const P = num.assumptions.doubling_min / 60;
	const germ = lin(h, lag - 0.6, lag);
	const partOp = 1 - lin(h, 4.15, 4.75);
	const density = Math.pow(lin(h, 3.85, 6.0), 0.85);
	const cells = h >= lag && partOp > 0 ? cellsAt(tree, h, P, {firstGenPinch, sepBoost}) : [];
	const lawn = lawnParticles(radii);
	const shrink = 1 - 0.35 * dead;
	return (
		<>
			<LawnDefs id={id} />
			<Starch seed={3} />
			{h < lag
				? GERM.map((p, i) => <Spore key={`g${i}`} x={p.x} y={p.y} a={SPORE_ANGLE[i]} germ={germ} swell={1} crack={1} />)
				: null}
			<g opacity={partOp * (1 - dead)}>
				{cells.map((c, i) => (
					<Capsule key={i} x={c.x} y={c.y} a={c.a} len={c.len} pinch={c.pinch} />
				))}
			</g>
			{density > 0 && dead < 1 ? (
				<g opacity={1 - dead}>
					{lawn.map((p, i) => {
						const u = clamp((density - p.thr) / 0.06);
						if (u <= 0) return null;
						return (
							<Capsule
								key={i}
								x={p.x}
								y={p.y}
								a={p.a}
								len={p.len * shrink}
								w={9 * (1 - 0.3 * dead)}
								opacity={u * p.op}
								fill={dead > 0 ? '#7d6a95' : C.bac}
							/>
						);
					})}
				</g>
			) : null}
			<Fog id={id} blobs={fogBlobs(radii)} amount={fog} />
			{/* 没发芽的芽孢画在雾上面：回锅后它们还在（左碗约 10 个/克） */}
			{DORMANT.map((p, i) => (
				<Spore key={`d${i}`} x={p.x} y={p.y} a={SPORE_ANGLE[6 + i]} />
			))}
		</>
	);
};

/** 右碗视野内容：芽孢原地不动（迟滞期里微微胀大） */
export const RightContent: React.FC<{swell: number}> = ({swell}) => (
	<>
		<Starch seed={3} />
		{[...GERM, ...DORMANT].map((p, i) => (
			<Spore key={i} x={p.x} y={p.y} a={SPORE_ANGLE[i]} swell={swell} crack={i < GERM.length ? 1 : 0} />
		))}
	</>
);

/** 一行菌数读数（对数刻度） */
const CountRow: React.FC<{cx: number; lg: number; op: number; read: string; readPulse?: number; tickPulse?: number; startMark?: number; thr?: number; thrLabel?: number; readColor?: string}> = ({
	cx,
	lg,
	op,
	read,
	readPulse = 0,
	tickPulse = 0,
	startMark = 0,
	thr = 0,
	thrLabel = 0,
	readColor = C.ink,
}) => {
	if (op <= 0.001) return null;
	const x0 = cx + ROW.trackX0;
	const x1 = cx + ROW.trackX1;
	const xv = logX(cx, clamp(lg, LOG_MIN, LOG_MAX));
	const ticks: [number, string][] = [
		[1, '10'],
		[3, '1000'],
		[6, '100万'],
	];
	const xt = logX(cx, 5);
	return (
		<g opacity={op}>
			<text x={cx + ROW.labelX} y={ROW.countY + 13} fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.ink}>
				菌数
			</text>
			<rect x={x0} y={ROW.countY - 10} width={x1 - x0} height={20} rx={10} fill="#c3c6c1" />
			<rect x={x0} y={ROW.countY - 10} width={Math.max(20, xv - x0 + 10)} height={20} rx={10} fill={C.bac} />
			<circle cx={xv} cy={ROW.countY} r={13} fill={C.paper} stroke={C.bac} strokeWidth={5} />
			{ticks.map(([v, s]) => {
				const x = logX(cx, v);
				const p = v === 3 ? tickPulse : 0;
				return (
					<g key={s}>
						<line x1={x} y1={ROW.countY + 12} x2={x} y2={ROW.countY + 20} stroke={C.inkSoft} strokeWidth={3} />
						<text x={x} y={ROW.tickY} textAnchor="middle" fontFamily={SANS} fontWeight={p > 0 ? 700 : 500} fontSize={36 * (1 + 0.25 * p)} fill={p > 0 ? C.ink : C.inkSoft}>
							{s}
						</text>
					</g>
				);
			})}
			{/* 审片后 P2-12：念“从1000个”时，在条上 1000 处留一个空心“起点”标记，一直留到读数落到 178 万：起点和终点同屏 */}
			{startMark > 0.001 ? (
				<g opacity={startMark}>
					<circle cx={logX(cx, 3)} cy={ROW.countY} r={12} fill={C.paper} stroke={C.ink} strokeWidth={4} />
					<Label x={logX(cx, 3)} y={ROW.annY} text="起点" size={36} weight={600} anchor="middle" bg={C.paper} />
				</g>
			) : null}
			{thr > 0 ? (
				<g opacity={thr}>
					<line x1={xt} y1={ROW.countY - 24} x2={xt} y2={ROW.countY + 22} stroke={C.ink} strokeWidth={3} strokeDasharray="6 5" />
					{/* 审片后 P2-9：深灰，放在虚线左边、视野圆下沿以下，不碰圆边 */}
					<Label x={xt - 6} y={ROW.countY - 19} text="产毒门槛10万" size={36} weight={600} anchor="end" op={thrLabel} color={C.ink} />
				</g>
			) : null}
			<text x={cx + ROW.readX} y={ROW.countY + 17} fontFamily={SANS} fontWeight={600} fontSize={48 * (1 + 0.15 * readPulse)} fill={readColor}>
				{read}
			</text>
		</g>
	);
};

/** 一行毒素读数（品红量条） */
const ToxinRow: React.FC<{cx: number; v: number; op: number; read: string; readOp?: number}> = ({cx, v, op, read, readOp = 1}) => {
	if (op <= 0.001) return null;
	const x0 = cx + ROW.trackX0;
	const x1 = cx + ROW.trackX1;
	return (
		<g opacity={op}>
			<text x={cx + ROW.labelX} y={ROW.toxY + 13} fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.ink}>
				毒素
			</text>
			<rect x={x0} y={ROW.toxY - 10} width={x1 - x0} height={20} rx={10} fill="#c3c6c1" />
			{v > 0.002 ? <rect x={x0} y={ROW.toxY - 10} width={Math.max(20, (x1 - x0) * v)} height={20} rx={10} fill={C.toxin} /> : null}
			<text x={cx + ROW.readX} y={ROW.toxY + 13} fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.inkSoft} opacity={readOp}>
				{read}
			</text>
		</g>
	);
};

/** 两视野之间的“示意”签：第一行“示意 · 按快的算”，“翻一倍”时长出第二行“约 25 分钟 ×2” */
const ShiYiTag: React.FC<{grow: number; op: number; line2: string}> = ({grow, op, line2}) => {
	if (op <= 0.001) return null;
	const w = 300;
	const h = mix(54, 104, grow);
	const y0 = 652;
	return (
		<g opacity={op}>
			<rect x={960 - w / 2} y={y0} width={w} height={h} rx={22} fill={C.paper} fillOpacity={0.92} stroke={C.inkFaint} strokeWidth={2.5} />
			<text x={960} y={y0 + 40} textAnchor="middle" fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.inkSoft}>
				示意 · 按快的算
			</text>
			{grow > 0.02 ? (
				<text x={960} y={y0 + 89} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={36} fill={C.ink} opacity={lin(grow, 0.4, 1)}>
					{line2}
				</text>
			) : null}
		</g>
	);
};

/** 样本卡：标题 + 室温秒表 + 日历 */
const SampleCard: React.FC<{
	cx: number;
	w: number;
	letter: string;
	title: string;
	hiText: string;
	hi: number;
	sw: string;
	swColor: string;
	cal: string;
	target?: string;
	targetOp?: number;
	snow?: number;
	op: number;
	swHand: number;
}> = ({cx, w, letter, title, hiText, hi, sw, swColor, cal, target, targetOp = 0, snow = 0, op, swHand}) => {
	if (op <= 0.001) return null;
	const x0 = cx - w / 2;
	const y0 = 103;
	const h = 64;
	const tSize = 38;
	const titleW = textW(`${letter} ${title} · `, tSize);
	const hiW = textW(hiText, tSize);
	let x = x0 + 22 + titleW + hiW + 34;
	const swX = x;
	x += 50;
	const swTextX = x;
	x += textW(sw, 46) + 12;
	const tgX = x;
	if (target) x += textW(target, 36) + 12;
	// 日历读数右对齐到卡片右沿，避免出框
	const calTextR = x0 + w - 24;
	const calX = calTextR - textW(cal, 36) - 62;
	return (
		<g opacity={op}>
			<rect x={x0 + 4} y={y0 + 5} width={w} height={h} rx={12} fill="#3b3226" opacity={0.12} />
			<rect x={x0} y={y0} width={w} height={h} rx={12} fill={C.paper} stroke={C.paperEdge} strokeWidth={2.5} />
			<text x={x0 + 22} y={y0 + 46} fontFamily={SERIF} fontWeight={600} fontSize={tSize} fill={C.ink}>
				{`${letter} ${title} · `}
			</text>
			{hi > 0 ? <rect x={x0 + 22 + titleW - 6} y={y0 + 10} width={hiW + 12} height={46} rx={8} fill={hiText.startsWith('4') ? C.cold : '#f3d9b0'} opacity={hi} /> : null}
			<text x={x0 + 22 + titleW} y={y0 + 46} fontFamily={SERIF} fontWeight={600} fontSize={tSize} fill={hiText.startsWith('4') ? C.coldInk : C.warmInk}>
				{hiText}
			</text>
			<Icon x={swX + 18} y={y0 + 32} size={42}>
				<Stopwatch color={swColor} hand={swHand} sw={9} />
			</Icon>
			<text x={swTextX} y={y0 + 49} fontFamily={SANS} fontWeight={600} fontSize={46} fill={swColor}>
				{sw}
			</text>
			{target ? (
				<text x={tgX} y={y0 + 46} fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.ink} opacity={targetOp}>
					{target}
				</text>
			) : null}
			{snow > 0 ? (
				<g opacity={snow}>
					<circle cx={swX + 38} cy={y0 + 14} r={15} fill={C.paper} />
					<Icon x={swX + 38} y={y0 + 14} size={28}>
						<Snowflake sw={11} />
					</Icon>
				</g>
			) : null}
			<Icon x={calX + 16} y={y0 + 32} size={36}>
				<Calendar color={C.inkSoft} sw={8} />
			</Icon>
			<text x={calTextR} y={y0 + 46} textAnchor="end" fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.inkSoft}>
				{cal}
			</text>
		</g>
	);
};

/** 视野形状：B17 一分为二；B31 压扁成秒表条（在 stopwatch.tsx 里接手） */
export const dualShapes = (T: Timeline, t: number, barA: Shape, barB: Shape) => {
	const split = ramp(t, T.zuo2, 0.85);
	const sL = L.single;
	const a = circleShape(mix(sL.cx, L.dualL.cx, split), mix(sL.cy, L.dualL.cy, split), mix(sL.r, L.dualL.r, split));
	const b = circleShape(mix(sL.cx, L.dualR.cx, split), mix(sL.cy, L.dualR.cy, split), mix(sL.r, L.dualR.r, split));
	const m = ramp(t, T.suoYi, 1.3);
	const lerp = (s: Shape, e: Shape): Shape => ({cx: mix(s.cx, e.cx, m), cy: mix(s.cy, e.cy, m), w: mix(s.w, e.w, m), h: mix(s.h, e.h, m), rx: mix(s.rx, e.rx, m)});
	return {L: m > 0 ? lerp(a, barA) : a, R: m > 0 ? lerp(b, barB) : b, r: mix(sL.r, L.dualL.r, split), morph: m};
};

export const DualScene: React.FC<{T: Timeline; t: number; num: Numbers; barA: Shape; barB: Shape}> = ({T, t, num, barA, barB}) => {
	const sh = dualShapes(T, t, barA, barB);
	const h = storyLeft(T, num, t);
	const hr = roomRight(T, num, t);
	const calR = calRight(T, num, t);
	const flashT = T.chaoTou3End + 0.27;
	const dead = lin(t, flashT + 0.3, flashT + 1.3);
	// 毒素通道（B25）：门槛之后才打开；04:16→06:00 的产毒曲线在条上补画一遍
	const thrH = num.left.t_threshold_h;
	const replayH = mix(thrH, num.left.hours, lin(t, T.duSu1 + 0.07, T.duSu1 + 1.17));
	const tox = t < T.duSu1 + 0.07 ? 0 : toxinLeft(num, replayH);
	const toxOpen = fade(t, T.duSu1 - 0.1, Infinity, 0.4);
	// 读数。审片后 P1-2：慢放的那一次翻倍，读数在细胞分开的那一帧（“翻一倍”）从 1,000 跳到 2,000，不再线性爬升
	const slow = t >= T.fenLie && t < T.fanYiBei;
	const lgLeft = mix(slow ? 3 : logNLeft(num, h), Math.log10(num.reheat.left_after), dead);
	// 慢放时左视野局部推近 3 倍（细胞约 60→125 像素长），快进前拉回
	const zIn = ramp(t, T.fenLie - 0.45, 0.6);
	const zOut = ramp(t, T.fanYiBei + 0.9, 0.7);
	const zoomL = mix(1, 3, zIn * (1 - zOut));
	const sepBoost = ramp(t, T.fanYiBei, 0.5);
	const nLeft = Math.pow(10, lgLeft);
	const readLeft = dead >= 1 ? `约 ${Math.round(num.reheat.left_after)}` : fmtCount(nLeft);
	const rowsOp = fade(t, T.zuo2 + 0.5, Infinity, 0.5) * (1 - sh.morph * 3);
	// 压暗：B17–B20 只动左视野；B21–B23 只动右视野
	const dimR = fade(t, T.d30, T.meiKe, 0.4, 0.5);
	const dimL = fade(t, T.you2, T.meiKe, 0.4, 0.5);
	const cold = lin(t, T.bingXiang2, T.bingXiang2 + 0.5);
	const swellR = lin(hr, 0, 1);
	const pauseOp = fade(t, T.zanTing1, T.huiDao, 0.3, 0.5) * pop(t, T.zanTing1, 0.4);
	const cardOp = fade(t, T.zuo2 + 0.4, T.suoYi, 0.45, 0.5);
	const contentOp = 1 - lin(t, T.suoYi, T.suoYi + 0.45);
	const reheatTag = fade(t, T.huiGuo2, T.zhangChu + 0.6, 0.3, 0.5);
	// 右碗室温秒表停在 01:00 后变冷蓝
	const frozen = lin(t, T.zanTing1, T.zanTing1 + 0.3);
	const swR = frozen > 0.5 ? C.coldInk : C.ink;
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
			<Field id="L" shape={sh.L} r={sh.r} dim={dimL} contentOpacity={contentOp} rim={sh.morph < 0.5}>
				<g transform={`scale(${zoomL})`}>
					<LeftContent id="L" num={num} h={h} dead={dead} fog={tox} firstGenPinch sepBoost={sepBoost} />
				</g>
			</Field>
			<Field id="R" shape={sh.R} r={sh.r} dim={dimR} cold={cold * (1 - sh.morph)} contentOpacity={contentOp} rim={sh.morph < 0.5}>
				<RightContent swell={swellR} />
			</Field>
			{pauseOp > 0 ? (
				<Icon x={L.dualR.cx} y={L.dualR.cy} size={150} opacity={Math.min(1, pauseOp) * (1 - 0.5 * dimR)}>
					<Pause color={C.ink} fill={C.ink} sw={4} />
				</Icon>
			) : null}
			{/* 样本卡 */}
			<SampleCard
				cx={500}
				w={860}
				letter="A"
				title="桌上"
				hiText="30°C"
				hi={fade(t, T.d30, T.zhongZi, 0.25, 0.6)}
				sw={fmtHM(h)}
				swColor={C.ink}
				swHand={h}
				cal={`+${Math.floor(h + 1e-6)} 小时`}
				target={t >= T.zhaoZhe && t < T.baiWan + 1.5 ? '→ 06:00' : undefined}
				targetOp={Math.min(fade(t, T.zhaoZhe + 0.3, T.baiWan + 1.0, 0.4, 0.4), 1)}
				op={cardOp}
			/>
			<SampleCard
				cx={1420}
				w={920}
				letter="B"
				title="饭后 1 小时进冰箱"
				hiText="4°C"
				hi={fade(t, T.bingXiang2, T.yaHaiMei + 0.4, 0.25, 0.6)}
				sw={fmtHM(hr)}
				swColor={swR}
				swHand={hr}
				cal={`+${Math.round(calR)} 小时`}
				snow={cold}
				op={cardOp}
			/>
			{/* 读数行 */}
			<g opacity={Math.max(0, rowsOp)}>
				<CountRow
					cx={L.dualL.cx}
					lg={lgLeft}
					op={1}
					read={readLeft}
					readPulse={Math.max(pulse(t, T.baiWan, 0.6), pulse(t, T.fanYiBei, 0.6))}
					tickPulse={pulse(t, T.n1000a - 0.1, 1.3)}
					startMark={fade(t, T.n1000a - 0.1, T.baiWanEnd + 0.8, 0.3, 0.4)}
					thr={fade(t, T.shiWan, Infinity, 0.3)}
					thrLabel={fade(t, T.shiWan, T.duSu1End + 1.2, 0.3, 0.5)}
				/>
				<CountRow cx={L.dualR.cx} lg={3} op={1} read={fmtCount(num.right.n)} readPulse={pulse(t, T.n1000b, 0.7)} thr={fade(t, T.shiWan, Infinity, 0.3)} readColor={C.ink} />
				{/* 二审 S8：补画毒素曲线时不再出第二个时钟；审片后 P2-11：“04:16 起”没有主语，改成“约 4 小时起产毒” */}
				<ToxinRow cx={L.dualL.cx} v={tox} op={toxOpen} read={`约 ${Math.round(num.left.t_threshold_h)} 小时起产毒`} readOp={fade(t, T.duSu1 + 0.1, Infinity, 0.4)} />
				<ToxinRow cx={L.dualR.cx} v={0} op={toxOpen} read="0" />
				{/* 示意小签（两根菌数条共用，放在两视野之间）。审片后 P2-16：和“约 25 分钟 ×2”合并成同一个签，“翻一倍”时签往下长出第二行 */}
				<ShiYiTag grow={ramp(t, T.fanYiBei, 0.35)} op={fade(t, T.d30, T.suoYi, 0.4, 0.4)} line2={`约 ${num.assumptions.doubling_min} 分钟 ×2`} />
			</g>
			{/* B26：回锅炒透 */}
			{[L.dualL.cx, L.dualR.cx].map((cx) => (
				<g key={cx} opacity={reheatTag} transform={`translate(${cx},${L.dualL.cy - 222}) scale(${0.85 + 0.15 * pop(t, T.huiGuo2, 0.4)})`}>
					<rect x={-128} y={-36} width={256} height={72} rx={36} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />
					<Icon x={-82} y={-2} size={56}>
						<Wok />
					</Icon>
					<text x={-40} y={14} fontFamily={SANS} fontWeight={600} fontSize={40} fill={C.ink}>
						回锅炒透
					</text>
				</g>
			))}
			{/* B28、B29：两个读数脱钩 */}
			{/* 二审 S4：“长出来的：死光”放在左视野里（细菌消失的地方）；两边读数旁加青色小签：B 的 1,000 全是没发芽的芽孢 */}
			<GrayTag x={L.dualL.cx + ROW.readX + textW(readLeft, 48) + 14} y={ROW.countY} anchor="start" text="剩芽孢" color={C.shell} stroke={C.spore} op={fade(t, T.quanSi, T.suoYi, 0.3, 0.4)} />
			<GrayTag x={L.dualR.cx + ROW.readX + textW(fmtCount(num.right.n), 48) + 14} y={ROW.countY} anchor="start" text="全是芽孢" color={C.shell} stroke={C.spore} op={fade(t, T.quanSi, T.suoYi, 0.3, 0.4)} />
			<Label x={900} y={ROW.toxY + 15} text="毒素：不变" size={40} weight={600} color={C.toxin} op={fade(t, T.meiShao, T.suoYi, 0.3, 0.4)} bg={C.paper} />
			{fade(t, T.meiShao, T.suoYi, 0.4, 0.3) > 0 ? (
				<circle
					cx={L.dualL.cx}
					cy={L.dualL.cy}
					r={262}
					fill="none"
					stroke={C.toxin}
					strokeWidth={3}
					strokeDasharray="12 10"
					opacity={fade(t, T.meiShao, T.suoYi, 0.4, 0.3)}
					strokeDashoffset={0}
				/>
			) : null}
			{/* “长出来的：死光”画在虚线圈注上面 */}
			<Label x={L.dualL.cx} y={L.dualL.cy - 205} text="长出来的：死光" size={40} weight={600} anchor="middle" op={fade(t, T.quanSi, T.suoYi, 0.3, 0.4)} bg={C.paper} />
			{/* B30：121°C 小卡（引用的事实，不标示意）。二审 S9：放在两视野之间、不压圆边；温度计深灰线稿 + 暖橙液柱，只有“毒素仍在”用品红 */}
			{/* 审片后 P2-6：两张页签挪到两视野之间的上方，这张卡下移 12 像素给页签让位 */}
			<g opacity={fade(t, T.d121, T.suoYi, 0.35, 0.4)} transform={`translate(0,12) translate(960,418) scale(${0.9 + 0.1 * easeOut(lin(t, T.d121, T.d121 + 0.35))}) translate(-960,-418)`}>
				<rect x={818} y={300} width={284} height={236} rx={14} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />
				<Icon x={862} y={382} size={104}>
					{/* 审片后 P2-10：暖橙只留给“室温在走”，121°C 的液柱改深灰 */}
					<Thermo color={C.ink} fill={C.inkSoft} level={0.9} />
				</Icon>
				<text x={912} y={370} fontFamily={SANS} fontWeight={700} fontSize={44} fill={C.ink}>
					{`${num.facts.cereulide_stable_C}°C`}
				</text>
				<text x={912} y={426} fontFamily={SANS} fontWeight={600} fontSize={40} fill={C.ink}>
					{`${num.facts.cereulide_stable_min} 分钟`}
				</text>
				<line x1={840} y1={456} x2={1080} y2={456} stroke={C.paperEdge} strokeWidth={2.5} />
				<Icon x={862} y={496} size={40}>
					<Arrow color={C.ink} sw={9} />
				</Icon>
				<text x={892} y={510} fontFamily={SANS} fontWeight={700} fontSize={40} fill={C.toxin}>
					毒素仍在
				</text>
			</g>
		</svg>
	);
};

