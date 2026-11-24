import {arrow, C, R, ring, rr} from '../../whiteboard';
import type {SectionCtx} from '../ctx';

// s15 · 下期（10:30–10:44）  主岛 CORE（D14 核心图；底下 core.box.spare 那条归本段）
// 核心图从左侧滑回、整图点亮；纸角书名小字 + 工具箱下一本合上的书「读原书」→ 底座红格闪两下「下期：红色」
// → 红格下一封邮件，主题里「贵司」写成「贵公」，错字圈出 → 箭头直接跳到大字「完了」，中间的站牌全是虚线 → 定格（片尾免责由 Episode 加）。

export const build = (ctx: SectionCtx) => {
	const {b, q, props, P} = ctx;
	const {core} = props;
	const t0 = ctx.t0;

	// 核心图从左侧滑回（镜头从 OPEN 往上飞的同时）
	const [hx0, hy0, hx1, hy1] = core.home;
	core.track.to(t0 - 1100, 1, {x: (hx0 + hx1) / 2 - 2600, y: (hy0 + hy1) / 2});
	core.back(t0 - 1000, 1500);
	ctx.cam(core.views.full, t0 - 1000, 1500, {whoosh: true});
	core.light(q.at('书里') + 300);

	// 「书里还讲了每种缺口怎么补，想细看，去读原书」：纸角书名小字；工具箱下面一本合上的书
	ctx.text('《养育你内心的小孩》', ...P(110, 1560), 72, q.at('每种缺口') - 200, {color: C.pencilDark});
	const tBook = q.at('去读原书') - 500;
	const [bx, by] = P(3300, 1440);
	b.stroke((s) => R.path(rr(bx, by, 220, 190, 10), {seed: s, roughness: 0.7}), tBook, 380, {w: 4});
	b.stroke((s) => R.line([bx + 34, by + 4], [bx + 34, by + 186], {seed: s, roughness: 0.4}), tBook + 380, 140, {w: 3.4});
	[60, 100].forEach((dy, k) => b.stroke((s) => R.line([bx + 70, by + dy], [bx + 190, by + dy + 2], {seed: s, roughness: 0.4}), tBook + 520 + k * 110, 100, {w: 3, color: C.pencilDark}));
	ctx.text('读原书', ...P(3250, 1590), 76, q.at('读原书') - 100, {anchor: 'end'});

	// 「下期拆最常见的红色」：底座红格闪两下
	const tRed = q.at('红色');
	core.baseFlash('red', tRed - 150, 2);
	ctx.text('下期：', ...P(760, 1250), 80, tRed - 700, {anchor: 'end'});
	ctx.text('红色', ...P(760, 1250), 80, tRed - 150, {color: C.redDeep});

	// 「一封邮件，写错一个字」：红格下一封邮件，主题「致贵公的方案」，错字圈出
	const tMail = q.at('一封邮件');
	// 集成修正：原框 x380..3000 把左边书名和「下期：」切掉一半、右边「读原书」切一半；改成 x60..2800，书名整行入画，读原书整块出画。
	ctx.cam(ctx.B(60, 900, 2800, 1700), tMail - 450, 1000);
	const [mx, my] = P(1080, 1430);
	b.stroke((s) => R.path(rr(mx, my, 600, 220, 16), {seed: s, roughness: 0.8}), tMail - 100, 420, {w: 4});
	b.stroke((s) => R.line([mx + 14, my + 70], [mx + 586, my + 72], {seed: s, roughness: 0.4}), tMail + 300, 200, {w: 2.4, color: C.pencilDark});
	ctx.text('主题', mx + 30, my + 56, 52, tMail + 350, {color: C.pencilDark, dur: 200});
	ctx.text('致贵公的方案', mx + 40, my + 150, 64, tMail + 550);
	const tErr = q.at('错');
	ring(b, mx + 40 + 64 * 2.5, my + 128, 100, 96, tErr - 100, 380, {w: 4.4});
	ctx.text('司', mx + 40 + 64 * 2.5, my - 18, 52, tErr + 350, {anchor: 'middle', color: C.pencilDark, dur: 160});

	// 「脑子为什么直接跳到完了？」：箭头一步跳到大字「完了」，中间的站牌全是虚线（没走的「然后呢」）
	const tJump = q.at('直接跳');
	const [sx, sy] = P(1790, 1650);
	[0, 1, 2].forEach((k) => {
		const x = sx + k * 190;
		b.stroke((s) => R.line([x, sy], [x, sy - 90], {seed: s, roughness: 0.4}), tJump - 300 + k * 120, 120, {w: 3, dash: '8 9', color: C.pencil, pen: false});
		b.stroke((s) => R.path(rr(x - 50, sy - 150, 100, 60, 8), {seed: s, roughness: 0.6}), tJump - 240 + k * 120, 140, {w: 3, dash: '8 9', color: C.pencil, pen: false});
	});
	arrow(b, P(1700, 1470), P(2340, 1470), tJump, 560, {bend: -0.12, w: 5, head: 30});
	const tEnd = q.at('完了');
	const endAt = ctx.write('完了', ...P(2360, 1400), 150, tEnd - 250, 800, {color: C.redDeep});
	ring(b, ...P(2515, 1480), 380, 200, endAt + 80, 460, {color: C.red, w: 5});
	b.hover(P(2750, 1380), endAt + 700, ctx.tNext + 2300);
};
