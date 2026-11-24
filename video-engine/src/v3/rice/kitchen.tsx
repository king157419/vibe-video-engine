// K1 / B01–B12：厨房台面（扁平矢量，暖光）；以及片尾 B44 原路拉回的厨房底图。
import React from 'react';
import type {Timeline} from './data';
import {Chain, chainWidth} from './cards';
import {Icon, Moon, Snowflake} from './icons';
import {C, SANS, SERIF} from './theme';
import {blobPath, easeIn, easeInOut, easeOut, fade, lin, mix, mixColor, mulberry32, pop, sineInOut} from './util';

export const BOWL_L = {cx: 620, cy: 620};
export const BOWL_R = {cx: 1300, cy: 620};
const GRAIN = {x: 600, y: 556}; // 推进时对准的那粒饭（左碗饭堆顶上）

export type Cam = {s: number; tx: number; ty: number};
export const applyCam = (c: Cam, x: number, y: number) => ({x: x * c.s + c.tx, y: y * c.s + c.ty});

/** 厨房镜头：1.00→1.03 缓推；B12 推进左碗一粒饭；B44 从一粒饭拉回 */
export const kitchenCam = (T: Timeline, t: number, ending = false): Cam => {
	const base = (s: number): Cam => ({s, tx: 960 * (1 - s), ty: 560 * (1 - s)});
	if (ending) {
		// 收束：从饭粒拉回整个厨房（B44）。审片后 P1-3：拉回挪到“记住两句”开口时，先让段 7 小结停够
		const u = easeOut(lin(t, T.jiZhu, T.jiZhu + 1.15));
		const s = 9 * Math.pow(1 / 9, u);
		const q = {x: mix(960, GRAIN.x, u), y: mix(470, GRAIN.y, u)};
		return {s, tx: q.x - GRAIN.x * s, ty: q.y - GRAIN.y * s};
	}
	const s0 = mix(1, 1.03, easeInOut(lin(t, T.first, T.first + 8)));
	if (t < T.zuanJin) return base(s0);
	const u = lin(t, T.zuanJin, T.zuanJin + 1.4);
	const start = applyCam(base(1.03), GRAIN.x, GRAIN.y);
	const s = 1.03 * Math.pow(14 / 1.03, easeIn(u));
	const k = easeInOut(Math.min(1, u * 1.4));
	const q = {x: mix(start.x, 960, k), y: mix(start.y, 470, k)};
	return {s, tx: q.x - GRAIN.x * s, ty: q.y - GRAIN.y * s};
};

/** 厨房里的“蒸汽钟”：押注定格时停住 */
const steamClock = (T: Timeline, t: number) => {
	const a = T.freeze0;
	const b = T.daAn;
	if (t < a) return t;
	if (t < b) return a;
	return t - (b - a);
};

// ---------- 碗 ----------
const riceBits = (seed: number) => {
	const rnd = mulberry32(seed);
	const out: {x: number; y: number; a: number; kind: number}[] = [];
	for (let i = 0; i < 95; i++) {
		const u = rnd() * 2 - 1;
		const top = -78 * Math.sqrt(Math.max(0, 1 - u * u)); // 饭堆轮廓
		const x = u * 165;
		const y = top + rnd() * (Math.abs(top) + 8) * 0.95 + 4;
		const k = rnd();
		out.push({x, y, a: rnd() * 180, kind: k < 0.12 ? 1 : k < 0.24 ? 2 : 0});
	}
	return out;
};

const Bowl: React.FC<{cx: number; cy: number}> = ({cx, cy}) => {
	const bits = React.useMemo(() => riceBits(11), []);
	return (
		<g transform={`translate(${cx},${cy})`}>
			<ellipse cx={0} cy={94} rx={176} ry={16} fill="#6b4a2a" opacity={0.18} />
			{/* 饭堆 */}
			<path d="M-172,-8 C-150,-70 -80,-84 0,-86 C80,-84 150,-70 172,-8 Z" fill="#efd185" />
			{bits.map((b, i) =>
				b.kind === 0 ? (
					<ellipse key={i} cx={b.x} cy={b.y - 12} rx={8} ry={3.6} fill={i % 3 === 0 ? '#fff4d2' : '#f8e6ad'} stroke="#e2c47a" strokeWidth={0.8} transform={`rotate(${b.a} ${b.x} ${b.y - 12})`} />
				) : b.kind === 1 ? (
					<rect key={i} x={b.x - 5} y={b.y - 15} width={10} height={6} rx={2} fill="#6f9a46" transform={`rotate(${b.a} ${b.x} ${b.y - 12})`} />
				) : (
					<rect key={i} x={b.x - 6} y={b.y - 16} width={12} height={8} rx={3} fill="#f2c443" transform={`rotate(${b.a} ${b.x} ${b.y - 12})`} />
				),
			)}
			{/* 碗身 */}
			<path d="M-182,-10 C-178,52 -112,86 -58,90 L58,90 C112,86 178,52 182,-10 Z" fill="#f5f1e8" stroke="#8d8273" strokeWidth={3} />
			<path d="M-176,14 C-150,44 -110,60 -60,64 L60,64 C110,60 150,44 176,14" fill="none" stroke="#a7896a" strokeWidth={6} opacity={0.55} />
			<rect x={-56} y={88} width={112} height={12} rx={4} fill="#e6dfd2" stroke="#8d8273" strokeWidth={3} />
			<ellipse cx={0} cy={-10} rx={182} ry={9} fill="none" stroke="#8d8273" strokeWidth={3} />
		</g>
	);
};

/** 蒸汽：每碗 3 条确定曲线，慢慢往上飘 */
const Steam: React.FC<{cx: number; cy: number; sc: number; boost: number; opacity: number}> = ({cx, cy, sc, boost, opacity}) => (
	<g opacity={opacity}>
		{[-60, 0, 58].map((dx, k) => {
			const pts: string[] = [];
			const h = 190 + 60 * boost;
			for (let i = 0; i <= 24; i++) {
				const v = i / 24;
				const y = cy - 92 - v * h;
				const x = cx + dx + Math.sin(v * 5.2 - sc * 1.3 + k * 2.1) * (10 + 16 * v) * (1 + 0.6 * boost);
				pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
			}
			const breathe = 0.55 + 0.25 * Math.sin(sc * 0.9 + k * 1.7);
			return (
				<polyline
					key={k}
					points={pts.join(' ')}
					fill="none"
					stroke="#ffffff"
					strokeWidth={9 + 8 * boost}
					strokeLinecap="round"
					opacity={Math.min(1, breathe + 0.4 * boost)}
					mask="url(#steamFade)"
				/>
			);
		})}
	</g>
);

/** 碗前的纸签 */
const Tag: React.FC<{cx: number; cy: number; letter: string; l1: string; l2: string; hi: number; dim: number; rot: number; outline?: number}> = ({cx, cy, letter, l1, l2, hi, dim, rot, outline = 0}) => {
	const s = 1 + 0.08 * hi;
	return (
		<g transform={`translate(${cx},${cy}) rotate(${rot}) scale(${s})`} opacity={1 - 0.45 * dim}>
			{/* 揭晓后 A 纸签的品红描边（“这碗有毒”，二审 S5：不再做迷你 A 卡） */}
			{outline > 0 ? <rect x={-213} y={-65} width={426} height={130} rx={14} fill="none" stroke={C.toxin} strokeWidth={7} opacity={outline} /> : null}
			<line x1={0} y1={-62} x2={0} y2={-112} stroke="#9b7b55" strokeWidth={6} strokeLinecap="round" />
			<rect x={-206} y={-58} width={412} height={116} rx={10} fill="#5b4a36" opacity={0.15} transform="translate(5,6)" />
			<rect x={-206} y={-58} width={412} height={116} rx={10} fill={C.paper} stroke={mixColor('#b5ab98', '#23272b', hi)} strokeWidth={3 + 2 * hi} />
			<circle cx={-170} cy={-18} r={24} fill={C.ink} />
			<text x={-170} y={-5} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={36} fill={C.paper}>
				{letter}
			</text>
			<text x={-132} y={-4} fontFamily={SERIF} fontWeight={600} fontSize={40} fill={C.ink}>
				{l1}
			</text>
			<text x={-178} y={42} fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.inkSoft}>
				{l2}
			</text>
		</g>
	);
};

const Bubble: React.FC<{cx: number; cy: number; w: number; h: number; tailX: number; tailY: number; s: number; op: number; children?: React.ReactNode}> = ({cx, cy, w, h, tailX, tailY, s, op, children}) => {
	if (op <= 0.001) return null;
	const x0 = -w / 2;
	const y0 = -h / 2;
	const tx = tailX - cx;
	const ty = tailY - cy;
	return (
		<g transform={`translate(${cx},${cy}) scale(${s})`} opacity={op}>
			<path d={`M${tx - 22},${y0 + h - 2} L${tx},${ty} L${tx + 24},${y0 + h - 2} Z`} fill={C.paper} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
			<rect x={x0} y={y0} width={w} height={h} rx={h / 2} fill={C.paper} stroke={C.ink} strokeWidth={3} />
			<rect x={tx - 20} y={y0 + h - 6} width={42} height={8} fill={C.paper} />
			{children}
		</g>
	);
};

// 气泡里两节链的位置（48px），飞到 B、C 卡时要从这里出发
export const BUBBLE_B = {cx: 1300, cy: 392};
export const BUBBLE_C = {cx: 960, cy: 300};
export const CHAIN_B = [{text: '隔夜'}, {text: '危险'}];
export const CHAIN_C = [{text: '炒透'}, {text: '安全'}];
export const BUBBLE_SCALE = 48 / 36;

export const Kitchen: React.FC<{T: Timeline; t: number; ending?: boolean}> = ({T, t, ending}) => {
	const cam = kitchenCam(T, t, ending);
	const sc = steamClock(T, t);
	// 窗光：B03 一下午过去，正午白 → 傍晚橙
	const eve = ending ? 1 : sineInOut(lin(t, T.zuo1, T.zuo1End));
	const skyTop = mixColor('#cfe1e9', '#e79a5c', eve);
	const skyBot = mixColor('#f4f1e6', '#f7d29a', eve);
	const lightCol = mixColor('#ffffff', '#ffc27a', eve);
	// 高亮与压暗（B03 / B04）
	const hiL = ending ? 0 : fade(t, T.zuo1 - 0.05, T.you1 - 0.1, 0.3, 0.3);
	const hiR = ending ? 0 : fade(t, T.you1 - 0.05, T.laoHua - 0.2, 0.3, 0.4);
	const dimR = ending ? 0 : fade(t, T.zuo1, T.you1 - 0.1, 0.3, 0.3);
	const dimL = ending ? 0 : fade(t, T.you1, T.laoHua - 0.2, 0.3, 0.4);
	const boost = ending ? 0 : Math.sin(Math.PI * lin(t, T.chaoTou1, T.chaoTou1 + 0.6)) * (t < T.chaoTou1 + 0.6 ? 1 : 0);
	const steamOp = ending ? 0 : 1 - lin(t, T.zuanJin, T.zuanJin + 0.6);
	const outlineA = ending ? 0 : fade(t, T.weiShenMe + 0.2, Infinity, 0.4);
	// 收束 B44（二审 S11）：纸签在拉回过程中先淡出（不进字幕带）；碗、筷子在终局卡升起时淡出到 0。
	// 审片后 P2-8：窗、置物架和调料罐也一起淡出，截图帧里两张卡周围只剩压暗的墙面和台面
	// 审片后 P2-1：开头推进一粒饭时，纸签一开推就淡出，不会被放大压进字幕带
	const props = ending ? 1 - lin(t, T.jiZhu + 0.65, T.jiZhu + 1.25) : 1;
	const tagsOp = ending ? 1 - lin(t, T.jiZhu + 0.05, T.jiZhu + 0.45) : 1 - lin(t, T.zuanJin, T.zuanJin + 0.35);
	// 气泡
	const bubB = fade(t, T.geYeBuNeng, T.naWan, 0.3, 0.5);
	const bubC = fade(t, T.chaoTouMeiShi, T.naWan, 0.3, 0.5);
	const popB = pop(t, T.geYeBuNeng, 0.45);
	const popC = pop(t, T.chaoTouMeiShi, 0.45);
	const wB = chainWidth(CHAIN_B, 48) + 64;
	const wC = chainWidth(CHAIN_C, 48) + 64;
	const shrinkB = 1 - 0.3 * lin(t, T.naWan, T.naWan + 0.5);
	return (
		<div style={{position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${cam.tx}px,${cam.ty}px) scale(${cam.s})`}}>
			<svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
				<defs>
					<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor={skyTop} />
						<stop offset="1" stopColor={skyBot} />
					</linearGradient>
					<linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor={lightCol} stopOpacity={0.55} />
						<stop offset="1" stopColor={lightCol} stopOpacity={0} />
					</linearGradient>
					<linearGradient id="steamGrad" x1="0" y1="1" x2="0" y2="0">
						<stop offset="0" stopColor="#fff" stopOpacity={0} />
						<stop offset="0.25" stopColor="#fff" stopOpacity={0.9} />
						<stop offset="1" stopColor="#fff" stopOpacity={0} />
					</linearGradient>
					<mask id="steamFade" maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
						<rect x={0} y={250} width={1920} height={300} fill="url(#steamGrad)" />
					</mask>
				</defs>
				{/* 墙 + 窗 */}
				<rect x={-200} y={-200} width={2320} height={900} fill="#ede2cd" />
				<g opacity={props}>
					<rect x={120} y={60} width={430} height={340} rx={8} fill="#fbf6ec" />
					<rect x={140} y={80} width={390} height={300} fill="url(#sky)" />
					<line x1={335} y1={80} x2={335} y2={380} stroke="#fbf6ec" strokeWidth={12} />
					<line x1={140} y1={230} x2={530} y2={230} stroke="#fbf6ec" strokeWidth={12} />
					<path d="M140,380 L530,380 L900,700 L420,700 Z" fill="url(#beam)" />
				</g>
				{/* 墙砖 */}
				<rect x={-200} y={470} width={2320} height={200} fill="#e6d8be" />
				{Array.from({length: 14}).map((_, i) => (
					<line key={`v${i}`} x1={i * 150 - 40} y1={470} x2={i * 150 - 40} y2={670} stroke="#d8c7a8" strokeWidth={3} />
				))}
				<line x1={-200} y1={570} x2={2120} y2={570} stroke="#d8c7a8" strokeWidth={3} />
				{/* 置物架上的米缸、调料瓶（静物，交代“厨房”） */}
				<g opacity={props}>
					<rect x={1560} y={250} width={300} height={14} rx={4} fill="#b69a74" />
					<rect x={1590} y={170} width={70} height={80} rx={10} fill="#d9cbb0" stroke="#9b8668" strokeWidth={3} />
					<rect x={1680} y={150} width={60} height={100} rx={8} fill="#cdbb98" stroke="#9b8668" strokeWidth={3} />
					<rect x={1760} y={185} width={70} height={65} rx={10} fill="#e2d6be" stroke="#9b8668" strokeWidth={3} />
				</g>
				{/* 台面 */}
				<rect x={-200} y={668} width={2320} height={90} fill="#d6c09a" />
				<rect x={-200} y={668} width={2320} height={8} fill="#e6d3b0" />
				<rect x={-200} y={758} width={2320} height={500} fill="#b99d78" />
				{Array.from({length: 7}).map((_, i) => (
					<rect key={`d${i}`} x={i * 330 - 120} y={790} width={300} height={260} rx={8} fill="none" stroke="#a5896a" strokeWidth={4} />
				))}
				<g opacity={props}>
				{/* 筷子 */}
				<g transform="translate(960,700) rotate(-8)">
					<rect x={-120} y={-5} width={240} height={8} rx={4} fill="#8c6844" />
					<rect x={-118} y={8} width={236} height={8} rx={4} fill="#8c6844" />
				</g>
				{/* 两碗 */}
				<g opacity={1 - 0.45 * dimL}>
					<Bowl cx={BOWL_L.cx} cy={BOWL_L.cy} />
				</g>
				<g opacity={1 - 0.45 * dimR}>
					<Bowl cx={BOWL_R.cx} cy={BOWL_R.cy} />
				</g>
				{steamOp > 0 ? (
					<>
						<Steam cx={BOWL_L.cx} cy={BOWL_L.cy} sc={sc} boost={boost} opacity={steamOp * (1 - 0.45 * dimL)} />
						<Steam cx={BOWL_R.cx} cy={BOWL_R.cy} sc={sc + 3.7} boost={boost} opacity={steamOp * (1 - 0.45 * dimR)} />
					</>
				) : null}
				</g>
				{/* 纸签（y 780–900） */}
				<g opacity={tagsOp}>
				<Tag cx={BOWL_L.cx} cy={842} letter="A" l1="中午剩的" l2="桌上放到傍晚 6 点" hi={hiL} dim={dimL} rot={-1.5} outline={outlineA} />
				<Tag cx={BOWL_R.cx} cy={842} letter="B" l1="昨晚剩的" l2="饭后 1 小时进冰箱" hi={hiR} dim={dimR} rot={1.5} />
				{/* B 签角：月亮 + 雪花（SVG） */}
				<g transform={`translate(${BOWL_R.cx},842) rotate(1.5) scale(${1 + 0.08 * hiR})`} opacity={1 - 0.45 * dimR}>
					<Icon x={128} y={-20} size={40}>
						<Moon color={C.ink} fill={C.ink} />
					</Icon>
					<Icon x={176} y={-20} size={40}>
						<Snowflake color={C.coldInk} sw={9} />
					</Icon>
				</g>
				{/* 两句老话：两节链的气泡（B05、B06） */}
				<Bubble cx={BUBBLE_B.cx} cy={BUBBLE_B.cy} w={wB} h={92} tailX={BOWL_R.cx + 40} tailY={498} s={popB * shrinkB} op={bubB}>
					<g opacity={t < T.naWan ? 1 : 0}>
						<g transform={`translate(${-wB / 2 + 32},0)`}>
							<Chain nodes={CHAIN_B} size={48} />
						</g>
					</g>
				</Bubble>
				</g>
				<Bubble cx={BUBBLE_C.cx} cy={BUBBLE_C.cy} w={wC} h={92} tailX={960} tailY={420} s={popC * shrinkB} op={bubC}>
					<g opacity={t < T.naWan ? 1 : 0}>
						<g transform={`translate(${-wC / 2 + 32},0)`}>
							<Chain nodes={CHAIN_C} size={48} />
						</g>
					</g>
				</Bubble>
			</svg>
		</div>
	);
};

/** B12：推进到一粒饭 → 圆形光圈打开。返回光圈半径（0..1 的进度）和饭粒近景的不透明度 */
export const pushState = (T: Timeline, t: number) => {
	const t0 = T.zuanJin;
	return {
		kitchenOp: 1 - lin(t, t0 + 1.05, t0 + 1.45),
		macroOp: Math.min(lin(t, t0 + 1.0, t0 + 1.4), 1 - lin(t, t0 + 1.9, t0 + 2.5)),
		iris: easeOut(lin(t, t0 + 1.35, t0 + 2.3)),
	};
};

/** 饭粒近景：满屏的米黄淀粉质感（半透明淀粉块叠在一起，像贴着饭粒表面） */
export const GrainMacro: React.FC<{op: number}> = ({op}) => {
	if (op <= 0) return null;
	const blobs = Array.from({length: 11}).map((_, i) => {
		const r = mulberry32(90 + i);
		return {x: r() * 1920, y: r() * 1080, rr: 200 + r() * 260, seed: 300 + i};
	});
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: op}}>
			<rect width={1920} height={1080} fill="#f3ead4" />
			{blobs.map((b, i) => (
				<path key={i} d={blobPath(b.x, b.y, b.rr, b.seed, 9, 0.35, 1.25, 0.85)} fill="#fbf7ee" fillOpacity={0.62} stroke="#ded1b4" strokeWidth={6} />
			))}
		</svg>
	);
};
