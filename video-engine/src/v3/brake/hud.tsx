import React from 'react';
import {bump, fin, ramp, win} from './anim';
import {clamp01} from './cam';
import type {Numbers} from './data';
import {Diamond, PaintText, textW} from './paint';
import type {CarState} from './state';
import type {TL} from './timeline';
import {carV, KMH} from './timeline';
import {C} from './theme';

// ───────── 读数区（画面上沿）：两辆车的速度表 ─────────
type ReadoutProps = {
	cx: number;
	label: string;
	color: string;
	value: string;
	valueColor?: string;
	opacity: number;
	flash?: number; // 0..1 闪一下
	pop?: number; // 0..1 放大一下
	brake?: number; // “刹”牌透明度
	timer?: string | null;
};

export const Readout: React.FC<ReadoutProps> = ({cx, label, color, value, valueColor, opacity, flash = 0, pop = 0, brake = 0, timer}) => {
	if (opacity <= 0.001) return null;
	const sc = 1 + 0.12 * flash + 0.1 * pop;
	return (
		<g opacity={opacity}>
			<PaintText x={cx} y={74} size={36} anchor="middle" color={color} weight={600}>
				{label}
			</PaintText>
			<g transform={`translate(${cx} 186) scale(${sc}) translate(${-cx} -186)`}>
				<PaintText x={cx + 4} y={190} size={118} anchor="end" color={valueColor ?? color} weight={700} tnum sh={3}>
					{value}
				</PaintText>
				<PaintText x={cx + 14} y={190} size={42} color={color} weight={600}>
					码
				</PaintText>
			</g>
			{flash > 0 ? <rect x={cx - 130} y={198} width={260 * flash} height={5} fill={color} /> : null}
			{brake > 0.001 ? (
				<g opacity={brake}>
					<rect x={cx - 230} y={112} width={70} height={70} fill={C.shadow} transform="translate(0 3)" />
					<rect x={cx - 230} y={112} width={70} height={70} fill={C.asphalt} stroke={C.yellow} strokeWidth={5} />
					<PaintText x={cx - 195} y={163} size={46} anchor="middle" color={C.white} weight={800} sh={0}>
						刹
					</PaintText>
				</g>
			) : null}
			{timer ? (
				<PaintText x={cx + 76} y={150} size={36} color={color} weight={500}>
					{timer}
				</PaintText>
			) : null}
		</g>
	);
};

/** 读数取“最近滴下的那个漆点”的速度：每滴一个点，读数少 5 码（与漆点一一对应） */
export const dotReading = (dots: {t: number; v: number}[], tp: number, v0: number) => {
	let v = v0;
	for (const d of dots) if (d.t <= tp + 1e-6) v = d.v;
	return v;
};

export const Readouts: React.FC<{t: number; frame: number; T: TL; N: Numbers; w: CarState; y: CarState}> = ({t, frame, T, N, w, y}) => {
	const trw = N.main['50'].t_react;
	const try_ = N.main['60'].t_react;
	// 白车
	const wOp = 1 - ramp(t, T.s3b, 0.5);
	let wVal = Math.round(dotReading(N.dots['50'], w.tp, 50));
	// 第二轮审片 P2：② 里重影车开到小旗下时，上方读数原来一直是“0 码”，和小旗“实际 35”对不上 →
	// 重影车在场时读数跟着重影车走（50 → 35），和 GhostCar（top.tsx）同一个物理时间
	if (t >= T.still35 && t < T.s2End + 0.6) {
		const s = N.main['50'];
		const tpG = s.t_react + Math.min(N.card_a.t_half, Math.max(0, (t - T.still35) * 0.6));
		wVal = Math.round(carV(s.v0, s.a, s.t_react, tpG));
	}
	const wBrakeT = Math.max(0, w.tp - trw);
	const wTimer = t > T.wStart - 0.1 && t < T.s1 ? `已刹 ${wBrakeT.toFixed(1)} 秒` : t > T.s3aEnd && t < T.s3b ? `已刹 ${wBrakeT.toFixed(1)} 秒` : null;
	const wBrake = win(t, T.brake, T.s1, 0.12, 0.4) + (t > T.s3aEnd && t < T.s3b ? fin(t, T.s3aEnd, 0.2) * (1 - ramp(t, T.s3b - 0.3, 0.3)) : 0);
	// 黄车
	const yOp = 1 - ramp(t, T.s3d, 0.5);
	const yHit = N.main['60'];
	const firstHit = t >= T.freeze;
	const replayHit = t >= T.these10 + yHit.t_brake / 0.6;
	const inReplay = t >= T.these10 - 0.05 && !replayHit;
	let yVal = String(Math.round(dotReading(N.dots['60'], y.tp, 60)));
	let yCol: string = C.yellow;
	// 审片 P0-2：押注之前不能露出黄车的速度。第一次播放时读数一律遮成“--”（“已刹 x 秒”照常走，它只说时间短），
	// 撞线定格那一刻起在“--”和“??”之间闪 0.6 秒（只用非数字字符，由帧号决定），然后停在“??”，揭晓时落成红色 42。
	if (t >= T.yStart - 0.05 && t < T.freeze) yVal = '--';
	if (firstHit && (t < T.these10 - 0.05 || replayHit)) {
		if (t < T.reveal) {
			yVal = t < T.freeze + 0.6 && Math.floor(frame / 3) % 2 === 0 ? '--' : '??';
		} else {
			yVal = String(Math.round(yHit.v_hit));
			yCol = C.red;
		}
	}
	const yBrakeT = Math.max(0, y.tp - try_);
	const yTimer = (t > T.yStart - 0.1 && t < T.s1) || inReplay || (t > T.these10 && t < T.s3d) ? `已刹 ${yBrakeT.toFixed(1)} 秒` : null;
	const yBrake = win(t, T.brake, T.s1, 0.12, 0.4) + (t > T.these10 - 0.05 && t < T.s3d ? fin(t, T.these10, 0.2) * (1 - ramp(t, T.s3d - 0.3, 0.3)) : 0);
	const pop = bump(t, T.reveal, 0.45) + bump(t, T.hit42, 0.5);
	// 审片 P1-1：升镜时斑马线、人形会扫过读数区。升镜这 1.2 秒给两块读数垫一块沥青色哑光底，落定后撤掉
	// 第二轮审片 P2：升镜那 0.6 秒行人从读数底板下透出来 → 底板改成不透明
	const plate = win(t, T.liftA - 0.15, T.liftB + 0.1, 0.15, 0.3);
	return (
		<>
			{plate > 0.001
				? [480, 1440].map((cx) => <rect key={cx} x={cx - 252} y={34} width={364} height={182} fill={C.asphalt} opacity={plate} />)
				: null}
			<Readout cx={480} label="50 码这辆" color={C.white} value={String(wVal)} opacity={wOp} flash={bump(t, T.g50, 0.45)} brake={Math.min(1, wBrake)} timer={wTimer} />
			<Readout
				cx={1440}
				label="60 码这辆"
				color={C.yellow}
				value={yVal}
				valueColor={yCol}
				opacity={yOp}
				flash={bump(t, T.g60, 0.45)}
				brake={Math.min(1, yBrake)}
				pop={pop}
				timer={yTimer}
			/>
		</>
	);
};

// ───────── 段落牌（左上角黄色菱形） ─────────
// 第二轮审片 P2：抛球段原来还挂着“④ 换路面”→ 抛球时换成“④ 抛球”；⑤ 的 4 张卡前两张是落地应用、后两张才是边界 →
// 念到“看手机”时是“⑤ 落地”，念到“车速越低”时翻成“⑤ 边界”（“落地与边界”五个字在牌子里放不下 36 px）。
// 同时牌子改成两行（序号 44 px / 名称 36 px），菱形半径 92 → 110：原来一行字只有 28–32 px，低于 36 px 下限
export const SIGN_C = 130;
const SIGNS: [keyof TL, string, string][] = [
	['s1', '①', '猜'],
	['s2', '②', '卡住'],
	['s3', '③', '按秒'],
	['s4', '④', '换路面'],
	['s4b', '④', '抛球'],
	['s5', '⑤', '落地'],
	['lower', '⑤', '边界'],
];

export const SectionSign: React.FC<{t: number; T: TL}> = ({t, T}) => {
	let cur = -1;
	SIGNS.forEach(([k], i) => {
		if (t >= (T[k] as number)) cur = i;
	});
	if (cur < 0) return null;
	const t0 = T[SIGNS[cur][0]] as number;
	const flip = Math.min(1, (t - t0) / 0.35);
	const out = 1 - ramp(t, T.s5End, 0.4);
	const sx = Math.abs(Math.cos(Math.PI * (1 - flip) * 0.5));
	const c = SIGN_C;
	return (
		<g opacity={out} transform={`translate(${c} ${c}) scale(${Math.max(0.02, sx)} 1) translate(${-c} ${-c})`}>
			<Diamond cx={c} cy={c} r={110} text={SIGNS[cur][1]} size={44} text2={SIGNS[cur][2]} size2={36} />
		</g>
	);
};

/** 左上角小结行（路面喷字小号），③b 末尾出现，一直留到终局 */
export const SummaryLine: React.FC<{t: number; T: TL}> = ({t, T}) => {
	// 第三轮自查：终局大字“速度按秒掉”在 s5End + 0.36 开始喷，原来小结行到 s5End + 0.7 才淡完，两行字在左上角叠了约 0.35 秒 →
	// 小结行在 s5End 就开始收、0.35 秒收完，交给终局大字
	const a = win(t, T.s3bEnd + 0.15, T.s5End, 0.5, 0.35);
	if (a <= 0) return null;
	// 第二轮审片 P2：小结行原来约 60 px 粗体、念到同一句时还放大 → 降到 40 px（拉长 1.3），念这句时只闪一下（变淡再回来），不放大
	const fl = bump(t, T.rule2, 0.5);
	return (
		<g opacity={a * (1 - 0.6 * fl)}>
			<PaintText x={262} y={112} size={40} stretch={1.3} weight={900} color={C.white}>
				速度按秒掉，路按米走
			</PaintText>
		</g>
	);
};

/** 右下角假设角标（全片常驻；抛球那段换成“不计空气阻力”，所以先收起） */
export const AssumptionTag: React.FC<{t: number; T: TL; N: Numbers}> = ({t, T, N}) => {
	const A = N.assumptions;
	const off = win(t, T.unlike, T.s5, 0.5, 0.5);
	const a = 0.72 * (1 - off);
	// 审片 P1-3：雨天段整块换成湿路的假设（不再同时挂“干燥沥青 / 7 m/s²”）
	// 第三轮自查：原来新旧两套字交叉淡化，中间约 0.4 秒两行字叠成一团（“反反应 … 干湿沥青”）→
	// 改成先淡出旧字、再淡入新字（swapOut / swapIn）；离开雨天时不再换回干路，等整块角标收起（抛球段）后再悄悄换回
	const rain = t < T.unlike + 0.55 ? ramp(t, T.s4, 0.6) : 0;
	// 审片 P1-4：终局和留题时孩子不在 35 米处，角标去掉“人在 35 米外”（35 米改标在终局图的“人”那条线上）
	const fin3 = ramp(t, T.s5End, 0.5);
	const swapOut = (k: number) => clamp01(1 - 2 * k);
	const swapIn = (k: number) => clamp01(2 * k - 1);
	const perSec = Math.round(A.a_dry * KMH);
	const perSecWet = (A.a_wet * KMH).toFixed(1);
	const dry = [`反应 ${A.t_react} 秒 · 干燥沥青`, `刹车每秒少约 ${perSec} 码（${A.a_dry} m/s²）`];
	const wet = [`反应 ${A.t_react} 秒 · 湿沥青`, `刹车每秒少约 ${perSecWet} 码（${A.a_wet} m/s²，示意）`];
	const line = (txt: string, i: number, op: number, key: string) =>
		op > 0.001 ? (
			<PaintText key={key} x={1890} y={834 + i * 42} size={36} anchor="end" color={C.white} opacity={op}>
				{txt}
			</PaintText>
		) : null;
	// 第二轮审片 P2：开头 0–7 秒角标第二行压在 60 码那边引擎盖的轮廓线上 → 驾驶视角时角标垫一块沥青色哑光底，升镜时撤掉
	const plateA = 1 - ramp(t, T.liftA, 0.4); // 整组透明度 0.72，底板实际约 72%
	const plateW = Math.max(...[...dry, `人在 ${A.d_person} 米外 · 计算示意`].map((s) => textW(s, 36))) + 28;
	return (
		<g opacity={a}>
			{plateA > 0.001 ? <rect x={1890 - plateW + 14} y={798} width={plateW} height={132} fill={C.asphalt} opacity={plateA} /> : null}
			{dry.map((l, i) => line(l, i, swapOut(rain), `d${i}`))}
			{wet.map((l, i) => line(l, i, swapIn(rain), `w${i}`))}
			{line(`人在 ${A.d_person} 米外 · 计算示意`, 2, swapOut(fin3), 'p')}
			{line('计算示意', 2, swapIn(fin3), 'q')}
		</g>
	);
};

/** 右上角“慢放”标 */
export const SlowTag: React.FC<{a: number; text: string}> = ({a, text}) => {
	if (a <= 0.001) return null;
	return (
		<g opacity={a}>
			<rect x={1690} y={36} width={200} height={58} fill="none" stroke={C.white} strokeWidth={3} />
			<PaintText x={1790} y={78} size={36} anchor="middle" weight={600}>
				{text}
			</PaintText>
		</g>
	);
};

/** 开头的“码＝公里/小时（口语）” */
export const UnitNote: React.FC<{t: number; T: TL}> = ({t, T}) => {
	const a = win(t, T.g50 + 0.3, T.see, 0.3, 0.3);
	if (a <= 0) return null;
	return (
		<PaintText x={480} y={258} size={36} anchor="middle" opacity={a * 0.9}>
			码＝公里/小时（口语）
		</PaintText>
	);
};
