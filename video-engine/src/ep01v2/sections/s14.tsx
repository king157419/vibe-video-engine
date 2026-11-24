import React from 'react';
import type {Box} from '../../whiteboard';
import {arrow, check, clamp01, CLAUSES, easeOut, HandText, qmark, R, rr, sheet, strike, wavy} from '../../whiteboard';
import type {SectionCtx} from '../ctx';

// s14 · 回收：那个涂黑的名字（9:45–10:30）  主岛 OPEN（D1 原样重现）
// D1 回家（s10 把它缩到了 MEMO）→ 推镜到涂黑的名字定住 → 对方那边一个「？」气泡出现又擦掉（不揭晓）
// → 答案句第 3 次：「事」划掉，句子条下「那句话」波浪线 → 迷你赛道：「那句话」✓ 已跑完，终点「答案」还空着
// → 聊天记录往上翻出更早的消息，手指在其中一条上点两下 → 一页备忘录叠上来写「如果__，就__」，句尾圈的颜色转一圈后留白
// → 备忘录缩成卡片「1 行字 · 1 个颜色」→「对方正在输入…」跳一轮又没了，备忘录立刻弹到最前面 → 输入框里「第二条…」，发送键打问号。

export const build = (ctx: SectionCtx) => {
	const {b, q, props, C} = ctx;
	const {chat, bar} = props;
	const t0 = ctx.t0;

	// 「回到开头」：D1 回家（镜头还在 S13 时完成），联想栏淡掉，镜头飞回聊天框
	chat.back(t0 - 900, 800);
	bar.fade(t0 - 900, 300, 0);
	ctx.cam(chat.views.panel, t0 - 500, 1500, {whoosh: true});
	const [, , , bY1] = chat.box.bubble;
	const tStamp = ctx.text('22:47 → 23:05', 705, bY1 + 70, 46, q.at('回到开头') + 500, {anchor: 'middle', color: C.pencilDark});

	// 「那个被涂黑的名字，你心里填的是谁？」：推镜到名字，定住（笔悬着）
	const tWho = q.at('谁');
	ctx.cam(chat.views.name, q.at('涂黑') - 400, 1100);
	const [nx0, ny0, nx1] = chat.box.name;
	b.hover([nx1 + 30, ny0 + 20], q.end('是谁') + 150, q.at('对方后来') - 250);
	b.node(q.end('是谁'), () => null, {dur: 600, nolint: true});
	void nx0;
	void tWho;

	// 「对方后来回了什么，我不知道，你也不用知道」：对方那边一个虚线气泡，「？」出现又擦掉
	ctx.cam(chat.views.panel, q.at('对方后来') - 300, 900);
	const tRe = q.at('回了什么') - 300;
	const bl: Box = [150, 470, 440, 580];
	const bub = b.collect(() => {
		b.stroke((s) => R.path(rr(bl[0], bl[1], bl[2] - bl[0], bl[3] - bl[1], 18), {seed: s, roughness: 0.8}), tRe, 360, {w: 3, dash: '10 10', color: C.pencilDark});
		b.stroke((s) => R.path(`M${bl[0] + 4} ${bl[3] - 18} L${bl[0] - 16} ${bl[3] + 4} L${bl[0] + 22} ${bl[3] - 2}`, {seed: s, roughness: 0.5}), tRe + 360, 120, {w: 3, color: C.pencilDark, lag: 0});
	});
	const qm = qmark(b, (bl[0] + bl[2]) / 2, (bl[1] + bl[3]) / 2, 80, tRe + 500, 420);
	b.eraseAll(qm, q.at('我不知道') + 100, 300);
	b.sound(q.at('我不知道') + 100, 'erase', 0.25);
	b.eraseAll(bub, q.end('不用知道') + 100, 400);

	// 答案句第 3 次：「让你难受的，常常不是事，是你自动补上的那句话」
	ctx.cam(chat.views.chatAndLine, q.at('让你难受') - 300, 1100);
	const tShi = q.at('不是事');
	ctx.write('事', 560, 560, 110, tShi - 700, 420, {anchor: 'middle'});
	strike(b, 490, 640, 620, q.ch('不是事', 2) + 100, 300, {size: 13});
	const g = chat.lineGeo;
	wavy(b, g.textX, g.textX + 560, g.y + 32, q.at('那句话') - 100, 700, {w: 4.4});
	ctx.text('那句话', g.textX + 280, g.y + 112, 56, q.at('那句话') + 300, {anchor: 'middle'});
	tStamp.out = q.at('让你难受');

	// 「而它在答案出来之前，就已经跑完了」：迷你赛道（盖一张卡片在聊天框下方）：「那句话」✓，终点「答案」还空着
	const tRun = q.at('而它');
	ctx.cam(null, tRun - 350, 1000);
	const rc: Box = [80, 866, 1110, 1104];
	sheet(b, rc, tRun - 100, {w: 3, r: 16});
	const LY = 1052;
	b.stroke((s) => R.line([150, LY], [900, LY + 2], {seed: s, roughness: 0.5}), tRun + 250, 420, {w: 4});
	b.stroke((s) => R.line([900, LY], [1060, LY], {seed: s, roughness: 0.5}), tRun + 650, 200, {w: 3, dash: '10 10', color: C.pencil, pen: false});
	[180, 540].forEach((x, k) => b.stroke((s) => R.circle(x, LY, 9, {seed: s, roughness: 0.3}), tRun + 350 + k * 150, 80, {w: 6, pen: false}));
	ctx.text('消息', 180, LY - 30, 46, tRun + 400, {anchor: 'middle', dur: 200});
	ctx.text('那句话', 520, LY - 30, 46, tRun + 600, {anchor: 'middle', dur: 260});
	arrow(b, [200, LY - 90], [500, LY - 90], tRun + 700, 420, {bend: 0.12, w: 3.4, color: C.pencilDark});
	const tDone = q.at('跑完');
	check(b, 640, LY - 44, 56, tDone - 100, 240, {w: 6});
	b.node(
		tDone,
		(ms) => {
			const u = clamp01((ms - tDone) / 700);
			const a = Math.sin(Math.PI * u);
			return a > 0.01 ? <ellipse cx={560} cy={LY - 44} rx={140} ry={48} fill={C.pencil} opacity={0.3 * a} /> : null;
		},
		{bb: [400, LY - 100, 720, LY], dur: 700},
	);
	b.stroke((s) => R.path(rr(930, 950, 150, 80, 12), {seed: s, roughness: 0.7}), tRun + 900, 300, {w: 3, dash: '9 9', color: C.pencilDark});
	ctx.text('答案', 1005, 1004, 44, tRun + 1150, {anchor: 'middle', color: C.pencilDark, dur: 200});
	ctx.text('还没出来', 800, 918, 44, tDone + 300, {anchor: 'middle', color: C.pencilDark});

	// 「今晚，打开跟这个人的聊天框」：聊天记录往上翻，露出更早的消息；「找一条你停下来多看了两眼的消息」：手指点两下
	const tScroll = q.at('打开');
	ctx.cam(chat.views.panel, q.at('今晚') - 300, 1000);
	const mb = chat.box.msgs;
	const tTap = q.at('两眼');
	const pick = 2; // 被点两下的那条（往上数第 2 条旧消息）
	const msgs = [
		{side: 'r', w: 560, text: '那件事，你考虑得怎么样了？'},
		{side: 'l', w: 380},
		{side: 'r', w: 300},
		{side: 'l', w: 480},
		{side: 'r', w: 420},
		{side: 'l', w: 340},
		{side: 'r', w: 380},
	];
	const clipId = 's14scroll';
	b.node(
		tScroll - 150,
		(ms) => {
			const u = easeOut(clamp01((ms - tScroll) / 1600));
			const off = 360 * u;
			const fadeIn = clamp01((ms - tScroll + 150) / 200);
			return (
				<g opacity={fadeIn}>
					<defs>
						<clipPath id={clipId}>
							<rect x={mb[0]} y={mb[1]} width={mb[2] - mb[0]} height={mb[3] - mb[1]} />
						</clipPath>
					</defs>
					<rect x={mb[0]} y={mb[1]} width={mb[2] - mb[0]} height={mb[3] - mb[1]} fill={C.card} />
					<g clipPath={`url(#${clipId})`}>
						{msgs.map((m, k) => {
							const y = 300 - k * 120 + off;
							const x = m.side === 'r' ? 990 - m.w : 150;
							const hot = k === pick && ms >= tTap;
							return (
								<g key={k}>
									<rect x={x} y={y} width={m.w} height={90} rx={20} fill="none" stroke={C.ink} strokeWidth={hot ? 5 : 3} />
									{m.text ? (
										<HandText x={x + m.w / 2} y={y + 58} size={38} anchor="middle">
											{m.text}
										</HandText>
									) : (
										<>
											<line x1={x + 30} y1={y + 38} x2={x + m.w - 40} y2={y + 38} stroke={C.pencil} strokeWidth={6} strokeLinecap="round" />
											<line x1={x + 30} y1={y + 62} x2={x + m.w * 0.6} y2={y + 62} stroke={C.pencil} strokeWidth={6} strokeLinecap="round" />
										</>
									)}
								</g>
							);
						})}
					</g>
				</g>
			);
		},
		{bb: mb, dur: 1800},
	);
	b.sound(tScroll, 'page', 0.18);
	// 手指点两下（指尖 + 两圈涟漪）+「×2」
	const pickY = 300 - pick * 120 + 360 + 45;
	const pickX = 990 - msgs[pick].w / 2;
	b.node(
		tTap - 400,
		(ms) => {
			const u = easeOut(clamp01((ms - tTap + 400) / 350));
			const taps = [tTap, tTap + 420];
			return (
				<g>
					{taps.map((t, k) => {
						const p = clamp01((ms - t) / 450);
						return p > 0 && p < 1 ? <circle key={k} cx={pickX} cy={pickY} r={20 + 50 * p} fill="none" stroke={C.ink} strokeWidth={4} opacity={1 - p} /> : null;
					})}
					<g opacity={u} transform={`translate(${pickX + 10} ${pickY + 10 + (1 - u) * 60})`}>
						<path d="M0 0 C-8 20 -8 60 -4 120 L36 120 C40 80 40 40 30 10 C24 -6 6 -8 0 0 Z" fill={C.card} stroke={C.ink} strokeWidth={4} />
					</g>
				</g>
			);
		},
		{bb: [pickX - 80, pickY - 80, pickX + 80, pickY + 150], dur: 1400},
	);
	[tTap, tTap + 420].forEach((t) => b.sound(t, 'tick', 0.3));
	ctx.text('×2', pickX + 130, pickY + 20, 56, tTap + 500, {dur: 200});

	// 「写一行：如果怎样，就会怎样」：一页备忘录叠上来（盖住右边），写「如果__，就__」
	const tMemo = q.at('写一行');
	ctx.cam(null, tMemo - 450, 1000);
	const memo: Box = [1150, 470, 2360, 1000];
	const mg = 's14memo';
	const tr = b.track(mg, [(memo[0] + memo[2]) / 2, (memo[1] + memo[3]) / 2]);
	b.inGroup(mg, () => {
		sheet(b, memo, tMemo - 250, {w: 3.4, r: 22});
		ctx.text('备忘录', memo[0] + 40, memo[1] + 64, 46, tMemo + 100, {color: C.pencilDark, dur: 260});
		const tIf = q.at('如果怎样');
		ctx.write('如果', 1210, 650, 96, tIf - 150, 520);
		b.stroke((s) => R.line([1420, 745], [1640, 747], {seed: s, roughness: 0.6}), tIf + 450, 260, {w: 4});
		ctx.write('就', 1700, 650, 96, q.at('就会') - 100, 300);
		ctx.text('，', 1655, 735, 96, q.at('就会') - 200, {dur: 60, nolint: true});
		b.stroke((s) => R.line([1810, 745], [2030, 747], {seed: s, roughness: 0.6}), q.at('就会') + 300, 260, {w: 4});
		// 「再圈一个颜色」：句尾一个圈，颜色在红橙蓝紫之间转一圈后留白（由你自己定）
		const tRing = q.at('圈一个');
		const [rcx, rcy] = [2180, 710];
		const cols = CLAUSES.map((c) => c.color);
		b.addPen({t0: tRing, t1: tRing + 450, tip: (p) => [rcx + 90 * Math.cos(p * 6.28 - 1.6), rcy + 60 * Math.sin(p * 6.28 - 1.6)]});
		b.node(
			tRing,
			(ms) => {
				const d = (ms - tRing - 450) / 260;
				const draw = clamp01((ms - tRing) / 450);
				const blank = d >= 4;
				const col = blank ? C.pencilDark : cols[Math.max(0, Math.min(3, Math.floor(d)))];
				const L = 2 * Math.PI * 80;
				return (
					<ellipse
						cx={rcx}
						cy={rcy}
						rx={95}
						ry={62}
						fill="none"
						stroke={col}
						strokeWidth={5}
						strokeDasharray={blank ? '14 12' : `${L * draw} ${L}`}
						transform={`rotate(-6 ${rcx} ${rcy})`}
					/>
				);
			},
			{bb: [rcx - 100, rcy - 70, rcx + 100, rcy + 70], dur: 450 + 4 * 260},
		);
		ctx.text('？', rcx, rcy + 22, 60, tRing + 450 + 4 * 260 + 100, {anchor: 'middle', color: C.pencilDark, dur: 120, nolint: true});
	});

	// 「你手里就有了一行字，一个颜色」：备忘录缩成一张卡片，右下「1 行字 · 1 个颜色」
	const tCard = q.at('这样');
	const small: Box = [1560, 700, 2200, 980];
	tr.fit(tCard, 800, memo, small);
	ctx.text('1 行字 · 1 个颜色', (small[0] + small[2]) / 2, small[3] + 88, 52, q.at('一行字') - 100, {anchor: 'middle'});

	// 「以后『正在输入』又没了」：「对方正在输入…」再出现，三个点跳一轮，又消失
	const tType = q.at('正在输入');
	ctx.cam([60, 60, 1500, 900], tType - 400, 1000);
	const tFirst = q.at('先写');
	chat.status(tType - 100, tFirst - 250, {rounds: 1, count: false});
	chat.statusOff(tFirst - 200);
	// 「你就先写这一行」：点消失的瞬间，备忘录立刻弹到最前面（叠在聊天框上）
	const pop: Box = [560, 230, 1480, 633];
	tr.fit(tFirst - 120, 380, memo, pop);
	b.sound(tFirst - 120, 'pop', 0.35);

	// 「再决定发不发第二条」：输入框里「第二条…」停在发送键上方，发送键画一个小问号
	const tSec = q.at('第二条');
	const ib = chat.box.input;
	b.node(tSec - 700, () => <rect x={ib[0] + 10} y={ib[1] + 8} width={ib[2] - ib[0] - 20} height={ib[3] - ib[1] - 16} rx={24} fill={C.card} />, {bb: ib, g: chat.g});
	chat.input([[tSec - 600, '第二条…']]);
	const sd = chat.box.send;
	qmark(b, (sd[0] + sd[2]) / 2, sd[1] - 50, 70, q.at('发不发'), 420);
	b.hover([(sd[0] + sd[2]) / 2 + 10, sd[1] + 10], q.at('发不发') + 500, ctx.tNext - 100);
};
