import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, Camera, ChapterLabel, EndMark, ensureV4Fonts, FONT_EN, FONT_ZH, GlowCanvas, Label, ParticleText, Readout, Subtitles, TitleCard, clamp, easeInOut, easeOut, lerp, prog, titleCenterY, win} from '../kit';
import {DUR, EV, SUBS, T, TYPE} from './data.gen';
import {AX, GOLD, ICE, PRO, ROSE, STAR_LABELS, axisXY, drawAll, starXY} from './draw';
import {FONT_SANS, FONT_TW, ensureHieloFonts} from './fonts';
import {TypeLatin, TypeZh} from './type';

const CHAPTERS = [
	{t: T.jump3 + 0.2, num: '01', zh: '三个时间', en: 'three times'},
	{t: T.bomb1, num: '02', zh: '桌下的炸弹', en: 'the bomb under the table'},
	{t: T.whyice, num: '03', zh: '为什么是冰', en: 'why ice'},
	{t: T.bogota, num: '04', zh: '第一句会传染', en: 'first lines are contagious'},
	{t: T.wall, num: '05', zh: '那个下午', en: 'that afternoon'},
];

/** 插图：黑底用 screen 叠到暗场上；遮罩是一团慢慢张开的光（像拿灯照过去） */
const Reveal: React.FC<{src: string; a: number; cx: number; cy: number; r: number; zoom?: number; ox?: number; oy?: number}> = ({src, a, cx, cy, r, zoom = 1, ox = 0, oy = 0}) => {
	if (a <= 0.001) return null;
	const m = `radial-gradient(circle at ${cx}% ${cy}%, rgba(0,0,0,1) ${Math.max(0, r - 260)}px, rgba(0,0,0,0) ${r}px)`;
	return (
		<AbsoluteFill style={{opacity: a, mixBlendMode: 'screen', WebkitMaskImage: m, maskImage: m}}>
			<Img
				src={staticFile(src)}
				style={{width: 1920, height: 1080, objectFit: 'cover', transform: `translate(${ox}px, ${oy}px) scale(${zoom})`, transformOrigin: `${cx}% ${cy}%`, filter: 'brightness(0.92) contrast(1.05)'}}
			/>
		</AbsoluteFill>
	);
};

const Small: React.FC<{x: number; y: number; zh: string; en?: string; color?: string; a: number; size?: number}> = ({x, y, zh, en, color = '#cfc6b3', a, size = 22}) => (
	<Label x={x} y={y} zh={zh} en={en} color={color} opacity={a} size={size} />
);

export const Video: React.FC = () => {
	ensureV4Fonts();
	ensureHieloFonts();
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;

	// 章节之间压暗；硬静音那几秒也压暗（只剩尘埃在飘）
	const gaps: [number, number][] = [[T.ch2, T.ch2_end], [T.ch3, T.ch3_end], [T.ch4, T.ch4_end], [T.ch5, T.ch5_end]];
	const gapDim = Math.max(0, ...gaps.map(([a, b]) => win(t, a - 0.4, b + 0.3, 0.5, 0.5)));
	const drift = 1 + 0.012 * Math.sin(t * 0.09) + 0.004 * t / 60;

	// ---------- 序 ----------
	const proA = 1 - prog(t, T.title - 0.6, T.title + 0.6, easeInOut);
	const hlPro = (li: number, ci: number) => {
		const k1 = prog(t, TYPE.proZh.t1 + 0.4, TYPE.proZh.t1 + 1.0);
		const k2 = prog(t, TYPE.proZh.t1 + 0.9, TYPE.proZh.t1 + 1.5);
		const k3 = prog(t, TYPE.proZh.t1 + 1.4, TYPE.proZh.t1 + 2.0);
		if (li === 0 && ci <= 3 && k1 > 0) return {color: GOLD, k: k1 * 0.6};
		if (li === 0 && ci >= 7 && ci <= 9 && k2 > 0) return {color: ROSE, k: k2 * 0.6};
		if (li === 2 && (ci === 7 || ci === 8) && k3 > 0) return {color: ICE, k: k3 * 0.6};
		return null;
	};
	// 片名：粒子聚成「多年以后」，再交给 TitleCard
	const TY = 400;
	const TS = 96;
	const pP = prog(t, T.title + 0.2, EV.titleHit, easeOut);
	const pCard = prog(t, EV.titleHit - 0.2, EV.titleHit + 1.0, easeOut);
	const outCard = prog(t, T.title_end - 0.9, T.title_end);

	// ---------- 一 ----------
	const ch1 = win(t, T.jump3 - 0.2, T.ch2 + 0.1, 0.6, 0.9);
	const lbN = axisXY(t, AX.N), lbF = axisXY(t, AX.F), lbP = axisXY(t, AX.P);
	const lblA = ch1 * win(t, T.jump3 + 0.6, T.verb + 0.2, 0.6, 0.6);
	const camA = win(t, T.camus + 0.2, T.verb, 0.6, 0.6);
	const numA = win(t, EV.three - 0.1, T.verb, 0.4, 0.6);
	const verbA = win(t, T.verb + 0.1, T.ch2 + 0.1, 0.6, 0.8);
	const prolA = win(t, T.prolep + 0.6, T.ch2 + 0.1, 0.8, 0.8);

	// ---------- 二 ----------
	const r15s = win(t, EV.flash15s + 0.2, T.placed + 0.2, 0.4, 0.6);
	const r15m = win(t, EV.ding15m, T.placed + 0.2, 0.3, 0.6);
	const chapN = Math.min(7, 1 + Math.floor(prog(t, T.ch7 + 0.2, EV.page7, (x) => x) * 6.999));
	const chapA = win(t, T.ch7 + 0.1, EV.page7 + 0.8, 0.4, 0.6);
	const squadA = win(t, EV.page7 - 0.1, EV.hush, 0.5, 0.12);
	const squadR = lerp(200, 2400, prog(t, EV.page7 - 0.1, EV.page7 + 2.4, easeOut));
	const sq2A = win(t, T.wall - 0.2, T.memoir + 0.8, 1.0, 1.0);
	const sq2R = lerp(220, 900, prog(t, T.wall, T.wall + 2.5, easeOut));

	// ---------- 三 ----------
	const iceA = win(t, EV.iceReveal - 0.1, T.true1 + 0.2, 0.4, 0.9);
	const iceR = lerp(120, 2200, prog(t, EV.iceReveal - 0.1, EV.iceReveal + 2.6, easeOut));
	const gmA = win(t, EV.grandmaReveal - 0.1, T.click + 0.1, 0.4, 0.4);
	const gmR = lerp(90, 1900, prog(t, EV.grandmaReveal - 0.1, EV.grandmaReveal + 2.6, easeOut));
	const clickA = win(t, EV.clickIn, T.deadpan + 0.4, 0.05, 0.5);
	const shake = clickA > 0 && t < T.deadpan - 0.2 ? Math.sin(t * 61) * 5 : 0;
	const crumble = prog(t, T.deadpan - 0.3, T.deadpan + 0.5, easeInOut);
	const dpA = win(t, T.deadpan + 0.1, T.ch4 + 0.2, 0.4, 0.8);

	// ---------- 四 ----------
	const kfA = win(t, T.bogota + 0.8, T.twenty - 0.2, 0.4, 0.8);
	const yrA = win(t, T.twenty - 0.2, EV.spectacle + 0.3, 0.6, 0.4);
	const soldA = win(t, EV.spectacle + 0.2, T.pattern + 0.6, 0.4, 0.8);
	const patA = win(t, T.pattern + 0.4, T.memes + 0.2, 0.4, 0.4);
	const memeA = win(t, T.memes, T.ch5 + 0.2, 0.2, 0.8);

	// ---------- 五 ----------
	const qA = win(t, T.quote, T.yours - 0.1, 0.4, 0.8);
	const blA = win(t, T.blank, DUR - 0.3, 0.3, 1.2);
	const memoirA = win(t, T.memoir + 0.4, T.yours - 0.1, 0.6, 0.8);

	return (
		<AbsoluteFill style={{background: "#0f0b08"}}>
			<Backdrop tint="#0f0b08" glowColor="#4a3218" glow={0.16} dust={300} dim={gapDim * 0.5} />
			<Camera scale={drift}>
				{/* 插图层（在光的下面） */}
				<Reveal src="v4/hielo/img/squad.png" a={squadA} cx={22} cy={30} r={squadR} zoom={1 + 0.03 * prog(t, EV.page7, EV.hush)} />
				<Reveal src="v4/hielo/img/squad.png" a={sq2A * 0.85} cx={18} cy={36} r={sq2R} zoom={1.12} ox={260} oy={40} />
				<Reveal src="v4/hielo/img/ice.png" a={iceA} cx={58} cy={42} r={iceR} zoom={1 + 0.04 * prog(t, EV.iceReveal, T.true1)} />
				<Reveal src="v4/hielo/img/grandma.png" a={gmA} cx={55} cy={27} r={gmR} zoom={1 + 0.04 * prog(t, EV.grandmaReveal, T.click)} />
				<GlowCanvas draw={drawAll} />

				{/* 序：原文打字 */}
				<TypeLatin tw={TYPE.proEs} t={t} size={27} y0={250} lineH={44} family={FONT_TW} opacity={proA * 0.9} />
				<TypeZh tw={TYPE.proZh} t={t} size={PRO.size} y0={PRO.y0} lineH={PRO.lineH} opacity={proA} hl={hlPro} cursor={t < TYPE.proZh.t1 + 3 ? GOLD : null} />
				<ParticleText text="多年以后" p={pP} cy={titleCenterY(TY, TS)} size={TS} tracking={0.48} opacity={(1 - clamp(pCard * 1.3)) * (1 - outCard)} color="#fff1d0" />
				<TitleCard title="多年以后" sub="预叙 · 马尔克斯 · 1967" en="prolepsis · garcía márquez · 1967" p={pCard} out={outCard} y={TY} size={TS} titleOpacity={clamp(pCard * 1.3)} />

				{/* 一：时间轴上的标签 */}
				<Small x={lbN[0]} y={lbN[1] + 62} zh="现在" en="now" color={GOLD} a={lblA} />
				<Small x={lbF[0]} y={lbF[1] + 62} zh="多年以后 · 行刑队" en="years later" color={ROSE} a={lblA * win(t, EV.landF - 0.2, 1e9, 0.4, 0)} />
				<Small x={lbP[0]} y={lbP[1] + 62} zh="那个遥远的下午" en="that afternoon" color={ICE} a={lblA * win(t, EV.landP - 0.2, 1e9, 0.4, 0)} />
				<TypeLatin tw={TYPE.camusFr} t={t} size={24} y0={300} lineH={40} family={FONT_TW} opacity={camA} center={false} x={232} />
				<div style={{position: 'absolute', left: 230, top: 352, opacity: camA, fontFamily: FONT_ZH, fontWeight: 380, fontSize: 38, color: '#ece4d2', letterSpacing: '0.1em', textShadow: '0 0 18px rgba(255,226,170,0.25)'}}>
					{Array.from('今天，妈妈死了。').slice(0, Math.max(0, Math.floor((t - TYPE.camusZh.t0) * TYPE.camusZh.cps))).join('')}
				</div>
				<Small x={465} y={540} zh="加缪《局外人》" en="camus · the stranger" a={camA * 0.85} size={18} />
				<Readout x={465} y={680} value="1" size={96} opacity={numA} color="#f4ead2" />
				<Readout x={1360} y={680} value="3" size={96} opacity={numA} color="#f4ead2" />
				{verbA > 0 ? (
					<div style={{position: 'absolute', left: 0, right: 0, top: 268, textAlign: 'center', opacity: verbA, fontFamily: FONT_ZH, fontWeight: 400, fontSize: 64, letterSpacing: '0.16em', textShadow: '0 0 26px rgba(255,226,170,0.3)'}}>
						<span style={{color: GOLD}}>将会</span>
						<span style={{color: ICE}}>回想起</span>
					</div>
				) : null}
				<TypeLatin tw={TYPE.verbEs} t={t} size={28} y0={364} lineH={40} family={FONT_TW} opacity={verbA * 0.9} />
				<Small x={1420} y={505} zh="预叙" en="prolepsis" color={GOLD} a={prolA} size={30} />

				{/* 二：数字对比、章节计数 */}
				<Readout x={480} y={330} value="15 秒" note="惊吓 · surprise" size={70} opacity={r15s} color="#e9dcc0" />
				<Readout x={1440} y={330} value="15 分钟" note="悬念 · suspense" size={118} opacity={r15m} color={GOLD} />
				<Small x={760} y={420} zh="第 1 页" en="page one" a={win(t, T.placed + 1.4, T.ch7 + 0.3, 0.5, 0.4)} size={18} />
				<Readout x={960} y={300} value={`第 ${chapN} 章`} note="chapter" size={58} opacity={chapA} color="#e9dcc0" />

				{/* 三：一件真的事、标题党 */}
				{STAR_LABELS.map(([i, zh, en]) => {
					const p = starXY(i);
					return <Small key={i} x={p[0]} y={p[1] + 34} zh={zh} en={en} a={win(t, T.true1 + 0.6, EV.grandmaReveal + 0.3, 0.5, 0.6) * 0.85} size={17} />;
				})}
				<Small x={960} y={484} zh="冰 · 真的" en="ice · true" color={ICE} a={win(t, EV.trueIgnite - 0.2, EV.grandmaReveal + 0.3, 0.4, 0.6)} size={19} />
				{clickA > 0 && crumble < 1 ? (
					<div style={{position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center', opacity: clickA * (1 - crumble), transform: `translate(${shake}px, ${crumble * 120}px) scale(${1 - 0.3 * crumble}) rotate(${crumble * -6}deg)`}}>
						<div style={{fontFamily: FONT_SANS, fontWeight: 900, fontSize: 70, color: '#ffe14a', WebkitTextStroke: '3px #d0201a', textShadow: '0 0 0 #000, 6px 6px 0 #d0201a'}}>震惊！上校临死前</div>
						<div style={{fontFamily: FONT_SANS, fontWeight: 900, fontSize: 70, color: '#ffe14a', WebkitTextStroke: '3px #d0201a', textShadow: '6px 6px 0 #d0201a', marginTop: 6}}>竟想起一块冰！！</div>
						<div style={{fontFamily: FONT_SANS, fontWeight: 800, fontSize: 26, color: '#ff8a7a', marginTop: 14, letterSpacing: '0.04em'}}>SHOCKING! Colonel Remembers ICE Before Execution!!</div>
					</div>
				) : null}
				<TypeZh tw={TYPE.deadpan} t={t} size={44} y0={410} lineH={60} opacity={dpA} cursor={null} />

				{/* 四：卡夫卡、年份、一千两百万册、仿写 */}
				<Small x={1380} y={370} zh="波哥大" en="bogotá" color={GOLD} a={win(t, T.bogota + 0.2, T.twenty - 0.2, 0.5, 0.6)} size={20} />
				<TypeLatin tw={TYPE.kafkaDe} t={t} size={28} y0={250} lineH={44} family={FONT_TW} opacity={kfA} />
				<Small x={960} y={340} zh="卡夫卡《变形记》，1915" en="kafka · the metamorphosis" a={kfA * win(t, T.kafka, 1e9, 0.5, 0) * 0.85} size={18} />
				<Readout x={560} y={560} value="1947" size={44} opacity={yrA} color="#e9dcc0" />
				<Readout x={1360} y={560} value="1967" size={44} opacity={yrA * win(t, T.twenty + 1.6, 1e9, 0.5, 0)} color={GOLD} />
				<Readout x={960} y={470} value="1200 万册" note="中文版 · copies in chinese" size={130} opacity={soldA} color="#fff4dc" />
				<TypeZh tw={TYPE.pattern} t={t} size={64} y0={420} lineH={80} opacity={patA} cursor={GOLD} />
				{(['meme1', 'meme2', 'meme3'] as const).map((k, i) => (
					<TypeZh key={k} tw={TYPE[k]} t={t} size={30} y0={200 + i * 200} lineH={46} opacity={memeA * (i === 0 ? 1 : win(t, TYPE[k].t0 - 0.1, 1e9, 0.2, 0))} cursor={t < TYPE[k].t1 + 0.4 && t > TYPE[k].t0 - 0.2 ? GOLD : null} weight={360} />
				))}
				{(['Facing my health report, I will remember the afternoon I believed "five more minutes".', 'Facing my boss\'s promises, I will remember the afternoon the app crashed before I saved.', 'Facing the gym mirror, I will remember the afternoon I said "this time I\'ll get fit".'] as const).map((en, i) => (
					<div key={i} style={{position: 'absolute', left: 0, right: 0, top: 200 + i * 200 + 104, textAlign: 'center', fontFamily: FONT_EN, fontStyle: 'italic', fontSize: 19, color: '#7f848a', opacity: memeA * win(t, TYPE[`meme${i + 1}`].t1 - 0.2, 1e9, 0.4, 0)}}>
						{en}
					</div>
				))}

				{/* 五：引用、填空 */}
				<Small x={960} y={210} zh="《活着为了讲述》· 2002" en="living to tell the tale" color={GOLD} a={memoirA} size={20} />
				<TypeLatin tw={TYPE.quoteEs} t={t} size={30} y0={300} lineH={48} family={FONT_TW} opacity={qA * 0.92} />
				<TypeZh tw={TYPE.quoteZh} t={t} size={40} y0={470} lineH={66} opacity={qA} cursor={t < TYPE.quoteZh.t1 + 1 ? GOLD : null} />
				<Small x={960} y={660} zh="加西亚·马尔克斯 · 自传题记" en="gabriel garcía márquez" a={win(t, TYPE.quoteZh.t1 + 0.3, T.yours - 0.1, 0.6, 0.8) * 0.8} size={17} />
				<TypeZh tw={TYPE.blank} t={t} size={48} y0={420} lineH={84} opacity={blA} cursor={GOLD} blankColor="rgba(240,210,140,0.55)" />
			</Camera>

			<ChapterLabel chapters={CHAPTERS} />
			<Subtitles subs={SUBS} />
			<EndMark t={t} from={DUR - 2.2} />
		</AbsoluteFill>
	);
};
