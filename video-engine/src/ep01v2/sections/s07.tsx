import React from 'react';
import type {Item, Pt} from '../../whiteboard';
import {bubble, C, check, counter, dots, flag, person, R, rr, stratum, strike, thought, thumb} from '../../whiteboard';
import {chatIcon} from '../props';
import type {SectionCtx} from '../ctx';

// s07 · 证据三：想开点，来晚了（3:28–4:02）  主岛 S07（OPEN 左边）
// 前半在 OPEN 的 D1：输入框上方思考泡（方向盘 / 花洒），拇指打「？」删掉再打（props.chat.input），计数 1→2→3，
//   纸边一个别人递进来的气泡「想开点」——离开 OPEN 时全部擦掉，不给 s14 留东西。
// 后半在 S07：D8 赛道。消息 → 那句话（冲线，撞断终点带）→ 手（跟着到）→ 想开点（弯腰喘气，才跑进来）；
//   「别比快」灰线划掉；一只手从上方捏起「那句话」那格，放进「稍后」盒子，盒盖合上。
// hanzi: 来晚了 抓下来

export const build = (ctx: SectionCtx) => {
	const {b, q, t0, tNext, P, B, props, islands} = ctx;
	const {chat} = props;
	const [OX, OY] = [islands.OPEN[0], islands.OPEN[1]];
	const O = (x: number, y: number): Pt => [OX + x, OY + y];

	// ================= OPEN：回到聊天框 =================
	// 镜头往左偏一点，右边不带出联想栏；左边留出空白给「别人」
	ctx.cam([OX - 660, OY + 60, OX + 1120, OY + 900], t0 - 500, 1300, {whoosh: true});
	const tLeave = q.at('来晚了') - 300;
	const openItems: Item[] = b.collect(() => {
		// 「你明明知道」：思考泡；「开车」方向盘；「洗澡」花洒
		const tK = q.at('知道');
		thought(b, [OX + 330, OY + 425, OX + 900, OY + 690], O(720, 745), tK, {w: 3});
		{
			const tD = q.at('开车');
			const [cx, cy] = O(480, 535);
			const r = 52;
			b.stroke((s) => R.circle(cx, cy, r, {seed: s, roughness: 0.8}), tD, 320, {w: 3.6});
			b.stroke((s) => R.circle(cx, cy, r * 0.28, {seed: s, roughness: 0.6}), tD + 320, 140, {w: 3});
			[90, 210, 330].forEach((deg, i) => {
				const a = (deg * Math.PI) / 180;
				b.stroke((s) => R.line([cx + Math.cos(a) * r * 0.3, cy + Math.sin(a) * r * 0.3], [cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92], {seed: s, roughness: 0.5}), tD + 460 + i * 90, 90, {w: 3});
			});
			ctx.text('开车？', cx, cy + 118, 40, tD + 800, {anchor: 'middle', color: C.pencilDark});
		}
		{
			const tS = q.at('洗澡');
			const [cx, cy] = O(745, 500);
			b.stroke((s) => R.path(rr(cx - 46, cy - 16, 92, 26, 8), {seed: s, roughness: 0.7}), tS, 260, {w: 3.4});
			b.stroke((s) => R.linear([[cx, cy - 16], [cx, cy - 46], [cx - 60, cy - 60]], {seed: s, roughness: 0.6}), tS + 260, 220, {w: 3.4});
			[-30, -15, 0, 15, 30].forEach((dx, i) => b.stroke((s) => R.line([cx + dx, cy + 20], [cx + dx * 1.3, cy + 70], {seed: s, roughness: 0.5}), tS + 500 + i * 60, 120, {w: 2.2, dash: '4 7', color: C.pencilDark}));
			ctx.text('洗澡？', cx, cy + 153, 40, tS + 900, {anchor: 'middle', color: C.pencilDark});
		}
		// 「手还是打了一个问号，删了，又打了一个」：拇指 + 输入框内容 + 计数
		const tHand = q.at('手还是');
		thumb(b, ...O(790, 792), 88, tHand);
		const steps: [number, string][] = [
			[q.at('问号'), '？'],
			[q.at('删了'), ''],
			[q.at('又打了'), '？'],
		];
		counter(b, ...O(930, 690), 56, steps.map((s) => s[0]), {color: C.pencilDark, anchor: 'end', sfx: false});
		// 「总有人劝你想开点」：纸边一个别人 + 圆润的气泡
		const tX = q.at('想开点');
		person(b, ...O(-620, 730), 170, tX - 700, {pose: 'raise'});
		bubble(b, ...O(-570, 470), 400, 110, tX, {side: 'r', text: '想开点', size: 52});
	});
	chat.input(
		[
			[q.at('问号'), '？'],
			[q.at('删了'), ''],
			[q.at('又打了'), '？'],
		],
		{until: tLeave},
	);
	b.eraseAll(openItems, tLeave, 400);

	// ================= S07：D8 赛道 =================
	// 集成修正：整岛视图下顶边切到「证据 ●●●」，下 40% 是空纸；框到赛道实际范围（z 0.80→0.85）。
	ctx.cam(B(30, 20, 2300, 880), tLeave, 1400, {whoosh: true});
	const tT = q.at('晚');
	// 证据 ③
	ctx.text('证据', ...P(100, 128), 52, tT + 700, {color: C.pencilDark});
	const d = dots(b, P(280, 110)[0], P(280, 110)[1], 3, 80, 26, tT + 200);
	d.light(0, tT + 900);
	d.light(1, tT + 1000);
	d.light(2, tT + 1200);

	const GY = 640; // 地面
	const FIN = 1700; // 终点
	stratum(b, P(240, GY)[0], P(2000, GY)[0], P(0, GY)[1], tT, 900, {w: 4, amp: 4});
	// 起点：消息（迷你 D1）
	chatIcon(b, B(110, 480, 300, 610), tT + 300, {});
	ctx.text('消息', ...P(205, 705), 50, tT + 1200, {anchor: 'middle', color: C.pencilDark});
	// 终点：旗杆 + 终点带
	flag(b, P(FIN, GY)[0], P(FIN, GY)[1], 260, tT + 600, {w: 4});
	const tape = b.stroke((s) => R.line(P(FIN, 440), P(FIN + 2, 630), {seed: s, roughness: 2.2, bowing: 3}), tT + 1000, 260, {w: 7, color: C.pencilDark});
	ctx.text('终点', ...P(FIN - 60, 705), 46, tT + 1300, {anchor: 'end', color: C.pencilDark});

	// 「那句话」那一格：铅笔虚线格 + 奔跑小人 + 标签，整格一个组
	const WX = 1400;
	const wordTr = b.track('d8word', P(WX, 600));
	b.inGroup('d8word', () => {
		const [x0, y0] = P(WX - 130, 430);
		b.stroke((s) => R.path(rr(x0, y0, 260, 330, 18), {seed: s, roughness: 0.9}), tT + 1400, 420, {w: 2.4, dash: '10 9', color: C.pencilDark});
		person(b, ...P(WX, GY), 150, tT + 1700, {pose: 'run'});
		ctx.text('那句话', ...P(WX, 722), 52, tT + 2300, {anchor: 'middle'});
	});
	// 「手」
	const HX = 1100;
	const handTr = b.track('d8hand', P(HX, 600));
	b.inGroup('d8hand', () => {
		thumb(b, ...P(HX, 560), 120, tT + 2600);
		ctx.text('手', ...P(HX, 722), 52, tT + 3200, {anchor: 'middle'});
	});

	// 「那句话已经跑完」：冲过终点，终点带断开飘走
	const tRun = q.at('跑完');
	wordTr.to(tRun - 700, 900, {x: P(2080, 600)[0]}); // 集成修正：冲过终点后停在旗杆右侧，不再压住旗杆和「已跑完」
	b.sound(tRun - 200, 'whoosh', 0.15);
	tape.out = tRun - 250;
	tape.outDur = 120;
	{
		const [fx, fy] = P(FIN, 440);
		const tHit = tRun - 250;
		b.node(
			tHit,
			(ms) => {
				const u = Math.min(1, (ms - tHit) / 900);
				const sw = Math.sin(u * Math.PI * 3) * (1 - u) * 40;
				return (
					<g fill="none" stroke={C.pencilDark} strokeWidth={5} strokeLinecap="round">
						<path d={`M${fx} ${fy} Q${fx - 30 - sw} ${fy + 60} ${fx - 70 - u * 40} ${fy + 90 + u * 30}`} />
						<path d={`M${fx} ${fy + 190} Q${fx + 40 + sw} ${fy + 140} ${fx + 80 + u * 40} ${fy + 120 - u * 30}`} />
					</g>
				);
			},
			{bb: B(FIN - 140, 380, FIN + 140, 640), dur: 900},
		);
	}
	check(b, ...P(1990, 800), 44, q.end('跑完'), 240, {w: 5});
	ctx.text('已跑完', ...P(2025, 814), 46, q.end('跑完') + 200, {color: C.pencilDark});

	// 「手也动了」：手跟到终点线前；「想开点才赶到」：弯腰小人从左边进来
	const tHand2 = q.at('手也动了');
	handTr.to(tHand2, 800, {x: P(1480, 600)[0]});
	check(b, ...P(1420, 800), 44, tHand2 + 800, 240, {w: 5});
	ctx.text('已动', ...P(1455, 814), 46, tHand2 + 1000, {color: C.pencilDark});
	const LX = 640;
	const tArr = q.at('赶到');
	const lateTr = b.track('d8late', P(LX, GY));
	lateTr.to(tArr - 1400, 1, {x: P(60, GY)[0]}).to(tArr - 1300, 1700, {});
	b.inGroup('d8late', () => {
		person(b, ...P(LX, GY), 150, tArr - 1500, {pose: 'bend'});
		// 喘气：头旁两道小短线
		b.stroke((s) => R.line(P(LX + 78, 530), P(LX + 96, 516), {seed: s, roughness: 0.5}), tArr - 700, 80, {w: 2.4, color: C.pencilDark});
		b.stroke((s) => R.line(P(LX + 84, 552), P(LX + 104, 544), {seed: s, roughness: 0.5}), tArr - 600, 80, {w: 2.4, color: C.pencilDark});
		ctx.text('想开点', ...P(LX, 722), 52, tArr - 500, {anchor: 'middle'});
	});
	ctx.write('来晚了', ...P(LX, 400), 64, q.end('赶到') - 100, 900, {anchor: 'middle'});

	// 「别跟它比快」：灰线划掉；写「别比快」
	const tFast = q.at('比快');
	strike(b, P(LX - 110, 590)[0], P(LX + 110, 590)[0], P(0, 580)[1], tFast, 320, {color: C.pencilDark, size: 11});
	ctx.text('别比快', ...P(LX, 830), 48, tFast + 350, {anchor: 'middle', color: C.pencilDark});

	// 「等它跑完，再把它抓下来」：镜头推到右半；手从上方伸下来捏起「那句话」那格
	const tGrab = q.at('抓下来');
	ctx.cam(B(960, 30, 2380, 900), tGrab - 1600, 1000);
	const pinchTr = b.track('d8pinch', P(2080, 300));
	pinchTr.to(tGrab - 1201, 1, {y: P(0, 300)[1] - 300}).to(tGrab - 1200, 700, {});
	b.inGroup('d8pinch', () => {
		const tP = tGrab - 1300;
		b.stroke((s) => R.line(P(2080, 40), P(2080, 330), {seed: s, roughness: 0.6}), tP, 240, {w: 5});
		b.stroke((s) => R.linear([P(2080, 330), P(2046, 400), P(2040, 436)], {seed: s, roughness: 0.6}), tP + 240, 160, {w: 4.4});
		b.stroke((s) => R.linear([P(2080, 330), P(2116, 400), P(2122, 436)], {seed: s, roughness: 0.6}), tP + 400, 160, {w: 4.4});
	});
	// 抬起
	wordTr.to(tGrab, 800, {x: P(1800, 600)[0], y: P(0, 600)[1] - 320});
	pinchTr.to(tGrab, 800, {x: P(1800, 300)[0], y: P(0, 300)[1] - 320});
	ctx.write('抓下来', ...P(1330, 150), 64, tGrab, 900, {anchor: 'middle'});

	// 「做完一个小测试就讲」：放进「稍后」盒子，盒盖合上
	const tBox = q.at('小测试');
	const [bx0, by0] = P(2000, 140);
	b.stroke((s) => R.linear([[bx0, by0], [bx0, by0 + 260], [bx0 + 320, by0 + 260], [bx0 + 320, by0]], {seed: s, roughness: 0.8}), tGrab + 900, 500, {w: 4});
	const lid = b.stroke((s) => R.line([bx0, by0], [bx0 + 130, by0 - 90], {seed: s, roughness: 0.6}), tGrab + 1400, 220, {w: 4});
	ctx.text('稍后', ...P(2160, 470), 52, tGrab + 1700, {anchor: 'middle', color: C.pencilDark});
	wordTr.to(tBox, 900, {x: P(2160, 250)[0], y: P(0, 260)[1], s: 0.42});
	pinchTr.to(tBox, 900, {x: P(2160, 250)[0], y: P(0, 300)[1] - 340, s: 0.6}).fade(tBox + 900, 300, 0);
	const tShut = q.at('就讲');
	lid.out = tShut;
	lid.outDur = 150;
	b.stroke((s) => R.line([bx0, by0], [bx0 + 320, by0], {seed: s, roughness: 0.6}), tShut, 240, {w: 4});
	b.sound(tShut + 200, 'pop', 0.3);
	// 盒子在最后几秒轻轻晃一下（里面的东西还在）
	b.hover(P(2160, 100), tShut + 500, Math.min(tNext, tShut + 2500));
};
