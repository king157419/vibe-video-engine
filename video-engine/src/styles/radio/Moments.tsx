import {SANS, SERIF} from '../../lib/fonts';
import type {CapLine} from '../../lib/types';
import {toCells, width100} from './layout';
import {amber, clamp01, cream, CX, easeInOut, easeOut, MOMENT_IN_MS, MOMENT_MAXW, MOMENT_OUT_MS, MOMENT_Y} from './theme';

/**
 * 「内容时刻」：口播里提到的东西在频谱下方留一个小小的实物感提示。
 * - book：某行出现《书名》时，从念到书名起，一直留到下一句结束；
 * - chips：某行有 ≥3 个关键词时，每念到一个就落下一枚琥珀胶囊，留到下一个句末。
 * 两个时刻重叠时，后来的顶掉先来的。全部在最后一句念完前收掉，给结尾卡让位。
 */
export type Moment =
	| {kind: 'book'; title: string; start: number; end: number}
	| {kind: 'chips'; items: {text: string; at: number}[]; start: number; end: number};

export const findMoments = (lines: CapLine[], starts: number[][]): Moment[] => {
	if (!lines.length) return [];
	const groupOf: number[] = [];
	const groupEnd: number[] = [];
	let g = 0;
	for (const l of lines) {
		groupOf.push(g);
		groupEnd[g] = l.endMs;
		if (l.sentenceEnd) g++;
	}
	const lastEnd = lines[lines.length - 1].endMs;
	const out: Moment[] = [];
	lines.forEach((line, i) => {
		const gi = groupOf[i];
		const nextSentenceEnd = groupEnd[gi + 1] ?? line.endMs + 1500;
		// 《书名》：只认同一行内成对的书名号
		const txt = line.chars.map((c) => c.t).join('');
		const m = /《([^《》\s]{1,24})》/.exec(txt);
		if (m) {
			let acc = 0;
			let at = line.startMs;
			for (let ci = 0; ci < line.chars.length; ci++) {
				const len = line.chars[ci].t.length;
				if (m.index < acc + len) {
					at = starts[i]?.[ci] ?? line.chars[ci].s;
					break;
				}
				acc += len;
			}
			out.push({kind: 'book', title: m[1], start: at, end: nextSentenceEnd});
		}
		// 关键词：连续的 hl 字（中间没有停顿）算一个词
		const items: {text: string; at: number}[] = [];
		let cur: {text: string; at: number} | null = null;
		for (const cell of toCells(line)) {
			if (!cell.hl) {
				cur = null;
				continue;
			}
			if (!cur) {
				cur = {text: '', at: starts[i]?.[cell.ci] ?? line.chars[cell.ci].s};
				items.push(cur);
			}
			cur.text += cell.t.replace(/[，。、！？；：,.!?;:…—]/g, '');
			if (cell.gapAfter) cur = null;
		}
		const words = items.filter((w) => w.text.length > 0);
		if (words.length >= 3) {
			out.push({
				kind: 'chips',
				items: words,
				start: words[0].at,
				end: line.sentenceEnd ? nextSentenceEnd : groupEnd[gi],
			});
		}
	});
	out.sort((a, b) => a.start - b.start);
	for (let k = 0; k < out.length; k++) {
		const next = out[k + 1];
		if (next) out[k].end = Math.min(out[k].end, next.start - MOMENT_OUT_MS);
		// 最后一句念完就收，结尾卡要用这块地方
		out[k].end = Math.min(out[k].end, lastEnd - MOMENT_OUT_MS * 0.5);
	}
	return out.filter((mo) => mo.end - mo.start > 700);
};

const vis = (mo: Moment, ms: number) => {
	const pIn = easeOut(clamp01((ms - mo.start) / MOMENT_IN_MS));
	const pOut = easeInOut(clamp01((ms - mo.end) / MOMENT_OUT_MS));
	return {pIn, o: pIn * (1 - pOut)};
};

const BOOK_FONT = {family: SERIF, weight: 500, letterSpacingEm: 0.08};
const CHIP_FONT = {family: SANS, weight: 500, letterSpacingEm: 0.08};

/** 书名牌：细琥珀框 + 宋体书名 + 一条小书签丝带 */
const BookPlate: React.FC<{title: string; pIn: number; o: number; fontsReady: boolean}> = ({title, pIn, o, fontsReady}) => {
	const text = `《${title}》`;
	const padX = 46;
	const fs = Math.min(40, (MOMENT_MAXW - padX * 2 - 20) / Math.max(1e-6, width100(text, BOOK_FONT, fontsReady) / 100));
	const h = fs * 1.4 + 40;
	return (
		<div
			style={{
				position: 'absolute',
				left: CX - MOMENT_MAXW / 2,
				width: MOMENT_MAXW,
				top: MOMENT_Y - h / 2,
				display: 'flex',
				justifyContent: 'center',
				opacity: o,
				transform: `translateY(${((1 - pIn) * 16).toFixed(2)}px)`,
			}}
		>
			<div
				style={{
					position: 'relative',
					height: h,
					padding: `0 ${padX}px`,
					display: 'flex',
					alignItems: 'center',
					border: `1.5px solid ${amber(0.5)}`,
					borderRadius: 6,
					background: `linear-gradient(180deg, ${amber(0.07)}, ${amber(0.025)})`,
				}}
			>
				{/* 书签丝带：从上边框垂下来 */}
				<div
					style={{
						position: 'absolute',
						right: 26,
						top: -2,
						width: 12,
						height: 26 + 10 * pIn,
						background: amber(0.8),
						clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 74%, 0 100%)',
					}}
				/>
				<div
					style={{
						fontFamily: SERIF,
						fontWeight: 500,
						fontSize: fs,
						lineHeight: 1.4,
						letterSpacing: '0.08em',
						color: cream(0.88),
						whiteSpace: 'nowrap',
					}}
				>
					{text}
				</div>
			</div>
		</div>
	);
};

/**
 * 关键词胶囊：每念到一个就落下一枚。一排时从中间长出来——新胶囊出现时整排平滑地重新居中
 * （每枚按出现进度占位），不会有一枚孤零零地停在最左边。放不下时缩字（≥28px），再不行才折行。
 */
const Chips: React.FC<{items: {text: string; at: number}[]; o: number; ms: number; fontsReady: boolean}> = ({
	items,
	o,
	ms,
	fontsReady,
}) => {
	const GAP = 14;
	const chipW = (text: string, fs: number) => (width100(text, CHIP_FONT, fontsReady) / 100 + 0.08) * fs + fs * 1.24 + 2;
	const natural = (fs: number) => items.reduce((s, it) => s + chipW(it.text, fs), 0) + GAP * (items.length - 1);
	// natural(fs) = a·fs + b；估算留 6% 余量（亚像素取整等），宁可小一点也别折成两排
	const M = 1.06;
	const b = 2 * items.length + GAP * (items.length - 1);
	const a = (natural(34) - b) / 34;
	const fs = Math.min(34, Math.max(28, (MOMENT_MAXW / M - b) / Math.max(1e-6, a)));
	const oneRow = natural(fs) * M <= MOMENT_MAXW + 0.5;
	const chipH = fs * 1.3 + fs * 0.5 + 2;
	const ps = items.map((it) => easeOut(clamp01((ms - it.at) / 360)));
	const chipStyle = (p: number): React.CSSProperties => ({
		height: chipH,
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 999,
		border: `1px solid ${amber(0.3)}`,
		background: amber(0.12),
		fontFamily: SANS,
		fontWeight: 500,
		fontSize: fs,
		lineHeight: 1.3,
		letterSpacing: '0.08em',
		color: amber(0.95),
		whiteSpace: 'nowrap',
		opacity: p,
	});
	const top = MOMENT_Y - 20 - chipH / 2;
	if (oneRow) {
		const ws = items.map((it) => chipW(it.text, fs));
		const total = ws.reduce((s, w, k) => s + ps[k] * (w + (k ? GAP : 0)), 0);
		let x = CX - total / 2;
		return (
			<div style={{position: 'absolute', left: 0, top, width: 0, height: chipH, opacity: o}}>
				{items.map((it, k) => {
					const p = ps[k];
					if (k) x += p * GAP;
					const left = x;
					x += p * ws[k];
					if (p <= 0.002) return null;
					return (
						<div
							key={k}
							style={{
								...chipStyle(p),
								position: 'absolute',
								left,
								top: 0,
								width: ws[k],
								transform: `translateY(${((1 - p) * 14).toFixed(2)}px) scale(${(0.9 + 0.1 * p).toFixed(4)})`,
								transformOrigin: '0% 50%',
							}}
						>
							<span style={{paddingLeft: '0.08em'}}>{it.text}</span>
						</div>
					);
				})}
			</div>
		);
	}
	return (
		<div
			style={{
				position: 'absolute',
				left: CX - MOMENT_MAXW / 2,
				width: MOMENT_MAXW,
				top,
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: 'center',
				gap: GAP,
				opacity: o,
			}}
		>
			{items.map((it, k) => (
				<div
					key={k}
					style={{
						...chipStyle(ps[k]),
						padding: `0 ${(fs * 0.62).toFixed(1)}px`,
						transform: `translateY(${((1 - ps[k]) * 14).toFixed(2)}px)`,
					}}
				>
					<span style={{paddingLeft: '0.08em'}}>{it.text}</span>
				</div>
			))}
		</div>
	);
};

export const Moments: React.FC<{moments: Moment[]; ms: number; fontsReady: boolean}> = ({moments, ms, fontsReady}) => {
	const nodes: React.ReactNode[] = [];
	moments.forEach((mo, k) => {
		if (ms < mo.start || ms > mo.end + MOMENT_OUT_MS) return;
		const {pIn, o} = vis(mo, ms);
		if (o <= 0.002) return;
		nodes.push(
			mo.kind === 'book' ? (
				<BookPlate key={k} title={mo.title} pIn={pIn} o={o} fontsReady={fontsReady} />
			) : (
				<Chips key={k} items={mo.items} o={o} ms={ms} fontsReady={fontsReady} />
			),
		);
	});
	return <>{nodes}</>;
};
