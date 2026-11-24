// 段 6–7（K8，B37–B43）：换样本复检 + 对照 + 边界。
// 一排四个小视野：米饭（回锅后，雾还在）/ 泡过夜的木耳 / 夏天桌上的卤肉 / 生肉里的沙门氏菌（对照）。
import React from 'react';
import type {Numbers, Timeline} from './data';
import {fmtHM} from './data';
import {LeftContent} from './dual';
import {Arrow, Check, Cross, Icon, Pause, PressureCooker, Snowflake, Stopwatch, ToxinDot, TwoCapsules, Wok} from './icons';
import {Capsule, circleShape, Field, Fog, LawnDefs} from './micro';
import {Label} from './specimen';
import {GrayTag} from './cards';
import {C, SANS, SERIF} from './theme';
import {blobPath, easeInOut, easeOut, fade, lin, mix, mulberry32, pop, pulse, ramp, textW} from './util';

const FX = [260, 720, 1180, 1640];
const FY = 470;
const FR = 190;

type Bug = {x: number; y: number; a: number; t: number};
/** 增殖：按固定种子撒点，第 i 个在 t_i 出现（数量按 2 的幂增长） */
const spawn = (seed: number, n: number, spread: number, clusters?: {x: number; y: number}[]) => {
	const rnd = mulberry32(seed);
	const out: Bug[] = [];
	for (let i = 0; i < n; i++) {
		let x: number;
		let y: number;
		if (clusters) {
			const c = clusters[i % clusters.length];
			const a = rnd() * Math.PI * 2;
			const r = Math.sqrt(rnd()) * 34;
			x = c.x + Math.cos(a) * r;
			y = c.y + Math.sin(a) * r;
		} else {
			const a = rnd() * Math.PI * 2;
			const r = Math.sqrt(rnd()) * spread;
			x = Math.cos(a) * r;
			y = Math.sin(a) * r;
		}
		// 第 i 个出现的进度：log2(i+1)/log2(n)，前几个早、后面越来越密
		out.push({x, y, a: rnd() * Math.PI, t: Math.log2(i + 1) / Math.log2(n)});
	}
	return out;
};

const FUNGUS = spawn(41, 70, 230);
const CLUSTERS = [
	{x: -120, y: -90},
	{x: 70, y: -140},
	{x: 150, y: 40},
	{x: -40, y: 60},
	{x: -150, y: 120},
	{x: 80, y: 170},
];
const STAPH = spawn(43, 84, 0, CLUSTERS);
const SALM = spawn(47, 60, 230);

/** 木耳片：深褐半透明的波浪片 */
const FungusBg: React.FC = () => (
	<g>
		{[0, 1, 2, 3].map((i) => (
			<path key={i} d={blobPath([-90, 110, -40, 140][i], [-110, -60, 120, 150][i], [150, 130, 140, 90][i], 70 + i, 11, 0.5, 1.3, 0.9)} fill={C.fungus} fillOpacity={0.42} stroke="#3d2a1e" strokeWidth={3} strokeOpacity={0.5} />
		))}
	</g>
);
/** 肉纤维：平行的波浪带（卤肉 / 生肉，都不带粉） */
const MeatBg: React.FC<{color: string; seed: number}> = ({color, seed}) => {
	const rnd = mulberry32(seed);
	const bands = Array.from({length: 9}).map((_, i) => {
		const y0 = -300 + i * 70 + rnd() * 10;
		const ph = rnd() * 6;
		let d = `M-320,${y0}`;
		for (let x = -320; x <= 320; x += 40) d += ` L${x},${(y0 + Math.sin(x / 70 + ph) * 10).toFixed(1)}`;
		for (let x = 320; x >= -320; x -= 40) d += ` L${x},${(y0 + 46 + Math.sin(x / 70 + ph + 0.4) * 10).toFixed(1)}`;
		return d + 'Z';
	});
	return (
		<g>
			{bands.map((d, i) => (
				<path key={i} d={d} fill={color} fillOpacity={0.55 + (i % 2) * 0.2} stroke="#8f6c4e" strokeOpacity={0.35} strokeWidth={2} />
			))}
		</g>
	);
};

/** 三格链：① 室温里长 ② 耐热的毒 ③ 再热没用（只画图标） */
const Chain3: React.FC<{cx: number; y: number; op: number; u1: number; u2: number; u3: number; control?: boolean; cross2?: number; check3?: number}> = ({cx, y, op, u1, u2, u3, control, cross2 = 0, check3 = 0}) => {
	if (op <= 0.001) return null;
	const cw = 110;
	const ch = 80;
	const gap = 30;
	const xs = [cx - cw - gap, cx, cx + cw + gap];
	return (
		<g opacity={op}>
			{xs.map((x, i) => (
				<rect key={i} x={x - cw / 2} y={y - ch / 2} width={cw} height={ch} rx={12} fill={C.paper} stroke={C.ink} strokeWidth={2.5} strokeDasharray={[u1, u2, u3][i] > 0 ? undefined : '7 6'} />
			))}
			{[0, 1].map((i) => (
				<Icon key={i} x={(xs[i] + xs[i + 1]) / 2} y={y} size={26}>
					<Arrow color={C.inkSoft} sw={10} />
				</Icon>
			))}
			<Icon x={xs[0]} y={y} size={70 * u1} opacity={u1}>
				<TwoCapsules />
			</Icon>
			{!control ? (
				<Icon x={xs[1]} y={y} size={60 * u2} opacity={u2}>
					<ToxinDot />
				</Icon>
			) : (
				<Icon x={xs[1]} y={y} size={56} opacity={cross2}>
					<Cross u={cross2} color={C.ink} sw={11} />
				</Icon>
			)}
			<g opacity={u3}>
				{/* ③ 再热：深灰锅图标（二审 S10：原来的白闪图标像太阳） */}
				<Icon x={xs[2] - 20} y={y - 4} size={58}>
					<Wok />
				</Icon>
				{!control ? (
					<Icon x={xs[2] + 26} y={y} size={44}>
						<ToxinDot />
					</Icon>
				) : (
					<Icon x={xs[2] + 26} y={y} size={50}>
						<Check u={check3} color={C.ink} sw={14} />
					</Icon>
				)}
			</g>
		</g>
	);
};

/** 样本卡；spin 不为空时，卡左侧的室温秒表快进转几圈（“室温里放了多久”） */
const SampleTag: React.FC<{cx: number; text: string; op: number; spin?: number}> = ({cx, text, op, spin}) => {
	if (op <= 0.001) return null;
	const extra = spin !== undefined ? 46 : 0;
	const w = textW(text, 36) + 36 + extra;
	return (
		<g opacity={op}>
			<rect x={cx - w / 2} y={214} width={w} height={54} rx={10} fill={C.paper} stroke={C.paperEdge} strokeWidth={2.5} />
			{spin !== undefined ? (
				<Icon x={cx - w / 2 + 32} y={241} size={36}>
					<Stopwatch color={C.warmInk} hand={spin} sw={9} />
				</Icon>
			) : null}
			<text x={cx + extra / 2} y={253} textAnchor="middle" fontFamily={SERIF} fontWeight={600} fontSize={36} fill={C.ink}>
				{text}
			</text>
		</g>
	);
};

export const SamplesScene: React.FC<{T: Timeline; t: number; num: Numbers}> = ({T, t, num}) => {
	// B41a：讲“同样的时间，天越热，菌长得越快”时四个小视野压淡到 40%；B42 起淡出
	const out = mix(1, 0.4, ramp(t, T.tongYang, 0.5)) * (1 - lin(t, T.bingXiang5, T.bingXiang5 + 0.5));
	if (out <= 0) return null;
	const open = (t0: number) => easeOut(lin(t, t0, t0 + 0.55));
	const o1 = open(T.paoGuoYe - 0.1);
	const o2 = open(T.muEr);
	const o3 = open(T.xiaTian);
	const o4 = open(T.duiZhao);
	// 木耳
	const g2 = lin(t, T.lingYiZhong, T.lingYiZhong + 1.6);
	const fl2 = T.gaoYaGuo + 0.35;
	const dead2 = lin(t, fl2 + 0.3, fl2 + 1.0);
	// 卤肉
	const g3 = lin(t, T.puTao, T.puTao + 1.5);
	const fl3 = T.jiaRe2 + 0.15;
	const dead3 = lin(t, fl3 + 0.3, fl3 + 1.0);
	// 生肉（对照）
	const g4 = lin(t, T.shaMen, T.shaMen + 1.1);
	const fl4 = T.reTou2 + 0.15;
	const dead4 = lin(t, fl4 + 0.3, fl4 + 1.0);
	// 视野内白闪：0.3 秒全白，0.1 秒淡出（不配声音）
	const lflash = (f: number) => (t < f ? 0 : t < f + 0.3 ? 1 : 1 - lin(t, f + 0.3, f + 0.4));
	// 链
	const chainOp = fade(t, T.taMen + 0.3, Infinity, 0.4);
	const u1 = ramp(t, T.xianZhang, 0.35);
	const u2 = ramp(t, T.naiReDeDu2, 0.35);
	const u3 = ramp(t, T.zaiRe, 0.35);
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: out}}>
			{/* 1 米饭（回锅后：细菌死光，雾还在） */}
			{o1 > 0 ? (
				<g opacity={o1}>
					<Field id="S1" shape={circleShape(FX[0], FY, FR * mix(0.6, 1, o1))} r={FR * mix(0.6, 1, o1)}>
						<LeftContent id="S1" num={num} h={num.left.hours} dead={1} fog={num.reheat.toxin_left} />
					</Field>
					<SampleTag cx={FX[0]} text="米饭 · 桌上 6 小时" op={o1} />
				</g>
			) : null}
			{/* 2 木耳 */}
			{o2 > 0 ? (
				<g opacity={o2}>
					<Field id="S2" shape={circleShape(FX[1], FY, FR * mix(0.6, 1, o2))} r={FR * mix(0.6, 1, o2)} flash={lflash(fl2)}>
						<LawnDefs id="S2" />
						<FungusBg />
						<g opacity={1 - dead2}>
							{FUNGUS.filter((b) => b.t <= g2).map((b, i) => (
								<Capsule key={i} x={b.x} y={b.y} a={b.a} len={44} w={8} opacity={Math.min(1, (g2 - b.t) * 8 + 0.2)} />
							))}
						</g>
						<Fog id="S2" blobs={[{x: -40, y: -20, r: 300}, {x: 80, y: 60, r: 220}]} amount={lin(t, T.lingYiZhong + 0.5, T.lingYiZhong + 1.8)} />
					</Field>
					<SampleTag cx={FX[1]} text="木耳 · 泡过夜" op={o2} spin={3 * easeOut(lin(t, T.muEr, T.muEr + 1.4))} />
				</g>
			) : null}
			{/* 3 卤肉 */}
			{o3 > 0 ? (
				<g opacity={o3}>
					<Field id="S3" shape={circleShape(FX[2], FY, FR * mix(0.6, 1, o3))} r={FR * mix(0.6, 1, o3)} flash={lflash(fl3)}>
						<LawnDefs id="S3" />
						<MeatBg color={C.meatCooked} seed={5} />
						<g opacity={1 - dead3}>
							{STAPH.filter((b) => b.t <= g3).map((b, i) => (
								<circle key={i} cx={b.x} cy={b.y} r={10} fill={C.bac} stroke={C.bacEdge} strokeWidth={1.6} opacity={Math.min(1, (g3 - b.t) * 8 + 0.2)} />
							))}
						</g>
						<Fog id="S3" blobs={CLUSTERS.map((c) => ({x: c.x, y: c.y, r: 120}))} amount={lin(t, T.puTao + 0.5, T.puTao + 1.7)} />
					</Field>
					<SampleTag cx={FX[2]} text="卤肉 · 夏天桌上半天" op={o3} spin={2 * easeOut(lin(t, T.luRou, T.luRou + 1.2))} />
				</g>
			) : null}
			{/* 4 生肉（对照）：不留雾，白闪后干干净净 */}
			{o4 > 0 ? (
				<g opacity={o4}>
					<Field id="S4" shape={circleShape(FX[3], FY, FR * mix(0.6, 1, o4))} r={FR * mix(0.6, 1, o4)} flash={lflash(fl4)}>
						<MeatBg color={C.meatRaw} seed={9} />
						<g opacity={1 - dead4}>
							{SALM.filter((b) => b.t <= g4).map((b, i) => (
								<Capsule key={i} x={b.x} y={b.y} a={b.a} len={26} w={11} opacity={Math.min(1, (g4 - b.t) * 8 + 0.2)} />
							))}
						</g>
					</Field>
					<SampleTag cx={FX[3]} text="生肉 · 沙门氏菌（对照）" op={o4} />
				</g>
			) : null}
			{/* 木耳：高压锅 → 白闪 → 雾不动 */}
			<g opacity={fade(t, T.gaoYaGuo - 0.05, T.xiaTian, 0.25, 0.4)}>
				<rect x={FX[1] - 96} y={318} width={192} height={64} rx={32} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />
				<Icon x={FX[1] - 54} y={350} size={52}>
					<PressureCooker />
				</Icon>
				<Label x={FX[1] - 18} y={364} text="高压锅" size={36} weight={600} />
			</g>
			{/* 二审 S10：原“毒：高压锅也不坏”和旁白同句，改成“高压锅后：毒仍在” */}
			{fade(t, fl2 + 0.7, Infinity, 0.3) > 0 ? (
				<g opacity={fade(t, fl2 + 0.7, Infinity, 0.3)}>
					<rect x={FX[1] - textW('高压锅后：毒仍在', 36) / 2 - 12} y={590} width={textW('高压锅后：毒仍在', 36) + 24} height={50} rx={10} fill={C.paper} />
					<text x={FX[1] - textW('高压锅后：毒仍在', 36) / 2} y={627} fontFamily={SANS} fontWeight={600} fontSize={36} fill={C.ink}>
						高压锅后：<tspan fill={C.toxin}>毒仍在</tspan>
					</text>
				</g>
			) : null}
			{/* 卤肉：葡萄球菌 */}
			<Label x={FX[2]} y={364} text="葡萄球菌" size={36} weight={600} anchor="middle" op={fade(t, T.puTao, T.yeBuPa - 0.15, 0.3, 0.25)} bg={C.paper} />
			{/* 审片后 P2-4：卤肉也重演同一套动作：先出“回锅”小签 → 白闪 →“回锅后：毒仍在” */}
			<g opacity={fade(t, T.yeBuPa - 0.05, T.taMen, 0.25, 0.4)}>
				<rect x={FX[2] - 86} y={318} width={172} height={64} rx={32} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />
				<Icon x={FX[2] - 44} y={350} size={52}>
					<Wok />
				</Icon>
				<Label x={FX[2] - 8} y={364} text="回锅" size={36} weight={600} />
			</g>
			{fade(t, fl3 + 0.7, Infinity, 0.3) > 0 ? (
				<g opacity={fade(t, fl3 + 0.7, Infinity, 0.3)}>
					<rect x={FX[2] - textW('回锅后：毒仍在', 36) / 2 - 12} y={590} width={textW('回锅后：毒仍在', 36) + 24} height={50} rx={10} fill={C.paper} />
					<text x={FX[2] - textW('回锅后：毒仍在', 36) / 2} y={627} fontFamily={SANS} fontWeight={600} fontSize={36} fill={C.ink}>
						回锅后：<tspan fill={C.toxin}>毒仍在</tspan>
					</text>
				</g>
			) : null}
			{/* 生肉：沙门氏菌 */}
			<Label x={FX[3]} y={364} text="沙门氏菌" size={36} weight={600} anchor="middle" op={fade(t, T.shaMen, T.reTou2End, 0.3, 0.4)} bg={C.paper} />
			{/* 三格链：先问（空链），再答（逐格点亮） */}
			{[0, 1, 2].map((i) => (
				<Chain3 key={i} cx={FX[i]} y={728} op={chainOp} u1={u1} u2={u2} u3={u3} />
			))}
			<Chain3
				cx={FX[3]}
				y={728}
				op={fade(t, T.shaMen + 0.3, Infinity, 0.4)}
				u1={ramp(t, T.shaMen + 0.6, 0.35)}
				u2={0}
				u3={ramp(t, fl4 + 0.4, 0.35)}
				control
				cross2={ramp(t, T.buXianLiuDu, 0.4)}
				check3={ramp(t, fl4 + 0.6, 0.4)}
			/>
			<g opacity={fade(t, T.xianZhang, Infinity, 0.4)}>
				<text x={720} y={828} textAnchor="middle" fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.inkSoft}>
					①室温里长　②耐热的毒　③再热没用
				</text>
			</g>
		</svg>
	);
};

/** 一只表盘（B41a）：深灰表壳，暖橙指针和已走过的扇形（室温时间用暖橙，不用品红、青、紫） */
const Dial: React.FC<{x: number; y: number; size: number; hand: number; sw: number}> = ({x, y, size, hand, sw}) => {
	const k = size / 100;
	const r = 40;
	const a = hand * Math.PI * 2 - Math.PI / 2;
	const big = hand % 1 > 0.5 ? 1 : 0;
	const hx = Math.cos(a) * r;
	const hy = Math.sin(a) * r;
	const wedge =
		hand <= 0.001 ? null : hand >= 0.999 ? (
			<circle r={r} fill={C.warm} opacity={0.35} />
		) : (
			<path d={`M0,0 L0,${-r} A${r},${r} 0 ${big},1 ${hx.toFixed(2)},${hy.toFixed(2)} Z`} fill={C.warm} opacity={0.35} />
		);
	return (
		<g transform={`translate(${x},${y}) scale(${k})`}>
			<rect x={-9} y={-56} width={18} height={11} rx={3} fill={C.ink} />
			<circle r={r + 2} fill={C.paper} stroke={C.ink} strokeWidth={sw / k} />
			{wedge}
			{Array.from({length: 12}).map((_, i) => {
				const b = (i / 12) * Math.PI * 2;
				return <line key={i} x1={Math.cos(b) * 33} y1={Math.sin(b) * 33} x2={Math.cos(b) * 38} y2={Math.sin(b) * 38} stroke={C.warmEdge} strokeWidth={2.4} strokeLinecap="round" />;
			})}
			<line x1={0} y1={0} x2={hx * 0.86} y2={hy * 0.86} stroke={C.warmInk} strokeWidth={5} strokeLinecap="round" />
			<circle r={4} fill={C.warmInk} />
		</g>
	);
};

/** 25°C / 33°C 下的菌数（numbers.json 的 hotter：熟米饭实测的迟滞和翻倍时间，示意） */
const nAt = (n0: number, c: {lag_h: number; td_min: number}, h: number) => (h < c.lag_h ? n0 : n0 * Math.pow(2, (h - c.lag_h) / (c.td_min / 60)));
const fmtHot = (n: number) => {
	if (n < 1e4) return Math.round(n).toLocaleString('en-US');
	const w = n / 1e4;
	return `${w >= 9.95 ? Math.round(w) : w.toFixed(1)} 万`;
};

/**
 * B41a（审片后 P2-13 改写）：“同样的时间，天越热，菌长得越快。”
 * 秒表仍然只量“在室温里待了多久”：两只秒表同步走、读数一样；变的是下面的菌数——33°C 先涨到 10 万，25°C 还在 1,000。
 * 数字来自 numbers.json 的 hotter（Vessoni 2002 熟米饭实测：25°C 迟滞 8 h、59 分钟翻倍；33°C 迟滞 2.5 h、42 分钟翻倍）。
 */
export const HotterScene: React.FC<{T: Timeline; t: number; num: Numbers}> = ({T, t, num}) => {
	if (t < T.tongYang - 0.05 || t > T.bingXiang5 + 0.6) return null;
	const inU = easeOut(lin(t, T.tongYang, T.tongYang + 0.5));
	const out = 1 - lin(t, T.bingXiang5, T.bingXiang5 + 0.5);
	const n0 = num.assumptions.N0_per_g;
	const hEnd = num.hotter.C33.t_thr_h;
	const hh = hEnd * easeInOut(lin(t, T.tongYang + 0.35, T.yueKuai + 0.45));
	const cols = [
		{x: 760, label: '25°C', c: num.hotter.C25},
		{x: 1160, label: '33°C', c: num.hotter.C33},
	];
	const hit = ramp(t, T.yueKuai + 0.45, 0.35);
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: inU * out}}>
			<rect x={566} y={282} width={788} height={414} rx={20} fill={C.paper} stroke={C.paperEdge} strokeWidth={3} />
			<GrayTag x={1284} y={322} text="示意" />
			{cols.map((col, i) => {
				const n = nAt(n0, col.c, hh);
				const read = fmtHot(n);
				return (
					<g key={i}>
						<text x={col.x} y={352} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={48} fill={C.ink}>
							{col.label}
						</text>
						<Dial x={col.x} y={458} size={160} hand={hh / 12} sw={4.5} />
						<text x={col.x} y={584} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={44} fill={C.warmInk}>
							{fmtHM(hh)}
						</text>
						<text x={col.x - 18} y={662} textAnchor="end" fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.inkSoft}>
							菌数
						</text>
						<text x={col.x - 6} y={664} fontFamily={SANS} fontWeight={700} fontSize={48 * (1 + (i === 1 ? 0.12 * pulse(t, T.yueKuai + 0.45, 0.6) : 0))} fill={C.ink}>
							{read}
						</text>
						{/* 33°C 先到 10 万（产毒门槛）：读数旁弹出一个品红毒素点 */}
						{i === 1 && hit > 0 ? <circle cx={col.x - 6 + textW(read, 48) + 26} cy={648} r={14 * pop(t, T.yueKuai + 0.45, 0.4)} fill={C.toxin} /> : null}
					</g>
				);
			})}
		</svg>
	);
};

/** B42–B43：冰箱这个暂停键也不完全灵（审片后 P2-17：元素放大到画面中部；P2-10：暂停图标和全片统一成深灰实心） */
export const BoundaryScene: React.FC<{T: Timeline; t: number}> = ({T, t}) => {
	const out = 1 - lin(t, T.jiZhu, T.jiZhu + 0.35);
	if (t < T.bingXiang5 || out <= 0) return null;
	const pin = pop(t, T.bingXiang5 + 0.4, 0.45);
	const px = 600;
	const py = 470;
	const size = 270 * (0.85 + 0.15 * pin);
	const crack = ramp(t, T.buWanQuanLing, 0.5);
	const fo = easeOut(lin(t, T.youDeJun, T.youDeJun + 0.5));
	// 李斯特菌：很慢地分裂一次
	const div = lin(t, T.lengCang, T.yiTianNei);
	const pinch = div < 0.55 ? -1 : Math.min(1, (div - 0.55) / 0.4);
	const sep = div > 0.95 ? (div - 0.95) / 0.05 : 0;
	const len = 110 + 70 * Math.min(1, div / 0.55);
	const FXL = 1180;
	const FYL = 470;
	const FRL = 210;
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: out}}>
			<Icon x={px} y={py} size={size} opacity={Math.min(1, pin)}>
				<Pause color={C.ink} fill={C.ink} sw={4} crack={crack} />
			</Icon>
			<g opacity={fade(t, T.bingXiang5 + 0.4, Infinity, 0.4)}>
				<Icon x={548} y={696} size={52}>
					<Snowflake sw={9} />
				</Icon>
				<Label x={586} y={714} text="冰箱" size={48} weight={600} />
			</g>
			{fo > 0 ? (
				<g opacity={fo}>
					<Field id="LIS" shape={circleShape(FXL, FYL, FRL * mix(0.6, 1, fo))} r={FRL * mix(0.6, 1, fo)} cold={1}>
						{sep > 0 ? (
							<>
								<Capsule x={-len / 4 - 14 * sep} y={-6 - 4 * sep} a={0.25} len={len / 2 + 4} w={48} />
								<Capsule x={len / 4 + 14 * sep} y={6 + 4 * sep} a={0.25} len={len / 2 + 4} w={48} />
							</>
						) : (
							<Capsule x={0} y={0} a={0.25} len={len} w={48} pinch={pinch} />
						)}
					</Field>
					<Icon x={FXL + 152} y={FYL - 160} size={56}>
						<Snowflake sw={9} />
					</Icon>
					<Label x={FXL + 238} y={FYL - 20} text="如：李斯特菌" size={44} weight={600} op={fade(t, T.lengCang, Infinity, 0.3)} />
					{/* 菌数小箭头：缓缓上移 */}
					<g opacity={fade(t, T.manManZhang, Infinity, 0.4)} transform={`translate(${FXL + 262},${FYL + 120 - 44 * lin(t, T.manManZhang, T.yiTianNeiEnd)})`}>
						<path d="M0,-34 L25,0 L9,0 L9,38 L-9,38 L-9,0 L-25,0 Z" fill={C.bac} />
						<text x={40} y={16} fontFamily={SANS} fontWeight={500} fontSize={40} fill={C.inkSoft}>
							菌数
						</text>
					</g>
				</g>
			) : null}
			<Label x={FXL} y={FYL + FRL + 92} text="剩饭 ≤ 1 天" size={48} weight={700} anchor="middle" op={fade(t, T.yiTianNei, Infinity, 0.3)} bg={C.paper} />
		</svg>
	);
};
