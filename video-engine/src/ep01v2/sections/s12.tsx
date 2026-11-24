import type {Item, Pt} from '../../whiteboard';
import {arrow, bubble, C, check, flag, freehand, person, qmark, R, ring, rr, strike, thumb} from '../../whiteboard';
import type {SectionCtx} from '../ctx';
import {LINE_Y, MB, MEMO, MP} from '../local/s10_layout';

// s12 · 工具：加（7:59–8:58）
// 前半段在 MEMO 岛（s10/s11 那张备忘录）：抓、追打勾 → 笔悬在旧句上作势要划又收回「不划掉」→ 旁边加一栏改写栏（最可能 · 我可以）
//   → 填「对方在忙 / 没想好怎么答」「明天 12:00 前不追问」+ 待发气泡「不急，周五前给个准信」→ 时间轴：干等的虚线在「周五」立旗截止
//   →「加，不是改？」（写「改」打问号，圈标题里的「加」）
// 后半段在 CORE 岛：迷你赛道「改」又落在后面 → 自证圆圈滑回、「动作」节点 + 手、长出第二条路、「随便你」划掉换成「周五前给个准信」、
//   圈在「动作 → 对方」之间断开，工具箱第 1 格出现笔 → 擦掉这些，D14 核心图按「一件事，一个动作，一句话，一个句尾，再加一行」连起来 → 拉远「地图」。

export const build = (ctx: SectionCtx) => {
	const {b, q, props, P, B} = ctx;
	const {core} = props;
	const T = MEMO.title;

	// ───────── MEMO：加 ─────────
	// 「最后是加」：回到整张备忘录；标题下的空格里，抓、追打勾，「加」下面划一道
	ctx.cam(MB(0, 0, 2400, 1120), ctx.t0 - 450, 1000);
	check(b, ...MP(T.xs[0], 212), 54, ctx.t0 + 120, 240);
	check(b, ...MP(T.xs[1], 212), 54, ctx.t0 + 420, 240);
	b.sound(ctx.t0 + 120, 'tick', 0.2);
	b.sound(ctx.t0 + 420, 'tick', 0.2);
	const tAdd = q.at('加');
	freehand(b, [MP(T.xs[2] - 70, 162), MP(T.xs[2], 158), MP(T.xs[2] + 70, 164)], tAdd, 320, {size: 10});

	// 「旧的那句不用划掉」：笔悬在旧句上方，作势要划（一小段铅笔虚线），停住，擦掉收回 →「不划掉」
	const tOld = q.at('旧的');
	const tStrike = q.at('划掉') - 250;
	b.hover(MP(215, LINE_Y - 110), tOld - 100, tStrike - 60);
	const ghost = b.stroke((s) => R.line(MP(195, LINE_Y - 20), MP(560, LINE_Y - 26), {seed: s, roughness: 0.6}), tStrike, 380, {w: 3.4, dash: '12 10', color: C.pencilDark});
	ghost.out = tStrike + 700;
	ghost.outDur = 260;
	b.sound(tStrike + 700, 'erase', 0.22);
	b.hover(MP(600, LINE_Y - 150), tStrike + 420, tStrike + 1050);
	ctx.text('不划掉', ...MP(300, 672), 50, q.end('划掉') + 60, {anchor: 'middle', color: C.pencilDark});

	// 「在它旁边，加一行」：旧句右边画出空白改写栏
	const tCol = q.at('加一行') - 250;
	const col = MEMO.rewrite;
	b.stroke((s) => R.path(rr(col[0], col[1], col[2] - col[0], col[3] - col[1], 20), {seed: s, roughness: 0.8}), tCol, 620, {w: 4});
	ctx.text('加一行', ...MP(2100, 306), 50, tCol + 520, {anchor: 'middle'});
	b.sound(tCol, 'pop', 0.2);

	// 「一行分两半：最可能是什么，我可以怎么做，至少两种」
	ctx.cam(MB(1100, 280, 2400, 1120), q.at('一行分两半') - 300, 1000);
	b.stroke((s) => R.line(MP(1850, 652), MP(2350, 654), {seed: s, roughness: 0.5}), q.at('两半'), 360, {w: 3, color: C.pencilDark});
	const blank = (x0: number, x1: number, y: number, t: number) => b.stroke((s) => R.line(MP(x0, y), MP(x1, y + 2), {seed: s, roughness: 0.6}), t, 220, {w: 3, color: C.pencil});
	const tMost = q.at('最可能');
	ctx.text('最可能是', ...MP(1860, 405), 50, tMost, {color: C.pencilDark});
	blank(2070, 2330, 410, tMost + 420);
	const tCan = q.at('我可以');
	ctx.text('我可以', ...MP(1860, 718), 50, tCan, {color: C.pencilDark});
	blank(2020, 2150, 722, tCan + 360);
	ctx.text('/', ...MP(2175, 718), 50, tCan + 560, {color: C.pencilDark, dur: 80, nolint: true});
	blank(2210, 2340, 722, q.at('至少两种') - 100);

	// 「填进去：最可能是对方在忙，或者还没想好怎么答」
	ctx.text('对方在忙', ...MP(1880, 492), 50, q.at('对方在忙') - 100);
	ctx.text('没想好怎么答', ...MP(1880, 578), 50, q.at('没想好') - 150);
	// 「我可以明天中午前不追问」+ 一个 12:00 的小钟
	ctx.text('明天12:00前不追问', ...MP(1860, 800), 42, q.at('明天') - 100);
	const tNoon = q.at('中午');
	const [kx, ky] = MP(2300, 786);
	b.stroke((s) => R.circle(kx, ky, 28, {seed: s, roughness: 0.6}), tNoon, 260, {w: 3.2});
	b.stroke((s) => R.line([kx, ky], [kx, ky - 22], {seed: s, roughness: 0.2}), tNoon + 260, 90, {w: 3.6, lag: 0});
	b.stroke((s) => R.line([kx, ky], [kx + 1, ky - 14], {seed: s, roughness: 0.2}), tNoon + 350, 90, {w: 4.6, lag: 0});
	// 「或者发一句：『不急，你周五前给我个准信就行。』」：待发的气泡，发送键还没按
	const tSay = q.at('发一句');
	const bb = MB(1850, 838, 2262, 944);
	b.stroke((s) => R.path(rr(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1], 20), {seed: s, roughness: 0.7}), tSay, 360, {w: 3.2, dash: '11 8'});
	b.stroke((s) => R.circle(...MP(2312, 890), 30, {seed: s, roughness: 0.6}), tSay + 380, 200, {w: 3, color: C.pencilDark});
	b.stroke((s) => R.linear([MP(2302, 876), MP(2326, 890), MP(2302, 904)], {seed: s, roughness: 0.4}), tSay + 580, 120, {w: 3, color: C.pencilDark, lag: 0});
	ctx.text('不急，', ...MP(1866, 904), 38, q.at('不急'));
	ctx.text('周五前给个准信', ...MP(1980, 904), 38, q.at('周五前') - 100);

	// 「这一句，把干等变成了截止时间」：一条看不到头的虚线（干等），在「周五」立旗，虚线到旗为止
	const tWait = q.at('干等');
	const TY = 1048;
	b.stroke((s) => R.line(MP(1330, TY), MP(2010, TY), {seed: s, roughness: 0.5}), tWait - 500, 420, {w: 3.2, dash: '12 12', color: C.pencilDark});
	const tail = b.stroke((s) => R.line(MP(2010, TY), MP(2400, TY + 2), {seed: s, roughness: 0.5}), tWait - 80, 260, {w: 3.2, dash: '12 12', color: C.pencilDark});
	ctx.text('干等', ...MP(1340, TY - 22), 44, tWait - 100, {color: C.pencilDark});
	const tDue = q.at('截止');
	flag(b, ...MP(2010, TY), 104, tDue - 250);
	tail.out = tDue + 350;
	tail.outDur = 350;
	b.sound(tDue + 350, 'erase', 0.2);
	ctx.text('截止', ...MP(2072, TY - 58), 44, tDue + 250);
	ctx.text('周五', ...MP(2010, TY + 46), 40, tDue + 450, {anchor: 'middle', color: C.pencilDark});

	// 「为什么是加，不是改？」：圈标题里的「加」，左边写「改」打问号；（停 1 秒）笔悬着
	ctx.cam(MB(700, 0, 2400, 420), q.at('为什么是加') - 450, 900);
	ring(b, ...MP(T.xs[2], 90), 200, 176, q.ch('为什么是加', 3) - 50, 420, {w: 4.6});
	const tGai = q.ch('不是改', 2);
	ctx.write('改', ...MP(900, 30), 120, tGai - 150, 420, {anchor: 'middle'});
	qmark(b, ...MP(1030, 100), 120, tGai + 320, 420, {w: 6});
	const tPauseEnd = q.end('不是改') + 1250;
	b.hover(MP(1000, 250), tGai + 800, tPauseEnd);

	// ───────── CORE：比快比不过 · 断圈 ─────────
	const temp: Item[] = [];
	const keep = (fn: () => void) => temp.push(...b.collect(fn));

	// 「改，就又在跟它比快，你比不过」：迷你赛道，「那句话」早冲过「手」那条线，「改」还在后面喘
	ctx.cam(B(80, 160, 1760, 960), tPauseEnd, 1150, {whoosh: true});
	const tRace = q.at('又在') - 250;
	const FOOT = 700;
	keep(() => {
		b.stroke((s) => R.line(P(220, 420), P(1650, 424), {seed: s, roughness: 0.6}), tPauseEnd + 300, 380, {w: 3.4, pen: false});
		b.stroke((s) => R.line(P(220, 760), P(1650, 756), {seed: s, roughness: 0.6}), tPauseEnd + 420, 380, {w: 3.4, pen: false});
		b.stroke((s) => R.line(P(300, 424), P(300, 756), {seed: s, roughness: 0.4}), tPauseEnd + 600, 200, {w: 2.6, color: C.pencil, pen: false});
		b.stroke((s) => R.line(P(1480, 400), P(1480, 780), {seed: s, roughness: 0.4}), tPauseEnd + 700, 220, {w: 6, pen: false});
		ctx.text('消息', ...P(300, 396), 50, tPauseEnd + 650, {anchor: 'middle', dur: 0});
		ctx.text('手', ...P(1480, 380), 56, tPauseEnd + 800, {anchor: 'middle', dur: 0});
		// 那句话：一溜烟冲过去
		const ga = 's12runA';
		b.track(ga, P(380, FOOT)).to(tRace + 350, 900, {x: P(1580, 0)[0], y: P(0, FOOT)[1]});
		b.inGroup(ga, () => {
			person(b, ...P(380, FOOT), 170, tRace, {pose: 'run', pen: false});
			ctx.text('那句话', ...P(380, 510), 44, tRace, {anchor: 'middle', dur: 0, nolint: true});
		});
		check(b, ...P(1580, 350), 60, tRace + 1300, 240, {pen: false});
		// 改：慢慢挪，最后弯腰喘气
		const gb = 's12runB';
		const tBend = q.at('比不过') - 150;
		b.track(gb, P(380, FOOT)).to(tRace + 500, tBend - tRace - 500, {x: P(760, 0)[0], y: P(0, FOOT)[1]}).fade(tBend, 160, 0);
		b.inGroup(gb, () => {
			person(b, ...P(380, FOOT), 170, tRace + 250, {pose: 'run', pen: false});
			ctx.text('改', ...P(380, 510), 56, tRace + 250, {anchor: 'middle', dur: 0, nolint: true});
		});
		person(b, ...P(760, FOOT), 170, tBend, {pose: 'bend', pen: false});
		ctx.text('改', ...P(790, 540), 56, tBend, {anchor: 'middle', dur: 0});
		for (let k = 0; k < 3; k++) b.stroke((s) => R.line(P(880 + k * 18, 560 - k * 26), P(910 + k * 22, 548 - k * 30), {seed: s, roughness: 0.4}), tBend + 200 + k * 90, 90, {w: 2.6, color: C.pencilDark, pen: false});
		ctx.text('比快，比不过', ...P(900, 880), 56, q.at('比不过') + 100, {anchor: 'middle'});
	});

	// 「它管的是你下一步的手」：自证圆圈从左上角滑回中央；「动作」节点高亮，画一只手
	const tCirc = q.at('它管的') - 350;
	// 赛道讲完就擦掉，别挤在圆圈的画面边上
	b.eraseAll([...temp], tCirc - 100, 400);
	// 集成修正：框收紧到圆圈 + 岔路 + 工具箱的实际范围（z 0.78→0.89），节点字在手机上更清楚。
	ctx.cam(B(1640, 370, 3600, 1420), tCirc - 150, 1000);
	const CX = 2150;
	const CY = 800;
	const RR = 300;
	const gc = 's12circle';
	const [ccx, ccy] = P(CX, CY);
	b.track(gc, [ccx, ccy]).to(tCirc - 5, 1, {x: P(1650, 0)[0], y: P(0, 420)[1], s: 0.35}).to(tCirc + 150, 900, {});
	const pt = (deg: number, r = RR): Pt => P(CX + r * Math.cos((deg * Math.PI) / 180), CY + r * Math.sin((deg * Math.PI) / 180));
	const arcPts = (a0: number, a1: number) => Array.from({length: 13}, (_, k) => pt(a0 + ((a1 - a0) * k) / 12));
	/** 顺时针一段弧 + 箭头；返回条目 */
	const arc = (a0: number, a1: number, t: number, o: {head?: boolean} = {}) =>
		b.collect(() => {
			b.stroke((s) => R.curve(arcPts(a0, a1), {seed: s, roughness: 0.7}), t, 260, {w: 4, pen: false});
			if (o.head !== false) {
				const e = pt(a1);
				const tg = ((a1 + 90) * Math.PI) / 180;
				const ux = Math.cos(tg);
				const uy = Math.sin(tg);
				const p1: Pt = [e[0] - ux * 26 - uy * 15, e[1] - uy * 26 + ux * 15];
				const p2: Pt = [e[0] - ux * 26 + uy * 15, e[1] - uy * 26 - ux * 15];
				b.stroke((s) => R.linear([p1, e, p2], {seed: s, roughness: 0.5}), t + 240, 100, {w: 4, pen: false, lag: 0});
			}
		});
	let arc23: Item[] = [];
	keep(() =>
		b.inGroup(gc, () => {
			// 节点：上 不在乎我（紫）· 右 随便你（你的动作）· 下 对方护住自己 · 左 看吧
			[-90, 0, 90, 180].forEach((a, k) => {
				const [x, y] = pt(a);
				b.stroke((s) => R.circle(x, y, 9, {seed: s, roughness: 0.3}), tCirc + k * 120, 120, {w: 7, pen: false});
			});
			arc(-74, -16, tCirc + 100);
			arc23 = arc(16, 74, tCirc + 250);
			arc(106, 164, tCirc + 400);
			arc(196, 254, tCirc + 550);
			const [n1x, n1y] = pt(-90);
			ctx.text('不在乎我', n1x, n1y - 36, 52, tCirc + 200, {anchor: 'middle', color: C.purpleDeep, dur: 0, nolint: true});
			b.stroke((s) => R.ellipse(n1x, n1y - 54, 270, 88, {seed: s, roughness: 1.2}), tCirc + 400, 300, {w: 4, color: C.purple, pen: false});
			const [n2x, n2y] = pt(0);
			ctx.text('随便你', n2x + 30, n2y + 18, 52, tCirc + 300, {dur: 0, nolint: true});
			const [n3x, n3y] = pt(90);
			person(b, n3x, n3y + 150, 120, tCirc + 350, {pose: 'hug', pen: false});
			const [n4x, n4y] = pt(180);
			ctx.text('看吧', n4x - 30, n4y + 18, 52, tCirc + 450, {anchor: 'end', dur: 0, nolint: true});
		}),
	);
	const [n2x, n2y] = pt(0);
	const tStep = q.at('下一步');
	keep(() => {
		b.stroke((s) => R.path(rr(n2x + 14, n2y - 42, 186, 84, 20), {seed: s, roughness: 0.8}), tStep, 420, {w: 5});
		ctx.text('动作', n2x + 107, n2y - 58, 50, tStep + 300, {anchor: 'middle', color: C.pencilDark});
		thumb(b, n2x + 130, n2y + 150, 130, q.at('手') - 200);
	});

	// 「旁边多一行，手就多一条路」：「动作」节点旁长出第二条岔路
	const tFork = q.at('多一行');
	const forkEnd = P(2860, 560);
	keep(() => {
		arrow(b, [n2x + 200, n2y - 20], forkEnd, tFork, 600, {bend: -0.2, w: 4.4});
		ctx.text('多一条路', ...P(2720, 720), 50, q.at('一条路') - 100, {color: C.pencilDark});
	});
	// 「你没回『随便你』，回的是『周五前给个准信』」
	keep(() => {
		strike(b, n2x + 24, n2x + 196, n2y + 2, q.at('随便你') + 150, 320, {size: 11});
		bubble(b, ...P(2870, 460), 420, 100, q.at('回的是') - 100, {side: 'r', text: '周五前给个准信', size: 50});
	});
	// 「那个圈，就断了一环」：「动作 → 对方」那段弧咔地断开；工具箱第 1 格出现笔
	const tBreak = q.at('断');
	b.eraseAll(arc23, tBreak, 120);
	keep(() =>
		b.inGroup(gc, () => {
			b.stroke((s) => R.curve(arcPts(16, 38), {seed: s, roughness: 0.7}), tBreak, 1, {w: 4, pen: false, boil: false});
			b.stroke((s) => R.curve(arcPts(52, 74), {seed: s, roughness: 0.7}), tBreak, 1, {w: 4, pen: false, boil: false});
			const a = pt(38);
			const z = pt(52);
			b.stroke((s) => R.linear([a, [a[0] + 14, a[1] - 18], [a[0] + 4, a[1] - 30]], {seed: s, roughness: 0.3}), tBreak + 40, 120, {w: 3.4});
			b.stroke((s) => R.linear([z, [z[0] - 18, z[1] + 12], [z[0] - 30, z[1] + 4]], {seed: s, roughness: 0.3}), tBreak + 160, 120, {w: 3.4});
			ctx.text('圈断了', ...P(2440, 1090), 56, tBreak + 250, {});
		}),
	);
	b.sound(tBreak, 'stamp', 0.35);
	core.toolbox(tBreak + 350);

	// ───────── D14 核心图总装 ─────────
	const tOne = q.at('一件事');
	b.eraseAll(temp, tOne - 480, 380);
	b.sound(tOne - 480, 'erase', 0.25);
	ctx.cam(B(0, 150, 3180, 1450), tOne - 520, 1000);
	core.event(tOne - 150);
	core.action(q.at('一个动作') - 150);
	const tSent = q.at('一句话') - 150;
	core.sentence(tSent);
	let t = core.chain(0, tSent + 1480, {label: false});
	t = core.chain(1, t + 20, {label: false});
	t = core.chain(2, t + 20, {label: false});
	const tTag = q.at('一个句尾') - 100;
	// 集成修正：原来「再加一行」才拉远，整图完整入画只剩 ~1.5 秒就飞去 s13；提前到「一个句尾」拉远，右侧改写栏在画内写出。
	ctx.cam(core.views.full, tTag - 300, 1200);
	core.tags(tTag, {lit: 'blue'});
	core.baseRow(tTag + 650, {arrowTo: 'blue'});
	const tLine = q.at('再加一行');
	core.rewrite(tLine, ['最可能', '在忙', '我可以', '不追问', '给截止']);
	core.bar(Math.max(t - 200, q.at('地图') - 400));
	// 「这就是这一季的地图，以后每期添一样」：整张图入画，空的 15 个工具格轻闪
	core.flashTools(q.at('每期'));
};
