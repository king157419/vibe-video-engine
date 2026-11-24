import type React from 'react';
import {AbsoluteFill, Easing, interpolate, spring} from 'remotion';
import {noise2D} from '@remotion/noise';
import {SANS, SERIF} from '../../lib/fonts';
import type {Captions} from '../../lib/types';
import type {CardDef, Chip, DeckItem, Layout} from './layout';
import {alpha, C, clamp01, deep, G, INNER_W, lerp, mix, NEED_COLORS, NEEDS, pad2, SAFE_R, SAFE_X, SYNC_MS, tint} from './theme';

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 有界弹簧：<0 取 0；超过 90 帧视为已稳定取 1（避免对长时间轴逐帧积分） */
export const spr = (df: number, fps: number, config: {damping?: number; stiffness?: number; mass?: number}) =>
	df <= 0 ? 0 : df > 90 ? 1 : spring({frame: df, fps, config});

const F = (ms: number, fps: number) => (ms / 1000) * fps;

// ---------------------------------------------------------------- 背景：奶油色 + 点阵 + 两团极淡的暖/冷色光

export const Backdrop: React.FC<{frame: number}> = ({frame}) => {
	const a = noise2D('cards-a', frame / 260, 0.3);
	const b = noise2D('cards-b', 0.7, frame / 300);
	return (
		<AbsoluteFill style={{backgroundColor: C.bg}}>
			<AbsoluteFill
				style={{
					background: [
						`radial-gradient(760px 760px at ${900 + a * 50}px ${250 + b * 40}px, rgba(224,122,106,0.14), rgba(224,122,106,0) 72%)`,
						`radial-gradient(900px 900px at ${120 + b * 50}px ${1720 + a * 50}px, rgba(79,124,172,0.10), rgba(79,124,172,0) 72%)`,
						`radial-gradient(600px 600px at ${980 - a * 30}px ${1500 + b * 30}px, rgba(224,168,79,0.08), rgba(224,168,79,0) 72%)`,
					].join(','),
				}}
			/>
			<AbsoluteFill
				style={{
					backgroundImage: 'radial-gradient(circle, rgba(31,31,31,0.10) 1.7px, rgba(31,31,31,0) 2.4px)',
					backgroundSize: '36px 36px',
					backgroundPosition: '6px 12px',
				}}
			/>
		</AbsoluteFill>
	);
};

// ---------------------------------------------------------------- 顶部：EP 胶囊 + 系列名

export const TopRow: React.FC<{L: Layout; seriesOpacity: number}> = ({L, seriesOpacity}) => {
	const {ep, rest, fs} = L.pill;
	const hasPill = Boolean(ep || rest);
	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE_X,
				top: G.topRowY,
				width: SAFE_R - SAFE_X,
				height: G.pillH,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				fontFamily: SANS,
			}}
		>
			{hasPill ? (
				<div
					style={{
						height: G.pillH,
						borderRadius: G.pillH / 2,
						background: C.ink,
						color: C.cream,
						padding: '0 26px 0 20px',
						display: 'flex',
						alignItems: 'center',
						gap: 12,
						fontSize: fs,
						fontWeight: 700,
						whiteSpace: 'nowrap',
						letterSpacing: '0.02em',
					}}
				>
					<span style={{width: 14, height: 14, borderRadius: 7, background: C.coral, flex: 'none'}} />
					{ep ? <span style={{color: '#F4B9A9', fontWeight: 800}}>{ep}</span> : null}
					{ep && rest ? <span style={{opacity: 0.45}}>·</span> : null}
					{rest ? <span>{rest}</span> : null}
				</div>
			) : (
				<div />
			)}
			{L.series ? (
				<div
					style={{
						fontSize: 26,
						fontWeight: 600,
						color: alpha(C.ink, 0.48),
						opacity: seriesOpacity,
						whiteSpace: 'nowrap',
						letterSpacing: '0.04em',
					}}
				>
					{L.series}
				</div>
			) : null}
		</div>
	);
};

// ---------------------------------------------------------------- 全集进度条

export const Progress: React.FC<{p: number; opacity: number}> = ({p, opacity}) => {
	const w = SAFE_R - SAFE_X;
	return (
		<div style={{position: 'absolute', left: SAFE_X, top: G.progressY, width: w, height: 6, opacity}}>
			<div style={{position: 'absolute', inset: 0, borderRadius: 3, background: alpha(C.ink, 0.08)}} />
			<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: w * p, borderRadius: 3, background: C.ink}} />
			<div
				style={{
					position: 'absolute',
					left: w * p - 8,
					top: -5,
					width: 16,
					height: 16,
					borderRadius: 8,
					background: C.coral,
					border: `3px solid ${C.bg}`,
					boxSizing: 'border-box',
				}}
			/>
		</div>
	);
};

// ---------------------------------------------------------------- 书目条（常驻，填补卡片下方空白）

const BookIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" style={{flex: 'none'}}>
		<path
			d="M3 5.2c2.9-1.1 5.9-1 9 .9v13.6c-3.1-1.9-6.1-2-9-.9V5.2z M21 5.2c-2.9-1.1-5.9-1-9 .9v13.6c3.1-1.9 6.1-2 9-.9V5.2z"
			fill="none"
			stroke={color}
			strokeWidth={1.9}
			strokeLinejoin="round"
		/>
	</svg>
);

export const BookStrip: React.FC<{L: Layout}> = ({L}) => {
	if (!L.book) return null;
	return (
		<div
			style={{
				position: 'absolute',
				// 书本图标对齐卡片正文左缘（封面上它就在卡片里）
				left: G.cardX + G.padX - 22,
				top: G.bookY,
				height: G.bookH,
				maxWidth: SAFE_R - (G.cardX + G.padX - 22),
				overflow: 'hidden',
				borderRadius: G.bookH / 2,
				background: C.strip,
				border: `1.5px solid ${alpha(C.ink, 0.06)}`,
				boxSizing: 'border-box',
				padding: '0 28px 0 22px',
				display: 'flex',
				alignItems: 'center',
				gap: 12,
				fontFamily: SANS,
				fontSize: 28,
				fontWeight: 600,
				color: alpha(C.ink, 0.62),
				whiteSpace: 'nowrap',
				letterSpacing: '0.02em',
			}}
		>
			<BookIcon size={30} color={alpha(C.ink, 0.62)} />
			<span>《{L.book.title}》</span>
			{L.book.author ? (
				<>
					<span style={{opacity: 0.45}}>·</span>
					<span>{L.book.author}</span>
				</>
			) : null}
		</div>
	);
};

// ---------------------------------------------------------------- 五种需要追踪条

const slotGeom = (k: number) => {
	const w = (SAFE_R - SAFE_X - G.trackerGap * 4) / 5;
	return {x: SAFE_X + k * (w + G.trackerGap), y: G.trackerY, w, h: G.trackerH};
};

const LitChip: React.FC<{k: number; w: number; h: number; style?: React.CSSProperties}> = ({k, w, h, style}) => {
	const color = NEED_COLORS[k];
	return (
		<div
			style={{
				position: 'absolute',
				width: w,
				height: h,
				borderRadius: h / 2,
				background: tint(color, 0.8),
				border: `2.5px solid ${color}`,
				boxSizing: 'border-box',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 9,
				fontFamily: SANS,
				fontSize: 29,
				fontWeight: 800,
				color: deep(color, 0.38),
				whiteSpace: 'nowrap',
				...style,
			}}
		>
			<span style={{width: 11, height: 11, borderRadius: 6, background: color, flex: 'none'}} />
			{NEEDS[k]}
		</div>
	);
};

export const Tracker: React.FC<{L: Layout; frame: number; fps: number; opacity: number}> = ({L, frame, fps, opacity}) => {
	if (opacity <= 0.001) return null;
	return (
		<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 0, opacity}}>
			{NEEDS.map((name, k) => {
				const {x, y, w, h} = slotGeom(k);
				const color = NEED_COLORS[k];
				const at = L.needArrive[k];
				const df = at === null ? -1 : frame - F(at, fps);
				const lit = df >= 0;
				// chip 飞到时槽位已是满尺寸：从 0.96 轻弹到 1，外加一圈扩散
				const pop = lit ? spr(df, fps, {damping: 11, stiffness: 190, mass: 0.6}) : 0;
				let scale = lit ? interpolate(pop, [0, 1], [0.96, 1]) : 1;
				for (const b of L.needBumps[k]) {
					const bf = frame - F(b, fps);
					if (bf >= 0 && bf < 12) scale *= 1 + 0.07 * Math.sin((bf / 12) * Math.PI);
				}
				const ring = lit ? clamp01(df / 18) : 1;
				return (
					<div key={name} style={{position: 'absolute', left: x, top: y, width: w, height: h}}>
						<div
							style={{
								position: 'absolute',
								inset: 0,
								borderRadius: h / 2,
								border: `2px dashed ${alpha(C.ink, 0.2)}`,
								boxSizing: 'border-box',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontFamily: SANS,
								fontSize: 29,
								fontWeight: 700,
								color: alpha(C.ink, 0.28),
								opacity: lit ? 0 : 1,
							}}
						>
							{name}
						</div>
						{lit ? (
							<>
								{ring < 1 ? (
									<div
										style={{
											position: 'absolute',
											inset: 0,
											borderRadius: h / 2,
											border: `3px solid ${color}`,
											transform: `scale(${1 + 0.3 * Easing.out(Easing.cubic)(ring)})`,
											opacity: 0.65 * (1 - ring),
										}}
									/>
								) : null}
								<LitChip k={k} w={w} h={h} style={{left: 0, top: 0, transform: `scale(${scale})`}} />
							</>
						) : null}
					</div>
				);
			})}
		</div>
	);
};

/** 说到某个需要时：从字的位置弹出一枚 chip，沿弧线飞进追踪条的槽位 */
export const Flights: React.FC<{L: Layout; frame: number; fps: number}> = ({L, frame, fps}) => {
	const total = G.flyPop + G.fly;
	return (
		<>
			{L.flights.map((fl) => {
				const df = frame - F(fl.spawnMs, fps);
				if (df < 0 || df > total + 2) return null;
				const {x: sx, y: sy, w, h} = slotGeom(fl.need);
				const x1 = sx + w / 2;
				const y1 = sy + h / 2;
				let x = fl.x0;
				let y = fl.y0;
				let s = 1.15;
				let op = 1;
				if (df < G.flyPop) {
					const u = df / G.flyPop;
					s = lerp(0.45, 1.15, Easing.out(Easing.back(2))(u));
					op = clamp01(u * 1.6);
				} else {
					const u = clamp01((df - G.flyPop) / G.fly);
					const e = Easing.bezier(0.33, 0, 0.18, 1)(u);
					// 二次贝塞尔：先升过槽位再落进去
					const cx = lerp(fl.x0, x1, 0.3);
					const cy = y1 - 80;
					x = (1 - e) * (1 - e) * fl.x0 + 2 * e * (1 - e) * cx + e * e * x1;
					y = (1 - e) * (1 - e) * fl.y0 + 2 * e * (1 - e) * cy + e * e * y1;
					s = lerp(1.15, 1, e);
					op = df > total ? 1 - (df - total) / 2 : 1;
				}
				return (
					<LitChip
						key={`${fl.need}-${fl.spawnMs}`}
						k={fl.need}
						w={w}
						h={h}
						style={{
							left: x - w / 2,
							top: y - h / 2,
							transform: `scale(${s})`,
							opacity: op,
							boxShadow: '0 14px 26px -14px rgba(60,40,20,0.45)',
						}}
					/>
				);
			})}
		</>
	);
};

// ---------------------------------------------------------------- 牌堆：顶卡甩走，下面那张（早已排好字）弹到最前

export type Pose = {
	item: DeckItem;
	idx: number;
	top: number;
	h: number;
	ty: number;
	sc: number;
	rot: number;
	op: number;
	bg: string;
	contentOp: number;
	origin: string;
	lift: number; // 0 = 叠在后面的阴影，1 = 顶卡阴影
	withBody: boolean;
};

const promoteCfg = {damping: 19, stiffness: 180, mass: 0.8};

export const deckPoses = (L: Layout, frame: number, fps: number): Pose[] => {
	const D = L.deck;
	const t = (frame / fps) * 1000;
	let k = 0;
	for (let i = 0; i < D.length; i++) if (D[i].inMs <= t) k = i;
	const pOf = (i: number, f: number) => (i === 0 ? 1 : spr(f - F(D[i].inMs, fps), fps, promoteCfg));
	const geomAt = (i: number, f: number) => {
		if (i === 0) return {top: D[0].top, h: D[0].h};
		const p = pOf(i, f);
		return {top: lerp(D[i - 1].top, D[i].top, p), h: lerp(D[i - 1].h, D[i].h, p)};
	};
	const p = pOf(k, frame);
	const {top, h} = geomAt(k, frame);
	const out: Pose[] = [];
	const base = {top, h, rot: 0, origin: '50% 100%'};

	// 第三张：空白纸，从更深处浮上来
	if (k + 2 < D.length) {
		out.push({
			...base,
			item: D[k + 2],
			idx: k + 2,
			ty: k === 0 ? G.peek2 : lerp(G.peek2 + 16, G.peek2, p),
			sc: k === 0 ? G.peekScale2 : lerp(G.peekScale2 - 0.03, G.peekScale2, p),
			op: k === 0 ? 1 : clamp01(p * 1.4),
			bg: C.peek2,
			contentOp: 0,
			lift: 0,
			withBody: false,
		});
	}
	// 第二张：真正的下一张卡，字已排好（被顶卡盖住，只露底边）
	if (k + 1 < D.length) {
		const q = k === 0 ? 1 : p;
		out.push({
			...base,
			item: D[k + 1],
			idx: k + 1,
			ty: lerp(G.peek2, G.peek1, q),
			sc: lerp(G.peekScale2, G.peekScale1, q),
			op: 1,
			bg: mix(C.peek2, C.peek1, q),
			contentOp: 0.6,
			lift: 0,
			withBody: true,
		});
	}
	// 顶卡：从第二张的位置弹到最前
	out.push({
		...base,
		item: D[k],
		idx: k,
		ty: lerp(G.peek1, 0, p),
		sc: lerp(G.peekScale1, 1, p),
		op: 1,
		bg: mix(C.peek1, C.card, p),
		contentOp: interpolate(p, [0, 0.4], [0.6, 1], CL),
		lift: p,
		withBody: true,
	});
	// 正在甩走的旧顶卡（最上层）
	for (let j = k - 1; j >= 0; j--) {
		const f0 = F(D[j + 1].inMs, fps);
		const x = (frame - f0) / G.flick;
		if (x >= 1) break;
		const xc = clamp01(x);
		const e = Easing.out(Easing.cubic)(xc);
		const g = geomAt(j, f0);
		out.push({
			item: D[j],
			idx: j,
			top: g.top,
			h: g.h,
			ty: -160 * e,
			sc: 1 - 0.03 * e,
			rot: -3 * e,
			// 壳子二次方淡出，字比壳子更快退：避免两张卡的大字长时间叠影
			op: (1 - xc) * (1 - xc),
			bg: C.card,
			contentOp: clamp01(1 - xc * 2.4),
			origin: '50% 50%',
			lift: 1,
			withBody: true,
		});
	}
	return out;
};

export const CardShell: React.FC<{pose: Pose; children?: React.ReactNode}> = ({pose, children}) => {
	if (pose.op <= 0.001) return null;
	const l = pose.lift;
	return (
		<div
			style={{
				position: 'absolute',
				left: G.cardX,
				top: pose.top,
				width: G.cardW,
				height: pose.h,
				borderRadius: G.radius,
				background: pose.bg,
				border: `1px solid ${alpha('#8A6A4A', lerp(0.08, 0.04, l))}`,
				boxSizing: 'border-box',
				boxShadow: `0 ${lerp(16, 34, l).toFixed(1)}px ${lerp(36, 70, l).toFixed(1)}px ${lerp(-24, -34, l).toFixed(1)}px rgba(90,62,40,${lerp(0.26, 0.3, l).toFixed(3)}), 0 3px 10px rgba(90,62,40,${(0.06 * l).toFixed(3)})`,
				transform: `translateY(${pose.ty}px) rotate(${pose.rot}deg) scale(${pose.sc})`,
				transformOrigin: pose.origin,
				opacity: pose.op,
				overflow: 'hidden',
			}}
		>
			{children && pose.contentOp > 0.001 ? (
				<div style={{position: 'absolute', inset: -1, opacity: pose.contentOp}}>{children}</div>
			) : null}
		</div>
	);
};

// ---------------------------------------------------------------- chip

export const ChipView: React.FC<{
	chip: Chip;
	left: number;
	top: number;
	h: number;
	fs: number;
	padX: number;
	dot: number;
	dotGap: number;
	scale: number;
	opacity: number;
}> = ({chip, left, top, h, fs, padX, dot, dotGap, scale, opacity}) => {
	// 五种需要用各自颜色；其他关键词用中性色（珊瑚色只留给「亲密」）
	const need = chip.need >= 0;
	return (
		<div
			style={{
				position: 'absolute',
				left,
				top,
				width: chip.w,
				height: h,
				borderRadius: h / 2,
				padding: `0 ${padX}px`,
				boxSizing: 'border-box',
				display: 'flex',
				alignItems: 'center',
				gap: dotGap,
				background: need ? tint(chip.color, 0.82) : C.neutralBg,
				color: need ? deep(chip.color, 0.4) : C.ink,
				fontFamily: SANS,
				fontSize: fs,
				fontWeight: 700,
				whiteSpace: 'nowrap',
				transform: `scale(${scale})`,
				transformOrigin: '30% 50%',
				opacity,
			}}
		>
			<span
				style={{
					width: dot,
					height: dot,
					borderRadius: need ? dot / 2 : 3,
					background: need ? chip.color : C.ink,
					flex: 'none',
				}}
			/>
			{chip.text}
		</div>
	);
};

const popOf = (frame: number, fps: number, atFrame: number) => {
	const df = frame - atFrame;
	if (df < 0) return null;
	const s = spr(df, fps, {damping: 11, stiffness: 220, mass: 0.6});
	return {scale: interpolate(s, [0, 1], [0.4, 1]), opacity: clamp01(s * 2.5)};
};

// ---------------------------------------------------------------- 字幕卡内容

const CardHeader: React.FC<{left: React.ReactNode}> = ({left}) => (
	<div
		style={{
			position: 'absolute',
			left: G.padX,
			top: G.padTop,
			width: INNER_W,
			height: G.headerH,
			display: 'flex',
			alignItems: 'center',
			gap: 18,
			fontFamily: SANS,
		}}
	>
		{left}
		<div style={{flex: 1, height: 2, borderRadius: 1, background: alpha(C.ink, 0.08)}} />
	</div>
);

const Counter: React.FC<{n: number; total: number}> = ({n, total}) => (
	<div style={{display: 'flex', alignItems: 'baseline', gap: 8, whiteSpace: 'nowrap'}}>
		<span style={{fontSize: 34, fontWeight: 800, color: C.coral, letterSpacing: '0.02em'}}>{pad2(n + 1)}</span>
		<span style={{fontSize: 24, fontWeight: 700, color: alpha(C.ink, 0.3)}}>/ {pad2(total)}</span>
	</div>
);

export const CaptionCardBody: React.FC<{
	card: CardDef;
	total: number;
	captions: Captions;
	t: number;
	frame: number;
	fps: number;
	disp: string[][];
	dy: number;
}> = ({card, total, captions, t, frame, fps, disp: dispAll, dy}) => {
	const {fs} = card;
	const lhPx = Math.round(fs * G.lh);
	// 合并卡：后一句开始时，前面的句子退到 55%
	const subDim = (s: number) => {
		let dim = 0;
		for (let q = s + 1; q < card.subStarts.length; q++) {
			dim = Math.max(dim, clamp01((frame - F(card.subStarts[q], fps)) / 8));
		}
		return 1 - 0.45 * dim;
	};
	// 左侧“阅读位置”竖条：跟着当前正在念的那一行滑动
	const lineBox = (li: number) => {
		const rs = card.rows.filter((r) => r.line === li);
		return {top: rs[0].top + fs * 0.2, h: rs.length * lhPx - fs * 0.4};
	};
	const barAt = (li: number) => captions.lines[li].startMs - 160 + SYNC_MS;
	let bar: {top: number; h: number; o: number} | null = null;
	const shown = card.lines.filter((li) => t >= barAt(li));
	if (shown.length) {
		const cur = shown[shown.length - 1];
		const p = spr(frame - F(barAt(cur), fps), fps, {damping: 18, stiffness: 160, mass: 0.7});
		const b = lineBox(cur);
		if (shown.length > 1) {
			const a = lineBox(shown[shown.length - 2]);
			bar = {top: a.top + (b.top - a.top) * p, h: a.h + (b.h - a.h) * p, o: 1};
		} else bar = {...b, o: clamp01(p * 1.5)};
	}
	return (
		<>
			<CardHeader left={<Counter n={card.n} total={total} />} />
			<div style={{position: 'absolute', left: 0, top: dy, width: G.cardW, height: card.h}}>
				{bar ? (
					<div
						style={{
							position: 'absolute',
							left: G.padX - 28,
							top: bar.top,
							width: 7,
							height: bar.h,
							borderRadius: 4,
							background: C.coral,
							opacity: bar.o,
						}}
					/>
				) : null}
				{card.rows.map((row, ri) => {
					const af = F(row.appearMs, fps);
					if (frame < af) return null;
					const p = spr(frame - af, fps, {damping: 17, stiffness: 150, mass: 0.8});
					const line = captions.lines[row.line];
					const litA = (i: number) => {
						const ch = line.chars[i];
						const dur = Math.max(60, Math.min(170, ch.e - ch.s));
						const s0 = ch.s - 40 + SYNC_MS;
						return interpolate(t, [s0, s0 + dur], [0.28, 1], CL);
					};
					const charEl = (i: number, color: string, text: string, key: string) => (
						<span key={key} style={{color: alpha(color, litA(i))}}>
							{text}
						</span>
					);
					const disp = (i: number) => dispAll[row.line]?.[i] ?? line.chars[i].t.trim();
					return (
						<div
							key={ri}
							style={{
								position: 'absolute',
								left: G.padX,
								top: row.top,
								height: lhPx,
								lineHeight: `${lhPx}px`,
								fontFamily: SANS,
								fontSize: fs,
								fontWeight: 800,
								whiteSpace: 'nowrap',
								letterSpacing: 0,
								opacity: clamp01(p * 1.6) * subDim(row.sub),
								transform: `translateY(${(1 - p) * 30}px)`,
							}}
						>
							{row.segs.map((seg, si) => {
								if (seg.kind === 'gap') {
									return <span key={`g${si}`} style={{display: 'inline-block', width: `${G.gapEm}em`}} />;
								}
								if (seg.kind === 'p') return charEl(seg.at, C.ink, seg.text, `p${si}`);
								if (seg.kind === 'txt') return seg.idx.map((i) => charEl(i, C.ink, disp(i), `c${i}`));
								const {kw} = seg;
								const k0 = kw.startMs + SYNC_MS;
								const prog = interpolate(t, [k0 - 30, Math.max(k0 + 200, kw.endMs + SYNC_MS)], [0, 1], {
									...CL,
									easing: Easing.out(Easing.cubic),
								});
								const df = frame - F(k0, fps);
								const bump = df >= 0 && df < 11 ? Math.sin((df / 11) * Math.PI) * 0.07 : 0;
								return (
									<span
										key={`k${si}`}
										style={{
											display: 'inline-block',
											position: 'relative',
											isolation: 'isolate',
											transform: `scale(${1 + bump})`,
											transformOrigin: '50% 75%',
										}}
									>
										<span
											style={{
												position: 'absolute',
												left: '-0.07em',
												right: '-0.07em',
												bottom: '0.12em',
												height: '0.42em',
												borderRadius: '0.1em',
												background: tint(kw.color, 0.55),
												transform: `scaleX(${prog})`,
												transformOrigin: 'left center',
												zIndex: -1,
											}}
										/>
										{seg.idx.map((i) => charEl(i, deep(kw.color, 0.3), disp(i), `c${i}`))}
									</span>
								);
							})}
						</div>
					);
				})}
			</div>
		</>
	);
};

// ---------------------------------------------------------------- 「五种需要」卡：5 个色块逐个点亮

export const NeedsBody: React.FC<{card: CardDef; total: number; frame: number; fps: number; dy: number}> = ({
	card,
	total,
	frame,
	fps,
	dy,
}) => {
	const gap = G.tileGap;
	const w = (INNER_W - 2 * gap) / 3;
	const y0 = card.tiles[0]?.y ?? 0;
	return (
		<>
			<CardHeader left={<Counter n={card.n} total={total} />} />
			<div style={{position: 'absolute', left: G.padX, top: dy, width: INNER_W, height: card.h, fontFamily: SANS}}>
				{card.tiles.map((tile) => {
					const color = NEED_COLORS[tile.need];
					const at = tile.startMs === null ? null : F(tile.startMs + SYNC_MS, fps);
					const df = at === null ? -1 : frame - at;
					const lit = df >= 0;
					const p = lit ? spr(df, fps, {damping: 12, stiffness: 200, mass: 0.6}) : 0;
					const fill = lit ? Easing.out(Easing.cubic)(clamp01(df / 7)) : 0;
					return (
						<div
							key={tile.need}
							style={{
								position: 'absolute',
								left: tile.x,
								top: tile.y,
								width: tile.w,
								height: tile.h,
								borderRadius: 28,
								overflow: 'hidden',
								transform: `scale(${lit ? interpolate(p, [0, 1], [0.92, 1]) : 1})`,
							}}
						>
							{/* 未点亮：虚线框 */}
							<div
								style={{
									position: 'absolute',
									inset: 0,
									borderRadius: 28,
									border: `2.5px dashed ${alpha(C.ink, 0.16)}`,
									opacity: 1 - fill,
								}}
							/>
							{/* 点亮：颜色从左扫过 */}
							<div
								style={{
									position: 'absolute',
									inset: 0,
									borderRadius: 28,
									background: tint(color, 0.8),
									border: `3px solid ${color}`,
									boxSizing: 'border-box',
									transform: `scaleX(${fill})`,
									transformOrigin: 'left center',
								}}
							/>
							<div
								style={{
									position: 'absolute',
									left: 26,
									top: 18,
									fontSize: 26,
									fontWeight: 800,
									letterSpacing: '0.04em',
									color: lit ? alpha(deep(color, 0.2), 0.5 + 0.5 * fill) : alpha(C.ink, 0.2),
								}}
							>
								{pad2(tile.need + 1)}
							</div>
							<div
								style={{
									position: 'absolute',
									left: 26,
									bottom: 16,
									fontSize: 58,
									lineHeight: 1.2,
									fontWeight: 800,
									whiteSpace: 'nowrap',
									color: lit ? mix('#BDB6AC', deep(color, 0.38), fill) : alpha(C.ink, 0.22),
								}}
							>
								{NEEDS[tile.need]}
							</div>
						</div>
					);
				})}
				{/* 第 6 格：框架名 */}
				<div
					style={{
						position: 'absolute',
						left: 2 * (w + gap),
						top: y0 + G.tileH + gap,
						width: w,
						height: G.tileH,
						borderRadius: 28,
						background: C.ink,
						color: C.cream,
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						paddingLeft: 26,
						boxSizing: 'border-box',
					}}
				>
					<div style={{fontSize: 24, fontWeight: 700, opacity: 0.55, letterSpacing: '0.06em'}}>丛非从</div>
					<div style={{fontSize: 44, fontWeight: 900, lineHeight: 1.25, whiteSpace: 'nowrap'}}>
						<span style={{color: '#F4B9A9'}}>5</span> 种需要
					</div>
				</div>
			</div>
		</>
	);
};

// ---------------------------------------------------------------- 封面

export const CoverBody: React.FC<{L: Layout; h: number}> = ({L, h}) => {
	const {cover, series} = L;
	const lineH = Math.round(cover.fs * 1.16);
	// 书目条常驻在卡片底部同一位置（画在牌堆上层），这里给它留出位置
	const bottomReserve = L.book ? G.coverTop + h - G.bookY + 22 : 52;
	return (
		<div style={{position: 'absolute', inset: 0, fontFamily: SANS}}>
			<div
				style={{
					position: 'absolute',
					left: G.padX,
					top: G.padTop + 8,
					width: INNER_W,
					height: h - G.padTop - 8 - bottomReserve,
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{/* 系列名 */}
				<div style={{display: 'flex', alignItems: 'center', gap: 14, height: 44}}>
					<span style={{width: 16, height: 16, borderRadius: 4, background: C.coral, flex: 'none'}} />
					{series ? (
						<span
							style={{
								fontSize: 30,
								fontWeight: 700,
								color: alpha(C.ink, 0.72),
								letterSpacing: '0.06em',
								whiteSpace: 'nowrap',
							}}
						>
							{series}
						</span>
					) : null}
					<div style={{flex: 1, height: 2, borderRadius: 1, background: alpha(C.ink, 0.08), marginLeft: 6}} />
				</div>
				{/* 标题区 */}
				<div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 16}}>
					{cover.lines.map((l, i) => (
						<div key={i} style={{position: 'relative', height: lineH, lineHeight: `${lineH}px`}}>
							<div
								style={{
									position: 'absolute',
									left: -10,
									width: cover.widths[i] + 20,
									bottom: lineH * 0.1,
									height: cover.fs * 0.4,
									borderRadius: 10,
									background: tint(C.coral, 0.5),
									transform: `rotate(${i % 2 ? 0.8 : -1.2}deg)`,
								}}
							/>
							<div
								style={{
									position: 'relative',
									fontSize: cover.fs,
									fontWeight: 900,
									color: C.ink,
									whiteSpace: 'nowrap',
								}}
							>
								{l}
							</div>
						</div>
					))}
					{cover.sub ? (
						<div
							style={{
								marginTop: 36,
								fontSize: 46,
								fontWeight: 700,
								lineHeight: '66px',
								color: alpha(C.ink, 0.7),
								maxWidth: INNER_W,
								display: 'flex',
								alignItems: 'flex-start',
								gap: 16,
							}}
						>
							<span style={{width: 34, height: 5, borderRadius: 3, background: C.ink, marginTop: 31, flex: 'none', opacity: 0.8}} />
							<span>{cover.sub}</span>
						</div>
					) : null}
				</div>
				{/* 金句 */}
				{cover.quote.length ? (
					<div style={{borderTop: `2px solid ${alpha(C.ink, 0.08)}`, paddingTop: 30, display: 'flex', gap: 16}}>
						<span
							style={{
								fontFamily: SERIF,
								fontSize: 84,
								lineHeight: '70px',
								height: 48,
								fontWeight: 900,
								color: C.coral,
								flex: 'none',
							}}
						>
							“
						</span>
						<span
							style={{
								fontFamily: SERIF,
								fontSize: 40,
								fontWeight: 600,
								lineHeight: '62px',
								color: alpha(C.ink, 0.66),
							}}
						>
							{cover.quote.map((q, i) => (
								<div key={i} style={{whiteSpace: 'nowrap'}}>
									{q}
								</div>
							))}
						</span>
					</div>
				) : null}
			</div>
		</div>
	);
};

// ---------------------------------------------------------------- 片尾

export const EndBody: React.FC<{L: Layout; frame: number; fps: number; dy: number}> = ({L, frame, fps, dy}) => {
	const inF = F(L.endInMs, fps);
	const ec = L.endChips;
	const E = L.end;
	// 片尾只有 ~2s：chip 在卡片还被上一张盖着时就开始弹（翻开时已基本到位），系列名和 CTA 紧跟着，留足阅读时间
	const serDf = frame - inF + 1;
	const serP = serDf <= 0 ? 0 : spr(serDf, fps, {damping: 20, stiffness: 150});
	const ctaDf = frame - inF - 4;
	const ctaP = ctaDf <= 0 ? 0 : spr(ctaDf, fps, {damping: 14, stiffness: 170});
	const pulse = 1 + 0.02 * Math.sin(Math.max(0, frame - inF - 30) / 6);
	return (
		<>
			<CardHeader
				left={
					<div style={{display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap'}}>
						<span style={{width: 14, height: 14, borderRadius: 4, background: C.coral}} />
						<span style={{fontSize: 28, fontWeight: 800, color: alpha(C.ink, 0.62), letterSpacing: '0.08em'}}>
							本期关键词
						</span>
					</div>
				}
			/>
			<div style={{position: 'absolute', left: 0, top: dy, width: G.cardW, height: E.h}}>
				{ec.chips.map((chip, i) => {
					const pop = popOf(frame, fps, inF - 3 + i * 1.2);
					if (!pop) return null;
					return (
						<ChipView
							key={chip.text}
							chip={chip}
							left={G.padX + chip.x}
							top={E.chipsTop + chip.y}
							h={ec.chipH}
							fs={ec.fs}
							padX={ec.padX}
							dot={ec.dot}
							dotGap={12}
							scale={pop.scale}
							opacity={pop.opacity}
						/>
					);
				})}
				{E.hasSeries ? (
					<div
						style={{
							position: 'absolute',
							left: G.padX,
							top: E.labelTop,
							width: INNER_W,
							display: 'flex',
							alignItems: 'center',
							gap: 18,
							fontFamily: SANS,
							opacity: clamp01(serP * 2),
						}}
					>
						<span style={{fontSize: 26, fontWeight: 700, color: alpha(C.ink, 0.4), letterSpacing: '0.12em'}}>
							这个系列
						</span>
						<div style={{flex: 1, height: 2, borderRadius: 1, background: alpha(C.ink, 0.08)}} />
					</div>
				) : null}
				<div
					style={{
						position: 'absolute',
						left: G.padX,
						top: E.seriesTop,
						fontFamily: SANS,
						opacity: clamp01(serP * 2),
						transform: `translateY(${(1 - serP) * 24}px)`,
					}}
				>
					<div
						style={{
							position: 'absolute',
							left: -8,
							right: -8,
							bottom: E.seriesFs * 0.1,
							height: E.seriesFs * 0.36,
							borderRadius: 8,
							background: tint(C.coral, 0.55),
							transform: `rotate(-1deg) scaleX(${serP})`,
							transformOrigin: 'left center',
						}}
					/>
					<div
						style={{
							position: 'relative',
							fontSize: E.seriesFs,
							fontWeight: 900,
							color: C.ink,
							whiteSpace: 'nowrap',
							lineHeight: 1.3,
						}}
					>
						{E.series}
					</div>
				</div>
				<div
					style={{
						position: 'absolute',
						left: G.padX,
						top: E.ctaTop,
						fontFamily: SANS,
						height: 100,
						borderRadius: 50,
						background: C.ink,
						display: 'flex',
						alignItems: 'center',
						gap: 20,
						padding: '0 46px 0 24px',
						transform: `scale(${interpolate(ctaP, [0, 1], [0.7, 1]) * pulse})`,
						transformOrigin: 'left center',
						opacity: clamp01(ctaP * 2),
					}}
				>
					<span
						style={{
							position: 'relative',
							width: 56,
							height: 56,
							borderRadius: 28,
							background: C.coral,
							flex: 'none',
						}}
					>
						<span style={{position: 'absolute', left: 16, top: 26, width: 24, height: 4, borderRadius: 2, background: '#fff'}} />
						<span style={{position: 'absolute', left: 26, top: 16, width: 4, height: 24, borderRadius: 2, background: '#fff'}} />
					</span>
					<span style={{fontSize: 40, fontWeight: 800, color: C.cream, whiteSpace: 'nowrap', letterSpacing: '0.04em'}}>
						关注我，下期继续聊
					</span>
				</div>
				<div
					style={{
						position: 'absolute',
						left: G.padX,
						top: E.ctaTop + 100 + 20,
						height: 32,
						lineHeight: '32px',
						fontFamily: SANS,
						fontSize: 24,
						letterSpacing: '0.04em',
						color: C.ink,
						opacity: 0.5 * clamp01(ctaP * 2),
						whiteSpace: 'nowrap',
					}}
				>
					读书分享，非心理咨询 · 丛非从《养育你内心的小孩》
				</div>
			</div>
		</>
	);
};
