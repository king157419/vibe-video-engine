import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, Html5Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ensureFonts, SANS, SERIF} from '../lib/fonts';
import {activeLineIndex} from '../lib/load';
import {H, SAFE, SAFE_W} from '../lib/safe';
import type {EpisodeMeta, EpisodeProps} from '../lib/types';
import {Grade, Scenes} from './illustration/Atmosphere';
import {Bgm} from './illustration/Bgm';
import {CaptionStack, type Finale, WARM} from './illustration/Captions';
import {fitTitle, layoutLine, textEm} from './illustration/layout';
import {DEFAULT_IMAGES, planScenes, type Scene} from './illustration/scenes';

ensureFonts();

/**
 * 风格 C「治愈插画」：绘本感插画 + 慢速 Ken Burns + 交叉溶解，
 * 声音是主角，字幕放在下三分之一，关键词用台灯般的暖光点亮。
 * 第 0 帧是封面（大标题），随后大标题缩成顶部常驻的「钩子标题」，字幕从第一句就同步出现。
 */

/**
 * 建议的片尾时长（ms）：最后一句停住约 0.9s + 片尾卡 ≥2.5s。
 * 目前 lib/load.ts 的 TAIL_MS 是全局 1600，本风格会自动在可用的尾巴里折中（见 endPlan）；
 * 改成按风格传入后，这里的数值即可直接生效。
 */
export const ILLUSTRATION_TAIL_MS = 3400;

const CREAM = '#FFF6E6';
const BAR_COLOR = '#07060B';
const BAR_H = 176; // 电影遮幅高度
const CAP_BOTTOM = SAFE.bottom - 40; // 字幕底边
// 顶部标签行：比安全区上沿再低一点，封面在抖音主页 3:4 裁切（约 y240 起）里也不贴边
const TOP_ROW = SAFE.top + 30;
const HOOK_TOP = TOP_ROW + 60; // 常驻钩子标题的上沿
const HOOK_SIZE = 72; // 常驻标题字号（一行）
const HOOK_SIZE_2 = 52; // 常驻标题字号（两行）
const COVER_SIZE = 150; // 封面大标题字号上限
const COVER_SETTLE: [number, number] = [380, 1150]; // 封面大标题 → 常驻标题
const COVER_EXTRAS_OUT: [number, number] = [260, 720]; // 副标题 / 章节 / 书名标签淡出
const BARS_OPEN: [number, number] = [150, 1000]; // 遮幅打开慢一点，更有电影感（不压字）
const CAPTION_FADE = 220;
// 片尾：最后一句停住（HOLD）后再进片尾卡；尾巴不够长时两者折中
const HOLD_IDEAL = 900;
const HOLD_MIN = 350;
const END_IDEAL = 2500;
const FINALE_DUR = 700; // 最后一句上浮成题记的时长
const QUOTE_SCALE = 0.8;
// 这个账号解读的书；meta.book 可覆盖
const DEFAULT_BOOK = '养育你内心的小孩';
// 背景音乐：程序合成的毛毡钢琴（art-src/illustration/make_bgm.py，无版权问题、可无缝循环），
// 音量按人声响度自动压到约 -20 dB（见 illustration/Bgm.tsx）。
// meta.bgm 可换成别的音乐（相对 public 的路径）；meta.bgm = 'none' 关闭（例如在剪映 / 抖音里另配乐）
const DEFAULT_BGM = 'styles/illustration/bgm.mp3';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const CAP_OPTS = {
	maxWidth: SAFE_W - 20,
	maxSize: 64,
	minSize: 58,
	preferTwoBelow: 60,
	letterSpacing: 0.04,
	lineHeight: 1.36,
};

/** 可选的扩展字段（meta.json 里有就用） */
type MetaX = EpisodeMeta & {bgm?: string};

/** 「养育你内心的小孩」→「读《养育你内心的小孩》」；已带书名号（如「丛非从《…》」）就原样加「读」 */
const bookLabel = (book: string): string => {
	const b = book.trim();
	if (!b) return '';
	return b.includes('《') ? `读${b}` : `读《${b}》`;
};

const splitChapter = (chapter: string) => chapter.split(/\s*[·・|｜:：]\s*/u).filter(Boolean);

/** EP00 这类「第 0 期」用章节名的第一段代替（「序」→「序章」），更有温度 */
const episodeLabel = (meta: EpisodeMeta | null): string => {
	const ep = (meta?.episodeNo ?? '').trim();
	const head = splitChapter((meta?.chapter ?? '').trim())[0] ?? '';
	if ((!ep || /^\D*0+$/u.test(ep)) && head) return head === '序' ? '序章' : head;
	return ep;
};

/** 章节标签：「序 · 五种需要」+ 期号「序章」→「序章 · 五种需要」（不重复） */
const chapterTag = (meta: EpisodeMeta | null, epLabel: string): string => {
	const parts = splitChapter((meta?.chapter ?? '').trim());
	if (!parts.length) return epLabel;
	if (epLabel && (epLabel.startsWith(parts[0]) || parts[0].startsWith(epLabel))) parts[0] = epLabel;
	else if (epLabel) parts.unshift(epLabel);
	return parts.join(' · ');
};

/** 配音是合成的（TTS/克隆）→ 整体标「内容由AI生成」；真人配音只标画面 */
const isSyntheticVoice = (voice?: string) => !!voice && /tts|neural|合成|占位|克隆|clone|\bai\b/iu.test(voice);

/** 片尾从哪一刻开始：尾巴够长时最后一句停 0.9s、片尾卡 ≥2.5s；不够时两头折中，最后一句至少停 0.35s */
const endPlan = (lastEnd: number, lastReveal: number, totalMs: number) => {
	const avail = totalMs - lastEnd;
	const hold = Math.max(HOLD_MIN, Math.min(HOLD_IDEAL, avail - END_IDEAL));
	const start = Math.min(Math.max(lastReveal + 200, lastEnd + hold), totalMs - 1000);
	// 片尾卡内部节奏按可用时长略微压缩（最多压到 80%）
	const pace = Math.max(0.8, Math.min(1, (totalMs - start) / END_IDEAL));
	return {start, pace};
};

export const Illustration: React.FC<EpisodeProps> = ({captions, meta}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const ms = (frame / fps) * 1000;
	const totalMs = (durationInFrames / fps) * 1000;
	const mx = meta as MetaX | null;

	const images = meta?.images && meta.images.length ? meta.images : DEFAULT_IMAGES;
	const scenes = useMemo<Scene[]>(
		() =>
			captions
				? planScenes(captions, images, totalMs)
				: [{img: images[0], startMs: 0, endMs: totalMs, move: 0, lift: 0, topLift: 0, focus: [0.5, 0.45]}],
		[captions, images, totalMs],
	);
	const layouts = useMemo(() => (captions ? captions.lines.map((l) => layoutLine(l, CAP_OPTS)) : []), [captions]);

	const lines = captions?.lines ?? [];
	const series = meta?.series ?? '';
	const epLabel = episodeLabel(meta);

	// ---- 时间轴 ----
	const last = lines[lines.length - 1];
	const lastChar = last?.chars[last.chars.length - 1];
	const lastReveal = lastChar ? lastChar.s + 110 : last?.endMs ?? 0; // 最后一个字点亮的时刻
	const plan = last ? endPlan(last.endMs, lastReveal, totalMs) : {start: Math.max(1500, totalMs - END_IDEAL), pace: 1};
	const endStart = plan.start;
	const capIn0 = Math.max(0, (lines[0]?.startMs ?? 0) - 150);

	const settle = interpolate(ms, COVER_SETTLE, [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const extras = interpolate(ms, COVER_EXTRAS_OUT, [1, 0], {...clamp, easing: Easing.inOut(Easing.quad)});
	const barsOpen = interpolate(ms, BARS_OPEN, [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const endP = interpolate(ms, [endStart, endStart + 700 * plan.pace], [0, 1], {
		...clamp,
		easing: Easing.inOut(Easing.cubic),
	});
	const capVis = interpolate(ms, [capIn0, capIn0 + CAPTION_FADE], [0, 1], clamp);
	// 顶部标签与常驻标题：片尾大标题出现前就已经消失，避免系列名同时出现两次
	const chromeOut = interpolate(ms, [endStart - 200, endStart + 150], [1, 0], clamp);

	const barH = BAR_H * (1 - barsOpen) + BAR_H * endP;
	const active = captions ? activeLineIndex(captions, ms) : -1;

	// 钩子标题来自 meta.cover / title；没有 meta 时封面用第一句，但不常驻（否则和字幕重复）
	const metaHook = (meta?.cover || meta?.title || '').trim();
	const hook = metaHook || (lines[0]?.text ?? '').trim();
	const endMetrics = endCardMetrics(series, epLabel);
	const finale: Finale | null = last
		? {start: endStart, lift: endMetrics.quoteLift, scale: QUOTE_SCALE, dur: FINALE_DUR * plan.pace}
		: null;

	const label = [series, epLabel].filter(Boolean).join(' · ');
	const bgm = mx?.bgm === undefined ? DEFAULT_BGM : mx.bgm.trim();

	return (
		<AbsoluteFill style={{backgroundColor: '#15131c', overflow: 'hidden'}}>
			{captions ? <Html5Audio src={staticFile(captions.audio)} /> : null}
			{captions && bgm && bgm !== 'none' ? (
				<Bgm voice={captions.audio} music={bgm} fps={fps} totalMs={totalMs} endStart={endStart} />
			) : null}

			<Scenes scenes={scenes} ms={ms} />
			<Grade ms={ms} />

			{/* 顶部压暗（给标签 + 常驻标题）+ 底部渐变（给字幕） */}
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(180deg, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.34) 14%, rgba(0,0,0,0.16) 22%, rgba(0,0,0,0) 31%)',
				}}
			/>
			<AbsoluteFill
				style={{
					background:
						'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.30) 60%, rgba(0,0,0,0.58) 74%, rgba(0,0,0,0.62) 100%)',
				}}
			/>
			{/* 字幕背后一团柔和的暗晕，亮图上也能读清 */}
			<AbsoluteFill
				style={{
					opacity: capVis,
					background:
						'radial-gradient(ellipse 520px 210px at 50% 1310px, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.22) 42%, rgba(0,0,0,0.08) 74%, rgba(0,0,0,0) 100%)',
				}}
			/>
			{/* 封面 / 片尾：下半部分额外压暗，托住大标题 / 片尾卡 */}
			{Math.max(1 - settle, endP) > 0 ? (
				<AbsoluteFill
					style={{
						opacity: Math.max(1 - settle, endP),
						background:
							'linear-gradient(180deg, rgba(6,5,12,0.10) 0%, rgba(6,5,12,0.05) 35%, rgba(6,5,12,0.45) 62%, rgba(6,5,12,0.72) 100%)',
					}}
				/>
			) : null}

			{/* 电影遮幅：封面时合上，开讲时缓缓打开，片尾再合上 */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: barH, background: BAR_COLOR}} />
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: barH, background: BAR_COLOR}} />

			{/* 封面大标题 → 常驻钩子标题 */}
			{hook && chromeOut > 0 ? (
				<Hook
					hook={hook}
					sub={coverSub(meta, hook)}
					tag={chapterTag(meta, epLabel)}
					book={bookLabel(meta?.book ?? DEFAULT_BOOK)}
					settle={metaHook ? settle : 0}
					extras={extras}
					opacity={metaHook ? chromeOut : chromeOut * extras}
					coverBottom={CAP_BOTTOM - (layouts[0]?.height ?? 90) - 60}
				/>
			) : null}

			{/* 顶部小标签 */}
			{label && chromeOut > 0 ? <TopLabel text={label} opacity={chromeOut} /> : null}

			{/* 字幕（最后一句会在片尾上浮成题记） */}
			{captions ? (
				<div
					style={{
						position: 'absolute',
						left: SAFE.left,
						width: SAFE_W,
						top: SAFE.top,
						height: CAP_BOTTOM - SAFE.top,
						opacity: capVis,
					}}
				>
					<CaptionStack lines={lines} layouts={layouts} active={active} ms={ms} finale={finale} />
				</div>
			) : null}

			{endP > 0 ? (
				<EndCard series={series} epLabel={epLabel} next={(meta?.next ?? '').trim()} ms={ms - endStart} pace={plan.pace} />
			) : null}

			<AiMark synthetic={isSyntheticVoice(captions?.voice)} />
		</AbsoluteFill>
	);
};

const LABEL_MAX_W = SAFE_W - 240; // 右侧留给 AI 标识

/** 系列 · 期号：和 AI 标识一样带半透明深色底，亮图（晨光窗帘、夕阳天空）上也读得清 */
const TopLabel: React.FC<{text: string; opacity: number}> = ({text, opacity}) => {
	const size = Math.min(29, Math.floor((LABEL_MAX_W - 60) / Math.max(1, textEm(text, 0.14))));
	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE.left,
				top: TOP_ROW,
				display: 'flex',
				alignItems: 'center',
				gap: 12,
				opacity,
				padding: '4px 16px 4px 14px',
				borderRadius: 999,
				background: 'rgba(0,0,0,0.32)',
				fontFamily: SANS,
				fontWeight: 500,
				fontSize: size,
				lineHeight: 1.3,
				letterSpacing: '0.14em',
				color: 'rgba(255,246,230,0.95)',
				textShadow: '0 1px 4px rgba(0,0,0,0.5)',
				whiteSpace: 'nowrap',
			}}
		>
			<div
				style={{
					width: 10,
					height: 10,
					borderRadius: 5,
					background: WARM,
					boxShadow: '0 0 10px rgba(255,200,120,0.8)',
				}}
			/>
			{text}
		</div>
	);
};

// 按国内 AIGC 标识要求需「显著」标注；放在安全区右上角，任何底图上都读得清
const AiMark: React.FC<{synthetic: boolean}> = ({synthetic}) => (
	<div
		style={{
			position: 'absolute',
			right: 1080 - SAFE.right,
			top: TOP_ROW + 3,
			padding: '4px 14px 5px',
			borderRadius: 999,
			border: '1px solid rgba(255,255,255,0.45)',
			background: 'rgba(0,0,0,0.38)',
			fontFamily: SANS,
			fontWeight: 500,
			fontSize: 24,
			lineHeight: 1.3,
			letterSpacing: '0.08em',
			color: 'rgba(255,255,255,0.92)',
			whiteSpace: 'nowrap',
		}}
	>
		{synthetic ? '内容由AI生成' : '画面由AI生成'}
	</div>
);

/** 副标题：避免和大标题重复（「你不是矫情」+「你不是矫情，是……」→ 只留「是……」） */
const coverSub = (meta: EpisodeMeta | null, hook: string): string => {
	const title = (meta?.title ?? '').trim();
	const quote = (meta?.quote ?? '').trim();
	if (title && title !== hook) {
		if (title.startsWith(hook)) {
			const rest = title.slice(hook.length).replace(/^[，,、：:；;。.！!？?\s—-]+/u, '');
			if (rest) return rest;
		} else if (!title.includes(hook)) return title;
	}
	return quote && quote !== hook ? quote : '';
};

const HOOK_LH = 1.18;
const HOOK_LS = 0.08;
const TAG_SIZE = 29;
const TAG_H = TAG_SIZE * 1.4;
const TAG_MB = 16;
const SUB_MT = 20;
const BOOK_SIZE = 26;
const BOOK_H = BOOK_SIZE * 1.4;
const BOOK_MT = 12;

/**
 * 封面（第 0 帧）：画面下半部的海报式大标题（章节标签 / 大标题 / 副标题 / 书名），
 * 底边停在第一句字幕上方，所以字幕从第一句就能同步出现、不叠字。
 * 0.38s 起大标题缓缓上升、缩成顶部常驻的钩子标题（整片都在，中途刷到的人也知道在讲什么），
 * 其余标签淡出，把画面还给插画。
 */
const Hook: React.FC<{
	hook: string;
	sub: string;
	tag: string;
	book: string;
	settle: number;
	extras: number;
	opacity: number;
	/** 封面标题块的底边（第一句字幕上方） */
	coverBottom: number;
}> = ({hook, sub, tag, book, settle, extras, opacity, coverBottom}) => {
	const T = fitTitle(hook, SAFE_W - 10, COVER_SIZE, HOOK_LS, 7);
	const target = T.rows.length > 1 ? HOOK_SIZE_2 : HOOK_SIZE;
	const hs = Math.min(1, target / T.fontSize);
	const scale = 1 + (hs - 1) * settle;
	const titleH = T.rows.length * T.fontSize * HOOK_LH;
	const subFit = sub ? fitTitle(sub, SAFE_W - 10, 44, 0.06, 99) : null;
	const subH = subFit ? SUB_MT + subFit.rows.length * subFit.fontSize * 1.3 : 0;
	const bookH = book ? BOOK_MT + BOOK_H : 0;
	const coverTop = coverBottom - bookH - subH - titleH;
	const top = coverTop + (HOOK_TOP - coverTop) * settle;
	const headerH = titleH * hs;
	const extraStyle = (y: number): React.CSSProperties => ({
		position: 'absolute',
		left: SAFE.left,
		width: SAFE_W,
		top: y,
		opacity: extras * opacity,
		transform: `translateY(${-30 * (1 - extras)}px)`,
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		whiteSpace: 'nowrap',
	});
	return (
		<>
			{/* 常驻标题背后的暗晕 */}
			{settle > 0 ? (
				<AbsoluteFill
					style={{
						opacity: opacity * settle,
						background: `radial-gradient(ellipse 600px ${Math.round(headerH * 1.1 + 60)}px at 50% ${Math.round(HOOK_TOP + headerH / 2)}px, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.20) 45%, rgba(0,0,0,0) 100%)`,
					}}
				/>
			) : null}
			<div
				style={{
					position: 'absolute',
					left: SAFE.left,
					width: SAFE_W,
					top: 0,
					opacity,
					transform: `translateY(${top}px) scale(${scale})`,
					transformOrigin: '50% 0%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
				}}
			>
				{T.rows.map((r, i) => (
					<div
						key={i}
						style={{
							fontFamily: SERIF,
							fontWeight: 900,
							fontSize: T.fontSize,
							lineHeight: HOOK_LH,
							height: T.fontSize * HOOK_LH,
							letterSpacing: `${HOOK_LS}em`,
							paddingLeft: `${HOOK_LS}em`,
							color: CREAM,
							textShadow: '0 4px 26px rgba(0,0,0,0.6), 0 0 3px rgba(0,0,0,0.45)',
							whiteSpace: 'nowrap',
						}}
					>
						{r}
					</div>
				))}
			</div>
			{extras > 0 && tag ? (
				<div style={extraStyle(coverTop - TAG_MB - TAG_H)}>
					<div
						style={{
							fontFamily: SANS,
							fontWeight: 500,
							fontSize: TAG_SIZE,
							lineHeight: 1.4,
							height: TAG_H,
							letterSpacing: '0.24em',
							paddingLeft: '0.24em',
							color: WARM,
							textShadow: '0 1px 8px rgba(0,0,0,0.7)',
						}}
					>
						{tag}
					</div>
				</div>
			) : null}
			{extras > 0 && (subFit || book) ? (
				<div style={extraStyle(coverTop + titleH)}>
					{subFit
						? subFit.rows.map((r, i) => (
								<div
									key={i}
									style={{
										marginTop: i === 0 ? SUB_MT : 0,
										fontFamily: SERIF,
										fontWeight: 600,
										fontSize: subFit.fontSize,
										lineHeight: 1.3,
										height: subFit.fontSize * 1.3,
										letterSpacing: '0.06em',
										paddingLeft: '0.06em',
										color: 'rgba(255,244,228,0.95)',
										textShadow: '0 2px 12px rgba(0,0,0,0.7)',
									}}
								>
									{r}
								</div>
							))
						: null}
					{book ? (
						<div
							style={{
								marginTop: BOOK_MT,
								fontFamily: SANS,
								fontWeight: 400,
								fontSize: BOOK_SIZE,
								lineHeight: 1.4,
								height: BOOK_H,
								letterSpacing: '0.12em',
								paddingLeft: '0.12em',
								color: 'rgba(255,246,230,0.8)',
								textShadow: '0 1px 8px rgba(0,0,0,0.7)',
							}}
						>
							{book}
						</div>
					) : null}
				</div>
			) : null}
		</>
	);
};

// ---- 片尾卡：尺寸全部显式给出，好算出最后一句要上浮多少 ----
const END_BOTTOM = CAP_BOTTOM; // 关注引导的底边
const DIV_H = 8;
const DIV_MB = 22;
const SERIES_LH = 1.25;
const EP_MT = 14;
const EP_SIZE = 29;
const EP_LH = 1.4;
const CTA_MT = 40;
const CTA_SIZE = 38;
const CTA_LH = 1.3;
const CTA_PAD: [number, number] = [14, 16];
const CTA_BORDER = 1.5;
const QUOTE_GAP = 38; // 题记底边到分隔线
const NOTE_MT = 22; // 片尾声明与关注引导的间距
const NOTE_H = 32;
const END_NOTE = '读书分享，非心理咨询 · 丛非从《养育你内心的小孩》';

const seriesFit = (series: string) =>
	series ? fitTitle(series, SAFE_W - 40, 72, 0.2, 99) : {rows: [] as string[], fontSize: 0};

const endCardMetrics = (series: string, epLabel: string) => {
	const S = seriesFit(series);
	const headH = series ? DIV_H + DIV_MB + S.rows.length * S.fontSize * SERIES_LH + (epLabel ? EP_MT + EP_SIZE * EP_LH : 0) : 0;
	const ctaH = CTA_SIZE * CTA_LH + CTA_PAD[0] + CTA_PAD[1] + CTA_BORDER * 2;
	const quoteLift = CAP_BOTTOM - END_BOTTOM + ctaH + NOTE_MT + NOTE_H + (series ? CTA_MT + headH : 0) + QUOTE_GAP;
	return {S, quoteLift};
};

/** 关注引导：有下期预告（meta.next）时点名下期，比泛泛的「下期继续聊」更促关注 */
const ctaText = (next: string) => (next ? `关注我 · 下期聊「${next}」` : '关注我，下期继续聊');

/** 片尾：最后一张图 + 最后一句（上浮成题记）+ 系列名 + 温柔的关注引导 */
const EndCard: React.FC<{series: string; epLabel: string; next: string; ms: number; pace: number}> = ({
	series,
	epLabel,
	next,
	ms,
	pace,
}) => {
	const {S} = endCardMetrics(series, epLabel);
	const cta = ctaText(next);
	// CTA 的字号：按宽度收，不超过 CTA_SIZE（高度固定，题记上浮量不受影响）
	const ctaSize = Math.min(CTA_SIZE, Math.floor((SAFE_W - 130) / Math.max(1, textEm(cta, 0.16))));
	// 分段进场：遮幅合上、最后一句上浮（0~700ms）；关注引导在题记让出底部后浮现，系列名等题记越过它之后再出现（避免叠字）
	const head = interpolate(ms, [480 * pace, 900 * pace], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const ctaIn = interpolate(ms, [300 * pace, 750 * pace], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const breathe = 0.9 + 0.1 * Math.cos(Math.max(0, ms - 750 * pace) / 420);
	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE.left,
				width: SAFE_W,
				bottom: H - END_BOTTOM,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
			}}
		>
			{series ? (
				<div
					style={{
						opacity: head,
						transform: `translateY(${(1 - head) * 10}px)`,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
					}}
				>
					<div style={{display: 'flex', alignItems: 'center', gap: 16, height: DIV_H, marginBottom: DIV_MB}}>
						<div style={{width: 60, height: 1, background: 'rgba(255,246,230,0.55)'}} />
						<div
							style={{width: 8, height: 8, borderRadius: 4, background: WARM, boxShadow: '0 0 12px rgba(255,200,120,0.9)'}}
						/>
						<div style={{width: 60, height: 1, background: 'rgba(255,246,230,0.55)'}} />
					</div>
					{S.rows.map((r, i) => (
						<div
							key={i}
							style={{
								fontFamily: SERIF,
								fontWeight: 700,
								fontSize: S.fontSize,
								lineHeight: SERIES_LH,
								height: S.fontSize * SERIES_LH,
								letterSpacing: '0.2em',
								paddingLeft: '0.2em',
								color: CREAM,
								textShadow: '0 3px 22px rgba(0,0,0,0.6)',
								whiteSpace: 'nowrap',
							}}
						>
							{r}
						</div>
					))}
					{epLabel ? (
						<div
							style={{
								marginTop: EP_MT,
								fontFamily: SANS,
								fontWeight: 500,
								fontSize: EP_SIZE,
								lineHeight: EP_LH,
								height: EP_SIZE * EP_LH,
								letterSpacing: '0.3em',
								paddingLeft: '0.3em',
								color: 'rgba(255,246,230,0.8)',
								textShadow: '0 1px 8px rgba(0,0,0,0.6)',
								whiteSpace: 'nowrap',
							}}
						>
							{epLabel} · 完
						</div>
					) : null}
				</div>
			) : null}
			<div
				style={{
					marginTop: series ? CTA_MT : 0,
					opacity: ctaIn * breathe,
					transform: `translateY(${(1 - ctaIn) * 14}px)`,
					height: CTA_SIZE * CTA_LH + CTA_PAD[0] + CTA_PAD[1] + CTA_BORDER * 2,
					boxSizing: 'border-box',
					display: 'flex',
					alignItems: 'center',
					padding: `${CTA_PAD[0]}px 40px ${CTA_PAD[1]}px calc(40px + 0.16em)`,
					borderRadius: 999,
					border: `${CTA_BORDER}px solid rgba(255,212,138,0.6)`,
					background: 'rgba(255,200,120,0.10)',
					fontFamily: SANS,
					fontWeight: 500,
					fontSize: ctaSize,
					lineHeight: CTA_LH,
					letterSpacing: '0.16em',
					color: WARM,
					textShadow: '0 1px 10px rgba(0,0,0,0.5)',
					whiteSpace: 'nowrap',
				}}
			>
				{cta}
			</div>
			<div
				style={{
					marginTop: NOTE_MT,
					height: NOTE_H,
					lineHeight: `${NOTE_H}px`,
					opacity: ctaIn * 0.8,
					fontFamily: SANS,
					fontWeight: 400,
					fontSize: 23,
					letterSpacing: '0.06em',
					color: 'rgba(255,246,230,0.75)',
					textShadow: '0 1px 8px rgba(0,0,0,0.6)',
					whiteSpace: 'nowrap',
				}}
			>
				{END_NOTE}
			</div>
		</div>
	);
};
