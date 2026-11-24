import {useAudioData} from '@remotion/media-utils';
import {useMemo} from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ensureFonts} from '../lib/fonts';
import type {Captions, EpisodeMeta, EpisodeProps} from '../lib/types';
import {loudnessAt, spectrumAt} from './radio/audio';
import {Background, Grain} from './radio/Background';
import {CAPTION_FONT, CAPTION_MAXW, CAPTION_MIN, CAPTION_SIZE, CaptionLine, captionHeight, effectiveStarts} from './radio/Captions';
import {Cover, END_CTA_AT, EndCard, endCardHeight} from './radio/Cards';
import {Header, VoiceBars} from './radio/Instruments';
import {layoutCaptionFixed} from './radio/layout';
import {findMoments, Moments} from './radio/Moments';
import {useFontsReady, useGrainReady} from './radio/ready';
import {
	BG_TOP,
	CAPTION_REVEAL_MS,
	CAPTION_Y,
	clamp,
	clamp01,
	COVER_HOLD_MS,
	COVER_MOVE_MS,
	CTA_MIN_MS,
	easeInOut,
	easeOut,
	END_GROUP_Y,
	END_IN_MS,
	END_LINE_GAP,
	END_MAX_LIFT,
	ENTER_LEAD_MS,
	ENTER_MS,
	episodeLabel,
	EXIT_LEAD_MS,
	EXIT_MS,
	FAST_ENTER_AFTER_MS,
	FAST_EXIT_MS,
	FINAL_HOLD_MS,
	FINAL_MIN_HOLD_MS,
	HEADLINE_AFTER_FIRST_MS,
	TIGHT_GAP_MS,
} from './radio/theme';

ensureFonts();

const PUNCT = '\\s，。、！？；：,.!?;:…—·～~-';
const LEADING_PUNCT = new RegExp(`^[${PUNCT}]+`);
const TRAILING_PUNCT = new RegExp(`[${PUNCT}]+$`);
const charCount = (s: string) => Array.from(s).length;
const normText = (s: string) => s.replace(/[\s\p{P}]/gu, '');

/** 从 text 里去掉与封面大字重复的那段（连同相邻标点）：「你不是矫情，是心里那个小孩在喊你」→「是心里那个小孩在喊你」 */
const stripHook = (text: string, hook: string): string => {
	const i = text.indexOf(hook);
	if (i < 0) return text;
	const before = text.slice(0, i).replace(TRAILING_PUNCT, '');
	const after = text.slice(i + hook.length).replace(LEADING_PUNCT, '');
	return [before, after].filter(Boolean).join('，').trim();
};

/** 封面副标题：标题去重后太短（<4 字）就换 quote，再不行就不显示 */
const coverSubtitle = (meta: EpisodeMeta | null): string | undefined => {
	const hook = meta?.cover?.trim();
	if (!hook) return undefined; // 钩子本身就来自 title / 第一句，不再重复
	for (const cand of [meta?.title, meta?.quote]) {
		const s = cand?.trim() ? stripHook(cand.trim(), hook) : '';
		if (charCount(s) >= 4) return s;
	}
	return undefined;
};

/** 封面钩子：meta.cover → meta.title → 没有 meta 时退回第一行字幕，保证第 0 帧永远是一张封面 */
const coverHook = (captions: Captions, meta: EpisodeMeta | null) => {
	const firstLine = captions.lines[0]?.chars.map((c) => c.t).join('').replace(/\s+/g, ' ').trim() ?? '';
	const hook = meta?.cover?.trim() || meta?.title?.trim() || firstLine;
	// 钩子就是第一句字幕时，不留「题眼」，否则同一句话会同时出现两次
	const isFirstLine = normText(hook) === normText(firstLine);
	return {hook, isFirstLine};
};

export type RadioProps = EpisodeProps & {
	/** 导出上传用封面图时传 true（npx remotion still Radio out/cover_Radio.png --frame=0 --props='{"still":true}'） */
	still?: boolean;
};

/**
 * 样式 A「深夜电台」：声音优先、极简、私密。
 * 深蓝夜色 + 失焦暖光 + 胶片颗粒；一行字幕居中卡拉 OK 点亮；真实音频驱动的细线频谱；
 * 提到《书名》/ 一串关键词时，频谱下方留一块小小的「内容时刻」。
 */
export const Radio: React.FC<RadioProps> = ({captions, meta, still}) => {
	if (!captions) return <AbsoluteFill style={{backgroundColor: BG_TOP}} />;
	if (still) return <RadioStill captions={captions} meta={meta} />;
	return <RadioInner captions={captions} meta={meta} />;
};

/** 上传用封面：以画面中线为轴（主页宫格/搜索里没有右侧按钮），带期数牌和节目名 */
const RadioStill: React.FC<{captions: Captions; meta: EpisodeMeta | null}> = ({captions, meta}) => {
	const fontsReady = useFontsReady();
	useGrainReady();
	const {hook} = coverHook(captions, meta);
	const subtitle = coverSubtitle(meta);
	return (
		<AbsoluteFill style={{backgroundColor: BG_TOP, overflow: 'hidden'}}>
			<Background t={0} glow={0.3} />
			<Cover
				hook={hook}
				title={subtitle}
				mode={{kind: 'still', ep: episodeLabel(meta?.episodeNo), series: meta?.series?.trim() || undefined}}
				fontsReady={fontsReady}
			/>
			<Grain frame={0} />
		</AbsoluteFill>
	);
};

type Timeline = {enter: number[]; exitStart: number[]; exitDur: number[]; exitPow: number[]};

/**
 * 每行的出现 / 离场时刻。
 * - 行提前 ENTER_LEAD_MS 出现，但不早于上一行念完 +100ms；
 * - 两句之间有停顿（≥300ms）：旧行在停顿里提前上飘淡出；
 * - 两句几乎连着（<300ms）：旧行在念完那一刻快速离场（180ms，四次方衰减），新行等旧行 <15% 才出现，不叠影。
 */
const buildTimeline = (captions: Captions, revealMs: number): Timeline => {
	const {lines} = captions;
	const n = lines.length;
	const enter: number[] = [];
	const exitStart: number[] = [];
	const exitDur: number[] = [];
	const exitPow: number[] = [];
	const rawEnter = (i: number) => {
		const s = lines[i].startMs;
		const prevEnd = i > 0 ? lines[i - 1].endMs + 100 : -Infinity;
		return Math.max(revealMs, Math.min(s, Math.max(s - ENTER_LEAD_MS, prevEnd)));
	};
	for (let i = 0; i < n; i++) {
		let e = rawEnter(i);
		if (i > 0 && exitDur[i - 1] === FAST_EXIT_MS) {
			e = Math.max(e, Math.min(exitStart[i - 1] + FAST_ENTER_AFTER_MS, lines[i].startMs + 150));
		}
		enter.push(e);
		if (i + 1 >= n) {
			exitStart.push(Infinity); // 最后一行交给收尾
			exitDur.push(EXIT_MS);
			exitPow.push(3);
			continue;
		}
		const gap = lines[i + 1].startMs - lines[i].endMs;
		if (gap < TIGHT_GAP_MS) {
			exitStart.push(Math.max(e + ENTER_MS, lines[i].endMs));
			exitDur.push(FAST_EXIT_MS);
			exitPow.push(4);
		} else {
			const nextIn = rawEnter(i + 1);
			const early = Math.max(lines[i].endMs + 50, nextIn - EXIT_LEAD_MS);
			exitStart.push(Math.max(e + ENTER_MS, Math.min(nextIn, early)));
			exitDur.push(EXIT_MS);
			exitPow.push(3);
		}
	}
	return {enter, exitStart, exitDur, exitPow};
};

const RadioInner: React.FC<{captions: Captions; meta: EpisodeMeta | null}> = ({captions, meta}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const fontsReady = useFontsReady();
	useGrainReady();
	const audioSrc = staticFile(captions.audio);
	const audioData = useAudioData(audioSrc);

	const ms = (frame / fps) * 1000;
	const t = ms / 1000;
	const totalMs = (durationInFrames / fps) * 1000;
	const {lines} = captions;

	// 字幕排版：72px 单行优先；长行先单行缩到 ≥60px，再按词拆 2 行（必要时也缩到 ≥60px），最后才 3 行
	const layouts = useMemo(
		() => lines.map((l) => layoutCaptionFixed(l, CAPTION_FONT, CAPTION_SIZE, CAPTION_MAXW, fontsReady, CAPTION_MIN)),
		[lines, fontsReady],
	);
	const starts = useMemo(() => effectiveStarts(lines), [lines]);
	const moments = useMemo(() => findMoments(lines, starts), [lines, starts]);

	const series = meta?.series?.trim() || undefined;
	const ep = episodeLabel(meta?.episodeNo);
	const chapter = meta?.chapter?.trim() || undefined;
	// 章节已经写了「序 · …」时，台标里不再重复「序章」
	const headerEp = ep && chapter && (chapter.startsWith(ep) || (ep === '序章' && chapter.startsWith('序'))) ? undefined : ep;

	// —— 时间轴：封面 → 题眼 ——
	const {hook, isFirstLine} = useMemo(() => coverHook(captions, meta), [captions, meta]);
	const hasCover = hook.length > 0;
	const subtitle = useMemo(() => coverSubtitle(meta), [meta]);
	// 夹到第一行结束前 300ms 以内：第一行再短也一定能露面
	const revealMs = hasCover && lines.length ? Math.min(CAPTION_REVEAL_MS, Math.max(0, lines[0].endMs - 300)) : 0;
	const headline = hasCover && !isFirstLine && lines.length > 0;
	const headlineEnd = clamp((lines[0]?.endMs ?? 0) + HEADLINE_AFTER_FIRST_MS, COVER_HOLD_MS + COVER_MOVE_MS + 300, 3500);
	const coverMove = hasCover ? easeInOut(clamp01((ms - COVER_HOLD_MS) / COVER_MOVE_MS)) : 1;

	// —— 时间轴：收尾 ——
	// 最后一句念完后原地不动、保持点亮；停一会儿后结尾卡在它下面分段长出来。
	// 尾巴长度由合成时长决定（lib/load.ts 的 TAIL_MS）：尾巴越长，停得越久、「关注我」留得越久。
	const lastIdx = lines.length - 1;
	const lastEnd = lastIdx >= 0 ? lines[lastIdx].endMs : 0;
	const tailAvail = totalMs - lastEnd;
	const endIn = clamp(tailAvail - FINAL_MIN_HOLD_MS - CTA_MIN_MS, 480, END_IN_MS);
	const hold = clamp(tailAvail - END_CTA_AT * endIn - CTA_MIN_MS, FINAL_MIN_HOLD_MS, FINAL_HOLD_MS);
	const endStart = lastIdx >= 0 ? lastEnd + hold : Math.max(0, totalMs - CTA_MIN_MS - END_IN_MS);
	const endP = clamp01((ms - endStart) / endIn);
	const offAir = easeInOut(clamp01((ms - endStart) / 600));

	// 结尾卡位置：紧贴最后一句下沿；结尾卡长出来的同时，「最后一句 + 结尾卡」整体缓缓上移到 END_GROUP_Y 居中
	// （只移动、不缩小，最多 END_MAX_LIFT）。没有字幕时结尾卡自己居中。
	const endH = useMemo(() => endCardHeight(series, fontsReady), [series, fontsReady]);
	const lastH = lastIdx >= 0 ? captionHeight(layouts[lastIdx]) : 0;
	const groupH = lastH + END_LINE_GAP + endH;
	const endLift = lastIdx >= 0 ? clamp(CAPTION_Y - lastH / 2 - (END_GROUP_Y - groupH / 2), 0, END_MAX_LIFT) : 0;
	const liftNow = endLift * easeInOut(clamp01(endP / END_CTA_AT));
	const endTop = lastIdx >= 0 ? CAPTION_Y + lastH / 2 + END_LINE_GAP - liftNow : END_GROUP_Y - endH / 2;

	// —— 音频驱动 ——
	const level = loudnessAt(audioData, t, 0.09);
	const glow = loudnessAt(audioData, t, 0.7);
	const spectrum = spectrumAt(audioData, frame, fps);
	// 最后一个字念完，频谱随之熄灭（给结尾卡腾出位置）
	const barsOut = lastIdx >= 0 ? easeInOut(clamp01((ms - lastEnd - 60) / 380)) : offAir;

	// —— 字幕 ——
	const tl = useMemo(() => buildTimeline(captions, revealMs), [captions, revealMs]);
	let idx = -1;
	for (let i = 0; i < lines.length; i++) {
		if (tl.enter[i] <= ms) idx = i;
		else break;
	}
	const shown: React.ReactNode[] = [];
	if (idx >= 0) {
		for (let i = Math.max(0, idx - 2); i <= idx; i++) {
			const inAt = tl.enter[i];
			if (ms < inAt) continue;
			// 安全网：下一行的出现时刻不晚于本行时，本行不画
			if (i + 1 < lines.length && tl.enter[i + 1] <= inAt) continue;
			const pIn = easeOut(clamp01((ms - inAt) / ENTER_MS));
			const pOut = clamp01((ms - tl.exitStart[i]) / tl.exitDur[i]);
			if (pOut >= 1) continue;
			const h = captionHeight(layouts[i]);
			const hNext = layouts[i + 1] ? captionHeight(layouts[i + 1]) : h;
			const shift = (h + hNext) / 2 + 20; // 上飘到完全让出新行（新行是两行时也不叠字）
			shown.push(
				<CaptionLine
					key={`l${i}`}
					line={lines[i]}
					layout={layouts[i]}
					starts={starts[i]}
					ms={ms}
					opacity={pIn * Math.pow(1 - pOut, tl.exitPow[i])}
					dy={(1 - pIn) * 30 - easeOut(pOut) * shift - (i === lastIdx ? liftNow : 0)}
				/>,
			);
		}
	}

	return (
		<AbsoluteFill style={{backgroundColor: BG_TOP, overflow: 'hidden'}}>
			<Html5Audio src={audioSrc} />
			<Background t={t} glow={glow} />
			<Header series={series} ep={headerEp} chapter={chapter} level={level} onAir={1 - offAir} opacity={1 - offAir} />
			{hasCover ? (
				<Cover hook={hook} title={subtitle} mode={{kind: 'video', ms, headline, headlineEnd}} fontsReady={fontsReady} />
			) : null}
			{shown}
			<Moments moments={moments} ms={ms} fontsReady={fontsReady} />
			<VoiceBars spectrum={spectrum} level={level} t={t} opacity={coverMove * (1 - barsOut)} />
			<EndCard series={series} ep={ep} top={endTop} p={endP} fontsReady={fontsReady} />
			<Grain frame={frame} />
		</AbsoluteFill>
	);
};
