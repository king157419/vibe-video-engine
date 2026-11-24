import type React from 'react';
import {SANS, SERIF} from '../../lib/fonts';
import type {Measure} from './layout';
import {wrapText} from './layout';
import {Marker, Pencil} from './parts';
import {INK, inkA, RED, redA, TEXT_W, TEXT_X} from './theme';

const glyphs = (s: string) => Array.from(s).length;
const TITLE_LS = 0.03;
const PUNCT = /[\s\p{P}\p{S}]/gu;
const PUNCT1 = /[\s\p{P}\p{S}]/u;
const norm = (s: string) => s.replace(PUNCT, '');
const NATURAL = /[\s，。、；：！？,.;:!?…—]$/u;
const NO_LINE_START = /^[，。、；：！？,.;:!?…》」』”’）)】]/u;

/**
 * 封面文案：meta.cover 是钩子，meta.title 常常是“钩子 + 后半句”。
 * - title 以 cover 开头 → 直接用整句 title 做两段式钩子（「你不是矫情，」/「是心里那个小孩在喊你」），不再单独放副标题
 * - title 和 cover 基本相同 → 只放 cover
 * - 否则 cover 做大标题，title 做副标题
 */
export const coverText = (cover: string, title: string): {hook: string; sub: string; split: number} => {
	const c = cover.trim();
	const t = title.trim();
	const nc = norm(c);
	const nt = norm(t);
	if (!nc) return {hook: t, sub: '', split: -1};
	if (!nt || nc === nt || nc.includes(nt)) return {hook: c, sub: '', split: -1};
	if (nt.startsWith(nc) || nt.includes(nc)) {
		// 找到 title 里 cover 结束的位置（跳过标点），把紧跟的标点也算进第一段
		const cs = Array.from(t);
		let k = 0;
		let seen = 0;
		const start = nt.indexOf(nc);
		while (k < cs.length && seen < start + nc.length) {
			if (!PUNCT1.test(cs[k])) seen++;
			k++;
		}
		while (k < cs.length && /[，。、；：！？,.;:!?…\s]/.test(cs[k])) k++;
		if (start === 0) return {hook: t, sub: '', split: k < cs.length ? k : -1};
		// 钩子在标题后半句（「为什么你总是 / 害怕被丢下」）：在钩子开头断行
		let j = 0;
		let n = 0;
		while (j < cs.length && n < start) {
			if (!PUNCT1.test(cs[j])) n++;
			j++;
		}
		while (j < cs.length && PUNCT1.test(cs[j])) j++;
		return {hook: t, sub: '', split: j > 0 && j < cs.length ? j : -1};
	}
	return {hook: c, sub: t, split: -1};
};

/** 大标题折行：1~3 行、同一字号，尽量大；断在标点/前后两段的分界处，不留孤字，不在书名号里断 */
export const coverTitleLayout = (text: string, m: Measure, split = -1): {lines: string[]; size: number} => {
	const w = (s: string) => m(s) + glyphs(s) * TITLE_LS * 100;
	const cs = Array.from(text.replace(/\s+/g, ' ').trim());
	if (!cs.length) return {lines: [], size: 150};
	const n = cs.length;
	const inBook: boolean[] = [];
	let depth = 0;
	cs.forEach((ch) => {
		inBook.push(depth > 0);
		if (ch === '《') depth++;
		if (ch === '》') depth = Math.max(0, depth - 1);
	});
	const lineOf = (a: number, b: number) => cs.slice(a, b).join('').trim();
	const pen = (p: number): number | null => {
		const rest = cs.slice(p).join('').trimStart();
		if (!rest || NO_LINE_START.test(rest)) return null;
		if (inBook[p] && cs[p - 1] !== '《') return 30;
		if (p === split) return -6; // 两段式钩子的分界：最想断这里
		return NATURAL.test(cs.slice(0, p).join('')) ? 0 : 14;
	};
	let best: {lines: string[]; size: number; score: number} | null = null;
	const consider = (cuts: number[]) => {
		const b = [0, ...cuts, n];
		const lines: string[] = [];
		let penalty = 0;
		for (let i = 0; i < b.length - 1; i++) lines.push(lineOf(b[i], b[i + 1]).replace(/\s+$/, ''));
		for (const c of cuts) {
			const pc = pen(c);
			if (pc === null) return;
			penalty += pc;
		}
		if (lines.some((l) => !l)) return;
		const cap = lines.length === 1 ? 170 : lines.length === 2 ? 150 : 136;
		const ws = lines.map(w);
		const size = Math.min(cap, (TEXT_W / Math.max(...ws)) * 100);
		let score = size - penalty - (lines.length - 1) * 3;
		if (lines.length > 1) score -= ((Math.max(...ws) - Math.min(...ws)) / Math.max(...ws)) * 6;
		if (lines.some((l) => glyphs(l.replace(PUNCT, '')) <= 2) && lines.length > 1) score -= 40;
		if (!best || score > best.score) best = {lines, size, score};
	};
	consider([]);
	for (let a = 1; a < n; a++) {
		consider([a]);
		for (let b = a + 1; b < n; b++) consider([a, b]);
	}
	const r = best as {lines: string[]; size: number; score: number} | null;
	if (!r) return {lines: [cs.join('')], size: 72};
	return {lines: r.lines, size: Math.floor(Math.max(64, r.size))};
};

// 页边上的红铅笔星号（学生画重点的记号）
const STAR = 'M16 2 L16 30 M3 9 L29 23 M3 23 L29 9';

export type CoverModel = {
	hook: string; // 两段式钩子（大标题全文）
	sub: string;
	lines: string[];
	size: number;
	lh: number;
	markLine: number; // 哪一行画荧光笔
};

export const coverModel = (cover: string, title: string, keywords: string[], measure800: Measure): CoverModel => {
	const {hook, sub, split} = coverText(cover, title);
	const {lines, size} = coverTitleLayout(hook, measure800, split);
	// 荧光笔画在哪一行：含关键词的最后一行，否则最后一行
	let markLine = lines.length - 1;
	for (let i = lines.length - 1; i >= 0; i--) {
		if (keywords.some((k) => k && lines[i].includes(k))) {
			markLine = i;
			break;
		}
	}
	return {hook, sub, lines, size, lh: Math.round(size * 1.18), markLine};
};

/**
 * 封面（第 0 帧就是封面图）。morph 0→1：大标题缩小、飞到页眉下成为常驻的“本期标题”，其余元素先淡出。
 * target = 本期标题的位置/字号（由 Notes 算好，保证缩上去的落点和常驻标题重合）
 */
export const Cover: React.FC<{
	model: CoverModel;
	series: string;
	epLabel: string;
	chapter?: string;
	measure600: Measure;
	morph: number; // 0 = 完整封面, 1 = 已变成本期标题
	target: {top: number; size: number; lh: number};
}> = ({model, series, epLabel, chapter, measure600, morph, target}) => {
	if (morph >= 1) return null;
	const {sub, lines, size, lh, markLine} = model;
	const subSize = 44;
	const subLH = Math.round(subSize * 1.5);
	const subLines = sub ? wrapText(sub, TEXT_W, subSize, measure600).slice(0, 2) : [];

	// 垂直节奏：章 → 标题 → (副标题) → 系列 → 本期，整块以 y≈860 为中心
	const TAG_H = 52;
	const heights = {
		tag: TAG_H + 40,
		title: lines.length * lh,
		sub: subLines.length ? 30 + subLines.length * subLH : 0,
		series: series ? 64 + 40 : 0,
		chapter: chapter ? (series ? 50 : 64) + 46 : 0,
	};
	const blockH = heights.tag + heights.title + heights.sub + heights.series + heights.chapter;
	const tagTop = Math.round(Math.max(430, Math.min(1400 - blockH, 860 - blockH / 2)));
	const titleTop = tagTop + heights.tag;
	const subTop = titleTop + heights.title + 30;
	const seriesTop = titleTop + heights.title + heights.sub + 64;
	const chapterTop = (series ? seriesTop + 40 : titleTop + heights.title + heights.sub) + (series ? 50 : 64);

	// 其余元素：前 35% 就淡掉，并轻轻上移
	const restA = 1 - Math.min(1, morph / 0.35);
	const lift = (k: number) => `translateY(${-40 * Math.min(1, morph / 0.35) * (1 + k * 0.2)}px)`;
	// 大标题：缩放 + 平移到本期标题的位置；到 60% 以后淡出，交给常驻标题
	const p = morph < 0.5 ? 4 * morph * morph * morph : 1 - Math.pow(-2 * morph + 2, 3) / 2; // easeInOutCubic
	const s = target.size / size;
	const ty = target.top + target.lh / 2 - titleTop - (lh * s) / 2;
	const titleA = 1 - Math.min(1, Math.max(0, (morph - 0.45) / 0.3));

	return (
		<div style={{position: 'absolute', inset: 0}}>
			{/* 读书笔记 · EPxx 小标签（像盖上去的章） */}
			<div
				style={{
					position: 'absolute',
					left: TEXT_X,
					top: tagTop,
					opacity: restA,
					transform: `${lift(0)} rotate(-2deg)`,
					transformOrigin: 'left center',
					fontFamily: SERIF,
					fontSize: 30,
					fontWeight: 600,
					letterSpacing: '0.14em',
					lineHeight: '40px',
					color: RED,
					padding: '4px 14px 4px 18px',
					border: `2.5px solid ${redA(0.85)}`,
					borderRadius: 6,
					whiteSpace: 'pre',
				}}
			>
				{epLabel}
			</div>

			{/* 页边红星 */}
			<div style={{opacity: restA}}>
				<Pencil d={STAR} w={32} h={32} width={3.4} progress={1} style={{left: 22, top: titleTop + lh * 0.5 - 16}} />
			</div>

			{/* 大标题 */}
			<div
				style={{
					position: 'absolute',
					left: TEXT_X,
					top: titleTop,
					opacity: titleA,
					transform: `translateY(${ty * p}px) scale(${1 + (s - 1) * p})`,
					transformOrigin: '0 0',
				}}
			>
				{lines.map((l, i) => {
					const hang = /^[《「『“‘（(【]/.test(l) ? -0.45 * size : 0;
					return (
						<div
							key={i}
							style={{
								position: 'relative',
								marginLeft: hang,
								fontFamily: SERIF,
								fontWeight: 800,
								fontSize: size,
								lineHeight: `${lh}px`,
								letterSpacing: `${TITLE_LS}em`,
								color: INK,
								whiteSpace: 'pre',
							}}
						>
							<span style={{position: 'relative', display: 'inline-block'}}>
								{i === markLine ? <Marker progress={1} opacity={0.8} variant={1} top="54%" height="0.42em" left="-0.06em" right="0.01em" tilt={-0.8} /> : null}
								<span style={{position: 'relative', zIndex: 1}}>{l}</span>
							</span>
						</div>
					);
				})}
			</div>

			{/* 副标题（只有和大标题不重复时才有） */}
			{subLines.length ? (
				<div
					style={{
						position: 'absolute',
						left: TEXT_X,
						top: subTop,
						opacity: restA,
						transform: lift(2),
						fontFamily: SERIF,
						fontWeight: 500,
						fontSize: subSize,
						lineHeight: `${subLH}px`,
						color: inkA(0.8),
						whiteSpace: 'pre',
					}}
				>
					{subLines.map((l, i) => (
						<div key={i}>{l}</div>
					))}
				</div>
			) : null}

			{/* 系列名 */}
			{series ? (
				<div
					style={{
						position: 'absolute',
						left: TEXT_X,
						top: seriesTop,
						height: 40,
						opacity: restA,
						transform: lift(3),
						display: 'flex',
						alignItems: 'center',
						gap: 18,
					}}
				>
					<div style={{width: 56, height: 2, background: redA(0.8)}} />
					<div style={{fontFamily: SANS, fontSize: 30, fontWeight: 500, letterSpacing: '0.24em', color: inkA(0.64), whiteSpace: 'pre'}}>{series}</div>
				</div>
			) : null}

			{/* 本期章节（红铅笔批注） */}
			{chapter ? (
				<div
					style={{
						position: 'absolute',
						left: TEXT_X,
						top: chapterTop,
						opacity: restA,
						transform: lift(4),
						fontFamily: SERIF,
						fontSize: 34,
						fontWeight: 600,
						letterSpacing: '0.06em',
						color: RED,
						whiteSpace: 'pre',
						lineHeight: '46px',
					}}
				>
					<span style={{fontFamily: SANS, fontSize: 24, fontWeight: 500, letterSpacing: '0.3em', color: redA(0.78), marginRight: 16}}>本期</span>
					{chapter}
				</div>
			) : null}
		</div>
	);
};
