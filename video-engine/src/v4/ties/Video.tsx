import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, ChapterLabel, EndMark, ensureV4Fonts, FONT_ZH, GlowCanvas, Subtitles} from '../kit';
import {useTitlePoints} from './fontReady';
import {DUR, SUBS} from './data.gen';
import {AMBER, BG} from './draw';
import {Grain} from './Grain';
import {MODEL_OK, PATH} from './model';
import {Overlays} from './Overlays';
import {drawAvatars} from './scenes/avatars';
import {draw1929} from './scenes/s1929';
import {draw1967} from './scenes/s1967';
import {draw1973} from './scenes/s1973';
import {draw2022} from './scenes/s2022';
import {drawSky} from './sky';
import {A, RAW, sm, story, vis} from './time';
import {makeTitle, TITLE_SIZE, TITLE_STEP, TITLE_TEXT, TITLE_TRACK, TITLE_WEIGHT} from './title';
import {CUT_FADE, CUT_PIC, drawWorld, setTitleGeo} from './world';

// 路标按真实时间出（和字幕同一个钟）
const CHAPTERS = [
	{t: 1.0, num: '2026', zh: '你这里', en: 'where you are'},
	{t: RAW.chap_1929, num: '1929', zh: '布达佩斯', en: 'budapest'},
	{t: RAW.chap_1967, num: '1967', zh: '奥马哈', en: 'omaha'},
	{t: RAW.chap_1973, num: '1973', zh: '波士顿', en: 'boston'},
	{t: RAW.chap_1998, num: '1998', zh: '康奈尔', en: 'cornell'},
	{t: RAW.chap_2022, num: '2022', zh: '你可能认识的人', en: 'people you may know'},
	{t: RAW.chap_2026b, num: '2026', zh: '你这里', en: 'where you are'},
];

/** 背景星空的亮度（故事时间）：星带、星盘本身就是星，那几段压暗；中段几章亮一点，让暗场一直有东西在动 */
const skyK = (s: number) => {
	let k = 0.5;
	if (s < 42.3) k = 0.3 + 0.2 * sm(s, 40.5, 42.3);
	else if (s < 103) k = 0.5;
	else if (s < 144.8) k = 0.62;
	else if (s < 200.3) k = 0.28;
	else if (s < 247) k = 0.5;
	else k = 0.3;
	// 洪水、硬静音：没有星空；静音结束后 1.2 秒慢慢回来（原来 0.3 秒，和别的东西一起亮回来时像跳了一下）
	if (s > 177.7 && s < A.silence[1] + 1.2) k *= 1 - vis(s, 177.7, A.silence[1] + 1.2, 0.3, 1.2);
	return k;
};

export const Video: React.FC = () => {
	ensureV4Fonts();
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const st = story(t);
	// 片名星座的取样点：等思源宋体真的就位再取（kit 的 useTextPoints 会在字体加进来之前就取样，落到系统黑体上）
	const rel = useTitlePoints(TITLE_TEXT, TITLE_SIZE, TITLE_WEIGHT, TITLE_STEP, FONT_ZH, TITLE_TRACK);
	useMemo(() => {
		if (!rel) return;
		const g1 = makeTitle(rel, [PATH[0], PATH[1], PATH[4], PATH[5]], 15, 1016, 1);
		const g2 = makeTitle(rel, [5, 15, 1016, 1006], 0, 1000, 2);
		setTitleGeo(g1, g2);
		if (MODEL_OK.length) console.error('[ties] model check failed', MODEL_OK);
	}, [rel]);
	// 背景整体压暗：片名后的近黑、硬静音、片尾渐黑
	const dim = Math.max(
		0.35 * sm(st, A.title1.out[0], A.title1.black[0]) * (1 - sm(st, 42.0, 43.0)),
		// 用户反馈（2026-10-12）：原来静音一开始一帧压暗、一结束一帧亮回来。现在和洪水同一帧开始 0.2 秒淡下去，静音结束后 1.2 秒亮回来
		0.45 * (st < CUT_PIC ? 0 : 1 - Math.pow(1 - Math.min(1, (st - CUT_PIC) / CUT_FADE), 2)) * (1 - sm(st, A.silence[1], A.silence[1] + 1.2)),
		sm(st, A.title2.fade[0], A.title2.fade[1]),
	);
	// 星盘撑满画面、星带被推近时，字幕带下面压一层暗（不是底框，是暗角）
	const shield = Math.max(vis(st, 174.6, 178.6, 0.9, 0.3), 0.85 * vis(st, 182.0, 187.0, 0.6, 0.8), 0.8 * vis(st, 194.0, 199.6, 0.8, 0.8));
	return (
		<AbsoluteFill style={{background: BG}}>
			<Backdrop tint={BG} glowColor="#16224a" glow={0.09} dust={150} drift={[-3, -1]} dim={dim} />
			<GlowCanvas draw={(g, tt) => drawSky(g, tt, skyK(story(tt)) * (1 - dim))} />
			<GlowCanvas
				draw={(g, tt) => {
					const s = story(tt);
					drawWorld(g, s);
					draw1929(g, s);
					draw1967(g, s);
					draw1973(g, s);
					drawAvatars(g, s);
					draw2022(g, s);
				}}
			/>
			<Overlays t={st} />
			{shield > 0.01 ? (
				<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 230, opacity: shield, background: 'linear-gradient(to top, rgba(2,3,8,0.88) 0px, rgba(2,3,8,0.7) 110px, rgba(2,3,8,0) 230px)'}} />
			) : null}
			<ChapterLabel chapters={CHAPTERS} accent={AMBER} />
			<Subtitles subs={SUBS} />
			<EndMark t={t} from={RAW.title2.endmark} />
			<Grain />
			<Audio src={staticFile('v4/ties/mix.wav')} />
		</AbsoluteFill>
	);
};
export const DURATION = DUR;
