import React from 'react';
import type {Captions} from '../../lib/types';
import {Board, makeCues} from './engine/board';
import {clamp01, easeOut} from './engine/camera';
import {R, rr} from './engine/rough';
import {C} from './engine/theme';
import {freehand, write} from './engine/verbs';
import {arrow, badge, balance, bubble, clock, flame, heartPath, HandText, magnifier, miniPhone, phone, ring, seed, stratum, under, zheng} from './kit';

// lab01 分镜：每一条都挂在旁白的某个字上（cue.at('词')），改稿后重新对齐即可。
// 世界坐标：上半张纸（y 0–800）是「故事区」，下半张纸（y 1180–2240）是「三层图」。

export const buildLab01 = (captions: Captions): Board => {
	const q = makeCues(captions);
	const b = new Board(q);

	// ============ 0 · 故事区 ============
	// —— 钟与时间：屏幕上的时间、钟的分针、锁屏时间，全部读同一个 minute(ms) ——
	const tHalf = q.at('半小时');
	const tFeed = q.at('点开');
	const minute = (ms: number) => {
		if (ms < tHalf) return 14;
		const sweep = easeOut(clamp01((ms - tHalf) / 950));
		if (ms < tHalf + 950) return 14 + 30 * sweep;
		if (ms < tFeed) return 44 + ((ms - tHalf - 950) / (tFeed - tHalf - 950)) * 8;
		return 52 + (ms - tFeed) / 4000;
	};
	const hhmm = (ms: number) => `20:${String(Math.floor(minute(ms))).padStart(2, '0')}`;

	// 镜头 1：只看手机
	b.cam(0, [470, 100, 990, 790]);
	const scr = phone(b, 560, 120, 340, 640, 60, 1100);
	b.node(900, (ms) => <HandText x={scr.x + 16} y={scr.y + 26} size={20} color={C.pencilDark}>{hhmm(ms)}</HandText>);
	b.text('阿哲', 730, 226, 30, 1000, {anchor: 'middle'});
	b.stroke((s) => R.line([scr.x + 8, 246], [scr.x + scr.w - 8, 246], {seed: s, roughness: 0.4}), 1250, 220, {color: C.pencil, w: 2});
	// 输入栏 + 发送键
	b.stroke((s) => R.path(rr(588, 650, 232, 46, 20), {seed: s, roughness: 0.5}), 1400, 260, {color: C.pencilDark, w: 2.4});
	b.stroke((s) => R.circle(852, 673, 20, {seed: s, roughness: 0.6}), 1640, 160, {color: C.pencilDark, w: 2.4});
	// 发出第一条
	const tSend = q.at('发了条消息');
	bubble(b, 662, 270, 210, 54, tSend, {text: '晚上一起吃饭？', size: 26});
	b.text('已送达', 872, 348, 18, tSend + 900, {anchor: 'end', color: C.pencil, pen: false});
	// 钟：半小时
	b.cam(tHalf - 300, [150, 110, 910, 770], 1000);
	clock(b, 'minute', 330, 250, 100, tHalf - 1500, minute);
	b.text('半小时', 330, 412, 46, tHalf + 250, {anchor: 'middle'});

	// —— 屏幕：聊天 / 熄屏 / 锁屏（看一眼） ——
	type S = 'chat' | 'dark' | 'look';
	const states: [number, S][] = [
		[0, 'chat'],
		[q.end('半小时没回') + 150, 'dark'],
		[q.at('看了一眼'), 'look'],
		[q.at('放下'), 'dark'],
		[q.ch('又看一眼', 1), 'look'],
		[q.at('补了一句'), 'chat'],
	];
	const stateAt = (ms: number): [S, S, number] => {
		let i = 0;
		for (let k = 0; k < states.length; k++) if (states[k][0] <= ms) i = k;
		const prev = i > 0 ? states[i - 1][1] : states[0][1];
		return [states[i][1], prev, clamp01((ms - states[i][0]) / 170)];
	};

	// 输入栏打字「在忙吗？」→ 发送
	const tType = q.at('补了一句') + 250;
	const tAsk = q.at('在忙吗');
	const typed = '在忙吗？';
	b.node(tType, (ms, frame) => {
		if (ms >= tAsk) return null;
		const n = Math.min(typed.length, Math.floor(((ms - tType) / Math.max(1, tAsk - 150 - tType)) * (typed.length + 0.99)));
		const s = typed.slice(0, Math.max(0, n));
		const caret = frame % 16 < 9;
		return (
			<g>
				<HandText x={604} y={682} size={26}>{s}</HandText>
				{caret ? <rect x={606 + s.length * 26} y={660} width={2.4} height={28} fill={C.ink} /> : null}
			</g>
		);
	});
	bubble(b, 740, 374, 132, 54, tAsk, {text: '在忙吗？', size: 26});
	// 还是没回：本该出现回复的地方，只有一个虚线的空气泡
	const tStill = q.at('还是没回');
	bubble(b, 590, 468, 150, 54, tStill + 150, {side: 'l', dashed: true, color: C.pencil, w: 2.6});
	b.text('……', 665, 502, 26, tStill + 480, {anchor: 'middle', color: C.pencil, pen: false});

	// 屏幕覆盖层（放在所有聊天内容之后，才能盖住它们）
	b.node(0, (ms) => {
		const [cur, prev, u] = stateAt(ms);
		const layer = (s: S, a: number) => {
			if (s === 'chat' || a <= 0) return null;
			if (s === 'dark')
				return <rect x={scr.x + 2} y={scr.y + 2} width={scr.w - 4} height={scr.h - 4} rx={10} fill={C.screen} opacity={0.93 * a} />;
			return (
				<g opacity={a}>
					<rect x={scr.x + 2} y={scr.y + 2} width={scr.w - 4} height={scr.h - 4} rx={10} fill={C.paper} />
					<HandText x={730} y={330} size={86} anchor="middle">{hhmm(ms)}</HandText>
					<HandText x={730} y={378} size={24} anchor="middle" color={C.pencilDark}>9月30日 星期二</HandText>
					<rect x={600} y={440} width={260} height={62} rx={16} fill="none" stroke={C.pencil} strokeWidth={2.4} strokeDasharray="8 9" />
					<HandText x={730} y={480} size={26} anchor="middle" color={C.pencilDark}>没有新消息</HandText>
				</g>
			);
		};
		return (
			<g>
				{layer(prev, 1 - u)}
				{layer(cur, u)}
			</g>
		);
	});

	// —— 看了几次：「正」字计数 ——
	const looks = [q.ch('看了一眼', 0), q.ch('又看一眼', 1), q.ch('还是没回', 2), q.ch('还是没回', 3) + 150, q.at('点开')];
	b.node(looks[0], (ms) => {
		const n = looks.filter((t) => t <= ms).length;
		return (
			<g>
				<HandText x={330} y={528} size={40} anchor="middle" color={C.pencilDark}>看了</HandText>
				<HandText x={330} y={528} size={1} anchor="middle">{''}</HandText>
				<HandText x={395} y={528} size={40} anchor="middle" color={n >= 4 ? C.red : C.ink}>{String(n)}</HandText>
				<HandText x={445} y={528} size={40} anchor="middle" color={C.pencilDark}>次</HandText>
			</g>
		);
	});
	zheng(b, 330, 640, 130, looks);
	looks.forEach((t) => b.sfx.push({t, src: 'lab/opus/tick.wav', vol: 0.35}));

	// —— 朋友圈：他十分钟前给别人点了赞 ——
	b.cam(tFeed - 250, [1560, 130, 1900, 760], 1000, true);
	const fs = phone(b, 1560, 120, 340, 640, tFeed - 200, 900);
	void fs;
	b.text('动态', 1730, 226, 30, tFeed + 500, {anchor: 'middle'});
	b.stroke((s) => R.line([1582, 246], [1878, 246], {seed: s, roughness: 0.4}), tFeed + 750, 180, {color: C.pencil, w: 2});
	const post = (y: number, t: number, name: string | null, img: boolean) => {
		b.stroke((s) => R.path(rr(1590, y, 56, 56, 10), {seed: s, roughness: 0.6}), t, 200, {w: 2.6});
		b.stroke((s) => R.circle(1618, y + 22, 10, {seed: s, roughness: 0.6}), t + 180, 120, {w: 2.2});
		b.stroke((s) => R.path(`M1600 ${y + 52} Q1618 ${y + 30} 1636 ${y + 52}`, {seed: s, roughness: 0.6}), t + 280, 120, {w: 2.2, lag: 0});
		if (name) b.text(name, 1662, y + 24, 26, t + 350, {pen: false});
		b.stroke((s) => R.curve([[1662, y + 48], [1720, y + 44], [1790, y + 50], [1860, y + 46]], {seed: s, roughness: 1.4}), t + 420, 160, {color: C.pencil, w: 2.4});
		b.stroke((s) => R.curve([[1662, y + 70], [1720, y + 67], [1790, y + 72]], {seed: s, roughness: 1.4}), t + 560, 140, {color: C.pencil, w: 2.4});
		if (img) {
			b.stroke((s) => R.rect(1662, y + 88, 190, 128, {seed: s, roughness: 0.6}), t + 700, 260, {w: 2.6});
			b.stroke((s) => R.linear([[1668, y + 205], [1718, y + 140], [1752, y + 180], [1792, y + 124], [1846, y + 205]], {seed: s, roughness: 0.8}), t + 960, 260, {w: 2.4});
			b.stroke((s) => R.circle(1818, y + 116, 12, {seed: s, roughness: 0.6}), t + 1220, 140, {w: 2.2});
		}
	};
	post(262, tFeed + 850, '小雨', true);
	const tTen = q.at('十分钟前');
	b.text('10分钟前', 1662, 518, 24, tFeed + 2100, {color: C.pencilDark, pen: false});
	b.stroke((s) => R.path(rr(1662, 540, 190, 50, 8), {seed: s, roughness: 0.5}), tFeed + 2200, 260, {color: C.pencil, w: 2});
	post(612, tFeed + 2400, null, false);
	b.cam(q.at('发现他') - 100, [1580, 250, 1880, 610], 900);
	ring(b, 1724, 510, 180, 54, tTen, 420);
	const tLike = q.at('点过赞');
	b.stroke((s) => R.path(heartPath(1688, 566, 28), {seed: s, roughness: 0.6}), tLike, 280, {color: C.red, w: 3});
	b.text('阿哲', 1712, 575, 26, tLike + 220);
	ring(b, 1757, 565, 230, 72, q.ch('点过赞', 2) + 60, 420);

	// —— 火上来了：两条「证据」汇成一团火 ——
	const tFire = q.at('好');
	b.cam(tFire - 150, [150, 20, 1960, 800], 1000, true);
	arrow(b, [912, 405], [1128, 470], tFire + 500, 520, {color: C.red, bend: -0.2, w: 3.6});
	b.text('半小时不回', 1010, 548, 34, tFire + 900, {anchor: 'middle', color: C.red});
	arrow(b, [1552, 566], [1336, 488], tFire + 1300, 520, {color: C.red, bend: -0.2, w: 3.6});
	b.text('却有空点赞', 1446, 640, 34, tFire + 1700, {anchor: 'middle', color: C.red});
	flame(b, 1232, 470, 150, q.at('火上来了') - 60);

	// —— 先别急着评理：天平两头「他不在乎 / 我太敏感」，然后划掉 ——
	const tJudge = q.at('我们先别急着');
	const tiltT = tJudge + 900;
	balance(b, 'scale', 1232, 76, 158, tJudge, (ms) => (ms < tiltT ? 0 : 9 * Math.sin(((ms - tiltT) / 1000) * Math.PI * 2 * 0.75) * Math.exp(-(ms - tiltT) / 2600)), [
		'他不在乎',
		'我太敏感',
	]);
	const tX = q.end('评理') + 60;
	b.stroke((s) => R.line([1040, 40], [1430, 330], {seed: s, roughness: 1}), tX, 220, {color: C.red, w: 5});
	b.stroke((s) => R.line([1430, 40], [1040, 330], {seed: s, roughness: 1}), tX + 240, 220, {color: C.red, w: 5});

	// ============ 1 · 三层图 ============
	const X0 = 60;
	const X1 = 1400;
	const Y = {l1: 1560, l2: 1880, l3: 2200};
	const mid = {top: 1410, mid: 1720, bot: 2040};
	const tCut = q.at('把这件事');
	b.cam(tCut, [40, 1180, 1420, 2240], 1300, true);
	const tSplit = q.at('拆成');
	stratum(b, X0, X1, Y.l1, Math.min(tSplit, tCut + 450), 480, {phase: 0.4});
	stratum(b, X0, X1, Y.l2, q.at('三层') - 60, 480, {phase: 1.9});
	stratum(b, X0, X1, Y.l3, q.ch('三层', 1) + 120, 480, {phase: 3.1});
	badge(b, 110, mid.top, 30, '1', q.at('三层看') + 330);
	badge(b, 110, mid.mid, 30, '2', q.at('三层看') + 560);
	badge(b, 110, mid.bot, 30, '3', q.at('三层看') + 790);

	// 第一层：事情
	b.cam(q.at('最上面一层') - 100, [40, 1250, 1420, 1580], 900);
	write(b, '事情', 160, mid.top + 22 - 60, 66, q.at('是事情') + 60, 760);
	b.text('发生了什么', 160, mid.top + 72, 30, q.end('是事情') + 100, {color: C.pencilDark, pen: false});
	const tFact = q.at('他回消息慢');
	miniPhone(b, 480, 1335, 150, tFact - 200);
	b.text('他回消息慢', 610, 1432, 62, tFact + 280);
	b.text('（半小时没回）', 610, 1492, 32, tFact + 900, {color: C.pencilDark, pen: false});

	// 第二层：你的反应
	b.cam(q.at('中间一层') - 100, [40, 1560, 1420, 1890], 900);
	write(b, '你的反应', 160, mid.mid + 22 - 60, 66, q.at('你的反应') - 80, 1150);
	b.text('你做了什么', 160, mid.mid + 72, 30, q.end('你的反应') + 100, {color: C.pencilDark, pen: false});
	const tRe = q.at('反复看');
	zheng(b, 500, 1712, 78, [0, 1, 2, 3, 4].map((i) => tRe + i * 95), {w: 4});
	b.text('反复看', 562, 1738, 46, tRe + 420);
	const tAsk2 = q.at('追问');
	bubble(b, 752, 1686, 128, 52, tAsk2 - 80, {text: '在忙吗？', size: 24});
	b.text('追问', 912, 1738, 46, tAsk2 + 330);
	const tProof = q.at('找证据');
	magnifier(b, 1088, 1704, 32, tProof - 80);
	b.text('找证据', 1160, 1738, 46, tProof + 420);

	// 第三层：底下真正起作用的
	b.cam(q.at('最底下一层') - 100, [40, 1840, 1420, 2230], 900);
	const tBottom = q.ch('最底下一层', 1);
	b.fill((s) => R.hatchRect(440, 1893, 960, 300, {seed: s, hachureGap: 13}), tBottom, 1100, {color: C.amber, w: 3, opacity: 0.55, pen: true});
	b.cam(q.at('才是真正') - 100, [40, 1640, 1420, 2230], 800);
	const tWork = q.at('起作用');
	arrow(b, [500, 1985], [500, 1786], tWork - 250, 380, {color: C.amberDeep, bend: 0.05, w: 4.4});
	arrow(b, [818, 1985], [818, 1790], tWork + 30, 380, {color: C.amberDeep, bend: -0.05, w: 4.4});
	arrow(b, [1090, 1985], [1090, 1796], tWork + 310, 380, {color: C.amberDeep, bend: 0.05, w: 4.4});

	const tWant = q.at('你想确认');
	const tCare = q.at('这层没照顾到');
	const tBack = q.at('再冒出来');
	const glow1 = (ms: number) => {
		if (ms < tCare + 300) return 1;
		if (ms < tBack) return 1 - 0.7 * easeOut(clamp01((ms - tCare - 300) / 500));
		return 0.3 + 0.7 * easeOut(clamp01((ms - tBack) / 400));
	};
	b.cam(tWant - 100, [440, 1900, 1400, 2190], 1000);
	seed(b, 500, 2074, 22, tWant, glow1);
	b.text('你想确认：', 545, 2018, 34, tWant + 250, {color: C.pencilDark});
	const tImp = q.at('我在他那儿是重要的');
	b.text('我在他那儿是重要的', 545, 2100, 66, tImp, {dur: q.end('我在他那儿是重要的') - tImp});

	// 书里管这层叫「需要」
	const tBook = q.at('书里');
	b.cam(tBook - 100, [40, 1180, 1420, 2240], 1100);
	b.text('书里的说法', 160, mid.bot + 76, 30, tBook + 350, {color: C.pencilDark});
	const tNeed = q.at('需要');
	write(b, '需要', 160, mid.bot + 24 - 64, 72, tNeed - 140, 1000, {color: C.amberDeep});
	ring(b, 228, mid.bot, 170, 96, tNeed + 380, 420, {color: C.amber, w: 4.4});

	// 这层没照顾到 → 种子暗下去
	b.text('（没照顾到）', 1160, 2100, 32, tCare + 350, {color: C.pencilDark});

	// 换一个人 / 换一份工作：上面两层换掉，底层是同一条
	const cols = [
		{x0: 1480, x1: 2440, t: q.at('换一个人'), note: '换一个人', top: '朋友已读不回', midT: '一遍遍点开对话框', bot: '我在朋友心里是重要的'},
		{x0: 2520, x1: 3480, t: q.at('换一份工作'), note: '换一份工作', top: '领导没回我的方案', midT: '反复刷新邮箱', bot: '我在领导眼里是重要的'},
	];
	const tForm = q.at('换个样子');
	const tAll = q.at('它还会');
	const colMark = b.mark();
	cols.forEach((c, i) => {
		const cx = (c.x0 + c.x1) / 2;
		const lx0 = i === 0 ? X1 : cols[0].x1 + 20;
		const lx1 = c.x1 + 60;
		b.cam(c.t - 150, [c.x0 - 180, 1180, c.x1 + 120, 2240], 850, true);
		stratum(b, lx0, lx1, Y.l1, c.t - 100, 380, {phase: 0.4 + i * 2});
		stratum(b, lx0, lx1, Y.l2, c.t - 20, 380, {phase: 1.9 + i * 2, pen: false});
		stratum(b, lx0, lx1, Y.l3, c.t + 60, 380, {phase: 3.1 + i * 2, pen: false});
		b.text(c.note, cx, 1300, 36, c.t + 200, {anchor: 'middle', color: C.pencilDark, pen: false});
		b.text(c.top, cx, 1432, 58, c.t + 330, {anchor: 'middle', dur: 520});
		b.text(c.midT, cx, 1738, 50, c.t + 700, {anchor: 'middle', dur: 520});
		b.fill((s) => R.hatchRect(c.x0, 1893, c.x1 - c.x0, 300, {seed: s, hachureGap: 13}), c.t + 400, 700, {color: C.amber, w: 3, opacity: 0.55, pen: false});
	});
	// 拉远：同一种需要，在三个场景里各冒一次
	b.cam(tAll - 100, [40, 1180, 3560, 2240], 1200, true);
	cols.forEach((c, i) => {
		const t = tForm + i * 330;
		b.text(c.bot, c.x0 + 105, 2100, 58, t, {dur: 520});
		seed(b, c.x0 + 60, 2074, 22, tBack + i * 260, (ms) => 0.3 + 0.7 * easeOut(clamp01((ms - tBack - i * 260) / 400)));
		arrow(b, [(c.x0 + c.x1) / 2, 1990], [(c.x0 + c.x1) / 2, 1768], tBack + 150 + i * 260, 360, {color: C.amberDeep, w: 4.4, pen: i === 0});
	});
	// 三个「是重要的」下面画同一条琥珀线
	const tImpLine = q.at('冒出来') + 300;
	under(b, 545 + 5 * 66, 545 + 9 * 66, 2122, tImpLine, 260, {w: 6});
	under(b, cols[0].x0 + 105 + 6 * 58, cols[0].x0 + 105 + 10 * 58, 2120, tImpLine + 200, 260, {w: 6, pen: false});
	under(b, cols[1].x0 + 105 + 6 * 58, cols[1].x0 + 105 + 10 * 58, 2120, tImpLine + 400, 260, {w: 6, pen: false});
	const colItems = b.since(colMark);

	// 所以这期不劝你「别想太多」
	const tDont = q.at('别想太多');
	b.cam(tDont - 500, [1100, 880, 2500, 1600], 750, true);
	const quoteMark = b.mark();
	b.text('「别想太多」', 1800, 1050, 104, tDont - 350, {anchor: 'middle', dur: 650});
	freehand(b, [[1470, 1022], [1700, 1016], [1920, 1030], [2140, 1026]], q.end('别想太多') + 80, 320, {size: 16, color: C.red});
	const quoteItems = b.since(quoteMark);

	// 就做一件事：回到第一列，把三层一层一层画清楚
	const tOne = q.at('就做一件事');
	b.eraseAll([...colItems, ...quoteItems], tOne + 200, 500);
	b.cam(tOne + 150, [40, 1080, 1420, 2240], 1200, true);
	const tLay = q.at('一层一层');
	const box3 = (y0: number, y1: number, t: number, color: string) =>
		b.stroke((s) => R.rect(56, y0, 1362, y1 - y0, {seed: s, roughness: 1.1, bowing: 1.4}), t, 330, {color, w: 5.4});
	box3(1262, Y.l1 - 8, tLay - 40, C.ink);
	box3(Y.l1 + 8, Y.l2 - 8, q.ch('一层一层', 2) - 40, C.ink);
	box3(Y.l2 + 8, Y.l3 + 8, q.at('画清楚') - 40, C.amberDeep);
	b.text('这期：把三层，一层一层画清楚', 730, 1182, 54, q.end('画清楚') + 150, {anchor: 'middle', dur: 800});
	freehand(b, [[400, 1210], [620, 1204], [840, 1208], [1060, 1200]], q.end('画清楚') + 1000, 460, {size: 14, color: C.amber});

	return b;
};
