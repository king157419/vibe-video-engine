import React from 'react';
import type {Item, Pt} from '../../whiteboard';
import {arrow, bubble, check, clamp01, cross, easeOut, HandText, mic, R, ring, rr, sheet, textW, thought} from '../../whiteboard';
import type {SectionCtx} from '../ctx';
import {ARROW_Y, CHAIN, chainClockHands, LINE_HEAD, LINE_SIZE, LINE_Y, MB, MEMO, MP, reg, resetReg, ringOf} from '../local/s10_layout';
import {BaseRow} from '../props';

// s10 · 工具：抓 · 追（6:57–7:42）  主岛 MEMO（s11、s12 前半段接着用同一张备忘录；版面见 local/s10_layout.ts）
// 画面线索：开头那条消息（D1）被「拿」过来缩到左上角 → 「抓 · 追 · 加」三个字 + 空格 → 备忘录第一格「抓」
// → 脑子里整句一闪就过 vs 备忘录一个字一个字写（呼应 D5 的快和慢）→「然后呢」箭头往右长两节（红 → 橙 → 蓝圈）
// → 追问格（最多 3 次）+ 停牌 + 迷你底座滑上来蓝格闪 →「我会很烦」打叉，箭头绕到「没办成」。

export const build = (ctx: SectionCtx) => {
	const {b, q, props, C} = ctx;
	const {chat} = props;
	resetReg();
	chainClockHands(b);
	const aux = (fn: () => void) => reg.aux.push(...b.collect(fn));

	// ① 「拿开头那条消息」：回到 D1（涂黑名字、23:05），圈一下那条气泡；「从头走一遍」时整个 D1 缩到 MEMO 左上角
	ctx.cam(chat.views.panel, ctx.t0 - 500, 1300, {whoosh: true});
	const tMove = q.at('从头');
	const [bx0, by0, bx1, by1] = chat.box.bubble;
	b.inGroup(chat.g, () => ring(b, (bx0 + bx1) / 2, (by0 + by1) / 2, bx1 - bx0 + 70, by1 - by0 + 60, ctx.t0 + 350, 520, {color: C.pencilDark, w: 3, out: tMove + 900, outDur: 300}));
	chat.moveTo(tMove, 1500, MEMO.d1Box);
	// 集成修正：整岛视图把左上角的迷你 D1 和「抓·追·加」切在顶边，框往上多放 60。
	ctx.cam(MB(0, -60, 2400, 1060), tMove, 1500, {whoosh: true});

	// ② 「工具就三个字：抓，追，加」：三个大字依次写出，每个字下面空一格
	// hanzi: 抓追加
	const T = MEMO.title;
	(['抓', '追', '加'] as const).forEach((w, i) => {
		const t = q.at(w);
		const [x, y] = MP(T.xs[i], T.y);
		ctx.write(w, x, y, T.size, t, 460, {anchor: 'middle'});
		const [sx0, sy0] = MP(T.xs[i] - 48, T.slot[0]);
		b.stroke((s) => R.path(rr(sx0, sy0, 96, T.slot[1] - T.slot[0], 10), {seed: s, roughness: 0.7}), t + 520, 260, {w: 3, dash: '10 9', color: C.pencilDark});
		if (i) ctx.text('·', ...MP((T.xs[i - 1] + T.xs[i]) / 2, T.y + 88), 90, t - 120, {anchor: 'middle', color: C.pencilDark, dur: 80, nolint: true});
	});

	// ③ 「先抓，把那句话原样写进备忘录」：一页备忘录，第一格标「抓」
	const tCard = q.at('先抓');
	const card = MEMO.card;
	sheet(b, card, tCard, {w: 3.2, r: 24});
	ctx.text('备忘录', card[0] + 40, card[1] + 62, 46, tCard + 420, {color: C.pencilDark, dur: 300});
	b.stroke((s) => R.line([card[0] + 24, card[1] + 88], [card[2] - 24, card[1] + 90], {seed: s, roughness: 0.4}), tCard + 700, 300, {w: 2.2, color: C.pencil, pen: false});
	const tTab = q.at('备忘录');
	const tab = MB(92, 498, 166, 578);
	b.stroke((s) => R.path(rr(tab[0], tab[1], tab[2] - tab[0], tab[3] - tab[1], 12), {seed: s, roughness: 0.6}), tTab, 300, {w: 3.4});
	ctx.write('抓', (tab[0] + tab[2]) / 2, tab[1] + 12, 54, tTab + 320, 380, {anchor: 'middle'});

	// ④ 「不方便打字，就说进语音里」：麦克风 + 波形跳三下
	const tMic = q.at('不方便');
	const tVoice = q.at('语音');
	aux(() => {
		mic(b, ...MP(1722, 372), 76, tMic);
		const [wx, wy] = MP(1470, 372);
		b.node(
			tMic + 500,
			(ms) => {
				const u = clamp01((ms - tMic - 500) / 300);
				return (
					<g opacity={u}>
						{Array.from({length: 8}, (_, k) => {
							const p = (ms - tVoice) / 520; // 三下：[tVoice, tVoice + 1560]
							const on = p > 0 && p < 3 ? Math.sin(Math.PI * (p % 1)) : 0;
							const h = 8 + on * (18 + 30 * Math.abs(Math.sin(k * 1.9 + 0.7)));
							return <rect key={k} x={wx + k * 26} y={wy - h / 2} width={11} height={h} rx={5} fill={C.ink} />;
						})}
					</g>
				);
			},
			{bb: [wx - 10, wy - 50, wx + 8 * 26, wy + 50], dur: tVoice + 1600 - tMic - 500},
		);
		ctx.text('语音也行', ...MP(1440, 392), 46, tVoice + 200, {anchor: 'end', color: C.pencilDark});
	});

	// ⑤ 「比如：如果对方不回，就是那件事没戏了」：思考泡里整句「弹」出来（没有笔），「没戏了」画红圈
	const tEg = q.at('比如');
	// 集成修正：原框右边把「语音也行」切成「语音也」，放宽到麦克风。
	ctx.cam(MB(0, 0, 1800, 780), tEg - 500, 1000);
	const tPop = q.at('如果对方');
	const tFlash = q.at('一闪');
	const tGone = tFlash + 560;
	const bub = MEMO.bubble;
	const bubItems = b.collect(() => thought(b, bub, MP(560, 330), tEg, {w: 3.2}));
	const bs = 46;
	const bText = LINE_HEAD + '没戏了';
	const bcx = (bub[0] + bub[2]) / 2;
	const bcy = (bub[1] + bub[3]) / 2 + 20;
	const bx = bcx - textW(bText, bs) / 2;
	b.sound(tPop, 'pop', 0.3);
	b.node(
		tPop,
		(ms) => {
			// 一闪就过：闪两下后消失
			let o = 1;
			if (ms > tFlash) {
				const k = Math.floor((ms - tFlash) / 120);
				o = k >= 4 ? 0 : k % 2 ? 0.12 : 1;
			}
			const s = 1 + 0.14 * (1 - easeOut(clamp01((ms - tPop) / 220)));
			return (
				<g transform={`translate(${bcx} ${bcy}) scale(${s}) translate(${-bcx} ${-bcy})`} opacity={o}>
					<HandText x={bx} y={bcy + bs * 0.36} size={bs}>
						{bText}
					</HandText>
				</g>
			);
		},
		{bb: [bx, bcy - bs, bx + textW(bText, bs), bcy + bs * 0.5], dur: tGone - tPop, textSize: bs, textLen: 10, out: tGone, outDur: 1},
	);
	const rx0 = bx + textW(LINE_HEAD, bs);
	bubItems.push(ring(b, rx0 + textW('没戏了', bs) / 2, bcy + bs * 0.36 - bs * 0.34, textW('没戏了', bs) + 34, bs * 1.4, q.at('没戏'), 380, {color: C.red, w: 4}));
	// 速度线：一闪就过
	bubItems.push(
		...b.collect(() => {
			for (let k = 0; k < 3; k++) {
				const y = bub[1] + 90 + k * 60;
				b.stroke((s) => R.line([bub[2] + 10, y], [bub[2] + 120 - k * 20, y + 4], {seed: s, roughness: 0.5}), tFlash + 80 + k * 60, 160, {w: 3, color: C.pencilDark, pen: false});
			}
		}),
	);
	b.eraseAll(bubItems, tGone, 260);
	b.sound(tFlash, 'whoosh', 0.12);

	// ⑥ 「写下来，就得一个字一个字来」：备忘录第一行，一个字一拍（每个字单独落笔，带一声轻响）
	const tW0 = q.at('写下来');
	const tW1 = q.end('一个字来');
	const chars: [string, number][] = [];
	Array.from(LINE_HEAD).forEach((ch, k) => chars.push([ch, CHAIN[0].x + textW(LINE_HEAD.slice(0, k), LINE_SIZE)]));
	Array.from('没戏了').forEach((ch, k) => chars.push([ch, CHAIN[1].x + textW('没戏了'.slice(0, k), LINE_SIZE)]));
	const per = (tW1 - tW0) / chars.length;
	chars.forEach(([ch, x], k) => {
		const t = tW0 + k * per;
		ctx.text(ch, ...MP(x, LINE_Y), LINE_SIZE, t, {dur: Math.min(160, per * 0.6), nolint: true});
		if (ch.trim() && ch !== '，') b.sound(t, 'tick', 0.12);
	});
	// 给 lint 登记一下整行的字号（上面逐字的都标了 nolint）
	b.node(tW0, () => null, {bb: [MP(CHAIN[0].x, 0)[0], MP(0, LINE_Y - LINE_SIZE)[1], MP(CHAIN[1].x + CHAIN[1].w, 0)[0], MP(0, LINE_Y + 10)[1]], textSize: LINE_SIZE, textLen: 10, dur: tW1 - tW0});
	aux(() => ctx.text('写下来 = 慢下来', ...MP(190, 668), 46, q.at('一个字') + 150, {color: C.pencilDark}));
	const r1 = ringOf(1);
	reg.rings.red = ring(b, ...MP(r1.cx, r1.cy), r1.w, r1.h, tW1 + 60, 380, {color: C.red, w: 4.4});

	// ⑦ 「再追，对着它问：然后呢？」：第一行右边长出一节箭头，箭头上写「然后呢」
	ctx.cam(MB(60, 290, 1880, 1000), q.at('再追') - 400, 1000);
	const chainArrow = (i: number, t: number) => {
		const s = CHAIN[i];
		arrow(b, MP(s.x + 6, ARROW_Y), MP(s.x + s.w - 6, ARROW_Y), t, 420, {bend: 0, w: 3.8, head: 20});
		ctx.text('然后呢', ...MP(s.x + s.w / 2, ARROW_Y - 32), 46, t + 260, {anchor: 'middle', color: C.pencilDark, dur: 300});
	};
	chainArrow(2, q.at('然后呢'));
	b.sound(q.at('然后呢'), 'tick', 0.15);

	// ⑧ 「没戏，我就得从头再找」：箭头末端写「得从头找」，橙圈
	ctx.text('得从头找', ...MP(CHAIN[3].x, LINE_Y), LINE_SIZE, q.at('得从头') - 60, {dur: 520});
	const r3 = ringOf(3);
	reg.rings.orange = ring(b, ...MP(r3.cx, r3.cy), r3.w, r3.h, q.end('从头再找') - 100, 380, {color: C.orange, w: 4.4});

	// ⑨ 「然后呢？又没办成，说明我就是办不成事」：再长一节，末端「办不成事」，蓝圈
	const tQ2 = q.at('然后呢', {nth: 1});
	chainArrow(4, tQ2);
	b.sound(tQ2, 'tick', 0.15);
	const tC = q.at('办不成事');
	ctx.text('办不成事', ...MP(CHAIN[5].x, LINE_Y), LINE_SIZE, tC - 200, {dur: 560});
	const r5 = ringOf(5);
	reg.rings.blue = ring(b, ...MP(r5.cx, r5.cy), r5.w, r5.h, q.end('办不成事') - 150, 400, {color: C.blue, w: 4.6});

	// ⑩ 「追到四种句尾之一就停，最多三次」：停牌 + 迷你底座从下方滑上来、蓝格闪 + 三个追问格勾两个
	const tStopLine = q.at('追到四种');
	ctx.cam(MB(60, 300, 1880, 1110), tStopLine - 350, 1000);
	const tStop = q.at('停');
	// 停牌（八角形 + 「停」）立在蓝圈右下
	const [sx, sy] = MP(1742, 676);
	const oct = Array.from({length: 9}, (_, k) => {
		const a = ((k % 8) * 45 + 22.5) * (Math.PI / 180);
		return [sx + 40 * Math.cos(a), sy + 40 * Math.sin(a)] as Pt;
	});
	b.stroke((s) => R.line([sx, sy + 40], [sx, sy + 110], {seed: s, roughness: 0.4}), tStop - 250, 180, {w: 4});
	b.stroke((s) => R.linear(oct, {seed: s, roughness: 0.5}), tStop - 60, 320, {w: 4});
	ctx.text('停', sx, sy + 16, 44, tStop + 260, {anchor: 'middle', dur: 160});
	b.sound(tStop, 'stamp', 0.25);
	// 迷你底座：从下方滑上来一点，蓝格闪一下
	const baseItems: Item[] = [];
	const bb = MEMO.base;
	const baseG = 's10base';
	const tr = b.track(baseG, [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2]);
	const tBase = q.at('句尾之一');
	tr.to(tBase - 20, 1, {x: (bb[0] + bb[2]) / 2, y: (bb[1] + bb[3]) / 2 + 160}).fade(tBase - 20, 1, 0);
	tr.to(tBase, 700, {}).fade(tBase, 400, 1);
	const row = new BaseRow(b, bb, (its) => baseItems.push(...its), baseG);
	const tb1 = row.frame(tBase, {fifth: true, step: 60});
	ctx.CLAUSES.forEach((_, i) => row.fill(i, tBase + 120 + i * 90, {dur: 260}));
	row.fifth(tb1, {drawFrame: false});
	row.flash(2, tStop + 420, {times: 2, dur: 520});
	// 追问格：三个小格，勾两个（刚才问了两次「然后呢」）
	const tMax = q.at('最多');
	aux(() => {
		[0, 1, 2].forEach((k) => {
			const [x0, y0] = MP(1062 + k * 84, 650);
			b.stroke((s) => R.rect(x0, y0, 62, 62, {seed: s, roughness: 0.7}), tMax - 300 + k * 130, 180, {w: 3.2});
			if (k < 2) check(b, x0 + 31, y0 + 32, 48, tMax + 380 + k * 260, 220);
		});
		ctx.text('最多 3 次', ...MP(1188, 780), 46, tMax + 200, {anchor: 'middle', color: C.pencilDark});
	});

	// ⑪ 「别停在『我会很烦』这种话上，要追到一件具体的后果」：泡泡打叉；箭头绕过它，指向「没办成」
	const tAnn = q.at('我会很烦');
	ctx.cam(MB(60, 460, 1320, 1110), q.at('别停') - 350, 1000);
	aux(() => {
		bubble(b, ...MP(170, 818), 330, 92, tAnn - 250, {side: 'l', text: '我会很烦', size: 50, color: C.pencilDark});
		cross(b, ...MP(335, 864), 120, q.end('这种话') - 150, 360, {w: 6});
		const tCon = q.at('具体');
		arrow(b, MP(900, 604), MP(780, 806), tCon - 250, 520, {bend: -0.35, w: 3.8});
		sheet(b, MB(640, 814, 930, 914), tCon + 200, {w: 3, r: 10, tilt: -3});
		ctx.text('没办成', ...MP(785, 882), 52, tCon + 420, {anchor: 'middle'});
		ring(b, ...MP(785, 866), 250, 96, q.at('后果') + 100, 420, {w: 3.6});
		ctx.text('追到具体后果', ...MP(560, 978), 46, q.at('后果') - 150, {anchor: 'middle', color: C.pencilDark});
	});
	reg.ready = true;
};
