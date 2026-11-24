import {measureText} from '@remotion/layout-utils';
import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, Html5Audio, interpolate, interpolateColors, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ensureFonts, SERIF} from '../lib/fonts';
import {SAFE} from '../lib/safe';
import type {EpisodeMeta, EpisodeProps} from '../lib/types';
import {Cover, coverModel} from './notes/Cover';
import {ExcerptCard, excerptLayout, SignOff, SIGNOFF_H} from './notes/EndCard';
import {IndexCard, indexCardTop} from './notes/IndexCard';
import type {Accent, KwRun, Measure, PageLayout, Row, Tok} from './notes/layout';
import {buildLayout} from './notes/layout';
import {AccentMark, Dot, Header, Marker, PageTitle, Paper, RuledLines} from './notes/parts';
import {scriptPunct} from './notes/punct';
import type {SfxEvent} from './notes/sound';
import {NotesSound} from './notes/sound';
import {
	ANCHOR,
	AUTHOR,
	BOOK,
	CAP,
	COVER,
	END,
	FADE_TOP,
	FAR_FACTOR,
	FAR_ROWS,
	GROUP_CAP,
	INK,
	INK_FRESH,
	INK_MS,
	MASK_CLEAR,
	MASK_SOLID,
	NOTES_TOP,
	OLD_ACCENT,
	OLD_KW,
	OLD_MARK_FADE,
	OLD_TEXT,
	PT_LH,
	PT_MIN,
	PT_SIZE,
	PT_TOP,
	ROW,
	START_ROW,
	TEXT_BOTTOM,
	TEXT_W,
	TEXT_X,
	VISIBLE,
} from './notes/theme';
import {useFontsReady} from './notes/useFontsReady';
import {useScript} from './notes/useScript';

ensureFonts();

/**
 * 建议的片尾时长（ms，最后一个字念完之后）：金句停 ≥1.2s、落款写完后静止 ≥2s。
 * lib/load.ts 目前对所有样式用同一个 TAIL_MS=1600（本片实际尾巴 ≈2.55s），见报告里的共享改动建议。
 * 本样式按实际尾巴长短自动压缩，尾巴越长越从容。
 */
export const NOTES_TAIL_MS = END.ideal;

// 「读书笔记」：暖纸笔记本，字随口播一个个“写”上去，关键词被荧光笔刷亮，红铅笔划线/圈数字/书名线，
// 句组写满就一两行地往上推；列举的要点钉成页脚的目录卡。
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const VIEW_TOP = NOTES_TOP - FADE_TOP;
const VIEW_H = FADE_TOP + (VISIBLE + 1) * ROW; // 多一行：滚动途中新行从下方淡入
const LAST_SOLID = NOTES_TOP + VISIBLE * ROW + 5; // 第 VISIBLE 行横线以下开始淡出
const VIEW_MASK = `linear-gradient(to bottom, transparent ${MASK_CLEAR - VIEW_TOP}px, #000 ${MASK_SOLID - VIEW_TOP}px, #000 ${LAST_SOLID - VIEW_TOP}px, transparent ${LAST_SOLID + 75 - VIEW_TOP}px)`;

const measurer =
	(weight: number, halt = false): Measure =>
	(text: string) =>
		text
			? measureText({text, fontFamily: SERIF, fontSize: 100, fontWeight: weight, additionalStyles: halt ? {fontFeatureSettings: '"halt"'} : undefined}).width
			: 0;
const M500 = measurer(500);
const M600 = measurer(600);
const M800 = measurer(800);
// 正文/本期标题整行开 OpenType halt：标点（，。、《》「」…）只占半格，量宽时也按 halt 量，排版和渲染一致
const M600H = measurer(600, true);
const M800H = measurer(800, true);

/** meta.json 里本样式认的可选字段（都可以不写） */
type MetaX = EpisodeMeta & {
	book?: string;
	author?: string;
	next?: string; // 下期讲什么：目录卡上圈出对应一项并标「下期」
	current?: number; // 本期是目录里的第几项（1 起）：该项带荧光
	index?: string[]; // 系列目录（不写就从口播里自动找“列举 ≥3 个关键词”的句子）
	indexTitle?: string;
	quoteSource?: string; // 'book' = meta.quote 是书里的原文（才会署「—— 《书名》」）
	quotePage?: string | number;
	bgm?: boolean; // false = 关掉本样式自带的垫乐/音效（比如管线已经混好了配乐）
};

const norm = (s: string) => s.replace(/[\s\p{P}\p{S}]/gu, '');
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 目录卡数据：meta.index 优先（按关键词对上口播时间），否则用 layout 自动找到的列举句 */
const indexOf = (layout: PageLayout, m: MetaX, endAt: number) => {
	const auto = layout.index;
	if (m.index && m.index.length) {
		const items = m.index.map((text) => {
			const run = layout.kw.find((r) => norm(r.text) === norm(text));
			return {text, at: run ? run.start : Infinity};
		});
		const first = Math.min(...items.map((it) => it.at));
		const appearAt = Number.isFinite(first) ? first - 450 : endAt;
		return {
			title: m.indexTitle || auto?.title || '系列目录',
			label: '系列目录',
			items: items.map((it, i) => ({text: it.text, at: Number.isFinite(it.at) ? it.at : appearAt + 150 + i * 90})),
			appearAt,
		};
	}
	if (!auto || !auto.items.length) return null;
	return {title: m.indexTitle || auto.title || '本期要点', label: '划重点', items: auto.items, appearAt: auto.items[0].at - 450};
};

/** 结尾时间线（ms，相对最后一个字念完）：尾巴越短越紧凑，但金句从不被撤掉 */
const endTimeline = (avail: number) => {
	const f = Math.max(0, Math.min(1, (avail - 1400) / (END.ideal - 1400)));
	const hold = lerp(END.holdMin, END.holdMax, f);
	const glide = lerp(END.glideMin, END.glideMax, f);
	const cta = lerp(END.ctaMin, END.ctaMax, f);
	return {f, hold, glide, cta};
};

export const Notes: React.FC<EpisodeProps> = ({episode, captions, meta}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const ready = useFontsReady();
	const script = useScript(captions ? episode : undefined);
	const m = (meta ?? {}) as MetaX;

	const layout: PageLayout | null = useMemo(() => {
		if (!ready || script === undefined || !captions || captions.lines.length === 0) return null;
		return buildLayout(captions, M600H, {
			base: CAP.base,
			min: CAP.min,
			shrinkOk: CAP.shrinkOk,
			width: TEXT_W,
			gapEm: CAP.gapEm,
			postPadEm: CAP.postPadEm,
			maxHang: TEXT_X - SAFE.left,
			lsEm: CAP.lsEm,
			lsMin: CAP.lsMin,
			anchor: ANCHOR,
			startRow: START_ROW,
			groupCap: GROUP_CAP,
			far: FAR_ROWS,
			revealStart: COVER.revealStartMs,
			catchupMs: COVER.catchupMs,
			punct: scriptPunct(captions, script),
		});
	}, [ready, script, captions]);

	// 封面 / 本期标题（封面大标题缩上去之后常驻页眉下）
	const cover = useMemo(() => {
		if (!ready || !captions) return null;
		const lines = captions.lines;
		// 没有 meta：用第一句口播做封面（只取第一行，太长的钩子在封面上不成立）
		const fallback = lines.length ? lines[0].text.trim().replace(/\s+/g, '，') : '';
		const model = coverModel(m.cover || m.title || fallback, m.cover ? m.title || '' : '', captions.keywords ?? [], M800);
		// 本期标题：一行放下整句钩子；放不下就只用 meta.cover
		const fitOne = (text: string) => {
			const cs = Array.from(text);
			const w = M800H(text);
			const ls = 0.02;
			const size = Math.min(PT_SIZE, (TEXT_W * 100) / (w + cs.length * ls * 100));
			return {text, size: Math.floor(size * 10) / 10, ls};
		};
		let pt = fitOne(model.hook.replace(/\s+/g, ''));
		if (pt.size < PT_MIN && m.cover) pt = fitOne(m.cover);
		pt.size = Math.max(PT_MIN - 4, pt.size);
		const markRaw = (model.lines[model.markLine] ?? '').replace(/[\s，。、；：！？,.;:!?…]+$/u, '');
		const mark = markRaw && pt.text.includes(markRaw) ? markRaw : '';
		return {model, pt, mark};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ready, captions, meta]);

	// 每行的红铅笔批注
	const accByRow = useMemo(() => {
		const map = new Map<number, Accent[]>();
		layout?.accents.forEach((a) => {
			if (!map.has(a.row)) map.set(a.row, []);
			map.get(a.row)?.push(a);
		});
		return map;
	}, [layout]);

	// meta.book 约定只写书名（不带书名号），这里补上《》
	const book = m.book ? (m.book.includes('《') ? m.book : `《${m.book}》`) : BOOK;
	const author = m.author || AUTHOR;
	const ep = (m.episodeNo || '').replace(/^\s*EP\.?\s*/i, '').trim();
	const series = m.series || '';

	if (!captions || !ready || !layout || !cover) {
		return (
			<AbsoluteFill>
				<Paper />
				{captions ? <Html5Audio src={staticFile(captions.audio)} /> : null}
			</AbsoluteFill>
		);
	}

	const ms = (frame / fps) * 1000;
	const totalMs = (durationInFrames / fps) * 1000;
	const lines = captions.lines;
	const lastLine = lines[lines.length - 1];
	const lastEnd = Math.max(lastLine.endMs, ...layout.kw.filter((k) => k.line === lines.length - 1).map((k) => k.end));

	// ---------- 封面 → 本期标题 ----------
	const morph = interpolate(frame, [COVER.holdEnd, COVER.morphEnd], [0, 1], clamp);
	const extras = interpolate(frame, [COVER.holdEnd + 6, COVER.morphEnd + 4], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
	const ptA = interpolate(morph, [0.6, 0.9], [0, 1], clamp);
	const notesIn = interpolate(frame, [COVER.morphEnd - 6, COVER.morphEnd + 2], [0, 1], clamp);

	// ---------- 结尾 ----------
	const finalG = layout.lineGroup[lines.length - 1];
	const finalRows = layout.groupRows[finalG];
	const k = finalRows.last - finalRows.first + 1;
	const quote = (m.quote || '').trim();
	const finalText = norm(lines.filter((_, i) => layout.lineGroup[i] === finalG).map((l) => l.text).join(''));
	const fromBook = m.quoteSource === 'book';
	// 摘句卡只在它真的带来新东西时出现：书中原文，或和最后一句不同的主播总结；否则金句本身就是结尾
	const useExcerpt = !!quote && (fromBook || !(norm(quote) === finalText || finalText.includes(norm(quote)) || norm(quote).includes(finalText)));
	const tl = endTimeline(totalMs - lastEnd);
	const endAt = lastEnd + tl.hold;
	const endT = ms - endAt;
	const oldFade = interpolate(endT, [0, 300], [1, 0], clamp); // 旧笔记退场
	let ctaAt: number;
	let signTop: number;
	let glideRows = 0;
	const scrollEnd = layout.scroll.reduce((a, e) => a + e.rows, 0);
	let excerpt: React.ReactNode = null;
	let cardAtMs: number | null = null;
	const idx = indexOf(layout, m, endAt);
	const floor = idx ? indexCardTop(idx.items, M600) - 30 : TEXT_BOTTOM; // 落款不能压到目录卡
	if (!useExcerpt) {
		// 金句滑到“本期标题”和目录卡之间，落款写在它下面；整块上下居中（横线跟着一起滑，字仍然压在线上）
		const areaTop = PT_TOP + PT_LH + 30;
		const blockH = k * ROW + 30 + SIGNOFF_H;
		const top = areaTop + Math.max(0, (floor - areaTop - blockH) / 2);
		const targetRel = Math.max(0, Math.min(VISIBLE - k, (top - NOTES_TOP) / ROW));
		const want = Math.max(0, finalRows.first - targetRel - scrollEnd);
		const g = spring({frame: Math.max(0, (endT / 1000) * fps), fps, config: {damping: 20, stiffness: 110, mass: 0.9}, durationInFrames: Math.round((tl.glide / 1000) * fps)});
		glideRows = want * (endT > 0 ? g : 0);
		ctaAt = endAt + tl.glide * 0.55;
		signTop = NOTES_TOP + (targetRel + k) * ROW + 30;
	} else {
		const cardAt = endAt + 260;
		cardAtMs = cardAt;
		const build = lerp(700, 1400, tl.f);
		const cardTop = NOTES_TOP + 20;
		const {cardH} = excerptLayout(quote, M500);
		excerpt = (
			<ExcerptCard
				t={ms - cardAt}
				fps={fps}
				build={build}
				quote={quote}
				fromBook={fromBook}
				book={book}
				page={m.quotePage !== undefined ? String(m.quotePage) : undefined}
				top={cardTop}
				measure500={M500}
			/>
		);
		ctaAt = cardAt + build * 0.8;
		signTop = cardTop + cardH + 60;
	}

	// ---------- 锚定滚动：每次 1~2 行，弹簧时长随停顿长短 ----------
	const scrollRows =
		layout.scroll.reduce((acc, ev) => {
			const f = frame - (ev.t / 1000) * fps;
			if (f <= 0) return acc;
			const dur = Math.max(10, Math.round((ev.durMs / 1000) * fps));
			return acc + ev.rows * spring({frame: f, fps, config: {mass: 1, damping: 22, stiffness: 90}, durationInFrames: dur});
		}, 0) + glideRows;
	const scrollPx = scrollRows * ROW;

	// 音效：荧光笔刷过（封面追写期间的不算，相隔太近的合并）、卡片贴上
	const sfx: SfxEvent[] = [];
	let lastSwipe = -Infinity;
	for (const run of layout.kw) {
		if (run.start < COVER.revealStartMs + 200 || run.start - lastSwipe < 380) continue;
		sfx.push({ms: run.start, kind: 'swipe'});
		lastSwipe = run.start;
	}
	if (idx) sfx.push({ms: idx.appearAt + 40, kind: 'paper'});
	if (cardAtMs !== null) sfx.push({ms: cardAtMs + 40, kind: 'paper'});

	const chapterW = m.chapter ? (M600(m.chapter) / 100) * 28 + Array.from(m.chapter).length * 0.06 * 28 : 0;

	return (
		<AbsoluteFill style={{backgroundColor: '#F4EDE1'}}>
			<Html5Audio src={staticFile(captions.audio)} />
			{m.bgm !== false ? <NotesSound fps={fps} durationInFrames={durationInFrames} captions={captions} events={sfx} /> : null}
			<Paper />

			{/* 页面框架：不参与任何缩放/漂移，细线不会逐帧重栅格化发虚 */}
			<RuledLines scrollPx={scrollPx} />
			<Header book={book} author={author} chapter={m.chapter} ep={ep} extras={extras} chapterW={chapterW} />
			<PageTitle text={cover.pt.text} mark={cover.mark} size={cover.pt.size} ls={cover.pt.ls} opacity={ptA} />

			{/* 笔记视窗 */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: VIEW_TOP,
					height: VIEW_H,
					overflow: 'hidden',
					WebkitMaskImage: VIEW_MASK,
					maskImage: VIEW_MASK,
					opacity: notesIn * (useExcerpt ? oldFade : 1),
				}}
			>
				<div style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${FADE_TOP - scrollPx}px)`}}>
					{layout.rows.map((row, ri) => {
						const rel = row.row - scrollRows;
						if (rel < -1.2 || rel > VISIBLE + 1) return null;
						const first = row.toks[0];
						if (!first || ms < first.r - 50) return null; // 还没写到这一行
						const endA = row.group === finalG ? 1 : oldFade;
						if (endA <= 0) return null;
						return <NoteRow key={row.key} row={row} rel={rel} ms={ms} layout={layout} accents={accByRow.get(ri)} endA={endA} />;
					})}
				</div>
			</div>

			{idx ? (
				<IndexCard
					title={idx.title}
					label={idx.label}
					items={idx.items}
					ms={ms}
					fps={fps}
					appearAt={idx.appearAt}
					next={m.next}
					nextAt={ctaAt + 200}
					current={m.current}
					measure600={M600}
				/>
			) : null}

			{excerpt}
			<SignOff t={ms - ctaAt} dur={tl.cta} series={series} top={Math.min(signTop, floor - SIGNOFF_H)} />

			<Cover
				model={cover.model}
				series={series}
				epLabel={m.episodeNo ? `读书笔记 · ${m.episodeNo}` : '读书笔记'}
				chapter={m.chapter}
				measure600={M600}
				morph={morph}
				target={{top: PT_TOP, size: cover.pt.size, lh: PT_LH}}
			/>
		</AbsoluteFill>
	);
};

// ---------- 一行笔记 ----------
const NoteRow: React.FC<{row: Row; rel: number; ms: number; layout: PageLayout; accents?: Accent[]; endA: number}> = ({row, rel, ms, layout, accents, endA}) => {
	// 滚出第 0 行时整行化开，而不是被视窗上缘切成半截字
	const exitA = interpolate(rel, [-0.75, -0.05], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
	const nextG = layout.groupStart[row.group + 1];
	// 0 = 当前句组, 1 = 旧笔记（最后一组没有“下一组”，永远是当前）
	const age = nextG !== undefined && Number.isFinite(nextG) ? interpolate(ms, [nextG, nextG + 520], [0, 1], clamp) : 0;
	// 离当前行很远的旧笔记再淡一档，保证当前句组永远是全页对比度最高的
	const farP = Number.isFinite(row.farAt) ? interpolate(ms, [row.farAt, row.farAt + 520], [0, 1], clamp) : 0;
	const far = 1 - (1 - FAR_FACTOR) * farP * age;
	const textA = (1 - (1 - OLD_TEXT) * age) * far;
	const kwA = (1 - (1 - OLD_KW) * age) * far;
	const markA = 0.76 * (1 - OLD_MARK_FADE * age) * far;
	const accA = (1 - (1 - OLD_ACCENT) * age) * far;

	// 把同一关键词的字块聚成一段，统一画荧光笔
	const segs: (Tok | Tok[])[] = [];
	row.toks.forEach((t) => {
		const last = segs[segs.length - 1];
		if (t.kw >= 0 && Array.isArray(last) && last[0].kw === t.kw) last.push(t);
		else if (t.kw >= 0) segs.push([t]);
		else segs.push(t);
	});

	const lastTok = row.toks[row.toks.length - 1];
	const ink = (t: Tok, text: string, alpha: number, key: string, dim = 1, post = false) => {
		if (!text) return null;
		const a = interpolate(ms, [t.r, t.r + INK_MS], [0, 1], clamp);
		// 行内标点（已 halt 成半角）后补一点呼吸，和 layout 的 postPadEm 一致
		const hs = post && t !== lastTok ? {marginRight: `${CAP.postPadEm}em`} : null;
		if (a <= 0) return <span key={key} style={{display: 'inline-block', opacity: 0, ...hs}}>{text}</span>;
		const color = interpolateColors(ms, [t.r, t.r + 380], [INK_FRESH, INK]);
		const dy = interpolate(ms, [t.r, t.r + 200], [5, 0], {...clamp, easing: Easing.out(Easing.quad)});
		return (
			<span
				key={key}
				style={{
					display: 'inline-block',
					position: 'relative',
					zIndex: 1,
					opacity: a * alpha * dim,
					color,
					transform: `translateY(${dy}px)`,
					...hs,
				}}
			>
				{text}
			</span>
		);
	};
	const postDim = (t: Tok) => (t.synth ? 0.6 : 1);
	const gap = (t: Tok, key: string) =>
		t.gap && !t.post && t !== lastTok ? <span key={key} style={{display: 'inline-block', width: `${CAP.gapEm}em`}} /> : null;

	const first = row.toks[0];
	const dotP = interpolate(ms, [first.r - 60, first.r + 200], [0, 1], {...clamp, easing: Easing.out(Easing.back(2))});

	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: row.row * ROW, height: ROW, opacity: exitA * endA}}>
			{row.groupFirst ? <Dot progress={dotP} opacity={0.62 * (1 - 0.45 * age) * far} style={{left: 37, top: ROW / 2 - 3}} /> : null}
			<div
				style={{
					position: 'absolute',
					left: TEXT_X + row.hang,
					top: 0,
					height: ROW,
					lineHeight: `${ROW}px`,
					fontFamily: SERIF,
					fontWeight: CAP.weight,
					fontSize: row.fontSize,
					letterSpacing: `${row.ls}em`,
					whiteSpace: 'pre',
					color: INK,
					fontFeatureSettings: '"halt"',
				}}
			>
				{accents?.map((ac) => (
					<AccentMark
						key={`a${ac.id}`}
						kind={ac.kind}
						x0={ac.x0}
						x1={ac.x1}
						fontSize={row.fontSize}
						progress={interpolate(ms, ac.t, ac.v, clamp)}
						opacity={accA}
						seed={ac.id}
					/>
				))}
				{segs.map((sg, si) => {
					if (!Array.isArray(sg)) {
						return (
							<React.Fragment key={si}>
								{ink(sg, sg.pre + sg.core, textA, `c${si}`)}
								{ink(sg, sg.post, textA, `p${si}`, postDim(sg), true)}
								{gap(sg, `g${si}`)}
							</React.Fragment>
						);
					}
					const run: KwRun = layout.kw[sg[0].kw];
					const p = interpolate(ms, run.t, run.v, clamp);
					const head = sg[0];
					const tail = sg[sg.length - 1];
					return (
						<React.Fragment key={si}>
							{ink(head, head.pre, textA, `q${si}`)}
							<span style={{position: 'relative', display: 'inline-block'}}>
								<Marker progress={p} opacity={markA} variant={run.id} top="45%" height="0.5em" />
								{sg.map((t, ti) => ink(t, t.core, kwA, `k${ti}`))}
							</span>
							{ink(tail, tail.post, textA, `p${si}`, postDim(tail), true)}
							{gap(tail, `g${si}`)}
						</React.Fragment>
					);
				})}
			</div>
		</div>
	);
};
