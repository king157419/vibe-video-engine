import {SANS, SERIF} from '../../lib/fonts';
import {SAFE, SAFE_W, W} from '../../lib/safe';
import {layoutTitle, width100} from './layout';
import {
	amber,
	CAPTION_Y,
	clamp01,
	COVER_HOLD_MS,
	COVER_MOVE_MS,
	cream,
	CX,
	easeInOut,
	easeOut,
	HEADLINE_FADE_MS,
	HEADLINE_OPACITY,
	HEADLINE_SCALE,
	HEADLINE_Y,
} from './theme';

const HOOK_FONT = {family: SERIF, weight: 800, letterSpacingEm: 0.06};
const SUB_FONT = {family: SANS, weight: 400, letterSpacingEm: 0.06};
const SERIES_FONT = {family: SERIF, weight: 600, letterSpacingEm: 0.1};

/** 沿二次贝塞尔曲线生成一笔「毛笔感」的填充形状：中间粗、两端收尖 */
const brushStroke = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, maxW: number): string => {
	const N = 48;
	const top: string[] = [];
	const bottom: string[] = [];
	for (let i = 0; i <= N; i++) {
		const u = i / N;
		const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1;
		const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1;
		const dx = 2 * (1 - u) * (cx - x0) + 2 * u * (x1 - cx);
		const dy = 2 * (1 - u) * (cy - y0) + 2 * u * (y1 - cy);
		const len = Math.hypot(dx, dy) || 1;
		const nx = -dy / len;
		const ny = dx / len;
		// 起笔稍重、收笔更尖
		const w = (maxW * Math.pow(Math.sin(Math.PI * u), 0.55) * (1.1 - 0.35 * u) + 1.2) / 2;
		top.push(`${(x + nx * w).toFixed(2)},${(y + ny * w).toFixed(2)}`);
		bottom.push(`${(x - nx * w).toFixed(2)},${(y - ny * w).toFixed(2)}`);
	}
	return `M ${top.join(' L ')} L ${bottom.reverse().join(' L ')} Z`;
};

export type CoverMode =
	| {kind: 'video'; ms: number; headline: boolean; headlineEnd: number}
	| {kind: 'still'; ep: string | undefined; series: string | undefined};

const EP_FONT = {family: SERIF, weight: 700, letterSpacingEm: 0.18};
const STILL_SERIES_FONT = {family: SERIF, weight: 500, letterSpacingEm: 0.14};

/**
 * 封面。
 * - video：第 0 帧是完整封面（以 SAFE 中线为轴，避开右侧按钮列）。150ms 起钩子上移、缩成一半，
 *   光晕/副标题立即收掉，下划线缩成一小笔；以 70% 亮度作为「题眼」挂在字幕上方，直到第一句念完再淡出。
 *   （钩子就是第一句字幕本身时——没有 meta——不做题眼，直接淡出，避免同一句话出现两次。）
 * - still：上传用的封面图（主页宫格/搜索里没有按钮）：以画面中线 540 为轴，
 *   钩子中心 y≈820，下面是副标题、琥珀色期数牌和节目名；3:4 宫格裁切（y 240–1680）里也居中，缩略图下能认出是第几期。
 */
export const Cover: React.FC<{hook: string; title: string | undefined; mode: CoverMode; fontsReady: boolean}> = ({
	hook,
	title,
	mode,
	fontsReady,
}) => {
	const still = mode.kind === 'still';
	const axis = still ? W / 2 : CX;
	const hookMaxW = still ? 860 : SAFE_W - 24;
	const hk = layoutTitle(hook, HOOK_FONT, hookMaxW, still ? 184 : 176, 124, fontsReady);
	const hookLH = 1.2;
	const hookH = hk.rows.length * hk.fontSize * hookLH;
	const hookCenter = still ? 820 : CAPTION_Y - 20;
	const hookTop = hookCenter - hookH / 2;
	const hookBottom = hookTop + hookH;
	const widths = hk.rows.map((r) => (width100(r, HOOK_FONT, fontsReady) / 100) * hk.fontSize);
	const lastW = widths[widths.length - 1];

	const sub = title ? layoutTitle(title, SUB_FONT, still ? 820 : SAFE_W - 40, 46, 38, fontsReady) : null;

	// —— 动画状态 ——
	let move = 0; // 0 封面 → 1 题眼
	let groupO = 1; // 钩子整体透明度
	let subO = 1; // 副标题、封面暖光
	let lift = 0;
	let scale = 1;
	if (mode.kind === 'video') {
		const {ms, headline, headlineEnd} = mode;
		subO = 1 - easeOut(clamp01((ms - COVER_HOLD_MS) / 150));
		if (headline) {
			// 前快后慢（ease-out cubic）：钩子在第一句字幕升起前就离开字幕带，不和它叠在一起
			move = 1 - Math.pow(1 - clamp01((ms - COVER_HOLD_MS) / COVER_MOVE_MS), 3);
			lift = (HEADLINE_Y - hookCenter) * move;
			scale = 1 - (1 - HEADLINE_SCALE) * move;
			const fade = 1 - easeInOut(clamp01((ms - headlineEnd) / HEADLINE_FADE_MS));
			groupO = (1 - (1 - HEADLINE_OPACITY) * move) * fade;
		} else {
			// 钩子就是第一句：快速上移淡出（~0.2s），第一句字幕在原位升起时它已基本看不见
			const out = easeOut(clamp01((ms - COVER_HOLD_MS) / 220));
			lift = -170 * out;
			scale = 1 - 0.06 * out;
			groupO = 1 - out;
		}
		if (groupO <= 0.002 && subO <= 0.002) return null;
	}
	const glow = 1 - move;

	// 下划线：略带弧度的一笔，宽度约为最后一行的 78%；成为题眼时缩到 40%（围绕中线）
	const ulW = Math.min(lastW * 0.78, hookMaxW - 16);
	const ulY = hookBottom + 14;
	const ulX0 = axis - ulW / 2;
	const ulPath = brushStroke(ulX0, ulY + 4, axis - ulW * 0.1, ulY + 14, ulX0 + ulW, ulY - 2, 8.5);
	const ulScale = 1 - 0.6 * move;

	// still：期数牌 + 节目名
	const subTop = ulY + 62;
	const subH = sub ? sub.rows.length * sub.fontSize * 1.45 : 0;
	const epTop = subTop + subH + (sub ? 84 : 40);
	const epText = still ? mode.ep : undefined;
	const epFs = epText ? Math.min(64, 800 / Math.max(1e-6, width100(epText, EP_FONT, fontsReady) / 100 + 1.2)) : 0;
	const seriesText = still ? mode.series : undefined;
	const st = seriesText ? layoutTitle(seriesText, STILL_SERIES_FONT, 820, 44, 40, fontsReady) : null;

	return (
		<div style={{position: 'absolute', inset: 0}}>
			{/* 暖光：像台灯照在标题上 */}
			<div
				style={{
					position: 'absolute',
					left: axis - 520,
					top: hookCenter - 330,
					width: 1040,
					height: 660,
					opacity: subO,
					background:
						'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(242,184,114,0.2) 0%, rgba(242,184,114,0.1) 35%, rgba(242,184,114,0.03) 65%, rgba(242,184,114,0) 100%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					opacity: groupO,
					transform: `translateY(${lift.toFixed(2)}px) scale(${scale.toFixed(4)})`,
					transformOrigin: `${axis}px ${hookCenter}px`,
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: axis - hookMaxW / 2 - 20,
						width: hookMaxW + 40,
						top: hookTop,
						textAlign: 'center',
						fontFamily: SERIF,
						fontWeight: 800,
						fontSize: hk.fontSize,
						lineHeight: hookLH,
						letterSpacing: '0.06em',
						color: '#F7F2E8',
						textShadow: glow > 0.01 ? `0 0 34px ${amber(0.32 * glow)}, 0 0 90px ${amber(0.16 * glow)}` : undefined,
					}}
				>
					{hk.rows.map((r, i) => (
						<div key={i} style={{whiteSpace: 'pre', paddingLeft: '0.06em'}}>
							{r}
						</div>
					))}
				</div>
				<svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0}} viewBox={`0 0 ${W} 1920`}>
					<defs>
						<filter id="radio-ul-glow" x="-10%" y="-400%" width="120%" height="900%">
							<feGaussianBlur stdDeviation="9" />
						</filter>
					</defs>
					<g transform={`translate(${axis} 0) scale(${ulScale.toFixed(4)} 1) translate(${-axis} 0)`}>
						{/* 小面积的 SVG 模糊只用于这一笔的光晕，且只在封面约 0.6 秒内存在 */}
						{glow > 0.01 ? <path d={ulPath} fill={amber(0.55 * glow)} filter="url(#radio-ul-glow)" /> : null}
						<path d={ulPath} fill={amber(0.95)} />
					</g>
				</svg>
			</div>
			{sub && subO > 0.002 ? (
				<div
					style={{
						position: 'absolute',
						left: axis - 440,
						width: 880,
						top: subTop,
						textAlign: 'center',
						fontFamily: SANS,
						fontWeight: 400,
						fontSize: sub.fontSize,
						lineHeight: 1.45,
						letterSpacing: '0.06em',
						color: cream(0.74),
						opacity: subO,
					}}
				>
					{sub.rows.map((r, i) => (
						<div key={i} style={{whiteSpace: 'pre', paddingLeft: '0.06em'}}>
							{r}
						</div>
					))}
				</div>
			) : null}
			{epText ? (
				<div
					style={{
						position: 'absolute',
						left: 0,
						width: W,
						top: epTop,
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						gap: 26,
					}}
				>
					<div
						style={{
							width: 16,
							height: 16,
							borderRadius: '50%',
							background: amber(0.95),
							boxShadow: `0 0 16px ${amber(0.75)}, 0 0 40px ${amber(0.35)}`,
						}}
					/>
					<div
						style={{
							fontFamily: SERIF,
							fontWeight: 700,
							fontSize: epFs,
							lineHeight: 1.3,
							letterSpacing: '0.18em',
							color: amber(1),
							whiteSpace: 'nowrap',
							textShadow: `0 0 24px ${amber(0.3)}`,
						}}
					>
						{epText}
					</div>
					<div style={{width: 16}} />
				</div>
			) : null}
			{st ? (
				<div
					style={{
						position: 'absolute',
						left: axis - 430,
						width: 860,
						top: epTop + (epText ? epFs * 1.3 + 18 : 0),
						textAlign: 'center',
						fontFamily: SERIF,
						fontWeight: 500,
						fontSize: st.fontSize,
						lineHeight: 1.3,
						letterSpacing: '0.14em',
						color: cream(0.78),
					}}
				>
					{st.rows.map((r, i) => (
						<div key={i} style={{whiteSpace: 'pre', paddingLeft: '0.14em'}}>
							{r}
						</div>
					))}
				</div>
			) : null}
		</div>
	);
};

/** 结尾卡进场进度到这里时，「关注我」胶囊已完整可见 */
export const END_CTA_AT = 0.8;

/** 结尾卡各段的高度（Radio.tsx 用它把「最后一句 + 结尾卡」整体排版） */
const END = {divider: 44, gap1: 34, seriesLH: 1.3, gap2: 10, signoff: 44, gap3: 50, cta: 90, gap4: 26, note: 34};
/** 片尾声明（合规：读书分享定位 + 注明作者书名） */
export const END_NOTE = '读书分享，非心理咨询 · 丛非从《养育你内心的小孩》';
const SERIES_MAX = 46;
const CTA_FS = 40;

const seriesLayout = (series: string | undefined, fontsReady: boolean) =>
	series ? layoutTitle(series, SERIES_FONT, SAFE_W - 60, SERIES_MAX, 36, fontsReady) : null;

export const endCardHeight = (series: string | undefined, fontsReady: boolean): number => {
	const st = seriesLayout(series, fontsReady);
	const stH = st ? st.rows.length * st.fontSize * END.seriesLH + END.gap2 : 0;
	return END.divider + END.gap1 + stH + END.signoff + END.gap3 + END.cta + END.gap4 + END.note;
};

/**
 * 结尾卡：像电台节目收尾。最后一句原地保持点亮，在它下面依次长出：
 * 琥珀分隔点 → 节目名（台名）→「序章 · 今天就先聊到这儿」→ 细线胶囊里的「关注我，下期继续聊」。
 * 节目名刻意比最后一句小，层级是：金句 > 台名 > 道别 / 关注。
 * top: 块顶部的 y；p: 0 → 1 进场进度。
 */
export const EndCard: React.FC<{
	series: string | undefined;
	ep: string | undefined;
	top: number;
	p: number;
	fontsReady: boolean;
}> = ({series, ep, top, p, fontsReady}) => {
	if (p <= 0) return null;
	const stage = (from: number, to: number) => easeOut(clamp01((p - from) / (to - from)));
	// 「关注我」在 0.8 处完整出现（Radio.tsx 按 END_CTA_AT 反推开始时间）
	const a0 = stage(0, 0.45);
	const a1 = stage(0.1, 0.55);
	const a2 = stage(0.2, 0.65);
	const a3 = stage(0.3, END_CTA_AT);
	const st = seriesLayout(series, fontsReady);
	const signoff = ep ? `${ep} · 今天就先聊到这儿` : '今天就先聊到这儿';
	const lineW = 150 * a0;
	return (
		<div style={{position: 'absolute', left: SAFE.left, width: SAFE_W, top, textAlign: 'center'}}>
			<div style={{height: END.divider, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: a0}}>
				<div style={{width: lineW, height: 2, background: `linear-gradient(90deg, ${amber(0)}, ${amber(0.75)})`}} />
				<div style={{width: 10, height: 10, borderRadius: '50%', margin: '0 18px', background: amber(0.95), boxShadow: `0 0 14px ${amber(0.7)}`}} />
				<div style={{width: lineW, height: 2, background: `linear-gradient(90deg, ${amber(0.75)}, ${amber(0)})`}} />
			</div>
			<div style={{height: END.gap1}} />
			{st ? (
				<div
					style={{
						fontFamily: SERIF,
						fontWeight: 600,
						fontSize: st.fontSize,
						lineHeight: END.seriesLH,
						letterSpacing: '0.16em',
						color: '#F7F2E8',
						textShadow: `0 0 26px ${amber(0.24)}`,
						opacity: a1,
						transform: `translateY(${(1 - a1) * 16}px)`,
						marginBottom: END.gap2,
					}}
				>
					{st.rows.map((r, i) => (
						<div key={i} style={{whiteSpace: 'pre', paddingLeft: '0.16em'}}>
							{r}
						</div>
					))}
				</div>
			) : null}
			<div
				style={{
					height: END.signoff,
					lineHeight: `${END.signoff}px`,
					fontFamily: SERIF,
					fontWeight: 400,
					fontSize: 30,
					letterSpacing: '0.2em',
					paddingLeft: '0.2em',
					color: cream(0.55),
					whiteSpace: 'nowrap',
					opacity: a2,
					transform: `translateY(${(1 - a2) * 14}px)`,
				}}
			>
				{signoff}
			</div>
			<div style={{height: END.gap3}} />
			<div style={{height: END.cta, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
				<div
					style={{
						height: END.cta - 6,
						padding: '0 44px',
						borderRadius: 999,
						border: `1.5px solid ${amber(0.5)}`,
						background: amber(0.06),
						display: 'flex',
						alignItems: 'center',
						fontFamily: SANS,
						fontWeight: 400,
						fontSize: CTA_FS,
						letterSpacing: '0.12em',
						color: cream(0.9),
						whiteSpace: 'nowrap',
						opacity: a3,
						transform: `translateY(${(1 - a3) * 16}px)`,
					}}
				>
					<span style={{paddingLeft: '0.12em'}}>
						<span style={{color: amber(1)}}>关注我</span>，下期继续聊
					</span>
				</div>
			</div>
			<div style={{height: END.gap4}} />
			<div
				style={{
					height: END.note,
					lineHeight: `${END.note}px`,
					fontFamily: SANS,
					fontWeight: 400,
					fontSize: 24,
					letterSpacing: '0.06em',
					color: cream(0.45),
					whiteSpace: 'nowrap',
					opacity: a3,
				}}
			>
				{END_NOTE}
			</div>
		</div>
	);
};
