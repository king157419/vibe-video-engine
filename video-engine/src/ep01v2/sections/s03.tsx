import React from 'react';
import type {SectionCtx} from '../ctx';
import type {Item} from '../../whiteboard';
import {clamp01, HandText, letterCard, R, rr} from '../../whiteboard';

// s03 · 四种补法：你是哪个字母（0:50–1:33）  主岛 OPEN（句子条下方的联想栏 D3）
// 「四种」联想栏弹出 → A–D 念到哪格写哪格 →【钩】「你是哪个」四张字母卡从上方落下，其余淡掉，评论框里打字母
// →「两个都有」两张卡一起亮 →「前半句」灰笔涂掉 → 句尾词圈色 + 防/关/评/等 图标 →「四个字」四色圈滑到句子条右端（句尾牌）。

export const build = (ctx: SectionCtx) => {
	const {b, q, props, C, CLAUSES} = ctx;
	const {bar, chat} = props;

	// 回到 OPEN：先看全貌（聊天框 + 句子条），「四种」时联想栏弹出，再推到句子条 + 联想栏
	ctx.cam(null, ctx.t0 - 150, 1500, {whoosh: true});
	const tFour = q.at('四种');
	bar.frame(tFour - 150);
	ctx.cam(bar.views.lineAndBar, tFour + 250, 1000);

	// A–D 念到哪格写哪格
	bar.row(0, q.at('A是不是'));
	bar.row(1, q.at('B我得'));
	bar.row(2, q.at('C是不是'));
	bar.row(3, q.at('D对方'));

	// ---------- 【钩·让观众做】「你是哪个」：四张字母卡从上方落下，其它元素淡掉 ----------
	const tWhich = q.at('你是哪个');
	bar.fade(tWhich - 100, 450, 0.12);
	chat.fade(tWhich - 100, 450, 0.12);
	const cardItems: Item[] = [];
	const cx0 = 1760;
	const cy = 560;
	const S = 250;
	const drop = 620;
	CLAUSES.forEach((c, i) => {
		const cx = cx0 + (i - 1.5) * 262;
		const gid = `s03card${i}`;
		const tr = b.track(gid, [cx, cy]);
		const td = tWhich + 150 + i * 170;
		tr.to(td - 5, 1, {y: cy - drop});
		tr.to(td, 480, {y: cy});
		ctx.sfx(td + 420, 'pop', 0.2);
		cardItems.push(...b.inGroup(gid, () => letterCard(b, cx, cy, S, c.letter, c.color, td, {w: 4.4})));
	});

	// 「评论区打个字母」：卡片下方写字；再下面一个评论框，光标一直闪，停顿里观众「打字」
	const tCmt = q.at('评论区');
	cardItems.push(ctx.text('评论区打字母', cx0, 790, 60, tCmt - 100, {anchor: 'middle'}));
	const bx0 = 1480;
	const bx1 = 2040;
	const by0 = 830;
	const by1 = 920;
	cardItems.push(b.stroke((s) => R.path(rr(bx0, by0, bx1 - bx0, by1 - by0, 26), {seed: s, roughness: 0.6}), tCmt + 500, 420, {w: 3, color: C.pencilDark}));
	// 念完「打个字母」后停 2 秒：先打 A，删掉，再打 A；「两个都有」时补一个 C
	const tTwo = q.at('两个');
	const tEnd = q.end('字母');
	const typed: [number, string][] = [
		[tEnd + 700, 'A'],
		[tEnd + 1600, ''],
		[tEnd + 2300, 'A'],
		[tTwo + 250, 'AC'],
	];
	typed.forEach(([t]) => ctx.sfx(t, 'tick', 0.2));
	const tOff = q.at('别看') - 150;
	cardItems.push(
		b.node(
			tCmt + 900,
			(ms, frame) => {
				let s = '';
				for (const [t, v] of typed) if (t <= ms) s = v;
				const x = bx0 + 34;
				const y = (by0 + by1) / 2 + 17;
				const w = s.length * 30;
				const u = clamp01((ms - tCmt - 900) / 300);
				return (
					<g opacity={u}>
						<HandText x={x} y={y} size={48} color={C.ink} weight={700}>
							{s.split('').map((ch, k) => (
								<tspan key={k} fill={CLAUSES.find((c) => c.letter === ch)?.color ?? C.ink}>
									{ch}
								</tspan>
							))}
						</HandText>
						{frame % 18 < 10 ? <rect x={x + w + 4} y={y - 40} width={3.5} height={46} fill={C.ink} /> : null}
					</g>
				);
			},
			{bb: [bx0, by0, bx1, by1], dur: tOff - tCmt - 900, textSize: 48, textLen: 2},
		),
	);

	// 「两个都有，也正常」：A、C 两张卡同时轻轻抬起、亮一下
	[0, 2].forEach((i) => {
		const cx = cx0 + (i - 1.5) * 262;
		const tr = b.track(`s03card${i}`, [cx, cy]);
		tr.to(tTwo + 150, 300, {y: cy - 46});
		tr.to(q.at('也正常') + 200, 400, {y: cy});
		cardItems.push(
			b.inGroup(`s03card${i}`, () =>
				b.node(
					tTwo + 150,
					(ms) => {
						const u = (ms - tTwo - 150) / 1100;
						const a = u >= 1 ? 0 : Math.sin(Math.PI * clamp01(u));
						return a > 0.01 ? <rect x={cx - S * 0.4 - 10} y={cy - S * 0.5 - 10} width={S * 0.8 + 20} height={S + 20} rx={18} fill="none" stroke={CLAUSES[i].color} strokeWidth={10} opacity={0.55 * a} /> : null;
					},
					{bb: [cx - S * 0.5, cy - S * 0.6, cx + S * 0.5, cy + S * 0.6], dur: 1100},
				),
			),
		);
	});

	// 「别看前半句」：卡片收走，联想栏回来；四条候选的前半句被灰笔涂掉
	b.eraseAll(cardItems, tOff, 380);
	ctx.sfx(tOff, 'erase', 0.25);
	bar.fade(tOff, 450, 1);
	chat.fade(tOff, 450, 1);
	const tHead = q.at('前半句');
	[0, 1, 2, 3].forEach((i) => bar.strikeHead(i, tHead + 150 + i * 200));

	// A 落在出事 · 防 / B 必须 · 关 / C 不行 · 评 / D 不在乎 · 等
	bar.tail(0, q.at('出事'));
	bar.icon(0, q.at('防危险') - 250);
	bar.verb(0, q.end('防危险'));
	bar.tail(1, q.at('必须'));
	bar.icon(1, q.at('关了') - 700);
	bar.verb(1, q.end('关了'));
	bar.tail(2, q.at('我不行'));
	bar.icon(2, q.at('打分') - 700);
	bar.verb(2, q.end('打分'));
	bar.tail(3, q.at('不在乎'));
	bar.icon(3, q.at('等人') - 200);
	bar.verb(3, q.end('当回事', q.at('等人')));

	// 「四个字：防，关，评，等」：四色圈排在下面一行，念到哪个字哪一行亮；然后整排滑到句子条右端 = 句尾牌
	const t4 = q.at('四个字');
	bar.tags(t4 + 200, {slideAt: q.end('等', t4) + 150, slideDur: 800});
	(['防', '关', '评', '等'] as const).forEach((v, i) => bar.flash(i, q.at(v, t4) - 60, {dur: 620}));
};
