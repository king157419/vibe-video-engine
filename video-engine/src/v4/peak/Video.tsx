/** A《峰终》 V4Peak：暗底，光是主角，一屏一件事。所有画面只由帧号推出。 */
import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera, Veil} from '../kit/Camera';
import {GlowCanvas} from '../kit/GlowCanvas';
import {ChapterLabel} from '../kit/Text';
import {C} from '../kit/theme';
import {easeInOut, smooth} from '../kit/util';
import {Subtitles} from './Subs';
import {makeAssets} from './assets';
import {Backdrop} from './Backdrop';
import {cam} from './camera';
import {build, type PeakProps} from './data';
import {useFontsReady} from './fonts';
import {ScreenText, WorldText} from './Overlay';
import {drawS0} from './scenes/s0';
import {drawS1} from './scenes/s1';
import {drawS2} from './scenes/s2';
import {drawS3} from './scenes/s3';
import {drawS4} from './scenes/s4';
import {drawS5} from './scenes/s5';
import {drawS6} from './scenes/s6';
import {CUT_REAL, toOld, toReal} from './warp';

// 章节标签由 kit 按真实时间画：旧时间轴的章节起点换算成真实时间（warp.ts）
const CHAPTERS = [
	{t: 1.0, num: '00', zh: '序', en: 'PROLOGUE'},
	{t: 38.1, num: '01', zh: '冷', en: 'THE COLD'},
	{t: 87.5, num: '02', zh: '峰', en: 'THE PEAK'},
	{t: 122.5, num: '03', zh: '终', en: 'THE ENDING'},
	{t: 163.95, num: '04', zh: '生', en: 'A LIFE'},
	{t: 204.45, num: '05', zh: '我', en: 'TWO SELVES'},
	{t: 244.65, num: '06', zh: '今天', en: 'TODAY'},
].map((c) => ({...c, t: toReal(c.t)}));

/** 章与章之间约 1 秒的近黑过渡。审片修改：原来 0.2–0.3 s 掉到纯黑再回来，像眨眼；
 *  现在淡出、淡入各 0.5 s（easeInOut），Veil 封顶 0.8，星尘留约两成 */
const DIPS: [number, number, number][] = [
	[86.7, 87.5, 0.8],
	[121.7, 122.5, 0.8],
	[163.15, 163.95, 0.8],
	[203.65, 204.45, 0.7],
	[243.85, 244.65, 0.8],
];
const dip = (t: number) => {
	let a = 0;
	for (const [t0, t1, k] of DIPS) {
		const a0 = t0 - 0.1;
		const a1 = t1 + 0.1;
		if (t >= a0 && t <= a1) a = Math.max(a, k * Math.min(easeInOut((t - a0) / 0.5), easeInOut((a1 - t) / 0.5)));
	}
	return a;
};

export const Video: React.FC<PeakProps> = ({subs, cue, num}) => {
	const ready = useFontsReady();
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const tr = frame / fps; // 真实时间：字幕、配乐、星尘
	const t = toOld(tr); // 旧时间轴：所有画面动作（见 warp.ts）
	const D = useMemo(() => (num && cue ? build(num, cue) : null), [num, cue]);
	const A = useMemo(() => (ready ? makeAssets() : null), [ready]);
	const c = cam(t);
	// 2026-10-12：硬静音里星尘、颗粒不再冻住（3 秒全冻住像播放器卡了）—— 人生线停在原地，星尘照常漂，读得出是「有意停下」
	// 审片修改：去掉两次整屏白 Veil（188.97 那两帧是一张平灰，像编码故障）；片名那一下改成画布里以两颗金点为中心的径向闪光
	// 2:51–2:57 只记得零星几点：背景星尘调暗到一半，36 颗金点才分得出来
	const dustK = 1 - 0.5 * Math.min(smooth((t - 170.6) / 1.0), 1 - smooth((t - 176.6) / 0.8));
	// 满屏奇观时字幕带后面加一层径向压暗（硬切的那一帧一起消失）
	const subDark = t >= 184.3 && t < 188.95 ? 0.42 * smooth((t - 184.3) / 1.2) : 0;
	return (
		<AbsoluteFill style={{background: C.bg}}>
			<Backdrop tt={tr} gf={frame} dustK={dustK} />
			{D && A ? (
				<GlowCanvas
					draw={(g, _t2, fr) => {
						const t2 = t;
						g.setTransform(c.s, 0, 0, c.s, c.ox + c.dx - c.s * c.ox, c.oy + c.dy - c.s * c.oy);
						drawS0(g, t2, fr, D, A);
						drawS1(g, t2, fr, D, A);
						drawS2(g, t2, fr, D, A);
						drawS3(g, t2, fr, D, A);
						drawS4(g, t2, fr, D, A);
						drawS5(g, t2, fr, D, A);
						drawS6(g, t2, fr, D, A);
						g.globalAlpha = 1;
						g.setTransform(1, 0, 0, 1, 0, 0);
					}}
				/>
			) : null}
			{D && ready ? (
				<Camera x={c.dx} y={c.dy} scale={c.s} ox={c.ox} oy={c.oy}>
					<WorldText t={t} tr={tr} D={D} />
				</Camera>
			) : null}
			{D && ready ? <ScreenText t={t} D={D} cam={c} /> : null}
			<Veil a={dip(t)} />
			{subDark > 0 ? (
				<AbsoluteFill style={{background: 'radial-gradient(ellipse 760px 170px at 50% 985px, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0) 100%)', opacity: subDark}} />
			) : null}
			<ChapterLabel chapters={CHAPTERS} />
			{subs ? <Subtitles subs={subs} hardOut={[CUT_REAL]} /> : null}
			<Veil a={smooth((t - 283.0) / 1.5)} />
			<Audio src={staticFile('v4/peak/mix.wav')} />
		</AbsoluteFill>
	);
};
