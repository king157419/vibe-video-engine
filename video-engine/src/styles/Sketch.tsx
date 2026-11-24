import {measureText} from '@remotion/layout-utils';
import React, {useMemo} from 'react';
import {AbsoluteFill, Html5Audio, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ensureFonts, SANS, SERIF} from '../lib/fonts';
import {groupOf} from '../lib/load';
import type {EpisodeMeta, EpisodeProps} from '../lib/types';
import {clamp01, easeInOut, easeOut, lerp, penAt, progress} from './sketch/anim';
import type {PenStrokeLike} from './sketch/anim';
import {CaptionBlock} from './sketch/Captions';
import {buildPages} from './sketch/capLayout';
import {Diagram, Ink} from './sketch/Diagram';
import {wrapFit} from './sketch/layout';
import type {CoverLayout, EndLayout} from './sketch/parts';
import {Cover, END_T, EndCard, Pencil, TopLabel} from './sketch/parts';
import type {Geo, Pt} from './sketch/rough';
import {R} from './sketch/rough';
import {buildScene} from './sketch/scene';
import {
	AMBER,
	AUTHOR,
	BOIL_EVERY,
	BOIL_VARIANTS,
	BOOK,
	CENTER,
	COVER_MS,
	CTA,
	DISCLAIMER,
	END,
	HEART_W,
	MAP_SCALE,
	MAP_Y,
	PAPER,
	PUSH,
	RING_R,
	SAFE_CX,
	SERIES_FALLBACK,
	TOP_LABEL,
} from './sketch/theme';
import {useFontsReady} from './sketch/useFontsReady';

ensureFonts();

// 风格 E「手绘框架·边画边讲」：一张《养育你内心的小孩》的五种需要框架图，
// 口播说到哪个需要，笔就把哪个圈出来、连到中心、涂上琥珀色；其他关键词写成便利贴贴在旁边。

const m100 = (fontFamily: string, fontWeight: number, letterSpacingEm = 0) => (text: string) =>
	text ? measureText({text, fontFamily, fontSize: 100, fontWeight}).width + Array.from(text).length * letterSpacingEm * 100 : 0;

type MetaX = EpisodeMeta & {book?: string; author?: string};

export const Sketch: React.FC<EpisodeProps> = ({captions, meta}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const ready = useFontsReady();
	const m = (meta ?? {}) as MetaX;

	const totalMs = (durationInFrames / fps) * 1000;
	const lastEnd = captions && captions.lines.length ? captions.lines[captions.lines.length - 1].endMs : totalMs - 1600;
	// 片尾紧跟最后一句（尾巴只有 TAIL_MS，要尽量留给片尾停留）
	const endStart = Math.max(lastEnd - 100, Math.min(lastEnd + END.after, totalMs - 2000));
	// 封面停到第一句念完：钩子标题 + 第一句字幕一起落地，再转正片
	const firstEnd = captions && captions.lines.length ? captions.lines[0].endMs : null;
	const hold = firstEnd === null ? COVER_MS.fallback : Math.min(COVER_MS.max, Math.max(COVER_MS.min, firstEnd));
	const coverOut = hold + COVER_MS.out;

	const built = useMemo(() => {
		if (!ready || !captions || captions.lines.length === 0) return null;
		const S700 = m100(SANS, 700);
		const S500 = m100(SANS, 500, 0.12);
		const F500 = m100(SERIF, 500);
		const F600 = m100(SERIF, 600);
		const F600ls = m100(SERIF, 600, 0.04);
		const F700 = m100(SERIF, 700, 0.04);
		const F800 = m100(SERIF, 800, 0.04);
		const F800s = m100(SERIF, 800, 0.06);

		const pages = buildPages(captions, S700);
		const scene = buildScene(captions, F600ls, {revealFrom: coverOut, endStart});

		// ---- 封面 ----
		const groups = groupOf(captions);
		const firstGroup = captions.lines
			.filter((_, i) => groups[i] === 0)
			.map((l) => l.text)
			.join('，');
		const F600c = m100(SERIF, 600, 0.08);
		const bookLabel = `${m.author || AUTHOR}《${m.book || BOOK}》`;
		const label = [m.series, m.episodeNo].filter(Boolean).join(' · ') || bookLabel; // 没有 meta 时用书名兜底
		const labelSize = label ? Math.min(34, (760 / Math.max(1, F600c(label))) * 100) : 34;
		// 封面标签下的琥珀色手绘线：划在系列名下面
		const labelX0 = SAFE_CX - ((F600c(label) / 100) * labelSize) / 2;
		const labelUW = ((F600c(m.series || label) - 8) / 100) * labelSize;
		const hookText = (m.cover || firstGroup).trim();
		const hook = wrapFit(hookText, F800, {maxW: 800, maxSize: 112, minSize: 72, maxLines: 2, maxChars: 8});
		// 副标题别重复钩子：“你不是矫情，是心里那个小孩在喊你” → “是心里那个小孩在喊你”
		let titleText = (m.title || '').trim();
		if (hookText && titleText.startsWith(hookText)) titleText = titleText.slice(hookText.length).replace(/^[，,。、：:；;！!？?\s—-]+/u, '');
		if (!titleText && m.title) titleText = (m.quote || '').trim();
		const title = wrapFit(titleText, F500, {
			maxW: 780,
			maxSize: hook.lines.length > 1 ? 38 : 42,
			minSize: 30,
			maxLines: 2,
			maxChars: 17,
		});
		const labelH = label ? labelSize * 1.4 : 0;
		const lhHook = hook.size * 1.2;
		const hookH = hook.lines.length * lhHook;
		const titleH = title.lines.length * title.size * 1.45;
		const H = labelH + (label ? 44 : 0) + hookH + (titleH ? 30 : 0) + titleH;
		const top = Math.max(300, Math.min(700 - H, 500 - H / 2));
		const hookTop = top + labelH + (label ? 44 : 0);
		const titleTop = hookTop + hookH + 30;
		// 封面上的小地图放在标题下面；标题很长时整体往下挪，保证不压字
		const coverMapY = Math.max(MAP_Y.cover, titleTop + titleH + 56 + (RING_R + 100) * MAP_SCALE.cover);
		const cover: CoverLayout = {
			label,
			labelSize,
			labelW: label ? (F600(label) / 100) * labelSize : 0,
			hook: {...hook, widths: hook.lines.map((l) => (F800(l) / 100) * hook.size)},
			title,
			top,
			hookTop,
			titleTop,
			markers: hook.lines.map((l, i) => {
				const w = (F800(l) / 100) * hook.size + 16;
				const x = SAFE_CX - w / 2;
				const y = hookTop + i * lhHook + lhHook * 0.56;
				const h = lhHook * 0.32;
				return {d: R.fillRect(x, y, w, h, {seed: 510 + i, roughness: 1.3, hachureGap: 8, fillWeight: 4, hachureAngle: -60}), x, y, w, h};
			}),
			labelLine: R.curve(
				[
					[labelX0 + 2, top + labelH + 6],
					[labelX0 + labelUW * 0.55, top + labelH + 10],
					[labelX0 + labelUW, top + labelH + 5],
				],
				{seed: 520, roughness: 1.2, bowing: 1.5, strokeWidth: 5},
			),
		};

		// ---- 顶部标签 ----
		// 太长时逐级精简（章节只留冒号前 → 去掉系列名 → 截断），保证字号不小于 TOP_LABEL.min
		const chapterFull = (m.chapter || '').trim();
		const chapterShort = chapterFull.split(/[：:｜|—]/)[0].trim() || chapterFull;
		const clip = (s: string, n: number) => (Array.from(s).length > n ? Array.from(s).slice(0, n).join('') + '…' : s);
		const sizeOf = (t: string) => (t ? Math.min(TOP_LABEL.size, (TOP_LABEL.maxW / Math.max(1, F600(t))) * 100) : TOP_LABEL.size);
		const topCands: {parts: (string | undefined)[]; chapter: string}[] = [
			{parts: [m.series, m.episodeNo, chapterFull], chapter: chapterFull},
			{parts: [m.series, m.episodeNo, chapterShort], chapter: chapterShort},
			{parts: [m.episodeNo, chapterShort], chapter: chapterShort},
			{parts: [m.episodeNo, clip(chapterShort, 12)], chapter: clip(chapterShort, 12)},
		];
		const topPick =
			topCands.find((c) => sizeOf(c.parts.filter(Boolean).join(' · ')) >= TOP_LABEL.min) ?? topCands[topCands.length - 1];
		const topText = topPick.parts.filter(Boolean).join(' · ') || bookLabel;
		const topSize = sizeOf(topText);
		const topW = (F600(topText) / 100) * topSize;
		const ulY = TOP_LABEL.y + topSize * 0.78 + 4;
		// 顶部标签的小下划线：划在本期章节名下面（没有章节就划系列名）
		const before = topPick.parts.slice(0, -1).filter(Boolean).join(' · ');
		const prefix = topPick.chapter ? before + (before ? ' · ' : '') : '';
		const underWord = topPick.chapter || m.series || topText;
		const ux0 = SAFE_CX - topW / 2 + (F600(prefix) / 100) * topSize;
		const uw = (F600(underWord) / 100) * topSize;
		const topLine = R.curve(
			[
				[ux0 + 2, ulY + 1],
				[ux0 + uw * 0.5, ulY + 5],
				[ux0 + uw, ulY],
			],
			{seed: 530, roughness: 1.2, bowing: 1.5, strokeWidth: 5},
		);

		// ---- 片尾 ----
		// 没有系列名时用中性的兜底，避免和下面的「读书分享，非心理咨询」重复
		const series = m.series || SERIES_FALLBACK;
		const seriesSize = Math.min(58, (760 / Math.max(1, F800s(series))) * 100);
		const seriesW = (F800s(series) / 100) * seriesSize;
		const ctaSize = Math.min(48, (780 / Math.max(1, F700(CTA))) * 100);
		const ctaW = (F700(CTA) / 100) * ctaSize;
		const discW = (S500(DISCLAIMER) / 100) * 28;
		// 文字整体放在套索下面（套索底 ≈ y 990）
		const ey = {series: 1056, book: 1142, cta: 1230, disc: 1314};
		const end: EndLayout = {
			series,
			seriesSize,
			seriesW,
			book: `${m.author || AUTHOR}《${m.book || BOOK}》`,
			cta: CTA,
			ctaW,
			ctaSize,
			disclaimer: DISCLAIMER,
			discW,
			y: ey,
			marker: (() => {
				const w = seriesW + 24;
				const x = SAFE_CX - w / 2;
				const y = ey.series + seriesSize * 0.02;
				const h = seriesSize * 0.42;
				return {d: R.fillRect(x, y, w, h, {seed: 540, roughness: 1.3, hachureGap: 8, fillWeight: 4, hachureAngle: -60}), x, y, w, h};
			})(),
			dashL: R.line([SAFE_CX - discW / 2 - 84, ey.disc + 1], [SAFE_CX - discW / 2 - 26, ey.disc], {seed: 543, roughness: 0.8, strokeWidth: 2, disableMultiStroke: true}),
			dashR: R.line([SAFE_CX + discW / 2 + 26, ey.disc], [SAFE_CX + discW / 2 + 84, ey.disc + 1], {seed: 544, roughness: 0.8, strokeWidth: 2, disableMultiStroke: true}),
		};
		// 「收藏这张图」：琥珀色套索把整张图圈起来（图坐标，垫在便利贴下面），不再用箭头指某一个需要。
		// 从右下起笔顺时针绕一圈多一点，起点略靠里、收尾略靠外，首尾交叠像随手圈的
		const lassoPts: Pt[] = [];
		const LN = 18;
		for (let k = 0; k <= LN + 2; k++) {
			const a = 0.55 + (k / LN) * Math.PI * 2;
			const grow = 0.975 + (k / LN) * 0.05;
			lassoPts.push([CENTER.x + 4 + Math.cos(a) * (RING_R + 138) * grow, CENTER.y + 4 + Math.sin(a) * (RING_R + 120) * grow]);
		}
		const lasso: Geo = R.curve(lassoPts, {seed: 546, roughness: 1.5, bowing: 1, strokeWidth: 6});

		const pen: PenStrokeLike[] = [
			...scene.pen,
			{t0: endStart + END_T.lasso, t1: endStart + END_T.lasso + END_T.lassoDur, geo: lasso, lag: 0.08, space: 'map' as const},
		].sort((a, b) => a.t0 - b.t0);

		return {pages, scene, cover, coverMapY, top: {text: topText, size: topSize, width: topW, line: topLine}, end, lasso, pen};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ready, captions, meta, endStart, coverOut]);

	if (!captions || !built) {
		return (
			<AbsoluteFill style={{backgroundColor: PAPER}}>
				<Img src={staticFile('styles/sketch/paper.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
				{captions ? <Html5Audio src={staticFile(captions.audio)} /> : null}
			</AbsoluteFill>
		);
	}

	const ms = (frame / fps) * 1000;
	const vi = Math.floor(frame / BOIL_EVERY) % BOIL_VARIANTS;

	// 封面 → 正片 → 片尾 的“镜头”：封面文字先快速上移淡出（~360ms），图随后再升上来，两者不叠字
	const coverFade = easeOut(clamp01((ms - hold) / 360));
	const coverK = easeInOut(clamp01((ms - hold - 120) / (coverOut - hold)));
	const endT = ms - endStart;
	const endK = easeInOut(clamp01(endT / 620));
	const scale = lerp(lerp(MAP_SCALE.cover, 1, coverK), MAP_SCALE.end, endK);
	const cy = lerp(lerp(built.coverMapY, CENTER.y, coverK), MAP_Y.end, endK);

	// 笔闲着时镜头缓慢推近（图坐标里绕 focus 缩放）
	let ps = 1;
	let pf: Pt = [CENTER.x, CENTER.y];
	for (const p of built.scene.pushes) {
		if (ms <= p.tIn || ms >= p.tOut) continue;
		const k = Math.min(easeInOut(clamp01((ms - p.tIn) / PUSH.ramp)), easeInOut(clamp01((p.tOut - ms) / PUSH.release)));
		ps = 1 + (p.s - 1) * k;
		pf = p.focus;
	}
	const mapTf =
		`translate(${SAFE_CX} ${cy}) scale(${scale}) translate(${-CENTER.x} ${-CENTER.y})` +
		(ps !== 1 ? ` translate(${pf[0]} ${pf[1]}) scale(${ps}) translate(${-pf[0]} ${-pf[1]})` : '');
	const toScreen = (p: Pt): Pt => {
		const q: Pt = [pf[0] + (p[0] - pf[0]) * ps, pf[1] + (p[1] - pf[1]) * ps];
		return [SAFE_CX + (q[0] - CENTER.x) * scale, cy + (q[1] - CENTER.y) * scale];
	};

	const uiIn = clamp01((ms - (hold + 250)) / 450);
	const endOut = 1 - clamp01(endT / 300);
	const capOut = 1 - clamp01(endT / 260);
	const noteOut = 1 - clamp01(endT / 320);
	// 字幕在第 0 帧之后立刻出现（~100ms，赶在第一个字之前）；第 0 帧本身留给封面图，保持干净
	const capIn = clamp01(ms / 100);

	const pen = penAt(ms, built.pen, {c: [CENTER.x, CENTER.y], r: HEART_W * 0.55, arcR: RING_R * 0.72});
	const penPt = pen ? (pen.space === 'map' ? toScreen(pen.pt) : pen.pt) : null;
	const restAlpha = 1 - coverFade;
	const pLasso = progress(ms, endStart + END_T.lasso, END_T.lassoDur);

	return (
		<AbsoluteFill style={{backgroundColor: PAPER}}>
			<Html5Audio src={staticFile(captions.audio)} />
			<Img src={staticFile('styles/sketch/paper.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}} />
			<div
				style={{
					position: 'absolute',
					inset: 0,
					backgroundImage: 'radial-gradient(circle, rgba(51,51,51,0.10) 1.4px, transparent 1.9px)',
					backgroundSize: '40px 40px',
					backgroundPosition: '20px 12px',
					WebkitMaskImage: 'linear-gradient(to bottom, transparent 150px, #000 330px, #000 1180px, transparent 1300px)',
					maskImage: 'linear-gradient(to bottom, transparent 150px, #000 330px, #000 1180px, transparent 1300px)',
					opacity: 0.9,
				}}
			/>

			<svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920} viewBox="0 0 1080 1920">
				<g transform={mapTf}>
					{pLasso > 0 ? <Ink geo={built.lasso} p={pLasso} lag={0.08} color={AMBER} width={6} opacity={0.85} /> : null}
					<Diagram scene={built.scene} ms={ms} vi={vi} endFade={noteOut} />
				</g>
			</svg>

			<TopLabel
				text={built.top.text}
				size={built.top.size}
				width={built.top.width}
				underline={built.top.line}
				ms={ms}
				from={hold + 250}
				opacity={uiIn * endOut}
			/>

			<CaptionBlock pages={built.pages} ms={ms} opacity={capIn * capOut} />

			<Cover c={built.cover} out={coverFade} sub={1 - clamp01(ms / 220)} />
			<EndCard e={built.end} t={endT} />

			<svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
				{restAlpha > 0 ? <Pencil pt={toScreen([648, 866])} alpha={restAlpha} ms={0} /> : null}
				{pen && penPt ? <Pencil pt={penPt} alpha={pen.alpha} ms={ms} /> : null}
			</svg>
		</AbsoluteFill>
	);
};
