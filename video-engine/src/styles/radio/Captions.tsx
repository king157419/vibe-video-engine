import {SANS} from '../../lib/fonts';
import {SAFE, SAFE_W} from '../../lib/safe';
import type {CapLine} from '../../lib/types';
import type {LineLayout} from './layout';
import {GAP_EM} from './layout';
import {amber, CAPTION_Y, clamp01, cream, creamToAmber, easeOut, KARAOKE_LEAD_MS, ONSET_DELAY_MS, ONSET_GAP_MS} from './theme';

export const CAPTION_FONT = {family: SANS, weight: 500, letterSpacingEm: 0.04};
/** 字幕基准字号；长行先单行缩到 CAPTION_MIN，再考虑换行（见 layoutCaptionFixed） */
export const CAPTION_SIZE = 72;
export const CAPTION_MIN = 60;
/** 比 SAFE 宽度再收窄一些，长行不贴着右侧按钮列 */
export const CAPTION_MAXW = 760;
export const CAPTION_LH = 1.42;
const DIM = 0.35;

/**
 * 一个字：卡拉 OK 式点亮（未念 35% → 念到时亮起）。s 是「有效起点」（停顿后的首字已推迟到真正发声处）。
 * 关键词：未念时和其它未念字完全一样（35% 米白，不提前变色），念到时从米白过渡成满琥珀，过半后才加柔光。
 */
const Char: React.FC<{text: string; s: number; e: number; hl: boolean; ms: number; gapAfter: boolean}> = ({
	text,
	s,
	e,
	hl,
	ms,
	gapAfter,
}) => {
	const dur = Math.min(200, Math.max(90, e - s));
	const p = easeOut(clamp01((ms - s + KARAOKE_LEAD_MS) / dur));
	const style: React.CSSProperties = {};
	if (hl) {
		style.color = creamToAmber(p, DIM);
		const g = clamp01((p - 0.5) * 2);
		if (g > 0) style.textShadow = `0 0 18px ${amber(0.5 * g)}, 0 0 46px ${amber(0.26 * g)}`;
	} else {
		style.color = cream(DIM + (1 - DIM) * p);
	}
	return (
		<>
			<span style={style}>{text}</span>
			{gapAfter ? <span style={{display: 'inline-block', width: `${GAP_EM}em`}} /> : null}
		</>
	);
};

/**
 * 每个字的「有效起点」：TTS 的词边界在停顿之后通常比真正发声早 ~150ms，
 * 所以停顿（>ONSET_GAP_MS 静音，或原文空格处）之后的第一个字推迟 ONSET_DELAY_MS 再亮。
 */
export const effectiveStarts = (lines: CapLine[]): number[][] =>
	lines.map((line, li) =>
		line.chars.map((c, ci) => {
			const prev = ci > 0 ? line.chars[ci - 1] : null;
			const prevEnd = prev ? prev.e : li > 0 ? lines[li - 1].endMs : -Infinity;
			const afterGap = (prev && /\s$/.test(prev.t)) || /^\s/.test(c.t) || c.s - prevEnd > ONSET_GAP_MS;
			if (!afterGap) return c.s;
			return Math.max(c.s, Math.min(c.s + ONSET_DELAY_MS, c.e - 40));
		}),
	);

export const captionHeight = (layout: LineLayout) => layout.rows.length * layout.fontSize * CAPTION_LH;

export const CaptionLine: React.FC<{
	line: CapLine;
	layout: LineLayout;
	starts: number[];
	ms: number;
	opacity: number;
	dy: number;
	scale?: number;
}> = ({line, layout, starts, ms, opacity, dy, scale = 1}) => {
	if (opacity <= 0.002 || !layout.rows.length) return null;
	const fs = Math.round(layout.fontSize * 10) / 10;
	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE.left,
				width: SAFE_W,
				top: CAPTION_Y,
				transform: `translateY(-50%) translateY(${dy.toFixed(2)}px) scale(${scale.toFixed(4)})`,
				transformOrigin: '50% 50%',
				opacity,
				textAlign: 'center',
				fontFamily: SANS,
				fontWeight: 500,
				fontSize: fs,
				lineHeight: CAPTION_LH,
				letterSpacing: '0.04em',
				textShadow: '0 2px 18px rgba(4,6,14,0.45)',
			}}
		>
			{layout.rows.map((row, r) => (
				<div key={r} style={{whiteSpace: 'nowrap', paddingLeft: '0.04em'}}>
					{row.map((cell) => {
						const c = line.chars[cell.ci];
						return <Char key={cell.ci} text={cell.t} s={starts[cell.ci] ?? c.s} e={c.e} hl={cell.hl} ms={ms} gapAfter={cell.gapAfter} />;
					})}
				</div>
			))}
		</div>
	);
};
