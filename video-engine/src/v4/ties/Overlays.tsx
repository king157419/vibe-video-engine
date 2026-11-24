/** 贴在画面上的小字（DOM）。每个都有出现和收走的时间，没有常驻。位置跟着各场景的镜头算。 */
import React from 'react';
import {C, FONT_EN, FONT_ZH, Label} from '../kit';
import {clamp} from '../kit/util';
import {FACTS} from './data.gen';
import {AMBER, P} from './draw';
import {KEPT_PCT, PATH, THEM, YOU, type XY} from './model';
import {fbLabelAt, FB_DEGREES} from './scenes/avatars';
import {BOSTON, mapScreen, OMAHA} from './scenes/s1967';
import {ORBIT_R, tieLabelAt, view73} from './scenes/s1973';
import {arcEndAt, peakLabelAt, rowEndsAt} from './scenes/s2022';
import {A, RAW, real, vis} from './time';
import {CLAUDE_STAR, rippleL, worldScreen, worldView} from './world';
import {DISC} from './model';

const H1 = A.hops1 as unknown as number[];
const H2 = A.hops2 as unknown as number[];

/** 只有英文的宽字距小标签 */
const Tag: React.FC<{x: number; y: number; text: string; a: number; size?: number; color?: string; align?: 'left' | 'center' | 'right'; track?: string}> = ({
	x,
	y,
	text,
	a,
	size = 14,
	color = '#7d879a',
	align = 'center',
	track = '0.36em',
}) => {
	if (a <= 0.001) return null;
	const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(${tx}, -50%)`,
				opacity: a,
				fontFamily: FONT_EN,
				fontSize: size,
				color,
				letterSpacing: track,
				paddingLeft: align === 'center' ? track : 0,
				whiteSpace: 'nowrap',
			}}
		>
			{text}
		</div>
	);
};
/** 中文小字（宽字距、暗） */
const ZhTag: React.FC<{x: number; y: number; text: string; a: number; size?: number; color?: string; align?: 'left' | 'center' | 'right'}> = ({x, y, text, a, size = 19, color = C.text, align = 'center'}) => {
	if (a <= 0.001) return null;
	const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `translate(${tx}, -50%)`, opacity: a, fontFamily: FONT_ZH, fontWeight: 380, fontSize: size, color, letterSpacing: '0.16em', whiteSpace: 'nowrap'}}>
			{text}
		</div>
	);
};
/** 序号（审片：原来 18 px、亮度 0.6，手机上不到 1 mm → 28 px、亮度 0.9） */
const Num: React.FC<{p: XY; n: string; a: number; size?: number}> = ({p, n, a, size = 28}) =>
	a <= 0.001 ? null : (
		<div style={{position: 'absolute', left: p[0], top: p[1], transform: 'translate(-50%, -50%)', opacity: 0.9 * a, fontFamily: FONT_EN, fontSize: size, color: '#f3c27a', textShadow: `0 0 12px ${AMBER}, 0 0 3px rgba(0,0,0,0.9)`}}>{n}</div>
	);
/** 开头四个中间人的序号：错开摆，「1」「2」不挤在一起，也不压在线上（下、上、上、下） */
const NUM_OFF: XY[] = [
	[-4, 34],
	[6, -36],
	[-6, -36],
	[4, 34],
];
/** 星盘上那条路的序号：沿圆的外法线挪出去（序号不压在圆和路上） */
const discNum = (t: number, i: number, k: number): XY => {
	const p = worldScreen(t, i);
	const c = worldScreen(t, -1);
	const dx = p[0] - c[0];
	const dy = p[1] - c[1];
	const L = Math.hypot(dx, dy) || 1;
	const out = 38 + (k % 2) * 10;
	return [p[0] + (dx / L) * out, p[1] + (dy / L) * out];
};

/** 片名卡的两行小字：金色「学名 · 人名 · 年份」+ 极小英文学名 */
export const TitleLines: React.FC<{t: number; sub: number; en: number; out: [number, number]; subOut?: [number, number]}> = ({t, sub, en, out, subOut}) => {
	const o = 1 - clamp((t - out[0]) / (out[1] - out[0]));
	// 片尾：金色小字在署名出现前收走，保证同屏汉字 ≤ 20
	const so = subOut ? 1 - clamp((t - subOut[0]) / (subOut[1] - subOut[0])) : 1;
	const s = clamp((t - sub) / 0.9);
	const e = clamp((t - en) / 0.9);
	if (o <= 0 || s <= 0) return null;
	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 506,
					textAlign: 'center',
					opacity: s * s * (3 - 2 * s) * o * so,
					fontFamily: FONT_ZH,
					fontWeight: 400,
					fontSize: 31,
					color: C.gold,
					letterSpacing: `${0.6 - 0.12 * s}em`,
					paddingLeft: `${0.6 - 0.12 * s}em`,
					textShadow: '0 0 18px rgba(240,200,120,0.25)',
				}}
			>
				弱关系的力量 · 格兰诺维特 · 1973
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 560,
					textAlign: 'center',
					opacity: e * e * (3 - 2 * e) * o * 0.9,
					fontFamily: FONT_EN,
					fontSize: 14,
					color: C.dim,
					letterSpacing: '0.5em',
					paddingLeft: '0.5em',
				}}
			>
				THE STRENGTH OF WEAK TIES
			</div>
		</>
	);
};

export const Overlays: React.FC<{t: number}> = ({t}) => {
	const els: React.ReactNode[] = [];
	const add = (k: string, el: React.ReactNode) => els.push(<React.Fragment key={k}>{el}</React.Fragment>);
	// ---------- 开头
	if (t < 42.3) {
		const y = worldScreen(t, YOU);
		const s = worldScreen(t, THEM);
		const z = Math.sqrt(worldView(t).s);
		add('you', <Label x={y[0] - 26 * z} y={y[1] + 46 * z} zh="你" en="you" align="right" size={Math.round(20 + 6 * (z - 1))} opacity={0.85 * vis(t, 2.4, 13.0, 0.5, 0.4)} />);
		add('them', <Label x={s[0] + 24} y={s[1] - 34} zh="陌生人" en="a stranger" align="left" size={20} opacity={0.85 * vis(t, 7.3, 13.0, 0.5, 0.4)} />);
		[1, 2, 3, 4].forEach((n) => {
			const p = worldScreen(t, PATH[n]);
			const o = NUM_OFF[n - 1];
			add(`n${n}`, <Num p={[p[0] + o[0] * z, p[1] + o[1] * z]} n={String(n)} a={vis(t, H1[n - 1], 29.7, 0.25, 0.6)} />);
		});
	}
	if (t > 36 && t < 42) add('tl1', <TitleLines t={t} sub={A.title1.sub_in} en={A.title1.en_in} out={A.title1.out as unknown as [number, number]} />);
	// ---------- 1929
	add('lanc', <Label x={600} y={170} zh="《链环》" en="láncszemek" size={20} opacity={0.8 * vis(t, 43.8, 50.0, 0.8, 0.8)} />);
	// ---------- 1967
	if (t > 62.5 && t < 91) {
		const o = mapScreen(t, OMAHA);
		const b = mapScreen(t, BOSTON);
		// 审片：两个地名挂了 22 秒 → OMAHA 只在 63–70；BOSTON 在 70.2 收信人亮起时淡出，到达后由「64 / 296」接替
		add('om', <Tag x={o[0] + 16} y={o[1] + 34} text="OMAHA" a={0.75 * vis(t, 63.0, 70.0, 0.6, 0.6)} size={13} align="left" />);
		add('bo', <Tag x={b[0] + 4} y={b[1] - 30} text="BOSTON" a={0.75 * vis(t, 63.0, 70.9, 0.6, 0.7)} size={13} />);
		add('sm', <Tag x={960} y={116} text="STANLEY MILGRAM" a={0.8 * vis(t, 63.5, 69.4, 0.8, 0.8)} size={15} />);
		const ra = vis(t, 85.6, 87.8, 0.4, 0.6);
		if (ra > 0)
			add(
				'64',
				<div style={{position: 'absolute', left: b[0] + 38, top: b[1] + 6, transform: 'translate(0, -50%)', opacity: ra}}>
					<div style={{fontFamily: FONT_EN, fontSize: 40, color: '#f3e9d2', letterSpacing: '0.04em', textShadow: '0 0 24px rgba(234,166,74,0.45)'}}>
						{FACTS.milgram.arrived} <span style={{color: C.dim, fontSize: 30}}>/</span> {FACTS.milgram.starters}
					</div>
					<div style={{fontFamily: FONT_EN, fontSize: 12, color: C.dim, letterSpacing: '0.34em', marginTop: 4}}>SOCIOMETRY · 1969</div>
				</div>,
			);
		const sd = vis(t, 88.2, 90.6, 0.6, 0.5);
		if (sd > 0)
			add(
				'six',
				<div style={{position: 'absolute', left: 0, right: 0, top: 104, textAlign: 'center', opacity: sd}}>
					<span style={{fontFamily: FONT_ZH, fontWeight: 380, fontSize: 22, color: C.text, letterSpacing: '0.3em'}}>六度分隔</span>
					<span style={{fontFamily: FONT_EN, fontSize: 13, color: C.dim, letterSpacing: '0.36em', marginLeft: 18}}>· SIX DEGREES</span>
				</div>,
			);
	}
	// ---------- 1973
	add('mg', <Tag x={960} y={116} text="MARK GRANOVETTER · NEWTON, MASSACHUSETTS" a={0.8 * vis(t, 113.3, 119.8, 0.8, 0.8)} size={15} />);
	if (t > 123 && t < 127) {
		const p = P(view73(t), [960 + ORBIT_R[2] + 26, 450]);
		add('yr', <ZhTag x={p[0]} y={p[1]} text="一年 ≤ 1 次" a={0.85 * vis(t, 123.2, 126.4, 0.4, 0.6)} align="left" color={AMBER} />);
	}
	if (t > 139.5 && t < 144.6) {
		// 审片：线从「系」和「WEAK」中间穿过 → 挪到弧的凹侧，离线约 40 px
		const m = tieLabelAt(t);
		add('wt', <Label x={m[0]} y={m[1]} zh="弱关系" en="weak tie" align="center" size={20} color={'#f1d7a8'} opacity={0.9 * vis(t, 139.7, 144.4, 0.4, 0.6)} />);
	}
	// ---------- 1998
	add('ws', <Tag x={960} y={70} text="DUNCAN WATTS · STEVEN STROGATZ" a={0.8 * vis(t, 147.0, 153.5, 0.8, 0.8)} size={15} />);
	add('nat', <Tag x={1400} y={150} text="NATURE · 1998" a={0.7 * vis(t, 148.0, 153.5, 0.8, 0.8)} size={12} align="left" />);
	if (t > 154.6 && t < 159.2) {
		const y = worldScreen(t, YOU);
		const s = worldScreen(t, THEM);
		const a = 0.85 * vis(t, 154.8, 158.8, 0.5, 0.5);
		add('you2', <ZhTag x={y[0] - 26} y={y[1] + 30} text="你" a={a} align="right" />);
		add('them2', <ZhTag x={s[0] + 26} y={s[1] - 28} text="陌生人" a={a} align="left" />);
	}
	if (t > 160.9 && t < 167.0) {
		// 审片：计数跟着弧尖跑，像加载进度圈 → 路上只留一个更小、更暗的数，会合处才亮出「100」
		const L = rippleL(t);
		const n = Math.max(1, Math.min(100, Math.floor(L)));
		const idx = Math.min(1000, Math.round(10 * Math.min(L, 100)));
		const v = worldView(t);
		const p = DISC[idx];
		const out: XY = [960 + (p[0] - 960) * 1.12, 470 + (p[1] - 470) * 1.12];
		const sp = P(v, out);
		const done = t >= A.crawl.fast_end;
		if (!done) add('cnt', <Tag x={sp[0]} y={sp[1]} text={String(n)} a={0.5 * vis(t, 160.9, 166.1, 0.3, 0.3)} size={14} color={AMBER} track="0.04em" />);
		else add('cnt100', <Num p={[sp[0], sp[1] - 6]} n="100" size={30} a={vis(t, A.crawl.fast_end, 166.9, 0.15, 0.5)} />);
	}
	// 一百步塌成五步：路上四个中间人的序号（和 0:21 同一套）
	if (t > 173.4 && t < 178.6) {
		[1, 2, 3, 4].forEach((n) => add(`h${n}`, <Num p={discNum(t, PATH[n], n)} n={String(n)} size={26} a={vis(t, H2[n - 1], 178.4, 0.15, 0.4)} />));
	}
	add('kept', <ZhTag x={960} y={866} text={`圈子 · ${KEPT_PCT}% 没变`} a={0.85 * vis(t, 183.0, 186.6, 0.6, 0.6)} size={20} />);
	if (t > 188 && t < 193.2) {
		const z = Math.sqrt(worldView(t).s);
		[1, 2, 3, 4].forEach((n) => {
			const p = worldScreen(t, PATH[n]);
			const o = NUM_OFF[n - 1];
			add(`m${n}`, <Num p={[p[0] + o[0] * z, p[1] + o[1] * z]} n={String(n)} a={vis(t, 188.4, 192.8, 0.5, 0.6)} />);
		});
	}
	// ---------- 化身
	add('ce', <Tag x={960} y={572} text="C. ELEGANS" a={0.8 * vis(t, 201.5, 203.4, 0.5, 0.5)} />);
	add('pg', <Tag x={960} y={758} text="WESTERN U.S. POWER GRID" a={0.8 * vis(t, 204.6, 206.7, 0.5, 0.5)} />);
	add('fa', <Tag x={960} y={742} text="FILM ACTORS" a={0.8 * vis(t, 207.6, 210.4, 0.5, 0.5)} />);
	add('sy1', <ZhTag x={1836} y={926} text="示意" a={0.5 * vis(t, 200.3, 210.6, 0.6, 0.6)} size={15} color={C.dim} />);
	if (t > 214 && t < 218.4) {
		const p = fbLabelAt(t);
		add('fb', <ZhTag x={p[0]} y={p[1]} text={`平均 ${FB_DEGREES} 人`} a={0.9 * vis(t, 214.4, 218.0, 0.5, 0.6)} color={'#f1d7a8'} />);
	}
	// ---------- 2022
	if (t > 227.5 && t < 233.6) {
		// 收走的时刻改按真实时间（和「生」「熟」一起收；峰顶之后故事时间放慢）
		const endR = RAW.k2022.hold_end - 0.4;
		const tr0 = real(t);
		const p = peakLabelAt(t);
		add('pk', <ZhTag x={p[0]} y={p[1]} text="约 10 个共同好友" a={0.92 * Math.min(vis(t, 230.3, 240, 0.4, 0), vis(tr0, 0, endR, 0, 0.6))} size={22} color={'#f1d7a8'} />);
		const e = arcEndAt(t);
		add('sy2', <ZhTag x={e[0]} y={e[1]} text="示意" a={0.5 * Math.min(vis(t, 227.8, 240, 0.6, 0), vis(tr0, 0, endR, 0, 0.6))} size={15} color={C.dim} align="left" />);
		// 用户反馈（2026-10-12）：S32b「不算熟，也不算生。」——一排两端出「生」「熟」，峰下那个人夹在中间、偏「生」那一侧。
		// 按真实时间出（和字幕同一个钟），和最右、最左那两根线亮一下同时
		const tr = real(t);
		const K = RAW.k2022;
		const [l, r] = rowEndsAt(t);
		add('shu', <ZhTag x={r[0]} y={r[1]} text="熟" a={0.85 * vis(tr, K.shu - 0.05, K.hold_end - 0.4, 0.35, 0.6)} size={26} color={'#d4dbe6'} />);
		add('sheng', <ZhTag x={l[0]} y={l[1]} text="生" a={0.85 * vis(tr, K.sheng - 0.05, K.hold_end - 0.4, 0.35, 0.6)} size={26} color={'#d4dbe6'} />);
	}
	// ---------- 结尾
	if (t > 264.5 && t < 269) {
		const p = worldScreen(t, CLAUDE_STAR);
		add('cl', <Tag x={p[0]} y={p[1] - 30} text="CLAUDE" a={0.8 * vis(t, 264.7, 268.7, 0.5, 0.8)} size={13} color={'#aab4c4'} />);
	}
	if (t > 272.5 && t < 274.8) {
		const s = worldScreen(t, THEM);
		add('them3', <Label x={s[0] + 24} y={s[1] - 34} zh="陌生人" en="a stranger" align="left" size={20} opacity={0.85 * vis(t, 272.7, 274.5, 0.5, 0.5)} />);
	}
	// 审片：金色小字先收走后英文孤零零地留着 → 片名卡四层（星座、真字、金色小字、英文）一起留到 card_out 再一起淡出，署名之后单独出现
	if (t > 277) add('tl2', <TitleLines t={t} sub={A.title2.sub_in} en={A.title2.en_in} out={A.title2.card_out as unknown as [number, number]} />);
	return <>{els}</>;
};
