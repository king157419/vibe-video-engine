// 两节链、押注卡（A/B/C）、K7 里“只划掉错的那一节”，以及段末留在右上角的两条改好的链。
import React from 'react';
import type {Timeline} from './data';
import {Arrow, Check, Icon} from './icons';
import {applyCam, BOWL_L, BUBBLE_B, BUBBLE_C, BUBBLE_SCALE, CHAIN_B, CHAIN_C, kitchenCam} from './kitchen';
import {C, HAND, SANS, SERIF} from './theme';
import {easeOut, fade, lin, mix, pop, ramp, textW} from './util';

// bare：手写改正，不带框、前面不带箭头，直接接在被划掉的那一节后面（审片后 P2-7：改正写在同一行，不再叠在上方）；
// write：手写从左往右写出来的进度；dot：字后面的品红毒素点
export type ChainNode = {text: string; check?: number; strike?: number; strikeArrow?: boolean; insert?: number; hand?: boolean; bare?: boolean; write?: number; dot?: number};

const PAD = 0.38;
/** 霞鹜文楷手写字的宽度（按 1.05 倍字号排；“≠”是全角宽） */
const handW = (s: string, size: number) => {
	let w = 0;
	for (const ch of s) w += /\s/.test(ch) ? 0.35 : /[0-9A-Za-z]/.test(ch) ? 0.58 : 1;
	return w * size * 1.05;
};
const ARROW = 1.35;
export const chainLayout = (nodes: ChainNode[], size: number) => {
	let x = 0;
	return nodes.map((n, i) => {
		const k = n.insert ?? 1;
		const ax0 = x;
		const aw = n.bare ? size * 0.3 * k : i > 0 ? size * ARROW * k : 0;
		x += aw;
		const w = n.bare
			? (handW(n.text, size) + (n.dot !== undefined ? size * 0.75 : 0)) * k
			: (textW(n.text, size) + 2 * PAD * size + (n.check !== undefined ? size * 0.95 : 0)) * k;
		const x0 = x;
		x += w;
		return {ax0, aw, x0, w, x1: x};
	});
};
export const chainWidth = (nodes: ChainNode[], size: number) => {
	const L = chainLayout(nodes, size);
	return L[L.length - 1].x1;
};

/** 两节链：[隔夜] → [危险]。原点在左端、竖直居中 */
export const Chain: React.FC<{nodes: ChainNode[]; size: number; id?: string}> = ({nodes, size, id = 'chain'}) => {
	const L = chainLayout(nodes, size);
	const h = size * 1.5;
	return (
		<g>
			{nodes.map((n, i) => {
				const l = L[i];
				const k = n.insert ?? 1;
				if (k <= 0.001) return null;
				if (n.bare) {
					const wr = n.write ?? 1;
					const tw = handW(n.text, size);
					const cid = `${id}-w${i}`;
					return (
						<g key={i} opacity={k}>
							{wr < 1 ? (
								<defs>
									<clipPath id={cid}>
										<rect x={l.x0 - 4} y={-size} width={(tw + 8) * wr} height={size * 2} />
									</clipPath>
								</defs>
							) : null}
							<text x={l.x0} y={size * 0.36} fontFamily={n.hand ? HAND : SANS} fontWeight={500} fontSize={size * 1.05} fill={C.ink} clipPath={wr < 1 ? `url(#${cid})` : undefined}>
								{n.text}
							</text>
							{n.dot ? <circle cx={l.x0 + tw + size * 0.42} cy={-size * 0.02} r={size * 0.27 * n.dot} fill={C.toxin} /> : null}
						</g>
					);
				}
				return (
					<g key={i} opacity={k}>
						{i > 0 ? (
							<Icon x={l.ax0 + l.aw / 2} y={0} size={size * 0.95 * k}>
								<Arrow color={C.inkSoft} sw={8} />
							</Icon>
						) : null}
						<rect x={l.x0 + 3} y={-h / 2} width={Math.max(0, l.w - 6)} height={h} rx={h * 0.22} fill={C.paper} stroke={C.ink} strokeWidth={2.5} />
						<g transform={`translate(${l.x0 + l.w / 2},0) scale(${k},1)`}>
							<text
								x={n.check !== undefined ? -size * 0.45 : 0}
								y={size * 0.36}
								textAnchor="middle"
								fontFamily={n.hand ? HAND : SANS}
								fontWeight={500}
								fontSize={size}
								fill={C.ink}
							>
								{n.text}
							</text>
							{n.check !== undefined ? (
								<Icon x={textW(n.text, size) / 2 + size * 0.1} y={0} size={size * 0.8}>
									<Check u={n.check} color={C.ink} sw={14} />
								</Icon>
							) : null}
						</g>
						{n.strike ? (
							<line
								x1={n.strikeArrow ? l.ax0 + 4 : l.x0 + 2}
								y1={size * 0.12}
								x2={mix(n.strikeArrow ? l.ax0 + 4 : l.x0 + 2, l.x1 - 2, n.strike)}
								y2={-size * 0.12}
								stroke={C.ink}
								strokeWidth={size * 0.12}
								strokeLinecap="round"
							/>
						) : null}
					</g>
				);
			})}
		</g>
	);
};

/** 纸卡：左上角圆形字母章 + 宋体标题 */
export const Card: React.FC<{cx: number; cy: number; w: number; h: number; s: number; op: number; letter: string; title: string; outline?: number; children?: React.ReactNode}> = ({
	cx,
	cy,
	w,
	h,
	s,
	op,
	letter,
	title,
	outline = 0,
	children,
}) => {
	if (op <= 0.001) return null;
	return (
		<g transform={`translate(${cx - (w * s) / 2},${cy - (h * s) / 2}) scale(${s})`} opacity={op}>
			<rect x={6} y={8} width={w} height={h} rx={14} fill="#3b3226" opacity={0.14} />
			<rect x={0} y={0} width={w} height={h} rx={14} fill={C.paper} stroke={C.paperEdge} strokeWidth={2.5} />
			{outline > 0 ? <rect x={-4} y={-4} width={w + 8} height={h + 8} rx={17} fill="none" stroke={C.toxin} strokeWidth={7} opacity={outline} /> : null}
			<circle cx={46} cy={46} r={27} fill={C.ink} />
			<text x={46} y={59} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={38} fill={C.paper}>
				{letter}
			</text>
			<text x={86} y={60} fontFamily={SERIF} fontWeight={600} fontSize={40} fill={C.ink}>
				{title}
			</text>
			{children}
		</g>
	);
};

/** 灰色小签（“常见直觉”“示意”之类） */
export const GrayTag: React.FC<{x: number; y: number; text: string; size?: number; op?: number; anchor?: 'middle' | 'start'; color?: string; stroke?: string}> = ({
	x,
	y,
	text,
	size = 36,
	op = 1,
	anchor = 'middle',
	color = C.inkSoft,
	stroke = C.inkFaint,
}) => {
	if (op <= 0.001) return null;
	const w = textW(text, size) + size * 0.9;
	const h = size * 1.45;
	const x0 = anchor === 'middle' ? x - w / 2 : x;
	return (
		<g opacity={op}>
			<rect x={x0} y={y - h / 2} width={w} height={h} rx={h / 2} fill={C.paper} fillOpacity={0.9} stroke={stroke} strokeWidth={2.5} />
			<text x={x0 + w / 2} y={y + size * 0.36} textAnchor="middle" fontFamily={SANS} fontWeight={500} fontSize={size} fill={color}>
				{text}
			</text>
		</g>
	);
};

/** 手写改正（霞鹜文楷），从左往右写出来 */
export const HandNote: React.FC<{x: number; y: number; text: string; u: number; size?: number; color?: string; id: string}> = ({x, y, text, u, size = 40, color = C.ink, id}) => {
	if (u <= 0) return null;
	const w = textW(text, size) * 1.3 + 16;
	return (
		<g>
			<defs>
				<clipPath id={id}>
					<rect x={x - 4} y={y - size * 1.1} width={w * u} height={size * 1.6} />
				</clipPath>
			</defs>
			<text x={x} y={y} fontFamily={HAND} fontWeight={500} fontSize={size} fill={color} clipPath={`url(#${id})`}>
				{text}
			</text>
		</g>
	);
};

// ---------- 押注卡的整条时间线 ----------
const CARD_W = 340;
const CARD_H = 222;
const A_H = 180;
const TOP = 165;
const CHAIN_DX = 24; // 卡内链条左端
const CHAIN_DY = 140; // 卡内链条中线
// 审片后 P2-7：槽位改成左端固定，改正写进同一行时卡片往右长（w0 → w1），链的左端不动
export const K7SLOT = {B: {x0: 220, y: 790, w0: 400, w1: 470}, C: {x0: 900, y: 392, w0: 480, w1: 630}};
// 二审 S5：揭晓后 B、C 卡只留卡头一行的小页签（36px），停在左右边缘，不压视野圆和样本卡
const TAB_W = 226;
const TAB_H = 58;
// 厨房和认零件段：B 页签在右边、C 页签在左边。
// 审片后 P2-6：进双视野后两张页签挪到两视野之间的上方、上下摞着，不贴任何一个视野（原来 C 贴着 A 视野的样本卡，像在给 A 贴标签）
export const TAB = {B: {x: 1920 - 14 - TAB_W, y: 190}, C: {x: 14, y: 190}};
export const TAB_MID = {B: {x: 960 - TAB_W / 2, y: 178}, C: {x: 960 - TAB_W / 2, y: 244}};
// 二审 S6：K7 末尾，两张改好的卡只留改后的那条链，缩成两行 36px 的残影放右上角，留到 B44
export const RESID = {x: 1410, yB: 182, yC: 126}; // C 在上、B 在下：两条链飞过去时不交叉

type Pose = {cx: number; cy: number; s: number; op: number; w: number};
const tabCenter = (k: 'B' | 'C') => ({x: TAB_MID[k].x + TAB_W / 2, y: TAB_MID[k].y + TAB_H / 2});

/** 卡片位姿：落下 → 揭晓后收进页签 → K7 从页签展开到槽位 → 段末卡片淡出（链去右上角当残影）。grow：改正写进同一行时卡片变宽 */
const cardPose = (T: Timeline, t: number, k: 'B' | 'C', home: {x: number; y: number}, tExpand: number, tResid: number, grow: number): Pose => {
	const appear = ramp(t, T.naWan, 0.6, easeOut);
	const edge = {x: TAB[k].x + TAB_W / 2, y: TAB[k].y + TAB_H / 2};
	const tc = tabCenter(k);
	const slot = K7SLOT[k];
	if (t < T.weiShenMe) return {cx: home.x, cy: home.y, s: mix(0.9, 1, appear), op: appear, w: CARD_W};
	if (t < tExpand) {
		const u = ramp(t, T.weiShenMe, 0.6);
		return {cx: mix(home.x, edge.x, u), cy: mix(home.y, edge.y, u), s: mix(1, 0.55, u), op: 1 - lin(u, 0.1, 0.7), w: CARD_W};
	}
	const u = ramp(t, tExpand, 0.75);
	const out = lin(t, tResid, tResid + 0.5);
	const ws = mix(slot.w0, slot.w1, grow);
	return {cx: mix(tc.x, slot.x0 + ws / 2, u), cy: mix(tc.y, slot.y, u), s: mix(0.55, 1, u), op: lin(u, 0.25, 0.8) * (1 - out), w: mix(CARD_W, ws, u)};
};
const tabOp = (T: Timeline, t: number, tExpand: number) => Math.min(lin(t, T.weiShenMe + 0.25, T.weiShenMe + 0.6), 1 - lin(t, tExpand, tExpand + 0.3)) * 0.92;
/** 页签位置：进双视野时（“左边”#2）从两边淡出、在中间淡入 */
const tabMove = (T: Timeline, t: number) => ramp(t, T.zuo2, 0.7);

const Tab: React.FC<{k: 'B' | 'C'; letter: string; title: string; op: number; mid?: boolean}> = ({k, letter, title, op, mid}) => {
	if (op <= 0.001) return null;
	const {x, y} = mid ? TAB_MID[k] : TAB[k];
	return (
		<g opacity={op}>
			<rect x={x + 3} y={y + 4} width={TAB_W} height={TAB_H} rx={12} fill="#3b3226" opacity={0.12} />
			<rect x={x} y={y} width={TAB_W} height={TAB_H} rx={12} fill={C.paper} stroke={C.paperEdge} strokeWidth={2.5} />
			<circle cx={x + 32} cy={y + TAB_H / 2} r={23} fill={C.ink} />
			<text x={x + 32} y={y + TAB_H / 2 + 12} textAnchor="middle" fontFamily={SERIF} fontWeight={700} fontSize={36} fill={C.paper}>
				{letter}
			</text>
			<text x={x + 66} y={y + TAB_H / 2 + 13} fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.ink}>
				{title}
			</text>
		</g>
	);
};

export const BetCards: React.FC<{T: Timeline; t: number}> = ({T, t}) => {
	if (t < T.naWan - 0.01 || t > T.jiZhu + 1.5) return null;
	const homeB = {x: 960, y: TOP + CARD_H / 2};
	const homeC = {x: 1360, y: TOP + CARD_H / 2};
	const tResid = T.naiReDeDu1End + 0.4;
	// A 卡：落下 → 品红描边 → 揭晓后淡出，品红描边转到左碗的 A 纸签上（二审 S5，不再缩成迷你卡）
	const aDrop = easeOut(lin(t, T.naWan, T.naWan + 0.6));
	let aPose: Pose = {cx: 560, cy: mix(-140, TOP + A_H / 2, aDrop), s: 1, op: lin(t, T.naWan, T.naWan + 0.2), w: CARD_W};
	const aGo = ramp(t, T.weiShenMe, 0.6);
	if (aGo > 0) {
		const p = applyCam(kitchenCam(T, t), BOWL_L.cx, 842);
		aPose = {cx: mix(aPose.cx, p.x, aGo), cy: mix(aPose.cy, p.y, aGo), s: mix(1, 0.6, aGo), op: 1 - lin(aGo, 0.2, 0.85), w: CARD_W};
	}
	const outlineA = lin(t, T.daAn, T.daAn + 0.3);
	// K7：B 卡只划掉“隔夜”，在同一行接着手写“室温时间”；C 卡插入“杀菌 ✓”，只划掉“→ 安全”，同一行接着写“≠ 解毒”
	const noteB = fade(t, T.fangDeJiu, Infinity, 0.4);
	const strikeB = ramp(t, T.six2, 0.4);
	const insB = ramp(t, T.six2 + 0.45, 0.35);
	const handB = ramp(t, T.six2 + 0.6, 0.7, (u) => u);
	const insC = ramp(t, T.reTou1, 0.5);
	const checkC = ramp(t, T.reTou1 + 0.45, 0.35);
	// 二审 S6：“错在”就划掉“→ 安全”；“≠ 解毒”在“耐热的毒”开口前写完
	const strikeC = ramp(t, T.cuoZai, 0.35);
	const insC2 = ramp(t, T.cuoZai + 0.4, 0.3);
	const handC = ramp(t, T.cuoZai + 0.5, 0.6, (u) => u);
	const dotC = pop(t, T.cuoZai + 1.15, 0.35);
	// B、C 卡
	const bPose = cardPose(T, t, 'B', homeB, T.geYeXiaRen, tResid, insB);
	const cPose = cardPose(T, t, 'C', homeC, T.chaoTouAnQuan, tResid, insC2);

	// 链：B05/B06 的气泡里飞出来，变成 B、C 卡的副标题；两条链分走上下两道弧线，避免在半路交叉重叠
	const fly = ramp(t, T.naWan, 0.9);
	const chainPose = (p: Pose, bubble: {cx: number; cy: number}, nodes: typeof CHAIN_B, arc: number) => {
		const cam = kitchenCam(T, T.naWan);
		const bw = chainWidth(nodes, 48) + 64;
		const b0 = applyCam(cam, bubble.cx - bw / 2 + 32, bubble.cy);
		const cardX = p.cx - (p.w * p.s) / 2 + CHAIN_DX * p.s;
		const cardY = p.cy - (CARD_H * p.s) / 2 + CHAIN_DY * p.s;
		return {x: mix(b0.x, cardX, fly), y: mix(b0.y, cardY, fly) + arc * 4 * fly * (1 - fly), s: mix(BUBBLE_SCALE * cam.s, p.s, fly)};
	};
	const nodesB: ChainNode[] = [{text: '隔夜', strike: strikeB}, {text: '室温时间', hand: true, bare: true, insert: insB, write: handB}, {text: '危险'}];
	const nodesC: ChainNode[] = [
		{text: '炒透'},
		{text: '杀菌', check: checkC, insert: insC},
		{text: '安全', strike: strikeC, strikeArrow: true},
		{text: '≠ 解毒', hand: true, bare: true, insert: insC2, write: handC, dot: dotC},
	];
	const cb = chainPose(bPose, BUBBLE_B, CHAIN_B, -70);
	const cc = chainPose(cPose, BUBBLE_C, CHAIN_C, 70);
	const LB = chainLayout(nodesB, 36);
	const tagOp = fade(t, T.meiGeYe, T.weiShenMe + 0.1, 0.35, 0.4);
	// 残影：链从卡上移到右上角（0.8 秒），卡上的链淡出、改好的链淡入
	const rv = ramp(t, tResid, 0.8);
	const residOut = 1 - lin(t, T.jiZhu + 0.9, T.jiZhu + 1.4);
	const toR = (c: {x: number; y: number; s: number}, y: number) => ({x: mix(c.x, RESID.x, rv), y: mix(c.y, y, rv), s: mix(c.s, 1, rv)});
	const rb = toR(cb, RESID.yB);
	const rc = toR(cc, RESID.yC);
	const cardChainOp = 1 - lin(rv, 0.05, 0.35);
	const residOp = lin(rv, 0.3, 0.7) * residOut;
	const residB: ChainNode[] = [{text: '室温时间', hand: true}, {text: '危险'}];
	const residC: ChainNode[] = [{text: '炒透'}, {text: '杀菌', check: 1}, {text: '≠ 解毒', hand: true, bare: true, dot: 1}];
	// 进度条（B08–B09）
	const barOp = fade(t, T.xianXuan, T.daAn + 0.15, 0.3, 0.3);
	const barU = lin(t, T.freeze0, T.daAn);
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
			{/* A */}
			<Card cx={aPose.cx} cy={aPose.cy} w={CARD_W} h={A_H} s={aPose.s} op={aPose.op} letter="A" title="桌上那碗" outline={outlineA}>
				<text x={CHAIN_DX} y={CHAIN_DY - 16} fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.inkSoft}>
					放了一下午
				</text>
			</Card>
			{/* B、C 页签（揭晓后到 K7 之间）：先在两边，进双视野后挪到中间 */}
			<Tab k="B" letter="B" title="冰箱那碗" op={tabOp(T, t, T.geYeXiaRen) * (1 - lin(tabMove(T, t), 0, 0.5))} />
			<Tab k="C" letter="C" title="两碗一样" op={tabOp(T, t, T.chaoTouAnQuan) * (1 - lin(tabMove(T, t), 0, 0.5))} />
			<Tab k="B" letter="B" title="冰箱那碗" op={tabOp(T, t, T.geYeXiaRen) * lin(tabMove(T, t), 0.5, 1)} mid />
			<Tab k="C" letter="C" title="两碗一样" op={tabOp(T, t, T.chaoTouAnQuan) * lin(tabMove(T, t), 0.5, 1)} mid />
			{/* B */}
			<Card cx={bPose.cx} cy={bPose.cy} w={bPose.w} h={CARD_H} s={bPose.s} op={bPose.op} letter="B" title="冰箱那碗">
				<GrayTag x={bPose.w / 2} y={CARD_H + 40} text="常见直觉" op={tagOp} />
			</Card>
			<Card cx={cPose.cx} cy={cPose.cy} w={cPose.w} h={CARD_H} s={cPose.s} op={cPose.op} letter="C" title="两碗一样">
				<GrayTag x={cPose.w / 2} y={CARD_H + 40} text="常见直觉" op={tagOp} />
			</Card>
			{/* 链（与卡同步缩放、淡化） */}
			<g transform={`translate(${rb.x},${rb.y}) scale(${rb.s})`} opacity={(t < tResid ? bPose.op : 1) * cardChainOp}>
				<Chain nodes={nodesB} size={36} id="cardB" />
				<text x={LB[0].x0 + 4} y={74} fontFamily={SANS} fontWeight={500} fontSize={36} fill={C.inkSoft} opacity={noteB * (1 - rv)}>
					≈ 放得久
				</text>
			</g>
			<g transform={`translate(${rc.x},${rc.y}) scale(${rc.s})`} opacity={(t < tResid ? cPose.op : 1) * cardChainOp}>
				<Chain nodes={nodesC} size={36} id="cardC" />
			</g>
			{/* 右上角残影：两条改好的链（B36 → B44） */}
			{residOp > 0 ? (
				<g opacity={residOp}>
					<g transform={`translate(${rb.x},${rb.y})`}>
						<Chain nodes={residB} size={36} />
					</g>
					<g transform={`translate(${rc.x},${rc.y})`}>
						<Chain nodes={residC} size={36} id="residC" />
					</g>
				</g>
			) : null}
			{/* 进度条 */}
			{barOp > 0 ? (
				<g opacity={barOp}>
					<rect x={450} y={428} width={1020} height={10} rx={5} fill={C.ink} opacity={0.15} />
					<rect x={450} y={428} width={1020 * barU} height={10} rx={5} fill={C.inkSoft} />
				</g>
			) : null}
		</svg>
	);
};
