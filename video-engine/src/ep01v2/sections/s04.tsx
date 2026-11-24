import type {SectionCtx} from '../ctx';
import {bubble} from '../../whiteboard';

// s04 · 来源和第五格（1:33–1:56）  主岛 BASE（OPEN 正下方）。共享道具：props.base（D4 底座五格）。
// 纸角小字写书名 → 一排格子逐格涂红橙蓝紫、下写需要名（左边标「书里叫」）→ 上方写句尾词（左边标「＊我的读法」）
// →【钩】第五格：虚线格 + 大问号，推近 →「没有句子」：上方一个空的虚线气泡 →「空着」：小便签「以后揭」。

export const build = (ctx: SectionCtx) => {
	const {q, props, C, P, B} = ctx;
	const {base} = props;

	// 等 s03 的句尾牌滑完再走（s03 最后一个动作在 ~95.0s）
	const tBook = q.at('丛非从');
	// 集成修正：原来整岛视图（z≈0.76）下半屏空着、标签偏小；改成只框书名 + 前四格（z≈1.07），第五格出现时再推过去。
	ctx.cam(B(10, 110, 1810, 720), Math.max(ctx.t0 + 450, tBook - 1500), 1300, {whoosh: true});
	// 纸角小字写书名（不放封面、不放作者照片）
	const [bx, by] = P(80, 200);
	ctx.text('《养育你内心的小孩》', bx, by, 58, tBook - 100, {color: C.pencilDark});

	// 「书里叫安全感、自由、价值感、亲密」：一排格子，逐格涂红橙蓝紫，每格下写需要名
	const tBookSays = q.at('书里叫');
	base.frame(tBookSays - 200);
	ctx.text('书里叫', ...P(270, 668), 50, tBookSays + 150, {color: C.pencilDark, anchor: 'end'});
	(['安全感', '自由', '价值感', '亲密'] as const).forEach((w, i) => {
		const t = q.at(w);
		base.fill(i, t - 150, {dur: 600});
		base.below(i, w, t + 100);
	});

	// 「按句尾来认，是我的读法」：四格上方写句尾词；左边标星号「我的读法」
	base.labels(q.at('按句尾') - 100, 'end', {step: 300});
	ctx.text('＊我的读法', ...P(280, 340), 50, q.at('读法') - 150, {color: C.pencilDark, anchor: 'end'});
	// 「下面的例子，是我的理解和整理」：书名下一行小字
	ctx.text('例子＝我的整理', ...P(80, 268), 50, q.at('例子') - 100, {color: C.pencilDark});

	// 【钩·悬念前置】「其实，底下还有第五格」：右端画出第五格，白色，笔画一个大问号；镜头推近
	const t5 = q.at('第五格');
	base.fifth(t5 - 350);
	ctx.cam(B(1060, 90, 2380, 800), t5 - 350, 1200);
	// 「只有这一格没有句子」：上方一个空的虚线气泡（没有句子）
	const cell = base.cells[4];
	bubble(ctx.b, (cell[0] + cell[2]) / 2 - 150, P(0, 170)[1], 300, 120, q.at('没有句子') - 100, {dashed: true, color: C.pencilDark, side: 'l'});
	// 「先空着」：小便签盖住问号格一角，写「以后揭」
	base.note(q.at('空着') - 500, '以后揭');
};
