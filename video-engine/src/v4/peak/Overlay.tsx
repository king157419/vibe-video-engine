/** 画面上的字（DOM）：贴在物体旁的小标签放在镜头里（WorldText），屏幕角上的「示意」和顶部人名年份放在镜头外（ScreenText）。
 *  每个标签都写明出现、收走的时间（剧本 §3）。 */
import React from 'react';
import {C, FONT_EN, FONT_EN_IT, FONT_ZH} from '../kit/theme';
import {clamp, lerp, prog, smooth, win} from '../kit/util';
import {type Cam, toScreen} from './camera';
import {type Data, mmss, thin} from './data';
import {goldSelfPos, selfTau} from './scenes/s5';

const ICE = '#a9c8ff';
const GOLD = '#f0d28c';

type TP = {
	x: number;
	y: number;
	o: number;
	children: React.ReactNode;
	align?: 'left' | 'center' | 'right';
	size?: number;
	color?: string;
	font?: string;
	tracking?: string;
	weight?: number;
	italic?: boolean;
	glow?: string;
	scale?: number;
	style?: React.CSSProperties;
};
const T: React.FC<TP> = ({x, y, o, children, align = 'center', size = 16, color = C.text, font = FONT_ZH, tracking = '0.18em', weight = 380, italic, glow, scale = 1, style}) => {
	if (o <= 0.002) return null;
	const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(${tx}, -50%) scale(${scale})`,
				transformOrigin: align === 'left' ? 'left center' : align === 'right' ? 'right center' : 'center center',
				opacity: clamp(o),
				whiteSpace: 'nowrap',
				fontFamily: font,
				fontWeight: weight,
				fontStyle: italic ? 'italic' : 'normal',
				fontSize: size,
				color,
				letterSpacing: tracking,
				textShadow: glow ? `0 0 10px ${glow}, 0 0 26px ${glow}` : '0 0 8px rgba(0,0,0,0.8)',
				lineHeight: 1.25,
				textAlign: align,
				...style,
			}}
		>
			{children}
		</div>
	);
};

/** 小标签的统一样式：16 px、宽字距、低亮度 */
const lab = (color: string, a = 0.85) => ({color, o: a});

const POEM: {text: string; hl: [number, number, string, string]}[] = [
	{text: '此情可待成追忆', hl: [5, 7, GOLD, 'rgba(240,210,140,0.75)']},
	{text: '只是当时已惘然', hl: [2, 4, ICE, 'rgba(169,200,255,0.75)']},
];

/** 水温（剧本 §2.4）：多出的 30 秒里由 14 °C 慢慢升到 15 °C，T = 14 + (s − 60)/30 */
const waterT = (s: number) => 14 + Math.max(0, s - 60) / 30;

/** 2026-10-12 用户反馈：「14 度、15 度这两个数没人记得，要说『比 14 度多 1 度』」。
 *  旧版只有一个 18 px 的小标签从「14.0 °C」滚到「15.0 °C」，滚完 14 就没了。现在（按真实时间 tr，和两句字幕对齐）：
 *  50.7 分叉开始长，原来那个「14 °C」放大成 30 px 并亮起；51.2–52.4 一道箭头画到右边，「15 °C」出现 ——
 *  两个数同屏，14 °C 更亮、15 °C 暗一档（和计时线「越亮越冷」同一个语法）；
 *  53.6 箭头上方浮出金色「+1 °C」；57.1 第二句「只暖了1度——还是冷。」上屏的同一刻它亮到最亮、放大一点，一直亮到 61.3；
 *  61.3–61.9 整组收走（61.9 计时线升上来提问）。 */
const TempReadout: React.FC<{t: number; tr: number}> = ({t, tr}) => {
	const a = win(t, 38.8, 58.4, 0.6, 1.0) * (1 - smooth((tr - 61.3) / 0.6));
	if (a <= 0.002) return null;
	const T0 = waterT(60);
	const T1 = waterT(90);
	const big = smooth((tr - 50.7) / 0.7);
	const size = lerp(18, 30, big);
	const iceGlow = big > 0 ? `0 0 ${10 * big}px rgba(169,200,255,${0.55 * big}), 0 0 ${26 * big}px rgba(169,200,255,${0.3 * big})` : '0 0 8px rgba(0,0,0,0.8)';
	const num = (v: number) => `${v.toFixed(0)} °C`;
	const out: React.ReactNode[] = [];
	out.push(
		<T key="t14" x={1360} y={560} o={a * lerp(0.85, 1, big)} align="left" size={size} color={ICE} font={FONT_EN} tracking="0.08em" style={{textShadow: iceGlow}}>
			{num(T0)}
		</T>,
	);
	const pa = smooth(prog(tr, 51.2, 52.4, (x) => x));
	if (pa > 0) {
		// 箭头：一条发光细线从 14 °C 画到 15 °C，头上一个小折角
		const L = 62;
		out.push(
			<svg key="arrow" width={L + 12} height={20} viewBox={`0 0 ${L + 12} 20`} style={{position: 'absolute', left: 1466, top: 550, opacity: a * 0.9, overflow: 'visible', filter: 'drop-shadow(0 0 4px rgba(169,200,255,0.8))'}}>
				<line x1={2} y1={10} x2={2 + L * pa} y2={10} stroke={ICE} strokeWidth={1.6} strokeLinecap="round" />
				{pa > 0.92 ? <polyline points={`${L - 6},4 ${L + 2},10 ${L - 6},16`} fill="none" stroke={ICE} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" opacity={smooth((pa - 0.92) / 0.08)} /> : null}
			</svg>,
		);
	}
	const p15 = smooth((tr - 52.1) / 0.5);
	out.push(
		<T key="t15" x={1548 + 10 * (1 - p15)} y={560} o={a * p15 * 0.68} align="left" size={30} color={ICE} font={FONT_EN} tracking="0.08em">
			{num(T1)}
		</T>,
	);
	// 金色「+1 °C」：53.6 浮出（中等亮度），57.1 第二句上屏时亮到最亮
	const p1 = smooth((tr - 53.6) / 0.6);
	const lit = smooth((tr - 57.1) / 0.35);
	if (p1 > 0) {
		const gr = lerp(8, 20, lit);
		out.push(
			<T
				key="d1"
				x={1504}
				y={510 - 6 * (1 - p1)}
				o={a * p1 * lerp(0.72, 1, lit)}
				size={32}
				color={GOLD}
				font={FONT_EN}
				tracking="0.06em"
				weight={500}
				scale={1 + 0.12 * lit}
				style={{textShadow: `0 0 ${gr}px rgba(240,210,140,${lerp(0.5, 0.9, lit)}), 0 0 ${2.4 * gr}px rgba(240,210,140,${lerp(0.25, 0.55, lit)})`}}
			>
				+{(T1 - T0).toFixed(0)} °C
			</T>,
		);
	}
	return <>{out}</>;
};

export const WorldText: React.FC<{t: number; tr: number; D: Data}> = ({t, tr, D}) => {
	const out: React.ReactNode[] = [];
	const add = (k: string, el: React.ReactNode) => out.push(<React.Fragment key={k}>{el}</React.Fragment>);
	// ---------- 01 冷 ----------
	{
		if (tr < 63) add('temp', <TempReadout t={t} tr={tr} />);
		add('cold1', <T x={420} y={812} {...lab(ICE)} o={win(t, 40.4, 43.4, 0.4, 0.5) * 0.8}>越亮越冷</T>);
		add('s60', <T x={1140} y={812} {...lab(ICE)} o={win(t, 43.6, 50.0, 0.3, 0.5) * 0.8}>60 秒</T>);
		add('p30a', <T x={1320} y={752} {...lab(ICE)} o={win(t, 50.9, 54.9, 0.4, 0.5) * 0.8}>+30 秒</T>);
		// 问号：58.2 淡入，呼吸（3 秒一周期）；68.25 缩成金点（金点 68.7 落地，和揭晓的 bell 同一拍，见 s1）
		if (t >= 58.2 && t < 68.45) {
			const a2 = smooth((t - 58.2) / 1.0);
			const br = 0.62 + 0.38 * Math.sin((2 * Math.PI * (t - 58.2)) / 3 - Math.PI / 2);
			const sh = prog(t, 68.25, 68.4);
			add(
				'q',
				<T x={1320} y={565} o={a2 * lerp(br, 1, sh) * (1 - sh)} size={110} color={GOLD} font={FONT_EN} tracking="0" glow="rgba(240,210,140,0.85)" scale={1 - 0.85 * sh}>
					?
				</T>,
			);
		}
		add('s90', <T x={1500} y={666} o={win(t, 68.9, 73.7, 0.4, 0.6) * 0.95} size={18} color={GOLD} glow="rgba(240,210,140,0.5)">90 秒</T>);
		add('p30b', <T x={1320} y={662} {...lab(ICE)} o={win(t, 74.8, 78.8, 0.4, 0.5) * 0.8}>+30 秒</T>);
	}
	// ---------- 02 峰 ----------
	{
		const a = win(t, 96.1, 101.1, 0.4, 0.6);
		add('feng', <T x={1140} y={538} o={a} size={20} color={GOLD} glow="rgba(240,210,140,0.55)">峰</T>);
		add('zhong', <T x={1500} y={538} o={a} size={20} color={GOLD} glow="rgba(240,210,140,0.55)">终</T>);
		const b = win(t, 103.4, 106.5, 0.4, 0.6) * 0.8;
		add('m60', <T x={760} y={540} {...lab(ICE)} o={b}>60 秒</T>);
		add('m90', <T x={1160} y={540} {...lab(ICE)} o={b}>90 秒</T>);
	}
	// ---------- 03 终 ----------
	{
		const a = win(t, 131.0, 137.0, 0.5, 0.6);
		const m3 = D.num.mem_2003;
		const num = (v: number) => (
			<span style={{fontFamily: FONT_EN, fontSize: 22, color: GOLD, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums', marginLeft: 10, textShadow: '0 0 12px rgba(240,210,140,0.5)'}}>{v.toFixed(1)}</span>
		);
		add('n49', <T x={932} y={405} o={a} align="left" color={ICE} tracking="0.16em">难受{num(m3.std.m)}</T>);
		add('n44', <T x={1130} y={665} o={a} align="left" color={ICE} tracking="0.16em">难受{num(m3.ext.m)}</T>);
		add('min20', <T x={960} y={820} {...lab(ICE)} o={win(t, 143.4, 149.4, 0.5, 0.6) * 0.8}>20 分钟</T>);
		const q = win(t, 157.0, 163.0, 0.9, 0.9);
		add(
			'quote',
			<T x={960} y={380} o={q * 0.9} size={30} font={FONT_EN_IT} italic tracking="0.01em" color="#eef0f0" weight={400} style={{textAlign: 'center', lineHeight: 1.45}}>
				We actually don&apos;t choose between experiences,
				<br />
				we choose between memories of experiences.
			</T>,
		);
		add('quoteBy', <T x={960} y={505} o={win(t, 157.6, 163.0, 0.9, 0.9) * 0.55} size={16} font={FONT_EN} tracking="0.32em">— DANIEL KAHNEMAN, 2010</T>);
	}
	// ---------- 04 生 ----------
	{
		add('y5', <T x={1430} y={532} o={win(t, 193.3, 197.5, 0.5, 0.6) * 0.6} size={16}>+5 年</T>);
	}
	// ---------- 05 我 ----------
	if (t >= 224.6 && t < 231.2) {
		const a = win(t, 224.8, 230.8, 0.5, 0.5);
		const [ix, iy] = D.melAt(selfTau(t));
		const [gx, gy] = goldSelfPos(D, t);
		add('live', <T x={ix} y={iy + 32} o={a * 0.85} size={18} color={ICE}>过日子</T>);
		add('tell', <T x={gx} y={gy - 34} o={a * 0.8} size={18} color="#c9ad6e">讲故事</T>);
	}
	// 诗两行
	if (t >= 237.9 && t < 244.8) {
		const fade = t < 243.85 ? 1 : t < 244.45 ? lerp(1, 0.3, prog(t, 243.85, 244.45)) : lerp(0.3, 0, prog(t, 244.5, 244.75, (x) => x));
		POEM.forEach((line, L) => {
			const chars = Array.from(line.text);
			add(
				`poem${L}`,
				<T x={960} y={L === 0 ? 400 : 480} o={fade} size={54} weight={340} tracking="0.3em" color="rgba(236,238,238,0.85)" style={{paddingLeft: '0.3em'}}>
					{chars.map((ch, i) => {
						const st = 238.0 + 0.09 * (i + 7 * L);
						const a = smooth((t - st) / 0.55);
						const hl = i >= line.hl[0] && i < line.hl[1];
						const hlA = smooth((t - 239.6 - 0.3 * L) / 0.8);
						return (
							<span
								key={i}
								style={{
									opacity: a,
									filter: a < 1 ? `blur(${(1 - a) * 5}px)` : undefined,
									color: hl ? line.hl[2] : undefined,
									textShadow: hl ? `0 0 ${12 * hlA}px ${line.hl[3]}, 0 0 ${34 * hlA}px ${line.hl[3]}` : undefined,
								}}
							>
								{ch}
							</span>
						);
					})}
				</T>,
			);
		});
		const b = win(t, 238.8, 243.9, 0.7, 0.5);
		add('poemBy', <T x={960} y={560} o={b * 0.55} size={16} tracking="0.3em">李商隐《锦瑟》</T>);
		const c = win(t, 239.3, 243.9, 0.8, 0.5);
		add(
			'poemEn',
			<T x={960} y={612} o={c * 0.6} size={15} font={FONT_EN_IT} italic tracking="0.02em" color={C.en} weight={400} style={{textAlign: 'center', lineHeight: 1.5}}>
				Must this feeling wait to become a memory?
				<br />
				Even then, in the moment, I was already adrift.
			</T>,
		);
	}
	// ---------- 06 今天 ----------
	{
		add('film', <T x={180} y={350} o={win(t, 245.5, 255.0, 0.6, 0.8) * 0.6} align="left" size={16}>本片<span style={{fontFamily: FONT_EN, fontSize: 12, letterSpacing: '0.34em', color: C.dim, marginLeft: 12}}>THIS FILM</span></T>);
		const fc = D.num.film_curve;
		const a = win(t, 261.45, 268.9, 0.4, 0.7);
		// 审片修改：标签只留金色「峰」「终」两个字，时间戳去掉（靠字幕讲）
		add('fpk', <T x={D.fx(fc.peak.t)} y={D.fy(fc.peak.F) - 52} o={a} size={20} color={GOLD} glow="rgba(240,210,140,0.5)">峰</T>);
		add('fend', <T x={D.fx(fc.end.t)} y={D.fy(fc.end.F) - 52} o={a} size={20} color={GOLD} glow="rgba(240,210,140,0.5)">终</T>);
		add('today', <T x={300} y={520} o={win(t, 274.0, 277.9, 0.5, 0.6) * 0.6} size={16}>今天<span style={{fontFamily: FONT_EN, fontSize: 12, letterSpacing: '0.34em', color: C.dim, marginLeft: 12}}>TODAY</span></T>);
	}
	// ---------- 片名卡的小字 ----------
	{
		const fo = 1 - smooth((t - 36.9) / 1.0);
		const sub = smooth((t - 33.9) / 0.9) * fo * (t < 38 ? 1 : 0);
		const trk = lerp(0.62, 0.42, smooth((t - 33.9) / 1.6));
		add('tsub', <T x={960} y={612} o={sub} size={30} weight={400} color={GOLD} tracking={`${trk}em`} style={{paddingLeft: `${trk}em`}} glow="rgba(240,210,140,0.25)">峰终定律 · 卡尼曼 · 1993</T>);
		add('ten', <T x={960} y={658} o={smooth((t - 34.5) / 0.9) * fo * (t < 38 ? 1 : 0) * 0.75} size={14} font={FONT_EN} tracking="0.5em" color={C.dim} style={{paddingLeft: '0.5em'}}>THE PEAK–END RULE</T>);
		// 片尾：只放极小英文，再由笔尖化成的光标打出身份标记。
		// 2026-10-12 用户反馈：不要「由 Claude 用代码生成」那一长句，只留极小的「Opus 5.5」
		add('ten2', <T x={960} y={548} o={smooth((t - 280.8) / 0.9) * 0.75} size={14} font={FONT_EN} tracking="0.5em" color={C.dim} style={{paddingLeft: '0.5em'}}>THE PEAK–END RULE</T>);
		if (t >= 281.3) {
			const text = 'Opus 5.5';
			const chars = Array.from(text);
			const n = Math.max(0, Math.min(chars.length, Math.floor((t - 281.5) * (chars.length / 0.9))));
			const br = 0.55 + 0.45 * Math.sin((t - 281.3) * 3.2);
			add(
				'sign',
				<div style={{position: 'absolute', left: 0, right: 0, top: 606, textAlign: 'center', fontFamily: FONT_EN, fontWeight: 400, fontSize: 16, color: '#9aa3ad', letterSpacing: '0.3em', whiteSpace: 'nowrap', opacity: smooth((t - 281.3) / 0.3)}}>
					{chars.slice(0, n).join('')}
					<span style={{display: 'inline-block', width: 3, height: 20, marginLeft: 4, marginRight: -7, verticalAlign: '-0.15em', background: ICE, opacity: br, boxShadow: `0 0 10px ${ICE}, 0 0 22px ${ICE}`}} />
					<span style={{visibility: 'hidden'}}>{chars.slice(n).join('')}</span>
				</div>,
			);
		}
	}
	return <>{out}</>;
};

export const ScreenText: React.FC<{t: number; D: Data; cam: Cam}> = ({t, D, cam}) => {
	const out: React.ReactNode[] = [];
	const add = (k: string, el: React.ReactNode) => out.push(<React.Fragment key={k}>{el}</React.Fragment>);
	// 右下角「示意」
	const shiyi = Math.max(win(t, 40.2, 86.7, 0.5, 0.6), win(t, 88.7, 121.7, 0.5, 0.6), win(t, 137.0, 142.2, 0.4, 0.5), win(t, 193.3, 203.6, 0.5, 0.6));
	add('shiyi', <T x={1760} y={850} o={shiyi * 0.7} align="right" size={14} color={C.dim} tracking="0.3em">示意</T>);
	add('orig', <T x={1760} y={850} o={win(t, 131.0, 137.0, 0.5, 0.5) * 0.75} align="right" size={14} color={C.dim} tracking="0.25em"><span style={{fontFamily: FONT_EN}}>0–10</span> · 论文原值</T>);
	// 顶部：证物、人名年份
	const top = (k: string, a: number, text: string, y = 150, color = C.text) =>
		add(k, <T x={960} y={y} o={a * 0.55} size={16} font={FONT_EN} tracking="0.35em" color={color} style={{paddingLeft: '0.35em'}}>{text}</T>);
	const paper = win(t, 81.0, 85.4, 0.7, 0.7);
	top('paper', paper, 'PSYCHOLOGICAL SCIENCE · 1993');
	add('paperT', <T x={960} y={190} o={paper * 0.8} size={26} font={FONT_EN_IT} italic tracking="0.01em" weight={400} color="#e6e8e8">When More Pain Is Preferred to Less</T>);
	top('y96', win(t, 108.8, 114.5, 0.6, 0.7), '1996 · REDELMEIER & KAHNEMAN');
	// 审片修改：落下的病人点约 124.5 s 才全部穿过顶部，人名小字等它们落过之后再淡入
	top('y03', win(t, 124.6, 129.4, 0.6, 0.7), '2003 · REDELMEIER, KATZ & KAHNEMAN');
	top('y01', win(t, 177.0, 182.5, 0.6, 0.7), '2001 · DIENER, WIRTZ & OISHI');
	add(
		'rule',
		<T x={960} y={180} o={win(t, 231.9, 236.9, 0.7, 0.8) * 0.75} size={16} color="#c9ad6e" tracking="0.35em" style={{paddingLeft: '0.35em'}}>
			峰终定律 · <span style={{fontFamily: FONT_EN}}>PEAK–END RULE</span>
		</T>,
	);
	// 04 生：28 835（由 numbers.json 的天数排版），171.3–172.0 缩到右下角
	{
		const days = D.num.life.days;
		const a = win(t, 168.8, 172.1, 0.6, 0.25);
		const sh = smooth(prog(t, 171.3, 172.0, (x) => x));
		const [cx, cy] = toScreen(cam, 960, 470);
		const x = lerp(cx, 1700, sh);
		const y = lerp(cy, 850, sh);
		add(
			'days',
			<T x={x} y={y} o={a} size={lerp(110, 16, sh)} font={FONT_EN} tracking="0.04em" color="#f3e3b8" glow="rgba(255,220,150,0.35)" weight={400}>
				{thin(days)}
			</T>,
		);
		add('daysNote', <T x={cx} y={cy + 86} o={win(t, 169.2, 171.4, 0.6, 0.4) * 0.6} size={16} tracking="0.3em" color={C.text}>{D.num.life.years} 年 × 365 天 · 示意</T>);
		add('daysSmall', <T x={1760} y={850} o={win(t, 171.8, 176.5, 0.3, 0.6) * 0.7} align="right" size={14} color={C.dim} tracking="0.25em"><span style={{fontFamily: FONT_EN}}>{thin(days)}</span> 天 · 示意</T>);
	}
	return <>{out}</>;
};
