import React from 'react';
import type {SectionCtx} from '../ctx';
import type {Item, Pt} from '../../whiteboard';
import {clamp01, dots, easeOut, person, qmark, R, stopwatch, tag, thought} from '../../whiteboard';

// s05 · 证据一：你停了吗（1:56–2:32）  主岛 S05（BASE 右边）
// 上沿：举手小人 + 思考泡「我判断的？」；「证据」+ ①②③（① 点亮）。
// 下面 D5 左右分屏：左边竖式 37×24 一顿一顿地算（停、进位、回头看），上方秒表走满一整圈 → 888 →「慢」；
// 右边「如果TA不回，就……」一下印满，秒表只走一格 →「你停了吗？」→ 大括号「整句弹出来」+ 句尾「。~」→ 标签「不是现算的」。

export const build = (ctx: SectionCtx) => {
	const {b, q, C, P, B} = ctx;
	const X = (x: number) => P(x, 0)[0];
	const Y = (y: number) => P(0, y)[1];

	// ---------- 「你可能会说：我就是这么判断的，哪来的什么条款？」 ----------
	ctx.cam(B(0, 0, 1500, 660), ctx.t0 + 80, 1300, {whoosh: true});
	const tSay = q.at('你可能') + 500;
	const intro: Item[] = [];
	intro.push(...person(b, X(330), Y(600), 380, tSay, {pose: 'raise'}));
	const tJudge = q.at('判断');
	intro.push(...thought(b, B(560, 70, 1320, 360), P(440, 300), tJudge - 900));
	intro.push(ctx.text('我判断的？', X(940), Y(245), 80, tJudge - 150, {anchor: 'middle'}));
	intro.push(...qmark(b, X(1400), Y(230), 150, q.at('条款') - 200, 450));

	// ---------- 「我给你三个证据」：「证据」+ 三个空圆点，① 点亮 ----------
	const tThree = q.at('三个');
	ctx.cam(B(0, -10, 2400, 700), tThree - 500, 1000);
	ctx.write('证据', X(1620), Y(70), 120, q.at('证据') - 200, 700, {anchor: 'middle'});
	const ev = dots(b, X(1850), Y(130), 3, 150, 38, tThree + 200);
	['①', '②', '③'].forEach((n, i) => ctx.text(n, X(1850 + i * 150), Y(235), 46, tThree + 300 + i * 140, {anchor: 'middle', color: C.pencilDark, dur: 120}));
	ev.light(0, q.at('第一个'));
	ctx.sfx(q.at('第一个'), 'pop', 0.25);

	// ---------- D5：左右分屏 ----------
	const tCalc = q.at('三十七');
	const tSplit = q.at('心算') - 200;
	ctx.cam(B(0, 150, 2400, 1110), tSplit - 300, 1000);
	// 开场的小人和思考泡完成任务，分屏开始时收掉（左边要放秒表）
	b.eraseAll(intro, tSplit - 300, 400);
	b.stroke((s) => R.line(P(1200, 330), P(1200, 1090), {seed: s, roughness: 0.8, bowing: 0.6}), tSplit, 450, {w: 3, color: C.pencilDark});

	// 左边秒表：从「三十七」开始走，到「速度」正好一整圈
	const tFull = q.at('速度') + 150;
	const swL: Pt = P(270, 560);
	stopwatch(b, 's05swL', swL[0], swL[1], 120, tCalc - 1000, (ms) => 360 * clamp01((ms - tCalc) / (tFull - tCalc)), {w: 4});

	// 竖式：37 × 24，右对齐到 x=950
	const DS = 104;
	const col = (k: number) => X(950 - DS * 0.28 - k * DS * 0.56); // k=0 个位, 1 十位, 2 百位
	const digit = (s: string, k: number, y: number, t: number, o: {size?: number; color?: string} = {}) =>
		ctx.text(s, col(k), Y(y), o.size ?? DS, t, {anchor: 'middle', dur: 150, color: o.color});
	const rows = {a: 500, b: 620, p1: 770, p2: 885, ans: 1030};
	digit('3', 1, rows.a, tCalc - 50);
	digit('7', 0, rows.a, tCalc + 150);
	ctx.text('×', col(3) - 20, Y(rows.b), DS, q.at('乘') - 50, {anchor: 'middle', dur: 150});
	digit('2', 1, rows.b, q.at('二十四') - 50);
	digit('4', 0, rows.b, q.at('二十四') + 250);
	b.stroke((s) => R.line([col(3) - 80, Y(650)], [col(0) + 60, Y(652)], {seed: s, roughness: 0.6}), q.end('二十四') + 50, 300, {w: 4});
	// 停 3 秒：笔尖停在个位上方，秒表在走
	const tSlow = q.at('慢吧');
	b.hover([col(0) + 10, Y(rows.p1 - 60)], q.end('二十四') + 400, tSlow + 700);

	// 「要停，要进位」：7×4=28 写 8，停一下，进位的小 2，再写 14；「还得回头看一眼」：笔回到 37 上，再写 74
	const tStop = q.at('要停');
	digit('8', 0, rows.p1, tStop - 100);
	b.hover([col(0) + 40, Y(rows.p1 - 40)], tStop + 100, tStop + 800);
	const tCarry = q.at('进位');
	digit('2', 1, 425, tCarry - 100, {size: 50, color: C.pencilDark});
	digit('4', 1, rows.p1, tCarry + 250);
	digit('1', 2, rows.p1, tCarry + 550);
	const tLook = q.at('回头');
	b.hover([col(0.5), Y(rows.a - 70)], tLook - 250, tLook + 350);
	b.hover([col(0.5), Y(rows.b - 70)], tLook + 350, tLook + 600);
	digit('4', 1, rows.p2, tLook + 650);
	digit('7', 2, rows.p2, tLook + 850);
	const tAns = q.at('答案');
	b.stroke((s) => R.line([col(3) - 80, Y(915)], [col(0) + 60, Y(917)], {seed: s, roughness: 0.6}), tAns - 100, 300, {w: 4});
	// 「答案是八百八十八」
	const t888 = q.at('八百');
	digit('8', 2, rows.ans, t888 - 100);
	digit('8', 1, rows.ans, t888 + 250);
	digit('8', 0, rows.ans, t888 + 600);
	ctx.cam(B(20, 330, 1190, 1100), tSlow - 400, 1000);

	// 「真在想，就是这个速度」：推近左边秒表，正好走满一整圈；写「慢」
	const tReal = q.at('真在想');
	// 集成修正：原来「真在想」一出来就推走，888 只露了不到 1 秒；改为至少停 1.3 秒，并在「速度」前到位。
	ctx.cam([swL[0] - 330, swL[1] - 230, swL[0] + 520, swL[1] + 330], Math.max(tReal - 100, Math.min(t888 + 1300, q.at('速度') - 900)), 900);
	ctx.write('慢', swL[0] + 180, swL[1] - 90, 170, tFull - 100, 600);

	// ---------- 右半屏：「刚才补那句话的时候，你停了吗？」 ----------
	const tNow = q.at('刚才');
	ctx.cam(B(0, 150, 2400, 1110), tNow - 300, 1000);
	const swR: Pt = P(1470, 560);
	const tPop = q.at('补那句话') + 150;
	stopwatch(b, 's05swR', swR[0], swR[1], 120, tNow + 100, (ms) => 30 * easeOut(clamp01((ms - tPop - 80) / 160)), {w: 4});
	ctx.sfx(tPop + 80, 'tick', 0.35);
	// 整句「印」出来：几乎没有书写时间
	const sX = X(1300);
	const sY = Y(780);
	const SS = 80;
	ctx.text('如果TA不回，就……', sX, sY, SS, tPop, {dur: 260});
	ctx.sfx(tPop, 'pop', 0.3);
	ctx.text('你停了吗？', X(1640), Y(600), 72, q.at('你停了吗') - 100, {dur: 350});
	// 停 1 秒：两个秒表并排定住，笔尖悬在中间
	b.hover(P(1200, 470), q.end('你停了吗') + 150, q.at('没停') - 100);

	// 「没停。它是整句弹出来的，连语气都带着」：大括号整句括起，句尾补「。~」
	// 集成修正：原框按高度适配后左边会带进半截竖式（37/24/888 被切一半）。左边界贴分隔线，右边留白。
	ctx.cam(B(1195, 390, 2640, 1100), q.at('没停') + 100, 1000);
	const sW = SS * 8.24; // 如果=2 TA=1.24 不回=2 ，=1 就=1 ……=2（字宽 em）
	const tWhole = q.at('整句');
	const by = sY + 40;
	const bx0 = sX + 4;
	const bx1 = sX + sW;
	const mid = (bx0 + bx1) / 2;
	b.stroke(
		(s) => R.path(`M${bx0} ${by} C${bx0} ${by + 34} ${bx0 + 20} ${by + 34} ${bx0 + 60} ${by + 34} L${mid - 40} ${by + 34} C${mid - 10} ${by + 34} ${mid} ${by + 50} ${mid} ${by + 70} C${mid} ${by + 50} ${mid + 10} ${by + 34} ${mid + 40} ${by + 34} L${bx1 - 60} ${by + 34} C${bx1 - 20} ${by + 34} ${bx1} ${by + 34} ${bx1} ${by}`, {seed: s, roughness: 0.6}),
		tWhole - 100,
		520,
		{w: 4.4},
	);
	ctx.text('整句弹出来', mid, by + 140, 60, tWhole + 450, {anchor: 'middle'});
	const tTone = q.at('语气');
	ctx.text('。', bx1 + 14, sY, SS, tTone - 250, {dur: 120});
	b.stroke((s) => R.curve([[bx1 + 80, sY - 30], [bx1 + 100, sY - 50], [bx1 + 122, sY - 30], [bx1 + 144, sY - 10], [bx1 + 164, sY - 30]], {seed: s, roughness: 0.4}), tTone + 50, 300, {w: 5});

	// 「至少，它不是你这一刻算出来的」：下面贴标签「不是现算的」
	const tMoment = q.at('这一刻');
	tag(b, [mid - 200, by + 178, mid + 200, by + 268], '不是现算的', C.ink, tMoment - 500, {hatch: false, size: 60, w: 3.6});
	// hanzi: 证据慢
};
